from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Numeric
from decimal import Decimal


class Expense(Base):
    __tablename__ = "expenses"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(Numeric(10 , 2))
    category: Mapped[str] = mapped_column(String(50))
    