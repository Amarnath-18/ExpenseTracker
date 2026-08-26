from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

class ExpenseService:
    def list_expenses(self,db:Session) -> list[Expense]:
        return list(db.execute(select(Expense)).scalars().all())
    
    def create_expense(self, db:Session, payload:ExpenseCreate) -> Expense:
        expense = Expense(
            title = payload.title,
            amount = payload.amount,
            category = payload.category
        )
        
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense


expense_service = ExpenseService()
