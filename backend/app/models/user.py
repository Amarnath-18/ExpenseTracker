import datetime as dt
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, DateTime, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.transaction import Transaction
    from app.models.refresh_token import RefreshToken


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, index=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(200), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc),
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: dt.datetime.now(dt.timezone.utc),
        onupdate=lambda: dt.datetime.now(dt.timezone.utc),
    )

    # One User -> Multiple Transactions relationship
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction", back_populates="user", cascade="all, delete-orphan"
    )

    # One User -> Multiple Active Refresh Tokens relationship
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship("RefreshToken", back_populates="user",cascade="all, delete-orphan")
