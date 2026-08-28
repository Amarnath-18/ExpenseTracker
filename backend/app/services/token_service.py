import datetime as dt
import hashlib
import logging
import uuid
from app.models.refresh_token import RefreshToken
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def hash_token(raw_token: str) -> str:
    """Hashes a raw refresh token using SHA-256 for secure storage."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


class TokenService:
    def create_refresh_token_record(
        self, db: Session, user_id: uuid.UUID, raw_token: str, expires_at: dt.datetime
    ) -> RefreshToken:
        """Stores a hashed refresh token in the database."""
        try:
            token_hash = hash_token(raw_token)
            record = RefreshToken(
                user_id=user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                is_revoked=False,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating refresh token record: {str(e)}")
            raise e

    def get_valid_refresh_token(
        self, db: Session, raw_token: str
    ) -> RefreshToken | None:
        """Retrieves a refresh token record if valid and not expired/revoked."""
        try:
            token_hash = hash_token(raw_token)
            record = db.execute(
                select(RefreshToken).where(
                    RefreshToken.token_hash == token_hash,
                    RefreshToken.is_revoked == False,
                )
            ).scalar_one_or_none()

            if not record:
                return None

            # Ensure token is not expired
            now = dt.datetime.now(dt.timezone.utc)
            if record.expires_at < now:
                logger.warning(f"Refresh token record {record.id} is expired.")
                return None

            return record
        except SQLAlchemyError as e:
            logger.error(f"Database error checking refresh token: {str(e)}")
            raise e

    def revoke_refresh_token(self, db: Session, raw_token: str) -> bool:
        """Revokes a specific refresh token."""
        try:
            token_hash = hash_token(raw_token)
            record = db.execute(
                select(RefreshToken).where(RefreshToken.token_hash == token_hash)
            ).scalar_one_or_none()

            if record:
                record.is_revoked = True
                db.commit()
                return True
            return False
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error revoking refresh token: {str(e)}")
            raise e

    def revoke_all_user_tokens(self, db: Session, user_id: uuid.UUID) -> None:
        """Revokes all refresh tokens for a specific user (Logout everywhere)."""
        try:
            records = db.execute(
                select(RefreshToken).where(
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_revoked == False,
                )
            ).scalars().all()

            for record in records:
                record.is_revoked = True
            db.commit()
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error revoking all user tokens for {user_id}: {str(e)}")
            raise e


token_service = TokenService()
