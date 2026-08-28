import datetime as dt
import logging
from fastapi import HTTPException, Response, status
import jwt
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    verify_password_reset_token,
)
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.token_service import token_service
from app.services.user_service import user_service

logger = logging.getLogger(__name__)


def signup(db: Session, payload: UserCreate) -> UserResponse:
    """Registers a new user after verifying the email is unique."""
    existing_user = user_service.get_user_by_email(db, payload.email)
    if existing_user:
        logger.warning(f"Signup failed: Email {payload.email} is already registered.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    try:
        new_user = user_service.create_user(db, payload)
        logger.info(f"User created successfully: {new_user.email} (ID: {new_user.id})")
        return UserResponse.model_validate(new_user)
    except SQLAlchemyError as e:
        logger.error(f"Error creating user {payload.email}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while creating the account.",
        )


def login(db: Session, response: Response, payload: UserLogin) -> Token:
    """Authenticates credentials, issues tokens, stores refresh token in DB and HttpOnly cookie."""
    user = user_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        logger.warning(f"Login failed for email: {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    raw_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Track refresh token in DB
    expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=7)
    token_service.create_refresh_token_record(
        db, user_id=user.id, raw_token=raw_refresh_token, expires_at=expires_at
    )

    # Set HttpOnly Cookie for security
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=False,  # Set to True in HTTPS production
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    logger.info(f"User logged in: {user.email}")
    return Token(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
    )


def refresh_access_token(
    db: Session, response: Response, refresh_token: str | None
) -> Token:
    """Validates refresh token against DB, performs Token Rotation, and sets new HttpOnly cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is missing.",
        )

    try:
        payload = jwt.decode(
            refresh_token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type for refresh.",
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or invalid.",
        )

    # Check Database tracking and revocation status
    record = token_service.get_valid_refresh_token(db, refresh_token)
    if not record:
        logger.warning("Attempted refresh with invalid or revoked token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or is invalid.",
        )

    # Token Rotation: Revoke the old refresh token
    token_service.revoke_refresh_token(db, refresh_token)

    # Generate new pair of tokens
    new_access_token = create_access_token(data={"sub": str(record.user_id)})
    new_refresh_token = create_refresh_token(data={"sub": str(record.user_id)})

    # Store new refresh token in DB
    new_expires_at = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=7)
    token_service.create_refresh_token_record(
        db, user_id=record.user_id, raw_token=new_refresh_token, expires_at=new_expires_at
    )

    # Update HttpOnly cookie with rotated refresh token
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )


def logout(
    db: Session, response: Response, refresh_token: str | None
) -> MessageResponse:
    """Revokes current session refresh token in DB and clears the HttpOnly cookie."""
    if refresh_token:
        token_service.revoke_refresh_token(db, refresh_token)

    response.delete_cookie(key="refresh_token")
    return MessageResponse(success=True, message="Successfully logged out.")


def logout_all_devices(
    db: Session, response: Response, current_user: User
) -> MessageResponse:
    """Revokes ALL refresh tokens for the user across all devices."""
    token_service.revoke_all_user_tokens(db, current_user.id)
    response.delete_cookie(key="refresh_token")
    return MessageResponse(
        success=True, message="Successfully logged out from all devices."
    )


def forgot_password(db: Session, payload: ForgotPasswordRequest) -> MessageResponse:
    """Generates a password reset token."""
    user = user_service.get_user_by_email(db, payload.email)
    if user:
        reset_token = create_password_reset_token(user.email)
        logger.info(f"Password reset token generated for {user.email}: {reset_token}")

    return MessageResponse(
        success=True,
        message="If the email is registered, a password reset token has been sent.",
    )


def reset_password(db: Session, payload: ResetPasswordRequest) -> MessageResponse:
    """Validates reset token and updates the user's password."""
    email = verify_password_reset_token(payload.token)
    if not email:
        logger.warning("Password reset failed: Invalid or expired token.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset token is invalid or has expired.",
        )

    user = user_service.get_user_by_email(db, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this reset token was not found.",
        )

    user_service.update_password(db, user, payload.new_password)
    logger.info(f"Password successfully reset for user: {user.email}")
    return MessageResponse(
        success=True,
        message="Your password has been reset successfully. You can now log in.",
    )
