import datetime as dt
import logging
from fastapi import BackgroundTasks, HTTPException, Response, status
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
    SendOTPRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    VerifyOTPRequest,
)
from app.services.email_service import email_service
from app.services.otp_service import otp_service
from app.services.token_service import token_service
from app.services.user_service import user_service

logger = logging.getLogger(__name__)


def signup(
    db: Session, payload: UserCreate, background_tasks: BackgroundTasks | None = None
) -> UserResponse:
    """Registers a new user after verifying the email is unique, and dispatches an OTP verification email."""
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

        # Automatically generate and send OTP for email verification
        try:
            otp = otp_service.generate_otp()
            saved, _ = otp_service.save_otp(new_user.email, otp)
            if saved:
                if background_tasks is not None:
                    background_tasks.add_task(email_service.send_otp_email, new_user.email, otp)
                else:
                    email_service.send_otp_email(new_user.email, otp)
                logger.info(f"Signup verification OTP queued for {new_user.email}")
        except Exception as otp_err:
            logger.warning(f"Failed to queue OTP on signup for {new_user.email}: {otp_err}")

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


def forgot_password(db: Session, payload: ForgotPasswordRequest, background_tasks: BackgroundTasks) -> MessageResponse:
    """Generates an OTP and sends it via email."""
    user = user_service.get_user_by_email(db, payload.email)
    if user:
        otp = otp_service.generate_otp()
        try:
            success, msg = otp_service.save_otp(user.email, otp)
            if success:
                background_tasks.add_task(email_service.send_otp_email, user.email, otp)
                logger.info(f"Password reset OTP queued for email: {user.email}")
        except Exception as e:
            logger.error(f"Error saving OTP for {user.email}: {e}")

    return MessageResponse(
        success=True,
        message="If the email is registered, a password reset code has been sent.",
    )


def reset_password(db: Session, payload: ResetPasswordRequest) -> MessageResponse:
    """Validates OTP and updates the user's password."""
    user = user_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    try:
        is_valid, msg = otp_service.verify_otp(payload.email, payload.otp)
    except Exception as e:
        logger.error(f"Error verifying OTP for {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing verification code.",
        )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    user_service.update_password(db, user, payload.new_password)
    logger.info(f"Password successfully reset for user: {user.email}")
    return MessageResponse(
        success=True,
        message="Your password has been reset successfully. You can now log in.",
    )


def send_verification_otp(
    db: Session, payload: SendOTPRequest, background_tasks: BackgroundTasks
) -> MessageResponse:
    """Generates an OTP and queues email dispatch for verification."""
    user = user_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    if user.is_verified:
        return MessageResponse(
            success=True,
            message="This email address is already verified.",
        )

    otp = otp_service.generate_otp()
    try:
        success, msg = otp_service.save_otp(payload.email, otp)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=msg,
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving OTP for {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate verification code. Please ensure Redis is available.",
        )

    background_tasks.add_task(email_service.send_otp_email, payload.email, otp)
    logger.info(f"Verification OTP queued for email: {payload.email}")

    return MessageResponse(
        success=True,
        message="Verification code has been sent to your email address.",
    )


def verify_email_otp(db: Session, payload: VerifyOTPRequest) -> MessageResponse:
    """Validates the OTP and marks the user account as verified."""
    user = user_service.get_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address.",
        )

    if user.is_verified:
        return MessageResponse(
            success=True,
            message="This email address is already verified.",
        )

    try:
        is_valid, msg = otp_service.verify_otp(payload.email, payload.otp)
    except Exception as e:
        logger.error(f"Error verifying OTP for {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing verification code.",
        )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg,
        )

    user.is_verified = True
    db.commit()
    db.refresh(user)
    logger.info(f"User {user.email} successfully verified via OTP.")

    return MessageResponse(
        success=True,
        message="Email successfully verified.",
    )

