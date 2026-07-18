"""
Generates educational skin-care, lifestyle, diet, and medication-category
recommendations based on the predicted disease and severity.

All medication content is intentionally limited to general drug CATEGORIES
and purposes (e.g. "topical retinoids", "antihistamines") rather than doses,
brand names, or prescribing instructions, and is explicitly framed as
educational, non-prescriptive information.
"""
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
with open(BASE_DIR / "data" / "disease_info.json") as f:
    DISEASE_INFO: dict = json.load(f)

MEDICATION_CATEGORIES = {
    "Eczema": {
        "categories": ["Topical Emollients", "Mild Topical Steroids (prescribed)", "Oral Antihistamines (for itching)"],
        "general_purpose": "Restore skin barrier hydration and reduce local inflammation and itching.",
        "precautions": ["Avoid continuous steroid use without supervision", "Do not apply steroids on broken/infected skin"],
        "side_effects": ["Skin thinning with prolonged steroid use", "Drowsiness from certain antihistamines"],
        "allergy_warning": "Discontinue use if skin irritation or rash worsens after application.",
    },
    "Warts_Viral_Infections": {
        "categories": ["Salicylic acid preparations", "Cryotherapy agents (OTC/professional)", "Immune response modifiers (e.g. imiquimod)"],
        "general_purpose": "Destructive peeling of viral-infected tissue or stimulating local immune response.",
        "precautions": ["Avoid contact with eyes, face, or genitals unless specified", "Do not use on bleeding or irritated skin"],
        "side_effects": ["Skin redness", "Localized burning", "Peeling or blistering"],
        "allergy_warning": "Seek medical attention if severe chemical burning, hives, or breathing issues occur.",
    },
    "Melanoma": {
        "categories": ["Surgical excision (primary)", "Immunotherapy", "Targeted therapy", "Chemotherapy / Radiation"],
        "general_purpose": "Specialist oncology and dermatology treatments. Self-medication is not appropriate.",
        "precautions": ["This is a high-risk malignancy; urgent surgical oncology staging is required", "Do not attempt self-treatment"],
        "side_effects": ["Varies widely depending on the prescribed clinical systemic therapy"],
        "allergy_warning": "Not applicable — professional oncological intervention is required.",
    },
    "Atopic_Dermatitis": {
        "categories": ["Thick Emollients/Ceramide creams", "Topical Corticosteroids", "Calcineurin inhibitors (tacrolimus)", "JAK inhibitors"],
        "general_purpose": "Repair the genetic skin barrier defect and control chronic immune-mediated flares.",
        "precautions": ["Use steroid creams sparingly on thin-skin areas (face, folds)", "Apply moisturizer first"],
        "side_effects": ["Temporary burning/stinging at application site", "Increased risk of localized skin infections"],
        "allergy_warning": "Discontinue and consult your doctor if signs of bacterial skin infection (yellow crusts) occur.",
    },
    "Basal_Cell_Carcinoma": {
        "categories": ["Surgical excision", "Mohs micrographic surgery", "Topical chemotherapy (imiquimod)", "Photodynamic therapy"],
        "general_purpose": "Eliminate cancerous epidermal basal cells and prevent local tissue damage.",
        "precautions": ["Requires professional diagnosis and removal; home remedies are ineffective and unsafe"],
        "side_effects": ["Localized swelling", "Redness", "Scarring at the surgical site"],
        "allergy_warning": "Not applicable — requires professional in-clinic treatment.",
    },
    "Melanocytic_Nevi": {
        "categories": ["Professional shave removal", "Surgical excision (with biopsy)"],
        "general_purpose": "Removal of moles if they are irritated by clothing, cosmetically bothersome, or suspicious.",
        "precautions": ["Moles must be removed by a doctor to allow laboratory biopsy", "Never attempt to cut or freeze a mole at home"],
        "side_effects": ["Mild surgical scarring", "Temporary localized pain"],
        "allergy_warning": "Seek professional dermatological review if a mole changes.",
    },
    "Benign_Keratosis": {
        "categories": ["Cryotherapy (freezing)", "Electrocautery / Shave removal", "Laser therapy"],
        "general_purpose": "Safe removal of cosmetic or physically irritated benign keratosis-like lesions.",
        "precautions": ["Confirm with a dermatologist that the lesion is benign before removal", "Avoid scratching or peeling"],
        "side_effects": ["Hypopigmentation (lighter skin patch)", "Temporary blistering"],
        "allergy_warning": "Consult a doctor if the spot starts growing rapidly or bleeding.",
    },
    "Psoriasis_Lichen_Planus": {
        "categories": ["High-potency Topical Corticosteroids", "Coal tar formulations", "Vitamin D3 analogues", "Systemic Biologics"],
        "general_purpose": "Slow down rapid skin cell production (Psoriasis) and reduce autoimmune-driven skin inflammation.",
        "precautions": ["Do not stop oral/systemic medications suddenly", "Avoid skin injury which can trigger new plaques"],
        "side_effects": ["Skin thinning", "Irritation", "Systemic immunosuppression (with biologic agents)"],
        "allergy_warning": "Seek immediate medical attention if you experience severe joint pain, widespread skin redness, or fever.",
    },
    "Seborrheic_Keratoses": {
        "categories": ["Cryotherapy", "Curettage or Shave excision"],
        "general_purpose": "Benign epidermal growth removal if cosmetically undesirable or physically irritated.",
        "precautions": ["Do not try to scratch off growths at home as it causes bleeding and infection", "Consult a doctor to rule out melanoma"],
        "side_effects": ["Mild scarring", "Temporary localized redness or swelling"],
        "allergy_warning": "Not applicable — professional removal only.",
    },
    "Tinea_Fungal_Infections": {
        "categories": ["Topical Antifungals (Clotrimazole, Terbinafine, Ketoconazole)", "Oral Antifungals (for resistant cases)"],
        "general_purpose": "Eradicate dermatophyte or yeast fungal infections of the skin.",
        "precautions": ["Apply for the full duration recommended (usually 2-4 weeks) even if skin looks clear", "Keep the area dry"],
        "side_effects": ["Mild burning, itching, or redness at the application site"],
        "allergy_warning": "Stop treatment if a severe burning sensation or spreading rash develops.",
    },
    "Healthy_Skin": {
        "categories": [],
        "general_purpose": "No medication is indicated.",
        "precautions": [],
        "side_effects": [],
        "allergy_warning": "Not applicable.",
    },
}

SEVERITY_GUIDANCE = {
    "Mild": "Mild presentation: home care and over-the-counter measures are typically a reasonable first step. Monitor for changes.",
    "Moderate": "Moderate presentation: a consultation with a dermatologist is recommended to confirm diagnosis and discuss treatment options.",
    "Severe": "Severe / high-risk presentation: please seek dermatologist or emergency care promptly — do not delay professional evaluation.",
}


def get_recommendations(disease: str, severity: str) -> dict:
    info = DISEASE_INFO.get(disease, DISEASE_INFO["Healthy_Skin"])
    meds = MEDICATION_CATEGORIES.get(disease, MEDICATION_CATEGORIES["Healthy_Skin"])

    return {
        "disease": disease,
        "severity": severity,
        "skin_care": info.get("self_care", []),
        "lifestyle": [
            "Aim for 7-9 hours of sleep nightly to support skin repair.",
            "Practice stress management (breathing exercises, yoga, walking).",
            "Engage in regular moderate exercise; shower promptly afterward.",
            "Limit smoking and alcohol, which can worsen many skin conditions.",
        ],
        "diet_recommended": [
            "Foods rich in omega-3s (walnuts, flaxseed, fish)",
            "Antioxidant-rich fruits and vegetables",
            "Probiotic foods (yogurt, fermented foods)",
            "Adequate water intake (~2-3 liters/day, individual needs vary)",
        ],
        "diet_avoid": [
            "Refined sugars and high-glycemic index foods",
            "Excessive dairy products if you notice a personal flare correlation",
            "Highly processed and fried foods",
        ],
        "hydration": "Maintain steady hydration throughout the day; pair with a fragrance-free moisturizer suited to your skin type.",
        "medication_info": meds,
        "severity_guidance": SEVERITY_GUIDANCE.get(severity, SEVERITY_GUIDANCE["Mild"]),
        "when_to_consult_doctor": info.get("when_to_consult_doctor", []),
        "emergency_warning_signs": info.get("emergency_signs", []),
    }
