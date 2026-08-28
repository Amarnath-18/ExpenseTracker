import logging
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import expense_service
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def list_expenses(db:Session) -> ExpenseListResponse:
    try:
        items = expense_service.list_expenses(db)
        return ExpenseListResponse(
            items=[ExpenseResponse.model_validate(item) for item in items],
            total=len(items)
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error while listing expenses: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while fetching expenses."
        )


def create_expense(db:Session ,payload: ExpenseCreate) -> ExpenseResponse:
    try:
        item = expense_service.create_expense(db, payload)
        return ExpenseResponse.model_validate(item)
    except SQLAlchemyError as e:
        logger.error(f"Database error while creating expense: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while saving the expense."
        )
    
