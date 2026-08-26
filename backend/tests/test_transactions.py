from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.ocr import OCRResponse
from app.schemas.transaction import TransactionCreate

client = TestClient(app)


def test_manual_transaction_lifecycle() -> None:
    """Tests manual addition and retrieval of transactions."""
    # 1. Create a manual transaction
    payload = {
        "merchant": "Starbucks Coffee",
        "amount": 250.50,
        "currency": "INR",
        "category": "Food",
        "payment_method": "UPI",
    }
    response = client.post("/api/v1/transactions/", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["merchant"] == "Starbucks Coffee"
    assert data["amount"] == "250.50"
    assert data["currency"] == "INR"
    assert data["id"] is not None  # Should be a UUID string

    # 2. Retrieve transactions list
    list_response = client.get("/api/v1/transactions/")
    assert list_response.status_code == 200

    list_data = list_response.json()
    assert list_data["total"] >= 1
    assert any(
        item["merchant"] == "Starbucks Coffee" for item in list_data["items"]
    )


@patch("app.controllers.transaction_controller.ocr_service.process_image")
@patch("app.controllers.transaction_controller.llm_service.format_transaction")
def test_upload_transaction_image(mock_format, mock_ocr) -> None:
    """Tests the unified receipt upload endpoint by mocking OCR and LLM services."""
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
    response = client.post("/api/v1/transactions/upload", files=files)

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
    files = {"file": ("test.txt", b"plain text data", "text/plain")}
    response = client.post("/api/v1/transactions/upload", files=files)
    assert response.status_code == 400
    assert "Uploaded file must be a valid image" in response.json()["detail"]
