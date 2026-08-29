from fastapi import APIRouter, BackgroundTasks, Cookie, Depends, Response, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_user
from app.controllers import auth_controller
from app.db.session import get_db_session
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

router = APIRouter()


@router.post(
    "/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    payload: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
) -> UserResponse:
    """Register a new user account and dispatch verification OTP email."""
    return auth_controller.signup(db, payload, background_tasks)


@router.post("/login", response_model=Token)
def login_user(
    payload: UserLogin,
    response: Response,
    db: Session = Depends(get_db_session),
) -> Token:
    """Authenticate user credentials, return JWT access token, and set HttpOnly refresh cookie."""
    return auth_controller.login(db, response, payload)


@router.post("/refresh", response_model=Token)
def refresh_token_endpoint(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: Session = Depends(get_db_session),
) -> Token:
    """Use the HttpOnly refresh_token cookie to issue a new access token (Token Rotation)."""
    return auth_controller.refresh_access_token(db, response, refresh_token)


@router.post("/logout", response_model=MessageResponse)
def logout_endpoint(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: Session = Depends(get_db_session),
) -> MessageResponse:
    """Logout current session by revoking the refresh token and clearing cookie."""
    return auth_controller.logout(db, response, refresh_token)


@router.post("/logout-all", response_model=MessageResponse)
def logout_all_sessions(
    response: Response,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db_session),
) -> MessageResponse:
    """Logout user from ALL active devices."""
    return auth_controller.logout_all_devices(db, response, current_user)


@router.post("/forgot-password", response_model=MessageResponse)
def request_password_reset(
    payload: ForgotPasswordRequest, db: Session = Depends(get_db_session)
) -> MessageResponse:
    """Request a password reset token for an email."""
    return auth_controller.forgot_password(db, payload)


@router.post("/reset-password", response_model=MessageResponse)
def perform_password_reset(
    payload: ResetPasswordRequest, db: Session = Depends(get_db_session)
) -> MessageResponse:
    """Reset password using a valid reset token."""
    return auth_controller.reset_password(db, payload)


@router.post("/send-otp", response_model=MessageResponse)
def send_otp_endpoint(
    payload: SendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db_session),
) -> MessageResponse:
    """Generate and dispatch a 6-digit OTP code to the user's email address."""
    return auth_controller.send_verification_otp(db, payload, background_tasks)


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp_endpoint(
    payload: VerifyOTPRequest,
    db: Session = Depends(get_db_session),
) -> MessageResponse:
    """Verify an email address using the received 6-digit OTP code."""
    return auth_controller.verify_email_otp(db, payload)


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get profile information for the currently authenticated user."""
    return UserResponse.model_validate(current_user)

