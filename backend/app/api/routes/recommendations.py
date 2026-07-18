"""
Disease information and recommendation routes.
"""
import json
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.schemas.prediction import RecommendationResponse
from app.services.recommendation_engine import get_recommendations
from app.services.translator import translate_recommendation

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

BASE_DIR = Path(__file__).resolve().parent.parent.parent
with open(BASE_DIR / "data" / "disease_info.json") as f:
    DISEASE_INFO = json.load(f)


@router.get("/disease/{disease_name}")
async def disease_info(disease_name: str):
    info = DISEASE_INFO.get(disease_name)
    if not info:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Disease information not found.")
    return {"disease": disease_name, **info}


@router.get("/{disease_name}/{severity}", response_model=RecommendationResponse)
async def recommendations(disease_name: str, severity: str, lang: str = "en", _user: dict = Depends(get_current_user)):
    if disease_name not in DISEASE_INFO:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown disease.")
    if severity not in {"Mild", "Moderate", "Severe"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Severity must be Mild, Moderate, or Severe.")
    
    rec = get_recommendations(disease_name, severity)
    return translate_recommendation(rec, lang)
