"""
Image upload + AI prediction + Grad-CAM explainability endpoint.
This is the core of the AI Prediction Module and Explainable AI Module.
"""
import cv2
from bson import ObjectId
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.db.mongodb import predictions_collection
from app.schemas.prediction import PredictionResponse
from app.services.cloudinary_service import upload_image_bytes
from app.services.ml_service import predict_image, CLASS_MAPPING, DISPLAY_TITLES

router = APIRouter(prefix="/api/predict", tags=["AI Prediction"])

MAX_FILE_SIZE_MB = 8
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPG, PNG, or WEBP images are supported.")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Image exceeds the {MAX_FILE_SIZE_MB}MB size limit.")

    try:
        result = predict_image(image_bytes)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    original_url = upload_image_bytes(image_bytes, folder="skin-ai/uploads")

    overlay_bgr = result.pop("gradcam_overlay_bgr")
    _, encoded_overlay = cv2.imencode(".jpg", overlay_bgr)
    gradcam_url = upload_image_bytes(encoded_overlay.tobytes(), folder="skin-ai/gradcam")

    doc = {
        "user_id": str(current_user["_id"]),
        "image_url": original_url,
        "gradcam_url": gradcam_url,
        "top_predictions": result["top_predictions"],
        "primary_disease": result["primary_disease"],
        "confidence": result["confidence"],
        "severity": result["severity"],
        "inference_mode": result["inference_mode"],
        "image_quality_warnings": result["image_quality_warnings"],
        "created_at": datetime.now(timezone.utc),
    }
    insert_result = await predictions_collection.insert_one(doc)

    return PredictionResponse(
        prediction_id=str(insert_result.inserted_id),
        top_predictions=result["top_predictions"],
        primary_disease=result["primary_disease"],
        primary_disease_title=result["primary_disease_title"],
        confidence=result["confidence"],
        severity=result["severity"],
        image_url=original_url,
        gradcam_image_url=gradcam_url,
        image_quality_warnings=result["image_quality_warnings"],
    )


@router.get("/{prediction_id}", response_model=PredictionResponse)
async def get_prediction(prediction_id: str, current_user: dict = Depends(get_current_user)):
    doc = await predictions_collection.find_one({
        "_id": ObjectId(prediction_id), "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")

    # Backward compatibility mappings for raw class labels
    raw_disease = doc.get("primary_disease")
    clean_disease_id = CLASS_MAPPING.get(raw_disease, raw_disease)

    mapped_predictions = []
    for p in doc.get("top_predictions", []):
        raw_pred_id = p["disease"]
        clean_pred_id = CLASS_MAPPING.get(raw_pred_id, raw_pred_id)
        mapped_predictions.append({
            "disease": clean_pred_id,
            "title": DISPLAY_TITLES.get(clean_pred_id, clean_pred_id),
            "confidence": p["confidence"]
        })

    return PredictionResponse(
        prediction_id=str(doc["_id"]),
        top_predictions=mapped_predictions,
        primary_disease=clean_disease_id,
        primary_disease_title=DISPLAY_TITLES.get(clean_disease_id, clean_disease_id),
        confidence=doc["confidence"],
        severity=doc["severity"],
        image_url=doc.get("image_url"),
        gradcam_image_url=doc.get("gradcam_url"),
        image_quality_warnings=doc.get("image_quality_warnings", []),
    )
