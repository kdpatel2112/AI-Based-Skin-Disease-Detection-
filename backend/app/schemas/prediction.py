"""
Pydantic schemas for the AI prediction and recommendation modules.
"""
from typing import Literal

from pydantic import BaseModel


class DiseasePrediction(BaseModel):
    disease: str
    title: str | None = None
    confidence: float


class PredictionResponse(BaseModel):
    prediction_id: str
    top_predictions: list[DiseasePrediction]
    primary_disease: str
    primary_disease_title: str | None = None
    confidence: float
    severity: Literal["Mild", "Moderate", "Severe"]
    image_url: str | None = None
    gradcam_image_url: str | None = None
    image_quality_warnings: list[str] = []


class RecommendationResponse(BaseModel):
    disease: str
    severity: str
    skin_care: list[str]
    lifestyle: list[str]
    diet_recommended: list[str]
    diet_avoid: list[str]
    hydration: str
    medication_info: dict
    severity_guidance: str
    when_to_consult_doctor: list[str]
    emergency_warning_signs: list[str]
