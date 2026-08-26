from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.controllers.transaction_controller import (
    create_transaction,
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
