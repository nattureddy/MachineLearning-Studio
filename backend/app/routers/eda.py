# backend/app/routers/eda.py
import os
import io
from typing import Any, Dict

from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse

import pandas as pd

from app.config import settings
from app.services import storage
from app.services import db

# ---------- Safe, headless plotting imports ----------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    HAS_PLOTTING = True
except Exception as e:
    print("Plotting libraries not available or failed to import:", e)
    HAS_PLOTTING = False

router = APIRouter()


def _safe_path(filename: str) -> str:
    """
    Resolve filename to an actual stored path or s3 URI.
    Priority:
      1) Try DB lookup by basename
      2) Fallback to upload_dir/basename
    Return:
      - local filesystem path (str) OR
      - s3://... URI (str)
    Raises 404 if not found
    """
    try:
        decoded = unquote(filename)
    except Exception:
        decoded = filename

    safe = os.path.basename(decoded)

    # 1) DB lookup
    try:
        db_entry = db.get_dataset_by_filename(safe)
    except Exception:
        db_entry = None

    if db_entry:
        stored = db_entry.get("path")
        if isinstance(stored, str) and stored.startswith("s3://"):
            return stored
        if isinstance(stored, str) and os.path.exists(stored):
            return stored
        # maybe stored is relative to upload_dir
        alt = os.path.join(settings.upload_dir, os.path.basename(stored or ""))
        if stored and os.path.exists(alt):
            return alt

    # 2) Fallback to upload_dir
    candidate = os.path.join(settings.upload_dir, safe)
    if os.path.exists(candidate):
        return candidate

    # helpful debug detail
    try:
        available = os.listdir(settings.upload_dir)
    except Exception:
        available = ["(could not list upload_dir)"]
    raise HTTPException(
        status_code=404,
        detail={
            "msg": "Dataset not found",
            "requested": safe,
            "decoded": decoded,
            "upload_dir": settings.upload_dir,
            "available_files_sample": available[:100],
        },
    )


def _load_dataframe_from_path_or_uri(path_or_uri: str) -> pd.DataFrame:
    """
    If path_or_uri is an s3:// URI, use storage.load_dataset to get DataFrame.
    Otherwise, read from the local path with pandas.
    """
    if isinstance(path_or_uri, str) and path_or_uri.startswith("s3://"):
        # storage.load_dataset should return a DataFrame when given s3://
        return storage.load_dataset(path_or_uri)
    # else local path
    ext = os.path.splitext(path_or_uri)[1].lower()
    if ext == ".csv":
        return pd.read_csv(path_or_uri)
    else:
        return pd.read_excel(path_or_uri, engine="openpyxl")


@router.get("/{filename}/preview")
def preview_dataset(filename: str, rows: int = 10):
    path = _safe_path(filename)
    try:
        # prefer using storage.load_dataset for S3/complex cases; otherwise read directly
        if isinstance(path, str) and path.startswith("s3://"):
            df = storage.load_dataset(path, nrows=rows)
        else:
            ext = os.path.splitext(path)[1].lower()
            if ext == ".csv":
                df = pd.read_csv(path, nrows=rows)
            else:
                df = pd.read_excel(path, engine="openpyxl", nrows=rows)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")
    return JSONResponse(content={"preview": df.fillna("").to_dict(orient="records")})


@router.get("/{filename}/summary")
def summary_dataset(filename: str):
    path = _safe_path(filename)
    try:
        df = _load_dataframe_from_path_or_uri(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    summary: Dict[str, Any] = {}
    for col in df.columns:
        col_data = df[col]
        info: Dict[str, Any] = {
            "dtype": str(col_data.dtype),
            "count": int(col_data.count()),
            "n_missing": int(col_data.isna().sum()),
        }

        if pd.api.types.is_numeric_dtype(col_data):
            try:
                desc = col_data.describe().to_dict()
                numeric_stats = {k: (None if pd.isna(v) else (float(v) if not isinstance(v, (int, float)) else v)) for k, v in desc.items()}
                info["numeric"] = numeric_stats
                try:
                    info["skew"] = float(col_data.skew())
                    info["kurtosis"] = float(col_data.kurtosis())
                except Exception:
                    info["skew"] = None
                    info["kurtosis"] = None
            except Exception:
                info["numeric"] = {}
        else:
            try:
                vc = col_data.dropna().astype(str).value_counts()
                top = vc.index[0] if len(vc) > 0 else None
                top_freq = int(vc.iloc[0]) if len(vc) > 0 else None
                unique = int(col_data.nunique(dropna=True))
                info.update({"unique": unique, "top": top, "top_freq": top_freq})
            except Exception:
                info.update({"unique": int(col_data.nunique(dropna=True)), "top": None, "top_freq": None})

        summary[col] = info

    return JSONResponse(content={"columns": list(summary.keys()), "summary": summary})


@router.get("/{filename}/missing")
def missing_report(filename: str):
    path = _safe_path(filename)
    try:
        df = _load_dataframe_from_path_or_uri(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    total = len(df)
    missing = []
    for col in df.columns:
        nmiss = int(df[col].isna().sum())
        pct = (nmiss / total * 100.0) if total > 0 else 0.0
        missing.append({"column": col, "missing_count": nmiss, "missing_pct": round(pct, 4)})
    missing_sorted = sorted(missing, key=lambda x: x["missing_count"], reverse=True)
    high_missing = [m for m in missing_sorted if m["missing_pct"] >= 30.0]
    return JSONResponse(content={"total_rows": total, "missing": missing_sorted, "high_missing": high_missing})


@router.get("/{filename}/correlation")
def correlation_matrix(filename: str):
    path = _safe_path(filename)
    try:
        df = _load_dataframe_from_path_or_uri(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    num_df = df.select_dtypes(include=["number"])
    if num_df.shape[1] == 0:
        return JSONResponse(content={"message": "No numeric columns to compute correlation.", "correlation": {}})

    corr = num_df.corr().fillna(0).round(4)
    corr_dict = corr.to_dict()
    return JSONResponse(content={"correlation": corr_dict})


@router.get("/{filename}/valuecounts/{column}")
def value_counts(filename: str, column: str, top: int = Query(20, ge=1, le=100)):
    path = _safe_path(filename)
    try:
        df = _load_dataframe_from_path_or_uri(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read column: {str(e)}")

    if column not in df.columns:
        raise HTTPException(status_code=404, detail="Column not found")
    vc = df[column].fillna("<<MISSING>>").astype(str).value_counts().head(top)
    result = [{"value": str(idx), "count": int(cnt)} for idx, cnt in vc.items()]
    return JSONResponse(content={"value_counts": result})


@router.get("/{filename}/histogram/{column}")
def histogram_image(filename: str, column: str, bins: int = Query(30, ge=1, le=200)):
    if not HAS_PLOTTING:
        raise HTTPException(status_code=501, detail="Plotting libraries (matplotlib/seaborn) not installed on server.")

    path = _safe_path(filename)
    try:
        df = _load_dataframe_from_path_or_uri(path)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

    if column not in df.columns:
        raise HTTPException(status_code=404, detail="Column not found")

    data = df[column].dropna()
    fig, ax = plt.subplots(figsize=(6, 4))
    try:
        if pd.api.types.is_numeric_dtype(df[column]):
            ax.hist(data.astype(float), bins=bins)
            ax.set_xlabel(column)
            ax.set_ylabel("Count")
            ax.set_title(f"Histogram: {column}")
        else:
            vc = data.astype(str).value_counts().head(30)
            sns.barplot(x=vc.values, y=vc.index, ax=ax)
            ax.set_xlabel("Count")
            ax.set_ylabel(column)
            ax.set_title(f"Top values: {column}")
        plt.tight_layout()
        buf = io.BytesIO()
        fig.savefig(buf, format="png")
    except Exception as e:
        plt.close(fig)
        raise HTTPException(status_code=500, detail=f"Failed to generate plot: {str(e)}")
    finally:
        plt.close(fig)

    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
