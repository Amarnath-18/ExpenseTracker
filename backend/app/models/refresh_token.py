import datetime as dt
from typing import TYPE_CHECKING
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, String, Uuid

from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base



if TYPE_CHECKING:
    from app.models.user import User

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True,index=True,default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id",ondelete="CASCADE"),
        nullable=False,index=True
    )
    token_hash: Mapped[str] = mapped_column(String(250),
    unique=True,nullable=False)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True),nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False,nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: dt.datetime.now(dt.timezone.utc)
    )

    user: Mapped["User"] = relationship("User",back_populates="refresh_tokens")