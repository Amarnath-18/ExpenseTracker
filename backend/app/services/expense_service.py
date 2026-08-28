import logging
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class ExpenseService:
    def list_expenses(self, db: Session) -> list[Expense]:
        try:
            return list(db.execute(select(Expense)).scalars().all())
        except SQLAlchemyError as e:
            logger.error(f"Database error while listing expenses: {str(e)}")
            raise e

    def create_expense(self, db: Session, payload: ExpenseCreate) -> Expense:
        try:
            expense = Expense(
                title=payload.title,
                amount=payload.amount,
                category=payload.category
            )
            db.add(expense)
            db.commit()
            db.refresh(expense)
            return expense
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error while creating expense: {str(e)}")
            raise e


expense_service = ExpenseService()
