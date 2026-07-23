"""
PDF report generation route. Produces a downloadable report for a given
prediction, including QR verification.
"""
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.api.deps import get_current_user
from app.db.mongodb import predictions_collection
from app.services.recommendation_engine import get_recommendations
from app.services.doctor_service import find_doctors, find_hospitals
from app.services.report_service import generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

SNOMED_MAPPING = {
    "Atopic_Dermatitis": {"code": "200762002", "display": "Atopic Dermatitis"},
    "Eczema": {"code": "187448005", "display": "Eczema"},
    "Melanoma": {"code": "372130007", "display": "Malignant Melanoma"},
    "Basal_Cell_Carcinoma": {"code": "254701007", "display": "Basal Cell Carcinoma"},
    "Melanocytic_Nevi": {"code": "400096001", "display": "Melanocytic Nevus (Mole)"},
    "Benign_Keratosis": {"code": "200962004", "display": "Benign Keratosis-like Lesion"},
    "Psoriasis_Lichen_Planus": {"code": "9014002", "display": "Psoriasis / Lichen Planus"},
    "Seborrheic_Keratoses": {"code": "201089006", "display": "Seborrheic Keratosis"},
    "Tinea_Fungal_Infections": {"code": "111867000", "display": "Tinea Fungal Infection"},
    "Warts_Viral_Infections": {"code": "111860007", "display": "Viral Wart Infection"},
    "Healthy_Skin": {"code": "268249007", "display": "Healthy Skin"},
}


@router.get("/{prediction_id}/pdf")
async def download_report(
    prediction_id: str,
    age: int = 21,
    gender: str = "Male",
    phone: str = "Optional",
    email: str = "Optional",
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    prediction = await predictions_collection.find_one({
        "_id": ObjectId(prediction_id), "user_id": str(current_user["_id"]),
    })
    if not prediction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")

    raw_disease = prediction.get("primary_disease")
    from app.services.ml_service import CLASS_MAPPING, DISPLAY_TITLES
    clean_disease_id = CLASS_MAPPING.get(raw_disease, raw_disease)

    # Clean-map top predictions for printable output in the PDF table
    mapped_predictions = []
    for p in prediction.get("top_predictions", []):
        raw_pred_id = p["disease"]
        clean_pred_id = CLASS_MAPPING.get(raw_pred_id, raw_pred_id)
        mapped_predictions.append({
            "disease": clean_pred_id,
            "title": DISPLAY_TITLES.get(clean_pred_id, clean_pred_id),
            "confidence": p["confidence"]
        })

    mapped_prediction = {
        **prediction,
        "primary_disease": clean_disease_id,
        "primary_disease_title": DISPLAY_TITLES.get(clean_disease_id, clean_disease_id),
        "top_predictions": mapped_predictions
    }

    recommendation = get_recommendations(clean_disease_id, prediction["severity"])
    nearby_doctors = await find_doctors(limit=5)
    nearby_hospitals = await find_hospitals(limit=5)

    verification_url = f"https://yourapp.example.com/verify-report/{prediction_id}"
    
    # Resolve email default if not provided
    resolved_email = email
    if resolved_email == "Optional" and current_user.get("email"):
        resolved_email = current_user["email"]

    pdf_bytes = generate_pdf_report(
        patient_name=current_user.get("full_name", "Patient"),
        prediction=mapped_prediction,
        recommendation=recommendation,
        nearby_doctors=nearby_doctors,
        nearby_hospitals=nearby_hospitals,
        verification_url=verification_url,
        age=age,
        gender=gender,
        phone=phone,
        email=resolved_email,
        target_lang=lang
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=skin_report_{prediction_id}.pdf"},
    )


from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr

class ShareReportPayload(BaseModel):
    email: EmailStr


@router.post("/{prediction_id}/share-email")
async def share_report_email(
    prediction_id: str,
    payload: ShareReportPayload,
    current_user: dict = Depends(get_current_user)
):
    prediction = await predictions_collection.find_one({
        "_id": ObjectId(prediction_id), "user_id": str(current_user["_id"]),
    })
    if not prediction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")

    recommendation = get_recommendations(prediction["primary_disease"], prediction["severity"])
    
    skin_care_str = "\n".join([f"   - {item}" for item in recommendation.get("skin_care", [])])
    lifestyle_str = "\n".join([f"   - {item}" for item in recommendation.get("lifestyle", [])])
    warnings_str = "\n".join([f"   - {item}" for item in recommendation.get("emergency_warning_signs", [])])
    diet_rec_str = ", ".join(recommendation.get("diet_recommended", []))
    diet_avoid_str = ", ".join(recommendation.get("diet_avoid", []))

    content = f"""
AI SKIN DISEASE ASSESSMENT REPORT
---------------------------------
Patient Name: {current_user.get("full_name", "Patient")}
Assessment Date: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}

DIAGNOSTIC SUMMARY:
- Primary Condition Detected: {prediction.get("primary_disease", "Unknown")}
- Confidence Score: {int(prediction.get("confidence", 0) * 100)}%
- Severity Assessment: {prediction.get("severity", "Mild")}

CLINICAL RECOMMENDATIONS ({prediction.get("severity", "Mild")} Severity):
1. Skincare Plan:
{skin_care_str}

2. Dietary Instructions:
   - Recommended: {diet_rec_str}
   - Discouraged: {diet_avoid_str}

3. Lifestyle Guidelines:
{lifestyle_str}

4. Warnings & Danger Signs:
{warnings_str}

---------------------------------
DISCLAIMER: This report is generated by an artificial intelligence screening model for educational purposes only. It does not constitute formal medical diagnosis or prescription. Please consult a qualified dermatologist for clinical evaluation.
"""

    from app.api.routes.auth import log_mock_email
    log_mock_email(
        email_type="Patient Assessment Report Share",
        recipient=payload.email,
        content=content
    )
    
    return {"message": "Report shared successfully via email."}

@router.get("/{prediction_id}/fhir")
async def download_fhir_report(
    prediction_id: str,
    current_user: dict = Depends(get_current_user)
):
    prediction = await predictions_collection.find_one({
        "_id": ObjectId(prediction_id), "user_id": str(current_user["_id"]),
    })
    if not prediction:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prediction not found.")

    raw_disease = prediction.get("primary_disease")
    from app.services.ml_service import CLASS_MAPPING
    clean_disease_id = CLASS_MAPPING.get(raw_disease, raw_disease)
    
    snomed_data = SNOMED_MAPPING.get(clean_disease_id, {"code": "000000000", "display": clean_disease_id})

    # Handling created_at string formatting safely
    created_at = prediction.get("created_at")
    if isinstance(created_at, datetime):
        eff_date = created_at.isoformat()
    elif isinstance(created_at, str):
        eff_date = created_at
    else:
        eff_date = datetime.now(timezone.utc).isoformat()

    # Build FHIR Observation Resource
    import json
    fhir_observation = {
        "resourceType": "Observation",
        "id": str(prediction["_id"]),
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "imaging",
                        "display": "Imaging"
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": snomed_data["code"],
                    "display": snomed_data["display"]
                }
            ],
            "text": "AI Skin Disease Classification"
        },
        "subject": {
            "reference": f"Patient/{current_user['_id']}",
            "display": current_user.get("full_name", "Unknown Patient")
        },
        "effectiveDateTime": eff_date,
        "valueCodeableConcept": {
            "coding": [
                {
                    "system": "http://snomed.info/sct",
                    "code": snomed_data["code"],
                    "display": snomed_data["display"]
                }
            ],
            "text": snomed_data["display"]
        },
        "interpretation": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                        "code": "A" if prediction.get("severity") in ["Moderate", "Severe"] else "N",
                        "display": "Abnormal" if prediction.get("severity") in ["Moderate", "Severe"] else "Normal"
                    }
                ]
            }
        ],
        "component": [
            {
                "code": {
                    "text": "Confidence Score"
                },
                "valueQuantity": {
                    "value": round(prediction.get("confidence", 0) * 100, 2),
                    "unit": "%",
                    "system": "http://unitsofmeasure.org",
                    "code": "%"
                }
            },
            {
                "code": {
                    "text": "Severity"
                },
                "valueString": prediction.get("severity", "Unknown")
            }
        ]
    }

    return Response(
        content=json.dumps(fhir_observation, indent=2),
        media_type="application/fhir+json",
        headers={"Content-Disposition": f"attachment; filename=fhir_report_{prediction_id}.json"},
    )
