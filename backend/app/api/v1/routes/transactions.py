import uuid
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.controllers.transaction_controller import (
    create_transaction,
    create_transaction_from_image,
    delete_transaction,
    list_transactions,
)
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionDeleteResponse,
    TransactionListResponse,
    TransactionResponse,
)

router = APIRouter()


@router.get("/", response_model=TransactionListResponse)
def get_transactions(
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionListResponse:
    """Get all stored transactions for the authenticated user."""
    return list_transactions(db, current_user.id)


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionResponse:
    """Manually add a transaction for the authenticated user."""
    return create_transaction(db, payload, current_user.id)


@router.post(
    "/upload",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_transaction_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionResponse:
    """Upload a transaction receipt image, scan it with OCR, format it with AI,

    and save the transaction to the database for the authenticated user.
    """
    return await create_transaction_from_image(db, file, current_user.id)


@router.delete(
    "/{transaction_id}",
    response_model=TransactionDeleteResponse,
    status_code=status.HTTP_200_OK,
)
def delete_transaction_endpoint(
    transaction_id: uuid.UUID,
    db: Session = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> TransactionDeleteResponse:
    """Delete a transaction by its ID for the authenticated user."""
    return delete_transaction(db, transaction_id, current_user.id)