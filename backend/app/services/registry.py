# backend/app/services/registry.py
import uuid
import time
import os
from typing import Dict, Any, Optional

# Simple in-memory registry: session_id -> metadata
_REG: Dict[str, Dict[str, Any]] = {}

def create_session(metadata: Dict[str, Any]) -> str:
    """
    Creates a new training session and returns its unique ID.
    """
    sid = str(uuid.uuid4())
    _REG[sid] = {
        "created_at": time.time(),
        "metadata": metadata,
    }
    return sid

def set_session(sid: str, key: str, value: Any) -> None:
    """
    Sets a key-value pair within an existing session's metadata.
    """
    if sid in _REG:
        _REG[sid]["metadata"][key] = value

def get_session(sid: str) -> Optional[Dict[str, Any]]:
    """
    Retrieves a session by its ID.
    """
    return _REG.get(sid)

def delete_session(sid: str) -> None:
    """
    Deletes a session and its associated temporary model file.
    """
    if sid in _REG:
        # Remove any temporary model files
        try:
            model_path = _REG[sid]["metadata"].get("model_local_path")
            if model_path and os.path.exists(model_path):
                os.remove(model_path)
        except Exception:
            # Log the error but don't fail if cleanup fails
            pass
        finally:
            # Delete the session from the registry
            del _REG[sid]