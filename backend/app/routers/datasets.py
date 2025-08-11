# backend/app/routers/datasets.py
import os
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Header, Query, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi import status

from app.config import settings
from app.services import storage
from app.services.parsing import extract_preview_and_metadata
from app.services import db

# boto3 only used for generating presigned URL on download when using S3
try:
    import boto3
    from botocore.exceptions import ClientError
except Exception:
    boto3 = None
    ClientError = None

router = APIRouter()
logger = logging.getLogger("mlstudio.datasets")

# Ensure upload dir exists for local storage
os.makedirs(settings.upload_dir, exist_ok=True)


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    x_user_uid: Optional[str] = Header(None, alias="X-User-Uid"),
):
    """
    Upload a dataset file. Saves either locally (dev) or to S3 (prod),
    extracts preview/metadata and stores entry in metadata DB.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    if not x_user_uid:
        raise HTTPException(status_code=400, detail="X-User-Uid header is required")

    logger.info(f"User {x_user_uid} started uploading file: {file.filename}")

    try:
        # Corrected call - no upload_dir parameter
        saved_ref = storage.save_upload_file(file, user_uid=x_user_uid)
        if not isinstance(saved_ref, str):
            raise RuntimeError("storage.save_upload_file returned unexpected value")

        logger.info(f"File saved at {saved_ref} for user {x_user_uid}")

        # Try parsing metadata
        try:
            metadata = extract_preview_and_metadata(saved_ref, preview_rows=10)
        except FileNotFoundError:
            logger.exception(f"File not found while parsing: {saved_ref}")
            try:
                if isinstance(saved_ref, str) and os.path.abspath(saved_ref).startswith(os.getcwd()):
                    if os.path.exists(saved_ref):
                        os.remove(saved_ref)
            except Exception:
                logger.exception("Failed to cleanup missing file after parse error")
            raise HTTPException(status_code=500, detail=f"Uploaded file not found on disk: {saved_ref}")
        except Exception as ex:
            logger.exception(f"Failed to extract preview/metadata for {saved_ref}: {ex}")
            try:
                if isinstance(saved_ref, str) and os.path.abspath(saved_ref).startswith(os.getcwd()):
                    if os.path.exists(saved_ref):
                        os.remove(saved_ref)
            except Exception:
                logger.exception("Failed to remove file after parse error")
            raise HTTPException(status_code=500, detail=f"Failed to parse uploaded file: {str(ex)}")

        filename = os.path.basename(saved_ref)
        size_bytes = None
        try:
            if isinstance(saved_ref, str) and not saved_ref.startswith("s3://"):
                size_bytes = os.path.getsize(saved_ref)
        except Exception:
            size_bytes = None

        rows = metadata.get("row_count") or metadata.get("rows") or None
        columns = metadata.get("columns")
        preview = metadata.get("preview")

        # Save metadata to DB scoped by user
        dataset_id = db.save_dataset_metadata(
            filename=filename,
            path=saved_ref,
            size_bytes=size_bytes,
            rows=rows,
            columns=columns,
            preview=preview,
            uploaded_by_uid=x_user_uid,
        )

        response = {
            "id": dataset_id,
            "filename": filename,
            "path": saved_ref,
            "size_bytes": size_bytes,
            **metadata,
            "uploaded_by_uid": x_user_uid,
        }
        return JSONResponse(content=response, status_code=status.HTTP_201_CREATED)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def list_datasets(uid: Optional[str] = Query(None, description="Filter by uploader uid (optional)")):
    try:
        files = db.list_datasets(uid)
        return {"datasets": files}
    except Exception as e:
        logger.exception("Failed to list datasets")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
def download_dataset(
    filename: str,
    x_user_uid: Optional[str] = Header(None, alias="X-User-Uid"),
):
    if not x_user_uid:
        raise HTTPException(status_code=400, detail="X-User-Uid header is required")

    safe = os.path.basename(filename)
    db_entry = db.get_dataset_by_filename(safe, uid=x_user_uid)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Dataset not found for user")

    stored_path = db_entry.get("path")
    if not stored_path:
        # Fallback local path for user
        stored_path = os.path.join(settings.upload_dir, x_user_uid, safe)

    if isinstance(stored_path, str) and stored_path.startswith("s3://"):
        if boto3 is None:
            raise HTTPException(status_code=500, detail="boto3 not available on server for S3 downloads")
        _ = stored_path.replace("s3://", "")
        try:
            bucket, key = _.split("/", 1)
        except ValueError:
            raise HTTPException(status_code=500, detail="Invalid S3 stored path")
        s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.aws_region,
        )
        try:
            presigned = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": key},
                ExpiresIn=3600,
            )
            return {"download_url": presigned}
        except ClientError as e:
            logger.exception("Failed to generate presigned URL")
            raise HTTPException(status_code=500, detail=str(e))

    local_path = stored_path
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(local_path, filename=safe, media_type="application/octet-stream")


@router.get("/preview/{filename}")
def dataset_preview(
    filename: str,
    rows: int = 10,
    x_user_uid: Optional[str] = Header(None, alias="X-User-Uid"),
):
    if not x_user_uid:
        raise HTTPException(status_code=400, detail="X-User-Uid header is required")

    safe = os.path.basename(filename)
    db_entry = db.get_dataset_by_filename(safe, uid=x_user_uid)
    if db_entry:
        path = db_entry.get("path")
    else:
        path = os.path.join(settings.upload_dir, x_user_uid, safe)

    try:
        metadata = extract_preview_and_metadata(path, preview_rows=rows)
        return metadata
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        logger.exception(f"Failed to create preview for {path}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{filename}")
def delete_dataset(
    filename: str,
    x_user_uid: Optional[str] = Header(None, alias="X-User-Uid"),
):
    if not x_user_uid:
        raise HTTPException(status_code=400, detail="X-User-Uid header is required")

    safe = os.path.basename(filename)
    db_entry = db.get_dataset_by_filename(safe, uid=x_user_uid)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Dataset not found for user")

    stored_path = db_entry.get("path")
    if not stored_path:
        stored_path = os.path.join(settings.upload_dir, x_user_uid, safe)

    deleted_from_storage = False
    try:
        if isinstance(stored_path, str) and stored_path.startswith("s3://"):
            if boto3 is None:
                raise HTTPException(status_code=500, detail="boto3 not available for S3 deletion")
            _ = stored_path.replace("s3://", "")
            try:
                bucket, key = _.split("/", 1)
            except ValueError:
                raise HTTPException(status_code=500, detail="Invalid S3 stored path")
            s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
                region_name=settings.aws_region,
            )
            try:
                s3.delete_object(Bucket=bucket, Key=key)
                deleted_from_storage = True
            except ClientError as e:
                logger.exception("S3 delete failed")
                raise HTTPException(status_code=500, detail=str(e))
        else:
            if os.path.exists(stored_path):
                os.remove(stored_path)
                deleted_from_storage = True
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to delete from storage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    try:
        db_deleted = db.delete_dataset_by_filename(safe, uid=x_user_uid)
    except Exception as e:
        logger.exception(f"Failed to delete DB row after file delete: {e}")
        raise HTTPException(status_code=500, detail=f"File removed but DB cleanup failed: {str(e)}")

    return JSONResponse(
        content={"deleted": True, "filename": safe, "storage_deleted": deleted_from_storage, "db_deleted": db_deleted}
    )
