from sqlalchemy.orm import Session
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)
from app.services.transaction_service import transaction_service


def list_transactions(db:Session)->TransactionListResponse:
    items = transaction_service.list_transactions(db)
    return TransactionListResponse(
        items = [TransactionResponse.model_validate(item) for item in items],
        total = len(items)
    )

def create_transaction(db:Session, payload:TransactionCreate) -> TransactionResponse:
    item = transaction_service.create_transaction(db, payload)
    return TransactionResponse.model_validate(item)