# backend/app/models/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Any

class DatasetPreview(BaseModel):
    filename: str
    columns: List[str]
    preview: List[Dict[str, Any]]
    row_count: int
    dtypes_sample: Dict[str, str]
    missing_sample: Dict[str, int]

