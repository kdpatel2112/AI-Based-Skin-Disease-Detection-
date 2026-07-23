"""
Chatbot route with Semantic RAG + Language-Aware replies.
Primary tier: Semantic similarity search over dermatology knowledge base (FAISS + MiniLM).
Fallback tier: Keyword pattern matching for when NLP models are not loaded.
"""
import re
import logging
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])

# ─── Knowledge Base ───────────────────────────────────────────────────────────
# Curated dermatology Q&A pairs. The 'query' is used for semantic indexing.
KNOWLEDGE_BASE = [
    {
        "queries": ["what is this app", "who are you", "hello", "hi", "help me", "what can you do"],
        "answer": (
            "Hello! I am your AI Skin Health assistant. 🌿\n\n"
            "I can help you with questions about skin diseases, how our AI classifier works, "
            "Grad-CAM explainability, skincare recommendations, and warning signs. "
            "How can I help you today?"
        )
    },
    {
        "queries": ["how accurate is the model", "can I trust the results", "model accuracy", "correct diagnosis", "is this reliable"],
        "answer": (
            "Our skin disease screening tool uses a state-of-the-art **EfficientNetV2-L** deep learning network, "
            "achieving ~94–98% validation accuracy on clinical dermatology datasets. 📊\n\n"
            "However, this is an **educational screening system** and is **NOT** a replacement for a "
            "dermatologist's physical examination. Always consult a healthcare professional for a formal diagnosis."
        )
    },
    {
        "queries": ["what is gradcam", "heatmap meaning", "red areas on scan", "explain the overlay", "what does the color mean"],
        "answer": (
            "**Grad-CAM (Gradient-weighted Class Activation Mapping)** is an Explainable AI technique. 🔍\n\n"
            "It calculates gradients of the prediction with respect to the last convolutional layer. "
            "The **red and yellow areas** highlight the exact pixels, lesion margins, and texture zones "
            "the model evaluated to make its prediction, allowing clinicians to verify its focus."
        )
    },
    {
        "queries": ["how to take care of skin", "daily skincare routine", "moisturizer advice", "sunscreen", "dry skin tips", "skin care"],
        "answer": (
            "Here are general daily skincare rules: 💧\n\n"
            "1. **Cleanse** gently twice daily with a soap-free, pH-balanced cleanser.\n"
            "2. Apply **broad-spectrum SPF 30+ sunscreen** daily, even on cloudy days.\n"
            "3. **Moisturize** regularly with non-comedogenic creams to protect your skin barrier.\n"
            "4. Avoid scratching or picking at active lesions to prevent secondary bacterial infection.\n"
            "5. Stay hydrated — drink at least 2–3 liters of water daily."
        )
    },
    {
        "queries": ["what should I eat for skin", "best foods for skin", "diet for eczema", "nutrition for acne", "foods to avoid skin", "diet advice"],
        "answer": (
            "Diet plays a crucial role in managing skin health: 🍏\n\n"
            "**Recommended:** Anti-inflammatory foods like berries, fatty fish (omega-3), leafy greens, almonds, and green tea.\n"
            "**Avoid:** High-glycemic index foods, excessive refined sugar, trans fats, and diary products (common triggers for eczema and acne).\n"
            "**Hydration:** Drink at least 2.5–3 liters of fresh water daily to flush toxins.\n"
            "**Supplements:** Vitamin D, Vitamin E, and Zinc may help skin repair."
        )
    },
    {
        "queries": ["when should I see a doctor", "emergency signs", "danger warning", "severe symptoms", "when to go to hospital"],
        "answer": (
            "⚠️ **Warning Signs to Watch For:**\n\n"
            "Seek immediate medical attention if you notice:\n"
            "• Sudden, painful spreading of redness or swelling.\n"
            "• Signs of systemic infection (fever, chills, warmth, pus draining).\n"
            "• Lesions that are bleeding, oozing, or changing shape/color rapidly (ABCDE rules of melanoma).\n"
            "• Difficulty breathing or severe allergic reaction after applying a medication."
        )
    },
    {
        "queries": ["how to use the app", "how to upload a photo", "how does scanning work", "how to get results"],
        "answer": (
            "To use the screening system: 📱\n\n"
            "1. Go to the **Scan Skin** page.\n"
            "2. Upload a clear, close-up photo of the skin lesion (JPG, PNG, or WEBP).\n"
            "3. The system runs quality checks (blur, contrast, brightness).\n"
            "4. If passed, it generates prediction probabilities, a Grad-CAM heatmap, and custom recommendations.\n"
            "5. Download your PDF report or share it via email."
        )
    },
    {
        "queries": ["what is eczema", "eczema treatment", "how to manage eczema", "eczema symptoms", "atopic dermatitis"],
        "answer": (
            "**Eczema (Atopic Dermatitis)** is a chronic inflammatory skin condition. 🌿\n\n"
            "**Symptoms:** Red, itchy, dry patches — often on the inner elbows, behind knees, and face.\n"
            "**Management:**\n"
            "• Apply a thick, fragrance-free moisturizer twice daily.\n"
            "• Use mild, soap-free cleansers and lukewarm water.\n"
            "• Identify and avoid triggers (pet dander, harsh detergents, stress).\n"
            "• Topical corticosteroids can reduce flares (use only as prescribed).\n"
            "• Consult a dermatologist if OTC creams don't improve symptoms in 2 weeks."
        )
    },
    {
        "queries": ["what is melanoma", "skin cancer signs", "melanoma symptoms", "is it cancer", "suspicious mole"],
        "answer": (
            "**Melanoma** is the most serious type of skin cancer. ⚠️\n\n"
            "Use the **ABCDE rule** to evaluate suspicious moles:\n"
            "• **A**symmetry — one half doesn't match the other\n"
            "• **B**order — irregular, ragged, or blurred edges\n"
            "• **C**olor — multiple shades of brown, black, red, or blue\n"
            "• **D**iameter — larger than 6mm (size of a pencil eraser)\n"
            "• **E**volving — changing in size, shape, or color\n\n"
            "**If you notice any of these signs, please consult a dermatologist immediately.** 🏥"
        )
    },
    {
        "queries": ["what is psoriasis", "psoriasis treatment", "psoriasis diet", "psoriasis triggers"],
        "answer": (
            "**Psoriasis** is a chronic autoimmune condition causing rapid skin cell buildup. 🔬\n\n"
            "**Symptoms:** Thick, red, scaly patches (plaques) — often on elbows, knees, scalp, and lower back.\n"
            "**Triggers:** Stress, infections, certain medications, cold weather, and alcohol.\n"
            "**Management:**\n"
            "• Keep skin moisturized to reduce scaling.\n"
            "• Phototherapy (UV light therapy) can help in moderate-severe cases.\n"
            "• Biologic medications are available for severe cases — consult a dermatologist."
        )
    },
    {
        "queries": ["prescription OCR", "read my prescription", "medicine names", "what medicines are in prescription"],
        "answer": (
            "The **Prescription OCR** feature (in your Dashboard) can read prescription images! 📋\n\n"
            "**How to use it:**\n"
            "1. Go to Dashboard → Prescription OCR tab.\n"
            "2. Upload a photo of your prescription.\n"
            "3. Our AI will extract medicine names, diseases, and symptoms.\n"
            "4. Safety alerts will be shown for high-risk medications.\n\n"
            "Note: This is for informational purposes only — always follow your doctor's instructions."
        )
    },
    {
        "queries": ["pdf report", "download report", "share report", "report in hindi", "report in gujarati"],
        "answer": (
            "You can download a **professional clinical PDF report** from the Results page! 📄\n\n"
            "**Features:**\n"
            "• Diagnosis summary with confidence scores and Grad-CAM heatmap.\n"
            "• Personalized skincare, diet, and lifestyle recommendations.\n"
            "• Nearby doctor/hospital information.\n"
            "• QR verification code and FHIR-compatible JSON export.\n"
            "• **Multilingual:** Reports can be generated in English, Hindi, or Gujarati — just set your language!"
        )
    },
]

# Flatten knowledge base into (text, answer) pairs for semantic indexing
_CORPUS: list[str] = []
_ANSWERS: list[str] = []
for kb in KNOWLEDGE_BASE:
    for q in kb["queries"]:
        _CORPUS.append(q)
        _ANSWERS.append(kb["answer"])

# ─── Lazy FAISS index ─────────────────────────────────────────────────────────
_faiss_index = None
_faiss_embeddings = None

def _build_faiss_index():
    """Build FAISS index from corpus embeddings on first call."""
    global _faiss_index, _faiss_embeddings
    if _faiss_index is not None:
        return True
    try:
        import faiss
        import numpy as np
        from app.services.nlp_service import _sentence_model, _init_models
        _init_models()
        if _sentence_model is None:
            return False
        embeddings = _sentence_model.encode(_CORPUS, convert_to_numpy=True)
        embeddings = embeddings / (np.linalg.norm(embeddings, axis=1, keepdims=True) + 1e-8)
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)  # Inner product (cosine on normalized vectors)
        index.add(embeddings.astype("float32"))
        _faiss_index = index
        _faiss_embeddings = embeddings
        logger.info("FAISS chatbot index built successfully.")
        return True
    except Exception as e:
        logger.warning(f"Could not build FAISS index: {e}")
        return False


def _semantic_lookup(query: str, threshold: float = 0.50) -> Optional[str]:
    """Find best matching answer using semantic similarity. Returns None if below threshold."""
    if not _build_faiss_index():
        return None
    try:
        import faiss
        import numpy as np
        from app.services.nlp_service import _sentence_model
        q_emb = _sentence_model.encode([query], convert_to_numpy=True)
        q_emb = q_emb / (np.linalg.norm(q_emb, axis=1, keepdims=True) + 1e-8)
        scores, indices = _faiss_index.search(q_emb.astype("float32"), k=1)
        best_score = float(scores[0][0])
        best_idx = int(indices[0][0])
        if best_score >= threshold and 0 <= best_idx < len(_ANSWERS):
            logger.info(f"Semantic match: score={best_score:.3f}, query='{query[:60]}'")
            return _ANSWERS[best_idx]
    except Exception as e:
        logger.warning(f"FAISS semantic search failed: {e}")
    return None


def _keyword_lookup(msg: str) -> Optional[str]:
    """Keyword-based fallback intent matching."""
    words = set(re.findall(r'\b\w+\b', msg))
    if words.intersection({"hi", "hello", "hey", "help"}) or "who are you" in msg:
        return KNOWLEDGE_BASE[0]["answer"]
    if words.intersection({"accurate", "accuracy", "reliable", "trust", "correct"}):
        return KNOWLEDGE_BASE[1]["answer"]
    if words.intersection({"gradcam", "heatmap", "overlay", "highlight", "red", "explain"}):
        return KNOWLEDGE_BASE[2]["answer"]
    if words.intersection({"skincare", "moisturizer", "sunscreen", "cleanser", "wash"}) or "skin care" in msg:
        return KNOWLEDGE_BASE[3]["answer"]
    if words.intersection({"diet", "food", "eat", "avoid", "sugar", "dairy", "nutrition"}):
        return KNOWLEDGE_BASE[4]["answer"]
    if words.intersection({"emergency", "warning", "danger", "doctor", "severe", "hospital"}):
        return KNOWLEDGE_BASE[5]["answer"]
    if words.intersection({"use", "upload", "work", "scan", "photo"}):
        return KNOWLEDGE_BASE[6]["answer"]
    if words.intersection({"eczema", "atopic", "itchy", "rash", "dermatitis"}):
        return KNOWLEDGE_BASE[7]["answer"]
    if words.intersection({"melanoma", "cancer", "mole", "abcde", "malignant"}):
        return KNOWLEDGE_BASE[8]["answer"]
    if words.intersection({"psoriasis", "plaque", "scaly", "silvery"}):
        return KNOWLEDGE_BASE[9]["answer"]
    if words.intersection({"prescription", "medicine", "drug", "ocr", "tablet"}):
        return KNOWLEDGE_BASE[10]["answer"]
    if words.intersection({"report", "pdf", "download", "hindi", "gujarati"}):
        return KNOWLEDGE_BASE[11]["answer"]
    return None


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ChatQuery(BaseModel):
    message: str
    language: Optional[str] = "en"  # "en" | "hi" | "gu"


class ChatResponse(BaseModel):
    reply: str
    matched_by: str = "keyword"  # "semantic" | "keyword" | "fallback"


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/query", response_model=ChatResponse)
async def query_chatbot(payload: ChatQuery):
    msg_original = payload.message.strip()
    lang = payload.language or "en"

    # Translate non-English query to English for semantic/keyword matching
    msg_en = msg_original
    if lang != "en":
        try:
            from app.services.nlp_service import translate_text
            msg_en = translate_text(msg_original, target_lang="en", source_lang=lang)
        except Exception as e:
            logger.warning(f"Chatbot query translation failed: {e}")

    msg_lower = msg_en.lower()

    # ── Tier 1: Semantic RAG search ───────────────────────────────────────────
    reply = _semantic_lookup(msg_lower)
    matched_by = "semantic"

    # ── Tier 2: Keyword fallback ──────────────────────────────────────────────
    if reply is None:
        reply = _keyword_lookup(msg_lower)
        matched_by = "keyword"

    # ── Tier 3: Generic fallback ──────────────────────────────────────────────
    if reply is None:
        reply = (
            "I'm sorry, I didn't quite catch that. You can ask me about:\n\n"
            "• **Model Accuracy** (e.g. 'How accurate is the app?')\n"
            "• **Explainable AI** (e.g. 'What does the heatmap show?')\n"
            "• **Skincare & Diet** (e.g. 'What foods should I avoid?')\n"
            "• **Warning Signs** (e.g. 'When should I see a doctor?')\n"
            "• **Eczema, Melanoma, Psoriasis** and other conditions\n\n"
            "Or try the Quick Questions above!"
        )
        matched_by = "fallback"

    # Translate reply back to user's language if needed
    if lang != "en" and matched_by != "fallback":
        try:
            from app.services.nlp_service import translate_text
            reply = translate_text(reply, target_lang=lang, source_lang="en")
        except Exception as e:
            logger.warning(f"Chatbot reply translation failed: {e}")

    return ChatResponse(reply=reply, matched_by=matched_by)
