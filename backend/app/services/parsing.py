# backend/app/services/parsing.py
import os
import pandas as pd
from typing import Dict, Any

def _is_csv(path: str) -> bool:
    return os.path.splitext(path)[1].lower() == ".csv"

def extract_preview_and_metadata(path: str, preview_rows: int = 10) -> Dict[str, Any]:
    """
    Returns a dict with keys: columns, preview (list of dict rows), row_count, dtypes_sample, missing_sample
    """
    ext = os.path.splitext(path)[1].lower()
    if _is_csv(path):
        # preview
        df_preview = pd.read_csv(path, nrows=preview_rows)
        cols = list(df_preview.columns)
        preview = df_preview.fillna("").to_dict(orient="records")
        # row count (efficient): read with chunks
        row_count = 0
        for chunk in pd.read_csv(path, chunksize=100000):
            row_count += len(chunk)
        sample = pd.read_csv(path, nrows=min(1000, row_count+1))
    else:
        # excel
        df_preview = pd.read_excel(path, engine="openpyxl", nrows=preview_rows)
        cols = list(df_preview.columns)
        preview = df_preview.fillna("").to_dict(orient="records")
        full_df = pd.read_excel(path, engine="openpyxl")
        row_count = len(full_df)
        sample = full_df.head(1000)

    dtypes_sample = {c: str(sample[c].dtype) for c in sample.columns}
    missing_sample = {c: int(sample[c].isna().sum()) for c in sample.columns}

    return {
        "columns": cols,
        "preview": preview,
        "row_count": int(row_count),
        "dtypes_sample": dtypes_sample,
        "missing_sample": missing_sample
    }
