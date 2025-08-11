import os
import shutil
import logging
from typing import Optional
import pandas as pd
from uuid import uuid4
from joblib import dump, load
from fastapi import UploadFile

from app.config import settings

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
except Exception:
    boto3 = None
    ClientError = None


def save_upload_file(file: UploadFile, user_uid: Optional[str] = None) -> str:
    """
    Save an uploaded file under the user's directory (or default upload dir).
    Supports local filesystem and S3 backend if configured.
    Returns the saved file path or S3 URI.
    """
    filename = file.filename
    unique_name = f"{uuid4().hex}_{filename}"

    if settings.storage_backend == "local":
        if user_uid:
            user_dir = os.path.join(settings.upload_dir, str(user_uid))
            os.makedirs(user_dir, exist_ok=True)
            dest_path = os.path.join(user_dir, unique_name)
        else:
            dest_path = os.path.join(settings.upload_dir, unique_name)

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return dest_path

    elif settings.storage_backend == "s3":
        if boto3 is None:
            raise RuntimeError("boto3 is required for S3 storage but is not installed")

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=getattr(settings, "aws_region", None),
        )

        prefix = f"{user_uid}/" if user_uid else ""
        s3_key = f"datasets/{prefix}{unique_name}"

        s3_client.upload_fileobj(file.file, settings.aws_s3_bucket, s3_key, ExtraArgs={"ACL": "private"})
        uri = f"s3://{settings.aws_s3_bucket}/{s3_key}"
        return uri

    else:
        raise ValueError(f"Unknown storage backend: {settings.storage_backend}")


def load_dataset(path_or_uri: str, nrows: Optional[int] = None) -> pd.DataFrame:
    """
    Load dataset from a local path or S3 URI, supports CSV and Excel files.
    """
    if not path_or_uri:
        raise FileNotFoundError("Empty dataset path provided")

    if isinstance(path_or_uri, str) and path_or_uri.startswith("s3://"):
        if boto3 is None:
            raise RuntimeError("boto3 required to read s3:// URIs")

        _, _, rest = path_or_uri.partition("s3://")
        try:
            bucket, key = rest.split("/", 1)
        except ValueError:
            raise RuntimeError("Invalid s3 URI")

        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=getattr(settings, "aws_region", None),
        )

        tmp_dir = os.path.join(settings.upload_dir, "tmp")
        os.makedirs(tmp_dir, exist_ok=True)
        tmp_path = os.path.join(tmp_dir, os.path.basename(key))

        try:
            s3.download_file(bucket, key, tmp_path)
            path_or_uri = tmp_path
        except ClientError as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise RuntimeError(f"S3 download failed: {e}")

    if not os.path.exists(path_or_uri):
        raise FileNotFoundError(f"Dataset not found at path: {path_or_uri}")

    ext = os.path.splitext(path_or_uri)[1].lower()
    try:
        if ext == ".csv":
            df = pd.read_csv(path_or_uri, nrows=nrows)
        else:
            df = pd.read_excel(path_or_uri, engine="openpyxl", nrows=nrows)
        return df
    except Exception as e:
        raise RuntimeError(f"Failed to read dataset: {e}")


def save_joblib_model(model, name: str, user_uid: Optional[str] = None) -> str:
    """
    Save a joblib model temporarily in a user-specific temp directory.
    """
    temp_dir = os.path.join(settings.upload_dir, "temp_models", user_uid or "anonymous")
    os.makedirs(temp_dir, exist_ok=True)
    safe_name = os.path.basename(name)
    if not safe_name.lower().endswith(".pkl"):
        safe_name = safe_name + ".pkl"
    dest = os.path.join(temp_dir, safe_name)
    dump(model, dest)
    return dest


def save_model_file(local_path: str, dest_name: Optional[str] = None, user_uid: Optional[str] = None) -> str:
    """
    Save a model file permanently in a user-specific directory (local or S3).
    Copies from temporary path to permanent storage.
    Returns the final saved file path or S3 URI.
    """
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Model file does not exist: {local_path}")

    dest_name = dest_name or os.path.basename(local_path)
    safe_name = os.path.basename(dest_name)

    if settings.storage_backend == "s3":
        if boto3 is None:
            raise RuntimeError("boto3 required for S3 operations")
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=getattr(settings, "aws_region", None),
        )
        s3_key = f"models/{user_uid or 'anonymous'}/{safe_name}"
        s3.upload_file(local_path, settings.aws_s3_bucket, s3_key, ExtraArgs={"ACL": "private"})
        uri = f"s3://{settings.aws_s3_bucket}/{s3_key}"
        return uri
    else:
        models_dir = os.path.join(settings.upload_dir, "models", user_uid or "anonymous")
        os.makedirs(models_dir, exist_ok=True)
        dest = os.path.join(models_dir, safe_name)
        shutil.copy(local_path, dest)
        return dest


def delete_file(path_or_uri: str, user_uid: Optional[str] = None) -> bool:
    """
    Delete a file from local or S3.
    Returns True if the file was deleted or False otherwise.
    """
    if isinstance(path_or_uri, str) and path_or_uri.startswith("s3://"):
        try:
            if boto3 is None:
                logger.error("boto3 not installed for S3 delete")
                return False
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
            bucket, key = path_or_uri.replace("s3://", "").split("/", 1)
            s3.delete_object(Bucket=bucket, Key=key)
            return True
        except Exception as e:
            logger.error(f"S3 delete failed for {path_or_uri}: {e}")
            return False

    if os.path.exists(path_or_uri):
        os.remove(path_or_uri)
        return True
    return False
