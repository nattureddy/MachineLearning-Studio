import os
import sqlite3
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

# Database file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "metadata.db")

print(f"Database path in use: {DB_PATH}")

# Dataset table schema (with uploaded_by_uid to track ownership)
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  size_bytes INTEGER,
  rows INTEGER,
  columns TEXT, -- stored as JSON list
  preview TEXT, -- stored as JSON stringified rows
  uploaded_by_uid TEXT,
  uploaded_at TEXT
);
"""

# Models table schema (with uploaded_by_uid for user ownership)
CREATE_MODELS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  task TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  metrics TEXT,
  saved_location TEXT NOT NULL,
  uploaded_by_uid TEXT,
  created_at TEXT
);
"""

def _get_conn():
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Persistent connection to DB
_conn = _get_conn()

# Create tables at module load if they do not exist
_conn.execute(CREATE_TABLE_SQL)
_conn.execute(CREATE_MODELS_TABLE_SQL)
_conn.commit()

# --- Dataset metadata management --- #

def save_dataset_metadata(
    filename: str,
    path: str,
    size_bytes: int,
    rows: Optional[int],
    columns: Optional[List[str]],
    preview: Optional[List[Dict[str, Any]]],
    uploaded_by_uid: Optional[str] = None,
) -> int:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO datasets (filename, path, size_bytes, rows, columns, preview, uploaded_by_uid, uploaded_at) VALUES (?,?,?,?,?,?,?,?)",
        (
            filename,
            path,
            size_bytes,
            rows if rows is not None else None,
            json.dumps(columns or []),
            json.dumps(preview or []),
            uploaded_by_uid,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    return cur.lastrowid

def list_datasets(uid: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    if uid:
        cur.execute("SELECT * FROM datasets WHERE TRIM(uploaded_by_uid) = TRIM(?) ORDER BY id DESC", (uid,))
    else:
        cur.execute("SELECT * FROM datasets ORDER BY id DESC")
    rows = cur.fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item["columns"] = json.loads(item.get("columns") or "[]")
        item["preview"] = json.loads(item.get("preview") or "[]")
        result.append(item)
    return result

def get_dataset_by_filename(filename: str, uid: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()

    # Try exact match with user filter if available
    if uid:
        cur.execute("SELECT * FROM datasets WHERE filename = ? AND TRIM(uploaded_by_uid) = TRIM(?) LIMIT 1", (filename, uid))
        r = cur.fetchone()
    else:
        cur.execute("SELECT * FROM datasets WHERE filename = ? LIMIT 1", (filename,))
        r = cur.fetchone()

    # If not found, try searching by original filename suffix after UUID prefix
    if not r and "_" in filename:
        original_filename = filename.split('_', 1)[-1]
        if uid:
            cur.execute("SELECT * FROM datasets WHERE filename LIKE ? AND TRIM(uploaded_by_uid) = TRIM(?) LIMIT 1", (f"%_{original_filename}", uid))
        else:
            cur.execute("SELECT * FROM datasets WHERE filename LIKE ? LIMIT 1", (f"%_{original_filename}",))
        r = cur.fetchone()

    if not r:
        return None

    item = dict(r)
    item["columns"] = json.loads(item.get("columns") or "[]")
    item["preview"] = json.loads(item.get("preview") or "[]")
    return item

def delete_dataset_by_filename(filename: str, uid: Optional[str] = None) -> bool:
    conn = _get_conn()
    cur = conn.cursor()
    if uid:
        cur.execute("DELETE FROM datasets WHERE filename = ? AND TRIM(uploaded_by_uid) = TRIM(?)", (filename, uid))
    else:
        cur.execute("DELETE FROM datasets WHERE filename = ?", (filename,))
    affected = cur.rowcount
    conn.commit()
    return affected > 0

# --- Model metadata management --- #

def save_model_metadata(
    name: str,
    session_id: str,
    task: str,
    algorithm: str,
    dataset_name: str,
    metrics: Dict[str, Any],
    saved_location: str,
    uploaded_by_uid: Optional[str] = None,
) -> int:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO models (name, session_id, task, algorithm, dataset_name, metrics, saved_location, uploaded_by_uid, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        (
            name,
            session_id,
            task,
            algorithm,
            dataset_name,
            json.dumps(metrics),
            saved_location,
            uploaded_by_uid,
            datetime.utcnow().isoformat(),
        ),
    )
    conn.commit()
    return cur.lastrowid

def get_saved_model_by_name(name: str, uid: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    if uid:
        cur.execute("SELECT * FROM models WHERE name = ? AND TRIM(uploaded_by_uid) = TRIM(?) LIMIT 1", (name, uid))
    else:
        cur.execute("SELECT * FROM models WHERE name = ? LIMIT 1", (name,))
    r = cur.fetchone()
    if not r:
        return None
    item = dict(r)
    item["metrics"] = json.loads(item.get("metrics") or "{}")
    return item

def list_saved_models_for_user(uid: str) -> List[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM models WHERE TRIM(uploaded_by_uid) = TRIM(?) ORDER BY id DESC", (uid,))
    rows = cur.fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item["metrics"] = json.loads(item.get("metrics") or "{}")
        result.append(item)
    return result

def get_saved_model_by_id(model_id: int, uid: Optional[str] = None) -> Optional[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    if uid:
        cur.execute("SELECT * FROM models WHERE id = ? AND TRIM(uploaded_by_uid) = TRIM(?) LIMIT 1", (model_id, uid))
    else:
        cur.execute("SELECT * FROM models WHERE id = ? LIMIT 1", (model_id,))
    r = cur.fetchone()
    if not r:
        return None
    item = dict(r)
    item["metrics"] = json.loads(item.get("metrics") or "{}")
    return item

def delete_model(model_id: int, uid: str) -> bool:
    """
    Delete model record for given model_id and user uid.
    Returns True if a row was deleted, False otherwise.
    """
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM models WHERE id = ? AND TRIM(uploaded_by_uid) = TRIM(?)", (model_id, uid))
    affected = cur.rowcount
    conn.commit()
    return affected > 0

def list_saved_models() -> List[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM models ORDER BY id DESC")
    rows = cur.fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item["metrics"] = json.loads(item.get("metrics") or "{}")
        result.append(item)
    return result

def get_last_n_models(n: int = 3) -> List[Dict[str, Any]]:
    conn = _get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM models ORDER BY id DESC LIMIT ?", (n,))
    rows = cur.fetchall()
    result = []
    for r in rows:
        item = dict(r)
        item["metrics"] = json.loads(item.get("metrics") or "{}")
        result.append(item)
    return result
