from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db_session

from app.controllers.expense_controller import create_expense, list_expenses
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse

router = APIRouter()


@router.get("/", response_model=ExpenseListResponse)
def get_expenses(db: Session = Depends(get_db_session)) -> ExpenseListResponse:
    return list_expenses(db)


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def add_expense(payload: ExpenseCreate, db:Session = Depends(get_db_session)) -> ExpenseResponse:
    return create_expense(db, payload)
