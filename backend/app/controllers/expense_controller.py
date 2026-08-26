from sqlalchemy.orm import Session
from app.schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import expense_service


def list_expenses(db:Session) -> ExpenseListResponse:
   items = expense_service.list_expenses(db)
   return ExpenseListResponse(
       items=[ExpenseResponse.model_validate(item) for item in items],
       total=len(items)
   )


def create_expense(db:Session ,payload: ExpenseCreate) -> ExpenseResponse:
    item = expense_service.create_expense(db, payload)
    return ExpenseResponse.model_validate(item)
    
