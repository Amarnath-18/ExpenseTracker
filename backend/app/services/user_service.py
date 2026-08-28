import logging
import uuid
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.auth import UserCreate
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class UserService:
    def get_user_by_email(self, db: Session, email: str) -> User | None:
        """Fetch a user by their email address."""
        try:
            return db.execute(
                select(User).where(User.email == email.lower().strip())
            ).scalar_one_or_none()
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching user by email {email}: {str(e)}")
            raise e

    def get_user_by_id(self, db: Session, user_id: uuid.UUID) -> User | None:
        """Fetch a user by their unique UUID ID."""
        try:
            return db.get(User, user_id)
        except SQLAlchemyError as e:
            logger.error(f"Database error fetching user by ID {user_id}: {str(e)}")
            raise e

    def create_user(self, db: Session, payload: UserCreate) -> User:
        """Hashes the password and creates a new user record."""
        try:
            hashed_pwd = hash_password(payload.password)
            user = User(
                email=payload.email.lower().strip(),
                hashed_password=hashed_pwd,
                full_name=payload.full_name,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error creating user {payload.email}: {str(e)}")
            raise e

    def authenticate_user(
        self, db: Session, email: str, password: str
    ) -> User | None:
        """Verifies email and password. Returns User if valid, None if invalid."""
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user

    def update_password(self, db: Session, user: User, new_password: str) -> User:
        """Updates user's password with a newly hashed password."""
        try:
            user.hashed_password = hash_password(new_password)
            db.commit()
            db.refresh(user)
            return user
        except SQLAlchemyError as e:
            db.rollback()
            logger.error(f"Database error updating password for user {user.id}: {str(e)}")
            raise e


user_service = UserService()
