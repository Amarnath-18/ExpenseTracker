from sqlalchemy.orm import Session
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)
from app.services.transaction_service import transaction_service
from fastapi import HTTPException, UploadFile, status
from app.services.ocr_service import ocr_service
from app.services.llm_service import llm_service, LLMServiceError


def list_transactions(db:Session)->TransactionListResponse:
    items = transaction_service.list_transactions(db)
    return TransactionListResponse(
        items = [TransactionResponse.model_validate(item) for item in items],
        total = len(items)
    )

def create_transaction(db:Session, payload:TransactionCreate) -> TransactionResponse:
    item = transaction_service.create_transaction(db, payload)
    return TransactionResponse.model_validate(item)


async def create_transaction_from_image(
    db: Session, file: UploadFile
) -> TransactionResponse:
    """Orchestrates image upload: runs OCR, structures text with LLM, and saves to DB."""
    # 1. Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (e.g. PNG, JPEG).",
        )
    # 2. Read image content
    content = await file.read()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    # 3. Perform OCR text extraction
    try:
        ocr_response = ocr_service.process_image(content)
        raw_text = ocr_response.extracted_text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"OCR engine failed to parse image: {str(e)}",
        )
    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text detected in the uploaded image.",
        )
    # 4. Format raw text using LLM
    try:
        structured_payload = llm_service.format_transaction(raw_text)
    except LLMServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI formatting failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during AI parsing: {str(e)}",
        )
    # 5. Save to database using your service
    item = transaction_service.create_transaction(db, structured_payload)
    return TransactionResponse.model_validate(item)