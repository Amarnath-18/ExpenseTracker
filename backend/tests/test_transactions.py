import uuid
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.ocr import OCRResponse
from app.schemas.transaction import TransactionCreate

client = TestClient(app)


def get_auth_headers() -> dict:
    """Helper function to register and login a test user, returning auth headers."""
    unique_email = f"test_{uuid.uuid4()}@example.com"
    client.post(
        "/api/v1/auth/signup",
        json={"email": unique_email, "password": "password", "full_name": "Test User"},
    )
    res = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "password"},
    )
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_manual_transaction_lifecycle() -> None:
    """Tests manual addition, retrieval, and deletion of transactions."""
    headers = get_auth_headers()

    # 1. Create a manual transaction
    payload = {
        "merchant": "Starbucks Coffee",
        "amount": 250.50,
        "currency": "INR",
        "category": "Food",
        "payment_method": "UPI",
    }
    response = client.post("/api/v1/transactions/", json=payload, headers=headers)
    assert response.status_code == 201

    data = response.json()
    assert data["merchant"] == "Starbucks Coffee"
    assert data["id"] is not None
    transaction_id = data["id"]

    # 2. Retrieve transactions list
    list_response = client.get("/api/v1/transactions/", headers=headers)
    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == transaction_id for item in list_data["items"])

    # 3. Delete the transaction
    delete_response = client.delete(f"/api/v1/transactions/{transaction_id}", headers=headers)
    assert delete_response.status_code == 200
    delete_data = delete_response.json()
    assert delete_data["success"] is True
    assert delete_data["id"] == transaction_id

    # 4. Check that deleting again returns 404
    delete_response_again = client.delete(f"/api/v1/transactions/{transaction_id}", headers=headers)
    assert delete_response_again.status_code == 404

    # 5. Check that it's no longer in the list
    list_response_after = client.get("/api/v1/transactions/", headers=headers)
    assert list_response_after.status_code == 200
    list_data_after = list_response_after.json()
    assert not any(item["id"] == transaction_id for item in list_data_after["items"])


@patch("app.controllers.transaction_controller.ocr_service.process_image")
@patch("app.controllers.transaction_controller.llm_service.format_transaction")
def test_upload_transaction_image(mock_format, mock_ocr) -> None:
    """Tests the unified receipt upload endpoint by mocking OCR and LLM services."""
    headers = get_auth_headers()

    # Mocking OCR response output
    mock_ocr.return_value = OCRResponse(
        extracted_text="Paid to Starbucks 12.50 USD on UPI",
        lines=["Paid to Starbucks", "12.50 USD", "on UPI"],
    )

    # Mocking LLM structured output
    mock_format.return_value = TransactionCreate(
        merchant="Starbucks",
        amount=12.50,
        currency="USD",
        category="Food",
        payment_method="UPI",
        raw_ocr_text="Paid to Starbucks 12.50 USD on UPI",
    )

    # Create dummy image file bytes to upload
    files = {"file": ("test_receipt.png", b"fake_image_bytes", "image/png")}
    response = client.post("/api/v1/transactions/upload", files=files, headers=headers)

    assert response.status_code == 201
    data = response.json()

    assert data["merchant"] == "Starbucks"
    assert data["amount"] == "12.50"
    assert data["currency"] == "USD"
    assert data["category"] == "Food"
    assert data["payment_method"] == "UPI"
    assert data["raw_ocr_text"] == "Paid to Starbucks 12.50 USD on UPI"


def test_upload_transaction_invalid_file() -> None:
    """Verifies endpoint rejects non-image files with a 400 status code."""
    headers = get_auth_headers()
    files = {"file": ("test.txt", b"plain text data", "text/plain")}
    response = client.post("/api/v1/transactions/upload", files=files, headers=headers)
    assert response.status_code == 400
