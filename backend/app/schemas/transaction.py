import datetime as dt
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
import uuid

class TransactionBase(BaseModel):
    merchant: str | None = Field(None, max_length=100)
    amount: Decimal = Field(gt=0)
    currency: str = Field("INR", max_length=10)
    category: str | None = Field(None, max_length=50)
    date: dt.date = Field(default_factory=dt.date.today)
    description: str | None = Field(None)
    payment_method: str | None = Field(None, max_length=50)
    raw_ocr_text: str | None = Field(default=None, exclude=True)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    merchant: str | None = Field(None, max_length=100)
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, max_length=10)
    category: str | None = Field(None, max_length=50)
    date: dt.date | None = None
    description: str | None = None
    payment_method: str | None = Field(None, max_length=50)


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: dt.datetime  # Fixed: dt.datetime type


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int


class TransactionDeleteResponse(BaseModel):
    success: bool
    message: str
    id: uuid.UUID
