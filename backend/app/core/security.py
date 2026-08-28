import datetime as dt
from datetime import timedelta
import jwt
from app.core.config import settings
import bcrypt



def hash_password(password: str) -> str:
    """Hashes a plain text password using bcrypt"""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hash_password = bcrypt.hashpw(pwd_bytes, salt)
    return hash_password.decode("utf-8") 


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password against a bcrypt hash."""
    plain_password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(plain_password_bytes,hashed_password_bytes)
    except ValueError:
        return False


def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    """Creates a short-lived signed JWT access token (default: 30 mins)."""
    to_encode = data.copy()
    now = dt.datetime.now(dt.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=30)  # Short-lived access token

    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    """Creates a long-lived signed JWT refresh token (default: 7 days)."""
    to_encode = data.copy()
    now = dt.datetime.now(dt.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=7)  # Long-lived refresh token

    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_password_reset_token(email: str) -> str:
    """Creates a short-lived signed JWT token for password reset."""
    now = dt.datetime.now(dt.timezone.utc)
    expire = now + timedelta(minutes=settings.reset_token_expire_minutes)
    to_encode = {
        "sub": email,
        "exp": expire,
        "type": "reset_password"
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_password_reset_token(token: str) -> str | None:
    """Decodes and validates a password reset JWT token."""
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        if payload.get("type") != "reset_password":
            return None
        email: str | None = payload.get("sub")
        return email
    except jwt.PyJWTError:
        return None
