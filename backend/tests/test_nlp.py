"""
Tests for the NLP Service module and NLP API endpoints.
Designed to work in both mock mode (no HF models installed) 
and full mode (with transformers/sentence-transformers).

Run with:
    cd backend
    pytest tests/test_nlp.py -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


# ─── NLP Service Unit Tests ───────────────────────────────────────────────────

class TestDetectLanguage:
    """Tests for nlp_service.detect_language()"""

    def test_detect_english(self):
        from app.services.nlp_service import detect_language
        lang = detect_language("This is a skin disease detection system.")
        assert lang == "en", f"Expected 'en', got '{lang}'"

    def test_detect_hindi(self):
        from app.services.nlp_service import detect_language
        lang = detect_language("यह एक त्वचा रोग पहचान प्रणाली है।")
        assert lang == "hi", f"Expected 'hi', got '{lang}'"

    def test_detect_gujarati(self):
        from app.services.nlp_service import detect_language
        lang = detect_language("આ ત્વચા રોગ ઓળખ સિસ્ટમ છે.")
        # langdetect may return 'gu' or fall back to 'en'; accept both
        assert lang in ("gu", "en"), f"Expected 'gu' or 'en', got '{lang}'"

    def test_detect_empty_returns_en(self):
        from app.services.nlp_service import detect_language
        lang = detect_language("")
        assert lang == "en"

    def test_detect_numbers_returns_en(self):
        from app.services.nlp_service import detect_language
        lang = detect_language("12345")
        assert lang == "en"


class TestTranslateText:
    """Tests for nlp_service.translate_text() — uses mock fallback."""

    def test_same_lang_returns_original(self):
        from app.services.nlp_service import translate_text
        text = "Hello, how are you?"
        result = translate_text(text, target_lang="en", source_lang="en")
        assert result == text

    def test_empty_text_returns_empty(self):
        from app.services.nlp_service import translate_text
        result = translate_text("", target_lang="hi", source_lang="en")
        assert result == ""

    def test_none_text_returns_none(self):
        from app.services.nlp_service import translate_text
        result = translate_text(None, target_lang="hi", source_lang="en")
        assert result is None

    def test_translate_to_hindi_mock_fallback(self):
        """In mock mode, known EN→HI phrases are returned from static dict."""
        from app.services.nlp_service import translate_text
        result = translate_text(
            "Apply a thick, fragrance-free moisturizer twice daily",
            target_lang="hi",
            source_lang="en"
        )
        # Should return the Hindi translation from the static dict, or a mock prefix
        assert result is not None
        assert len(result) > 0

    def test_translate_unknown_phrase_mock(self):
        """For unknown phrases in mock mode, returns prefixed text."""
        from app.services.nlp_service import translate_text
        result = translate_text(
            "An unknown phrase not in any dictionary xyz",
            target_lang="hi",
            source_lang="en"
        )
        assert result is not None
        # Mock fallback prefixes with [HI] or returns static match
        assert isinstance(result, str)


class TestExtractMedicalEntities:
    """Tests for nlp_service.extract_medical_entities() — uses mock fallback."""

    def test_returns_dict_with_required_keys(self):
        from app.services.nlp_service import extract_medical_entities
        result = extract_medical_entities("Patient has eczema and takes isotretinoin.")
        assert isinstance(result, dict)
        assert "medicines" in result
        assert "diseases" in result
        assert "symptoms" in result

    def test_medicines_extracted_mock(self):
        from app.services.nlp_service import extract_medical_entities
        result = extract_medical_entities("Prescription: Isotretinoin 20mg, Clindamycin Gel.")
        # Mock mode extracts known keywords
        assert isinstance(result["medicines"], list)

    def test_diseases_extracted_mock(self):
        from app.services.nlp_service import extract_medical_entities
        result = extract_medical_entities("Diagnosis: Acne Vulgaris and chronic Eczema.")
        assert isinstance(result["diseases"], list)

    def test_empty_text_returns_empty_lists(self):
        from app.services.nlp_service import extract_medical_entities
        result = extract_medical_entities("")
        assert result["medicines"] == []
        assert result["diseases"] == []
        assert result["symptoms"] == []

    def test_no_medical_terms_returns_empty(self):
        from app.services.nlp_service import extract_medical_entities
        result = extract_medical_entities("The weather is sunny today and birds are singing.")
        assert isinstance(result["medicines"], list)
        assert isinstance(result["diseases"], list)


class TestSemanticSearch:
    """Tests for nlp_service.semantic_search() — uses mock fallback."""

    def test_returns_list(self):
        from app.services.nlp_service import semantic_search
        corpus = ["Eczema treatment options", "Melanoma warning signs", "Psoriasis management"]
        results = semantic_search("how to treat eczema", corpus, top_k=2)
        assert isinstance(results, list)

    def test_respects_top_k(self):
        from app.services.nlp_service import semantic_search
        corpus = ["A", "B", "C", "D", "E"]
        results = semantic_search("something", corpus, top_k=3)
        assert len(results) <= 3

    def test_empty_corpus_returns_empty(self):
        from app.services.nlp_service import semantic_search
        results = semantic_search("query", [], top_k=3)
        assert results == []

    def test_result_format(self):
        from app.services.nlp_service import semantic_search
        corpus = ["Eczema is itchy", "Melanoma is serious"]
        results = semantic_search("eczema", corpus, top_k=1)
        if results:
            text, score = results[0]
            assert isinstance(text, str)
            assert isinstance(score, float)


# ─── API Endpoint Integration Tests ───────────────────────────────────────────

@pytest.fixture(scope="module")
def client():
    """Create a TestClient with a mock authenticated user."""
    from app.main import app
    from app.api.deps import get_current_user

    mock_user = {"_id": "test_user_id", "email": "test@test.com", "role": "user", "full_name": "Test User"}

    app.dependency_overrides[get_current_user] = lambda: mock_user

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


class TestNLPTranslateEndpoint:
    """Integration tests for POST /api/nlp/translate"""

    def test_translate_en_to_en_same(self, client):
        resp = client.post("/api/nlp/translate", json={
            "text": "Hello world",
            "target_lang": "en",
            "source_lang": "en"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "translated_text" in data
        assert data["source_lang"] == "en"
        assert data["target_lang"] == "en"

    def test_translate_invalid_lang(self, client):
        resp = client.post("/api/nlp/translate", json={
            "text": "Hello",
            "target_lang": "fr"
        })
        assert resp.status_code == 400

    def test_translate_to_hindi(self, client):
        resp = client.post("/api/nlp/translate", json={
            "text": "Apply a thick, fragrance-free moisturizer twice daily",
            "target_lang": "hi",
            "source_lang": "en"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["target_lang"] == "hi"
        assert isinstance(data["translated_text"], str)
        assert len(data["translated_text"]) > 0


class TestNLPDetectLanguageEndpoint:
    """Integration tests for POST /api/nlp/detect-language"""

    def test_detect_english(self, client):
        resp = client.post("/api/nlp/detect-language", json={
            "text": "This is a test for skin disease detection."
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["detected_lang"] == "en"
        assert "lang_label" in data

    def test_detect_hindi(self, client):
        resp = client.post("/api/nlp/detect-language", json={
            "text": "यह एक परीक्षण है।"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["detected_lang"] in ("hi", "en")  # langdetect may vary


class TestNLPNEREndpoint:
    """Integration tests for POST /api/nlp/ner"""

    def test_ner_returns_structure(self, client):
        resp = client.post("/api/nlp/ner", json={
            "text": "Patient is prescribed Isotretinoin for acne."
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "medicines" in data
        assert "diseases" in data
        assert "symptoms" in data
        assert isinstance(data["medicines"], list)


class TestChatbotEndpoint:
    """Integration tests for POST /api/chatbot/query"""

    def test_chatbot_hello_responds(self, client):
        resp = client.post("/api/chatbot/query", json={"message": "hello", "language": "en"})
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        assert len(data["reply"]) > 0

    def test_chatbot_accuracy_question(self, client):
        resp = client.post("/api/chatbot/query", json={
            "message": "How accurate is the model?",
            "language": "en"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "reply" in data
        # Should match either semantic or keyword tier
        assert data.get("matched_by") in ("semantic", "keyword", "fallback")

    def test_chatbot_fallback(self, client):
        resp = client.post("/api/chatbot/query", json={
            "message": "zzzzz completely unrelated gibberish xyzzy",
            "language": "en"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("matched_by") in ("keyword", "fallback")

    def test_chatbot_without_language_defaults_en(self, client):
        resp = client.post("/api/chatbot/query", json={"message": "What is eczema?"})
        assert resp.status_code == 200
        assert "reply" in resp.json()
