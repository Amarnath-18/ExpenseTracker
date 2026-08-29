import datetime as dt
from pydantic import BaseModel, ConfigDict, EmailStr, Field
import uuid


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=6, description="Password must be at least 6 characters"
    )
    full_name: str | None = Field(None, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None
    is_active: bool
    is_verified: bool = False
    created_at: dt.datetime


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(
        min_length=6, description="New password must be at least 6 characters"
    )


class SendOTPRequest(BaseModel):
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class MessageResponse(BaseModel):
    success: bool
    message: str
