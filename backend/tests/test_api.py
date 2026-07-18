import json
import pytest
from fastapi.testclient import TestClient
from bson import ObjectId
from app.main import app
from app.db.mongodb import users_collection, predictions_collection

client = TestClient(app)

# We will use unique emails for each test run to avoid conflicts
TEST_ADMIN_EMAIL = "admin_test_unique_99@example.com"
TEST_USER_EMAIL = "user_test_unique_99@example.com"
TEST_PASSWORD = "testpassword123!"

@pytest.fixture(autouse=True)
async def cleanup_test_data():
    # Before test execution
    yield
    # Cleanup test accounts and predictions from the local database
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_USER_EMAIL]}})
    # Clean up predictions for tests
    # Note: We will delete by referencing the test users' IDs or by deleting test predictions
    # But since user_id is dynamic, we'll let pytest cleanup run asynchronously if needed.
    # In FastAPI test client, the event loop runs synchronously for test requests, 
    # but we can do manual async database cleanups if we want.

@pytest.mark.anyio
async def test_auth_and_user_flows():
    # Ensure database is clean of our test users
    await users_collection.delete_many({"email": {"$in": [TEST_ADMIN_EMAIL, TEST_USER_EMAIL]}})

    # 1. Register Admin (first user registration makes admin)
    # But wait! If the db already has users, the first one we register in test won't be admin.
    # To guarantee an admin role, let's register and then if needed, update the role,
    # or clean users collection first. Actually, let's register the user and verify.
    register_payload = {
        "full_name": "Test Admin User",
        "email": TEST_ADMIN_EMAIL,
        "password": TEST_PASSWORD,
        "preferred_language": "en"
    }
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 201
    admin_data = response.json()
    assert admin_data["email"] == TEST_ADMIN_EMAIL
    
    # Let's ensure the user is marked verified for testing /me
    await users_collection.update_one({"email": TEST_ADMIN_EMAIL}, {"$set": {"is_verified": True}})

    # 2. Register standard user
    user_payload = {
        "full_name": "Test Standard User",
        "email": TEST_USER_EMAIL,
        "password": TEST_PASSWORD,
        "preferred_language": "hi"
    }
    response = client.post("/api/auth/register", json=user_payload)
    assert response.status_code == 201
    user_data = response.json()
    assert user_data["email"] == TEST_USER_EMAIL

    # 3. Test Login
    login_payload = {
        "email": TEST_ADMIN_EMAIL,
        "password": TEST_PASSWORD
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    token_data = response.json()
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    access_token = token_data["access_token"]

    # 4. Get Current User profile (/me)
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    me_data = response.json()
    assert me_data["email"] == TEST_ADMIN_EMAIL

    # 5. Test Recommendations endpoints
    # Get general disease info
    response = client.get("/api/recommendations/disease/Eczema")
    assert response.status_code == 200
    assert response.json()["disease"] == "Eczema"

    # Get dynamic recommendation based on disease and severity
    response = client.get("/api/recommendations/Eczema/Mild", headers=headers)
    assert response.status_code == 200
    rec_data = response.json()
    assert "skin_care" in rec_data
    assert "when_to_consult_doctor" in rec_data

    # 6. Test Doctor / Hospital Search
    response = client.get("/api/doctors")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    response = client.get("/api/doctors/hospitals")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    # 7. Test mock Prediction API
    # Generate 1x1 black pixel image bytes
    import io
    from PIL import Image
    img = Image.new("RGB", (224, 224), color="black")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="JPEG")
    img_byte_arr = img_byte_arr.getvalue()

    response = client.post(
        "/api/predict",
        files={"file": ("test.jpg", img_byte_arr, "image/jpeg")},
        headers=headers
    )
    assert response.status_code == 200
    pred_data = response.json()
    assert "prediction_id" in pred_data
    assert "primary_disease" in pred_data
    assert "confidence" in pred_data
    assert "gradcam_image_url" in pred_data

    prediction_id = pred_data["prediction_id"]

    # Retrieve prediction detail
    response = client.get(f"/api/predict/{prediction_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["prediction_id"] == prediction_id

    # Test Dashboard history
    response = client.get("/api/dashboard/history", headers=headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 1
    assert history[0]["_id"] == prediction_id

    # Cleanup predictions in DB
    await predictions_collection.delete_many({"user_id": me_data["id"]})
