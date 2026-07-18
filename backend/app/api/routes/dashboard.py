"""
User dashboard route: prediction history and basic personal statistics.
Admin analytics (disease distribution, state-wise stats, model performance)
are sketched here as a starting point — extend with real aggregation
pipelines once production data volume justifies it.
"""
from collections import Counter

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user, require_admin
from app.db.mongodb import predictions_collection, users_collection

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/history")
async def prediction_history(current_user: dict = Depends(get_current_user)):
    cursor = predictions_collection.find({"user_id": str(current_user["_id"])}).sort("created_at", -1)
    history = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        history.append(doc)
    return history


@router.get("/admin/analytics")
async def admin_analytics(_admin: dict = Depends(require_admin)):
    total_users = await users_collection.count_documents({})
    total_predictions = await predictions_collection.count_documents({})

    disease_counter: Counter = Counter()
    severity_counter: Counter = Counter()
    async for doc in predictions_collection.find({}, {"primary_disease": 1, "severity": 1}):
        disease_counter[doc["primary_disease"]] += 1
        severity_counter[doc["severity"]] += 1

    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "disease_distribution": dict(disease_counter),
        "severity_distribution": dict(severity_counter),
    }
