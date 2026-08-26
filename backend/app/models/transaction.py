import datetime as dt  # Changed: import dt
from decimal import Decimal
import uuid
from sqlalchemy import DateTime, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid,primary_key=True, index=True, default=uuid.uuid4)
    merchant: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)

    date: Mapped[dt.date] = mapped_column(default=dt.date.today)

    payment_method: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    raw_ocr_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=dt.datetime.now(dt.timezone.utc)
    )
