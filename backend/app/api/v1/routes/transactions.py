from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session
from app.controllers.transaction_controller import (
    create_transaction,
    create_transaction_from_image,  # 1. Import your new controller
    list_transactions,
)
from app.db.session import get_db_session
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)

router = APIRouter()


@router.get("/", response_model=TransactionListResponse)
def get_transactions(
    db: Session = Depends(get_db_session),
) -> TransactionListResponse:
    """Get all stored transactions."""
    return list_transactions(db)


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_transaction(
    payload: TransactionCreate, db: Session = Depends(get_db_session)
) -> TransactionResponse:
    """Manually add a transaction to the database."""
    return create_transaction(db, payload)


# 2. Define the image upload endpoint (returning 201 Created)
@router.post(
    "/upload",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_transaction_image(
    file: UploadFile = File(...), db: Session = Depends(get_db_session)
) -> TransactionResponse:
    """Upload a transaction receipt image, scan it with OCR, format it with AI,

    and save the transaction to the database.
    """
    return await create_transaction_from_image(db, file)
