"""
NLP Service API Routes.
Exposes translation, language detection, medical NER, OCR pipeline,
and semantic search as REST endpoints.
"""
import io
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.services import nlp_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nlp", tags=["NLP & Translation"])


# ─── Request / Response Schemas ──────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    target_lang: str  # "en" | "hi" | "gu"
    source_lang: Optional[str] = None


class TranslateResponse(BaseModel):
    original_text: str
    translated_text: str
    source_lang: str
    target_lang: str


class DetectLanguageRequest(BaseModel):
    text: str


class DetectLanguageResponse(BaseModel):
    text: str
    detected_lang: str
    lang_label: str


class NERRequest(BaseModel):
    text: str


class NERResponse(BaseModel):
    medicines: List[str]
    diseases: List[str]
    symptoms: List[str]


class SemanticSearchRequest(BaseModel):
    query: str
    corpus: List[str]
    top_k: int = 3


class SemanticSearchResult(BaseModel):
    text: str
    score: float


class SemanticSearchResponse(BaseModel):
    query: str
    results: List[SemanticSearchResult]


class OCRResponse(BaseModel):
    raw_text: str
    language_detected: str
    medicines: List[str]
    diseases: List[str]
    symptoms: List[str]
    safety_alerts: List[str]


# ─── Language label map ───────────────────────────────────────────────────────

LANG_LABELS = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "gu": "Gujarati (ગુજરાતી)",
}

# Known safety-flagged drugs
SAFETY_FLAGS = {
    "isotretinoin": "⚠️ Isotretinoin is teratogenic — avoid during pregnancy. Monitor liver enzymes monthly.",
    "methotrexate": "⚠️ Methotrexate requires regular blood monitoring. Avoid alcohol and NSAIDs.",
    "dapsone": "⚠️ Dapsone can cause hemolytic anemia. Check G6PD levels before use.",
    "tacrolimus": "⚠️ Tacrolimus: avoid prolonged sun exposure. Do not use on infected skin.",
    "clindamycin": "ℹ️ Clindamycin: May cause antibiotic-associated diarrhea. Complete the full course.",
    "tretinoin": "ℹ️ Tretinoin: Start with low frequency to build tolerance. Avoid sun exposure.",
    "betamethasone": "⚠️ Betamethasone is a potent steroid. Avoid long-term use without medical supervision.",
    "clobetasol": "⚠️ Clobetasol: High-potency steroid. Limit use to 2 consecutive weeks.",
}


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    payload: TranslateRequest,
    _user: dict = Depends(get_current_user)
):
    """Translate text between English, Hindi, and Gujarati."""
    if payload.target_lang not in ("en", "hi", "gu"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "target_lang must be one of: en, hi, gu"
        )
    detected = payload.source_lang or nlp_service.detect_language(payload.text)
    translated = nlp_service.translate_text(
        payload.text,
        target_lang=payload.target_lang,
        source_lang=detected
    )
    return TranslateResponse(
        original_text=payload.text,
        translated_text=translated,
        source_lang=detected,
        target_lang=payload.target_lang,
    )


@router.post("/detect-language", response_model=DetectLanguageResponse)
async def detect_language(
    payload: DetectLanguageRequest,
    _user: dict = Depends(get_current_user)
):
    """Detect language of the given text."""
    lang = nlp_service.detect_language(payload.text)
    return DetectLanguageResponse(
        text=payload.text,
        detected_lang=lang,
        lang_label=LANG_LABELS.get(lang, lang)
    )


@router.post("/ner", response_model=NERResponse)
async def extract_entities(
    payload: NERRequest,
    _user: dict = Depends(get_current_user)
):
    """Extract medical entities (medicines, diseases, symptoms) from text."""
    result = nlp_service.extract_medical_entities(payload.text)
    return NERResponse(**result)


@router.post("/semantic-search", response_model=SemanticSearchResponse)
async def semantic_search(
    payload: SemanticSearchRequest,
    _user: dict = Depends(get_current_user)
):
    """Find the most semantically similar strings in a corpus."""
    if not payload.corpus:
        return SemanticSearchResponse(query=payload.query, results=[])
    raw_results = nlp_service.semantic_search(
        payload.query, payload.corpus, top_k=payload.top_k
    )
    return SemanticSearchResponse(
        query=payload.query,
        results=[SemanticSearchResult(text=r[0], score=r[1]) for r in raw_results]
    )


@router.post("/ocr", response_model=OCRResponse)
async def ocr_prescription(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Full OCR + NLP pipeline for prescription images.
    Steps:
      1. Read image bytes
      2. Run EasyOCR to extract raw text
      3. Detect language of extracted text
      4. Translate to English if not already English
      5. Run Biomedical NER to extract medicines, diseases, symptoms
      6. Cross-reference medicines against safety flag database
      7. Return structured result
    """
    if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/bmp"}:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Only JPG, PNG, WEBP, or BMP images are supported for OCR."
        )

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Prescription image exceeds the 10MB size limit."
        )

    raw_text = ""
    # ── Step 1: EasyOCR text extraction ──────────────────────────────────────
    try:
        import easyocr
        import numpy as np
        import cv2

        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # EasyOCR: support English, Hindi (Devanagari), and Gujarati
        reader = easyocr.Reader(["en", "hi"], gpu=False, verbose=False)
        results = reader.readtext(img_bgr, detail=0, paragraph=True)
        raw_text = " ".join(results).strip()
    except ImportError:
        logger.warning("easyocr not installed — falling back to Tesseract-style mock OCR.")
        raw_text = "(OCR library not installed. Install easyocr to enable real OCR.)"
    except Exception as e:
        logger.error(f"OCR processing error: {e}")
        raw_text = "(OCR failed to extract text from the provided image.)"

    if not raw_text or raw_text.startswith("("):
        return OCRResponse(
            raw_text=raw_text or "No text detected.",
            language_detected="en",
            medicines=[],
            diseases=[],
            symptoms=[],
            safety_alerts=["OCR could not extract readable text. Please upload a clearer image."]
        )

    # ── Step 2: Language detection ────────────────────────────────────────────
    detected_lang = nlp_service.detect_language(raw_text)

    # ── Step 3: Translate to English for NER processing ──────────────────────
    english_text = raw_text
    if detected_lang != "en":
        try:
            english_text = nlp_service.translate_text(
                raw_text, target_lang="en", source_lang=detected_lang
            )
        except Exception as e:
            logger.warning(f"Translation failed, using original text for NER: {e}")

    # ── Step 4: Biomedical NER ────────────────────────────────────────────────
    entities = nlp_service.extract_medical_entities(english_text)

    # ── Step 5: Safety alerts ─────────────────────────────────────────────────
    safety_alerts = []
    all_medicine_names = " ".join(entities.get("medicines", [])).lower()
    for drug_key, alert_msg in SAFETY_FLAGS.items():
        if drug_key in all_medicine_names or drug_key in english_text.lower():
            safety_alerts.append(alert_msg)

    return OCRResponse(
        raw_text=raw_text,
        language_detected=detected_lang,
        medicines=entities.get("medicines", []),
        diseases=entities.get("diseases", []),
        symptoms=entities.get("symptoms", []),
        safety_alerts=safety_alerts if safety_alerts else [],
    )
