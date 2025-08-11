import os
import traceback
import logging
from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional, List, Dict

from app.services import model_trainer, registry, storage, db
from app.config import settings

router = APIRouter()
logger = logging.getLogger("mlstudio.model_builder")


# Helper to get user ID from header with fallback
def get_user_id(x_user_uid: Optional[str] = Header(None, alias="X-User-Uid")) -> str:
    user_id = x_user_uid or "dev_user"
    if user_id:
        user_id = user_id.strip()
    return user_id


# Request models
class TrainRequest(BaseModel):
    task: str
    algorithm: str
    dataset: str
    test_size: float = 0.2
    improve_with: Optional[List[str]] = []


class ImproveRequest(BaseModel):
    session_id: str
    improve_with: List[str]


class SaveRequest(BaseModel):
    session_id: str
    model_name: Optional[str] = None


def _resolve_dataset_path(dataset_identifier: str, user_id: str) -> str:
    if not dataset_identifier:
        raise ValueError("Empty dataset identifier")

    safe = os.path.basename(dataset_identifier)
    try:
        entry = db.get_dataset_by_filename(safe, uid=user_id)
    except Exception as e:
        logger.exception(f"DB lookup failed for {safe} and user {user_id}: {e}")
        entry = None

    if entry and entry.get("path"):
        return entry["path"]

    candidate_path = os.path.join(settings.upload_dir, user_id, safe)
    if os.path.exists(candidate_path):
        return candidate_path

    raise FileNotFoundError(f"Dataset '{dataset_identifier}' not found for user '{user_id}'")


# TRAIN endpoint
@router.post("/train")
def train(req: TrainRequest, user_id: str = Depends(get_user_id)):
    try:
        resolved_path = _resolve_dataset_path(req.dataset, user_id)
        logger.info(
            f"Training request: task={req.task}, algo={req.algorithm}, dataset={req.dataset}, resolved={resolved_path}, "
            f"test_size={req.test_size}, improve_with={req.improve_with}, user={user_id}"
        )
        result = model_trainer.train_model(
            task=req.task,
            algorithm=req.algorithm,
            dataset_filename=resolved_path,
            test_size=req.test_size,
            improve_with=req.improve_with,
            user_uid=user_id,
        )
        return result
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Training error: {e}\n{tb}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": tb})


# IMPROVE endpoint
@router.post("/improve")
def improve(req: ImproveRequest):
    sess = registry.get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    meta = sess["metadata"]
    try:
        dataset_identifier = meta.get("dataset")
        created_by = meta.get("created_by")
        resolved_path = _resolve_dataset_path(dataset_identifier, created_by)

        logger.info(
            f"Improve request: session={req.session_id}, dataset={dataset_identifier}, resolved={resolved_path}, new_improve={req.improve_with}"
        )

        result = model_trainer.train_model(
            task=meta["task"],
            algorithm=meta["algorithm"],
            dataset_filename=resolved_path,
            test_size=meta.get("test_size", 0.2),
            improve_with=req.improve_with,
            user_uid=created_by,
        )
        return result
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Improve training error: {e}\n{tb}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": tb})


# SAVE model endpoint
@router.post("/save")
def save_model(req: SaveRequest, user_id: str = Depends(get_user_id)):
    sess = registry.get_session(req.session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    meta = sess["metadata"]
    local_path = meta.get("model_local_path")
    if not local_path or not os.path.exists(local_path):
        raise HTTPException(status_code=400, detail="Model file not found")

    model_name = req.model_name or os.path.basename(local_path)
    model_name = os.path.basename(model_name)

    metrics = meta.get("metrics", {})
    feature_names = meta.get("features")
    if feature_names:
        metrics = dict(metrics)  # avoid modifying original
        metrics["features"] = feature_names

    try:
        saved_location = storage.save_model_file(local_path, dest_name=model_name, user_uid=user_id)
        db.save_model_metadata(
            name=model_name,
            session_id=req.session_id,
            task=meta["task"],
            algorithm=meta["algorithm"],
            dataset_name=meta["dataset"],
            metrics=metrics,
            saved_location=saved_location,
            uploaded_by_uid=user_id,
        )
        registry.delete_session(req.session_id)
        logger.info(f"Model saved successfully at {saved_location} for user {user_id}")
        return {"status": "ok", "saved_location": saved_location}
    except Exception as e:
        tb = traceback.format_exc()
        logger.exception(f"Failed to save model: {e}")
        raise HTTPException(status_code=500, detail={"error": str(e), "traceback": tb})


# SESSION info endpoint
@router.get("/session/{session_id}")
def get_session(session_id: str):
    sess = registry.get_session(session_id)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")
    return sess["metadata"]


# List saved models for user
@router.get("/saved")
def list_saved_models(x_user_uid: Optional[str] = Header(None, alias="X-User-Uid")):
    if not x_user_uid:
        raise HTTPException(status_code=400, detail="X-User-Uid header is required")
    user_id = x_user_uid.strip()
    models = db.list_saved_models_for_user(uid=user_id)
    return {"models": models}


# Get model features
@router.get("/features/{model_id}")
def get_model_features(model_id: int, user_id: str = Depends(get_user_id)):
    model = db.get_saved_model_by_id(model_id, uid=user_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    metrics = model.get("metrics", {})
    features = metrics.get("features", [])
    return {"features": features}


# BULK prediction endpoint
@router.post("/predict/bulk")
async def predict_bulk(
    file: UploadFile = File(...),
    model_id: int = Form(...),
    user_id: str = Depends(get_user_id),
):
    model = db.get_saved_model_by_id(model_id, uid=user_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    temp_dir = os.path.join(settings.temp_dir, user_id)
    os.makedirs(temp_dir, exist_ok=True)
    temp_filepath = os.path.join(temp_dir, file.filename)
    with open(temp_filepath, "wb") as f:
        f.write(await file.read())

    try:
        predictions = model_trainer.predict_bulk(
            model_filepath=model["saved_location"],
            input_filepath=temp_filepath,
        )
        return {"predictions": predictions}
    except Exception as e:
        logger.error(f"Bulk prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    finally:
        if os.path.exists(temp_filepath):
            os.remove(temp_filepath)


# Manual prediction endpoint
class ManualPredictRequest(BaseModel):
    model_id: int
    inputs: Dict[str, str]


@router.post("/predict/manual")
def predict_manual(req: ManualPredictRequest, user_id: str = Depends(get_user_id)):
    model = db.get_saved_model_by_id(req.model_id, uid=user_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    try:
        prediction = model_trainer.predict_manual(
            model_filepath=model["saved_location"],
            inputs=req.inputs,
        )
        if hasattr(prediction, "tolist"):
            prediction_data = prediction.tolist()
        elif isinstance(prediction, (list, tuple)):
            prediction_data = list(prediction)
        else:
            prediction_data = prediction
        return {"prediction": prediction_data}
    except Exception as e:
        logger.error(f"Manual prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Manual prediction failed: {str(e)}")


# DELETE model endpoint
@router.delete("/model/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(model_id: int, user_id: str = Depends(get_user_id)):
    logger.info(f"Delete model request for model_id={model_id} by user_id={user_id!r}")
    model = db.get_saved_model_by_id(model_id, uid=user_id)
    if not model:
        logger.warning(f"Model id={model_id} not found for user_id={user_id!r}")
        raise HTTPException(status_code=404, detail="Model not found")
    deleted = db.delete_model(model_id, uid=user_id)
    if not deleted:
        logger.warning(f"Model id={model_id} could not be deleted (not found or already deleted)")
        raise HTTPException(status_code=404, detail="Model not found or already deleted")
    logger.info(f"Model id={model_id} successfully deleted for user_id={user_id!r}")
    return

