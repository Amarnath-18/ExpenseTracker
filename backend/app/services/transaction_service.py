from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from sqlalchemy import select
from sqlalchemy.orm import Session


class TransactionService:
    def list_transactions(self, db:Session) -> list[Transaction]:
        """Fetch all transactions from the database."""
        return list(db.execute(select(Transaction)).scalars().all())

    def create_transaction(self, db:Session, payload:TransactionCreate) -> Transaction:
        transaction = Transaction(
            merchant=payload.merchant,
            amount=payload.amount,
            currency=payload.currency,
            category=payload.category,
            date=payload.date,
            payment_method=payload.payment_method,
            raw_ocr_text=payload.raw_ocr_text,
        )
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction

transaction_service = TransactionService()

