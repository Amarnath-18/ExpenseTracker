import logging
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db_session
from app.models.user import User
from app.services.user_service import user_service
import uuid

logger = logging.getLogger(__name__)

# Tells FastAPI that token acquisition happens at /api/v1/auth/login
oauth2_scheme = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db_session),
    token_obj: HTTPAuthorizationCredentials  = Depends(oauth2_scheme),
) -> User:
    """Dependency that decodes the Bearer JWT token and retrieves the authenticated User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = token_obj.credentials
    try:
        logger.info(f"token is :{token}")
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "access":
            logger.warning("Token validation failed: Token is not an access token.")
            raise credentials_exception

        user_id_str: str | None = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
    except jwt.PyJWTError as e:
        logger.warning(f"JWT decoding error: {str(e)}")
        raise credentials_exception

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise credentials_exception

    user = user_service.get_user_by_id(db, user_id)
    if user is None:
        logger.warning(f"User ID {user_id} decoded from token was not found in database.")
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency ensuring the authenticated user account is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )
    return current_user
