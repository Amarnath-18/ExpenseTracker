import logging
import uuid
from sqlalchemy.exc import SQLAlchemyError
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

logger = logging.getLogger(__name__)


def list_transactions(db: Session, user_id: uuid.UUID) -> TransactionListResponse:
    try:
        items = transaction_service.list_transactions(db, user_id)
        return TransactionListResponse(
            items=[TransactionResponse.model_validate(item) for item in items],
            total=len(items),
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error listing transactions for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while fetching transactions.",
        )


def create_transaction(
    db: Session, payload: TransactionCreate, user_id: uuid.UUID
) -> TransactionResponse:
    try:
        item = transaction_service.create_transaction(db, payload, user_id)
        return TransactionResponse.model_validate(item)
    except SQLAlchemyError as e:
        logger.error(f"Database error creating transaction for user {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while saving the transaction.",
        )


def delete_transaction(
    db: Session, transaction_id: uuid.UUID, user_id: uuid.UUID
) -> dict:
    try:
        success = transaction_service.delete_transaction(db, transaction_id, user_id)
        if not success:
            logger.warning(
                f"Failed to delete transaction: ID {transaction_id} not found for user {user_id}."
            )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found.",
            )

        logger.info(f"Transaction {transaction_id} deleted successfully for user {user_id}.")
        return {
            "success": True,
            "message": "Transaction deleted successfully.",
            "id": transaction_id,
        }
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error deleting transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while trying to delete the transaction.",
        )
    except Exception as e:
        logger.error(f"Unexpected error deleting transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred.",
        )


async def create_transaction_from_image(
    db: Session, file: UploadFile, user_id: uuid.UUID
) -> TransactionResponse:
    """Orchestrates image upload: runs OCR, structures text with LLM, and saves to DB for user."""
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
    # 5. Save to database for authenticated user
    item = transaction_service.create_transaction(db, structured_payload, user_id)
    return TransactionResponse.model_validate(item)
