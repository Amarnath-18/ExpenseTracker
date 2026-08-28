import datetime as dt
import uuid
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, String, Uuid, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base
import enum


if TYPE_CHECKING:
    from app.models.user import User
    from app.models.transaction import Transaction

class JobStatus(str,enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class UploadJob(Base):
    __tablename__ = "upload_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, index=True,default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,index=True
    )

    file_path: Mapped[str] = mapped_column(String(500), nullable=False)

    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus),default=JobStatus.PENDING,
        index=True
    )

    error_message: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    transaction_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("transactions.id", ondelete="SET NULL"),
        nullable=True
    )

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), default=lambda:dt.datetime.now(dt.timezone.utc)
    )

    user: Mapped["User"] = relationship("User")
    transaction: Mapped["Transaction"] = relationship("Transaction")
