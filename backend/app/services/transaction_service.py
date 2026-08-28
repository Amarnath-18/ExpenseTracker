import logging
import uuid
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class TransactionService:
    def list_transactions(self, db: Session, user_id: uuid.UUID) -> list[Transaction]:
        """Fetch all transactions belonging to a specific user."""
        try:
            return list(
                db.execute(
                    select(Transaction).where(Transaction.user_id == user_id)
                ).scalars().all()
            )
        except SQLAlchemyError as e:
            logger.error(f"Database error listing transactions for user {user_id}: {str(e)}")
            raise e

    def get_transaction(
        self, db: Session, transaction_id: uuid.UUID, user_id: uuid.UUID
    ) -> Transaction | None:
        """Fetch a transaction by ID, ensuring it belongs to the specified user."""
        try:
            return db.execute(
                select(Transaction).where(
                    Transaction.id == transaction_id,
                    Transaction.user_id == user_id,
                )
            ).scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching transaction {transaction_id}: {str(e)}")
            raise e

    def create_transaction(
        self, db: Session, payload: TransactionCreate, user_id: uuid.UUID
    ) -> Transaction:
        """Saves a new transaction linked to the authenticated user."""
        try:
            transaction = Transaction(
                user_id=user_id,
                merchant=payload.merchant,
                amount=payload.amount,
                currency=payload.currency,
                category=payload.category,
                description=payload.description,
                date=payload.date,
                payment_method=payload.payment_method,
                raw_ocr_text=payload.raw_ocr_text,
            )
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            return transaction
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating transaction for user {user_id}: {str(e)}")
            raise e

    def delete_transaction(
        self, db: Session, transaction_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Deletes a transaction if it exists and belongs to the user."""
        try:
            transaction = self.get_transaction(db, transaction_id, user_id)
            if not transaction:
                return False
            db.delete(transaction)
            db.commit()
            return True
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error deleting transaction {transaction_id}: {str(e)}")
            raise e


transaction_service = TransactionService()
