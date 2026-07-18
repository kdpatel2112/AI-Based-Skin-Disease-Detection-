"""
Chatbot FAQ API: provides instant responses to clinical questions,
accuracy queries, skincare tips, and explainability mechanisms.
"""
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot"])


class ChatQuery(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@router.post("/query", response_model=ChatResponse)
async def query_chatbot(payload: ChatQuery):
    msg = payload.message.strip().lower()
    
    # 1. Greetings
    if any(x in msg for x in ["hi", "hello", "hey", "who are you", "greetings", "help"]):
        reply = (
            "Hello! I am your AI Skin Health assistant. 🌿\n\n"
            "You can ask me questions about skin diseases, how our classifier works, "
            "Grad-CAM explainability, skincare recommendations, or warning signs. "
            "How can I help you today?"
        )
    
    # 2. Accuracy & Reliability
    elif any(x in msg for x in ["accuracy", "accurate", "reliable", "correct", "wrong", "mistake", "trust"]):
        reply = (
            "Our skin disease screening tool uses a state-of-the-art **EfficientNetV2-L** deep learning network, "
            "achieving ~94-98% validation accuracy on clinical datasets. 📊\n\n"
            "However, please note that it is an educational screening system and **NOT** a replacement for a "
            "dermatologist's physical examination. Always consult a healthcare professional for a formal diagnosis."
        )
        
    # 3. Grad-CAM & Heatmaps
    elif any(x in msg for x in ["gradcam", "grad-cam", "heatmap", "red spot", "overlay", "highlight", "explain"]):
        reply = (
            "**Grad-CAM (Gradient-weighted Class Activation Mapping)** is an Explainable AI technology. 🔍\n\n"
            "It calculates gradients of class prediction scores with respect to the last convolutional layer. "
            "The red and yellow areas highlight the exact pixels, lesion margins, and texture zones that the "
            "model evaluated to make its prediction, allowing clinicians to verify its focus."
        )

    # 4. Skincare & Daily Care
    elif any(x in msg for x in ["skincare", "skin care", "wash", "moisturizer", "sunscreen", "dry skin", "oil"]):
        reply = (
            "Here are general daily skincare rules: 💧\n\n"
            "1. Cleanse gently twice daily with a soap-free, pH-balanced cleanser.\n"
            "2. Apply a broad-spectrum SPF 30+ sunscreen daily, even on cloudy days.\n"
            "3. Moisturize regularly with non-comedogenic creams to protect your skin barrier.\n"
            "4. Avoid scratching or picking at active lesions to prevent secondary bacterial infection."
        )

    # 5. Diet & Nutrition
    elif any(x in msg for x in ["diet", "food", "eat", "avoid", "nutrition", "sugar", "dairy", "water"]):
        reply = (
            "Diet plays a crucial role in managing skin health: 🍏\n\n"
            "- **Recommended**: Anti-inflammatory foods like berries, fatty fish (rich in omega-3), leafy greens, almonds, and green tea.\n"
            "- **Avoid**: High-glycemic index foods, excessive refined sugar, trans fats, and dairy products (which are common triggers for eczema and acne flares).\n"
            "- **Hydration**: Drink at least 2.5 to 3 liters of fresh water daily to flush toxins."
        )

    # 6. Warning Signs & Emergencies
    elif any(x in msg for x in ["warning", "emergency", "danger", "doctor", "severe", "hospital", "worse"]):
        reply = (
            "⚠️ **Warning Signs to Watch For**:\n\n"
            "Seek immediate medical attention if you notice:\n"
            "- Sudden, painful spreading of redness or swelling.\n"
            "- Signs of systemic infection (fever, chills, warmth, pus draining).\n"
            "- Lesions that are bleeding, oozing, or changing shape/color rapidly (ABCDE rules of melanoma)."
        )

    # 7. How to Use
    elif any(x in msg for x in ["use", "how to", "upload", "work"]):
        reply = (
            "To use the screening system: 📱\n\n"
            "1. Go to the **Scan Skin** page.\n"
            "2. Upload a clear, close-up photo of the skin lesion.\n"
            "3. The system will run quality checks (blur, contrast, brightness).\n"
            "4. If passed, it generates the prediction probabilities, Grad-CAM heatmap, and custom recommendations."
        )

    # 8. Fallback FAQ guidance
    else:
        reply = (
            "I'm sorry, I didn't quite catch that. You can ask me about:\n\n"
            "• **Model Accuracy** (e.g. 'How accurate is the app?')\n"
            "• **Explainable AI** (e.g. 'What does the heatmap show?')\n"
            "• **Skincare & Diet** (e.g. 'What foods should I avoid?')\n"
            "• **Warning Signs** (e.g. 'When should I see a doctor?')\n\n"
            "Or try selecting one of the Quick Questions above!"
        )
        
    return ChatResponse(reply=reply)
