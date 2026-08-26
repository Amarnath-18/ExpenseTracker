from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ExpenseBase(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    amount: Decimal = Field(gt=0)
    category: str = Field(min_length=1, max_length=50)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    total: int
