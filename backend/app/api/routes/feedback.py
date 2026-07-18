"""
Feedback collection API routes: allows users to rate their diagnosis/recommendations,
and allows administrators to monitor patient satisfaction ratings and comments.
"""
from datetime import datetime, timezone
from typing import Optional
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user, require_admin
from app.db.mongodb import feedback_collection, predictions_collection, users_collection

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])


class FeedbackCreate(BaseModel):
    prediction_id: str
    rating: int = Field(..., ge=1, le=5, description="Satisfaction rating from 1 to 5 stars")
    comments: Optional[str] = Field(None, max_length=1000)


class FeedbackResponse(BaseModel):
    feedback_id: str
    prediction_id: str
    rating: int
    comments: str
    created_at: datetime


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(payload: FeedbackCreate, current_user: dict = Depends(get_current_user)):
    try:
        pred_obj_id = ObjectId(payload.prediction_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid prediction_id format.")

    prediction = await predictions_collection.find_one({
        "_id": pred_obj_id, "user_id": str(current_user["_id"])
    })
    if not prediction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction report not found or unauthorized.")

    # Check if feedback already exists for this prediction
    existing = await feedback_collection.find_one({"prediction_id": payload.prediction_id})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Feedback has already been submitted for this prediction.")

    doc = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user.get("full_name", "Anonymous Patient"),
        "user_email": current_user.get("email", ""),
        "prediction_id": payload.prediction_id,
        "rating": payload.rating,
        "comments": payload.comments or "",
        "created_at": datetime.now(timezone.utc)
    }
    
    insert_result = await feedback_collection.insert_one(doc)
    
    return FeedbackResponse(
        feedback_id=str(insert_result.inserted_id),
        prediction_id=doc["prediction_id"],
        rating=doc["rating"],
        comments=doc["comments"],
        created_at=doc["created_at"]
    )


@router.get("/admin/stats")
async def get_feedback_stats(_admin: dict = Depends(require_admin)):
    total = await feedback_collection.count_documents({})
    if total == 0:
        return {
            "total_feedback": 0,
            "average_rating": 0.0,
            "rating_distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        }

    sum_ratings = 0
    rating_distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    
    cursor = feedback_collection.find({})
    async for f in cursor:
        r = f.get("rating", 5)
        sum_ratings += r
        if r in rating_distribution:
            rating_distribution[r] += 1

    return {
        "total_feedback": total,
        "average_rating": round(sum_ratings / total, 2),
        "rating_distribution": rating_distribution
    }


@router.get("/admin/list")
async def list_feedback(_admin: dict = Depends(require_admin)):
    cursor = feedback_collection.find({}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
