import logging
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

# Lazy loaded models to avoid blocking server startup and save memory
_translator_pipeline = None
_ner_pipeline = None
_language_detector = None
_sentence_model = None

# Language codes for NLLB-200
LANG_MAP = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "gu": "guj_Gujr"
}

def _init_models():
    """Lazy initialize Hugging Face models."""
    global _translator_pipeline, _ner_pipeline, _language_detector, _sentence_model
    try:
        from transformers import pipeline
        import langdetect
        from sentence_transformers import SentenceTransformer

        if _language_detector is None:
            _language_detector = langdetect

        # Note: In a production environment with limited VRAM, 
        # these would be shifted to external APIs or smaller quantized models.
        if _translator_pipeline is None:
            logger.info("Loading translation model (facebook/nllb-200-distilled-600M)...")
            try:
                # Setting device=-1 for CPU. Change to 0 for GPU if available.
                _translator_pipeline = pipeline("translation", model="facebook/nllb-200-distilled-600M", device=-1) 
            except Exception as e:
                logger.error(f"Failed to load translator: {e}")
                
        if _ner_pipeline is None:
            logger.info("Loading NER model (d4data/biomedical-ner-all)...")
            try:
                _ner_pipeline = pipeline("ner", model="d4data/biomedical-ner-all", aggregation_strategy="simple", device=-1)
            except Exception as e:
                logger.error(f"Failed to load NER model: {e}")
                
        if _sentence_model is None:
            logger.info("Loading sentence transformer (all-MiniLM-L6-v2)...")
            try:
                _sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.error(f"Failed to load sentence model: {e}")
                
    except ImportError:
        logger.warning("NLP dependencies (transformers, sentence-transformers, langdetect) are not fully installed. Using mock mode.")

def detect_language(text: str) -> str:
    """Detect language of text. Returns 'en', 'hi', or 'gu'."""
    if not text or not text.strip():
        return "en"
    
    # 1. Fast script character range check
    has_devanagari = any('\u0900' <= char <= '\u097F' for char in text)
    if has_devanagari:
        return "hi"
    
    has_gujarati = any('\u0A80' <= char <= '\u0AFF' for char in text)
    if has_gujarati:
        return "gu"

    # 2. Statistical langdetect check
    try:
        import langdetect
        lang = langdetect.detect(text)
        if lang in ["hi", "gu"]:
            return lang
        return "en" # Default to English for unknown/others
    except Exception:
        return "en"


def translate_text(text: str, target_lang: str, source_lang: str = None) -> str:
    """Translate text to target language ('en', 'hi', 'gu')."""
    if not text or target_lang == source_lang:
        return text
        
    _init_models()
    
    if source_lang is None:
        source_lang = detect_language(text)
        
    if source_lang == target_lang:
        return text

    if _translator_pipeline:
        try:
            src = LANG_MAP.get(source_lang, "eng_Latn")
            tgt = LANG_MAP.get(target_lang, "eng_Latn")
            result = _translator_pipeline(text, src_lang=src, tgt_lang=tgt)
            return result[0]['translation_text']
        except Exception as e:
            logger.error(f"Translation error: {e}")
    
    # Fallback / Mock behavior if models aren't available locally
    logger.warning("Using mock translation (HF model unavailable).")
    # For testing, we just prefix it, or we could use the hardcoded EN_TO_HI mapping here as a fallback
    from app.services.translator import EN_TO_HI
    if target_lang == 'hi' and text in EN_TO_HI:
        return EN_TO_HI[text]
    return f"[{target_lang.upper()}] {text}"

def extract_medical_entities(text: str) -> Dict[str, List[str]]:
    """Extract diseases, medicines, and symptoms from text using Biomedical NER."""
    _init_models()
    
    result = {
        "medicines": [],
        "diseases": [],
        "symptoms": []
    }
    
    if _ner_pipeline:
        try:
            entities = _ner_pipeline(text)
            for entity in entities:
                label = entity.get('entity_group', '')
                word = entity.get('word', '').strip()
                if not word:
                    continue
                if label in ['Medication', 'Drug', 'Chemical']:
                    result["medicines"].append(word)
                elif label in ['Disease', 'MedicalCondition', 'Diagnosis']:
                    result["diseases"].append(word)
                elif label in ['Symptom', 'Sign']:
                    result["symptoms"].append(word)
            return result
        except Exception as e:
            logger.error(f"NER error: {e}")
            
    # Mock fallback
    logger.warning("Using mock NER.")
    lower_text = text.lower()
    if "isotretinoin" in lower_text or "clindamycin" in lower_text:
        result["medicines"] = ["Isotretinoin", "Clindamycin"]
    if "acne" in lower_text or "eczema" in lower_text:
        result["diseases"] = ["Acne", "Eczema"]
        
    return result

def semantic_search(query: str, corpus: List[str], top_k: int = 3) -> List[Tuple[str, float]]:
    """Find most semantically similar strings in corpus using sentence embeddings."""
    _init_models()
    
    if _sentence_model and len(corpus) > 0:
        try:
            import torch
            query_embedding = _sentence_model.encode(query, convert_to_tensor=True)
            corpus_embeddings = _sentence_model.encode(corpus, convert_to_tensor=True)
            
            # Compute cosine similarity
            from sentence_transformers import util
            cos_scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
            
            top_results = torch.topk(cos_scores, k=min(top_k, len(corpus)))
            
            results = []
            for score, idx in zip(top_results[0], top_results[1]):
                results.append((corpus[idx.item()], score.item()))
            return results
        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            
    # Mock fallback
    return [(corpus[i], 1.0) for i in range(min(top_k, len(corpus)))] if corpus else []
