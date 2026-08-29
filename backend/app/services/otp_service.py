import hashlib
import json
import logging
import secrets
import string
import time
from redis import Redis
from redis.exceptions import ConnectionError as RedisConnectionError, TimeoutError as RedisTimeoutError
from app.core.config import settings

logger = logging.getLogger(__name__)

OTP_EXPIRY_SECONDS = 300  # 5 minutes
RESEND_COOLDOWN_SECONDS = 60  # 1 minute
MAX_ATTEMPTS = 5


class OTPService:
    def __init__(self, redis_client: Redis | None = None):
        self._client = redis_client
        self._memory_store: dict[str, dict] = {}
        self._memory_cooldown: dict[str, float] = {}

    @property
    def client(self) -> Redis:
        if self._client is None:
            self._client = Redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0
            )
        return self._client

    @staticmethod
    def generate_otp(length: int = 6) -> str:
        """Generates a cryptographically secure numeric OTP."""
        return "".join(secrets.choice(string.digits) for _ in range(length))

    @staticmethod
    def _hash_otp(otp: str) -> str:
        """Hashes OTP with SHA-256 for secure storage."""
        return hashlib.sha256(otp.encode("utf-8")).hexdigest()

    def save_otp(self, email: str, otp: str) -> tuple[bool, str]:
        """
        Saves hashed OTP to Redis with expiration and anti-spam cooldown.
        Falls back to in-memory store if Redis is unavailable.
        Returns (success, message).
        """
        email_clean = email.strip().lower()
        cooldown_key = f"otp_cooldown:{email_clean}"
        otp_key = f"otp:{email_clean}"

        try:
            # Try Redis storage first
            if self.client.exists(cooldown_key):
                ttl = self.client.ttl(cooldown_key)
                return False, f"Please wait {ttl} seconds before requesting a new code."

            data = {
                "hashed_otp": self._hash_otp(otp),
                "attempts": 0,
            }

            self.client.setex(otp_key, OTP_EXPIRY_SECONDS, json.dumps(data))
            self.client.setex(cooldown_key, RESEND_COOLDOWN_SECONDS, "1")
            return True, "OTP generated successfully."

        except (RedisConnectionError, RedisTimeoutError, Exception) as e:
            logger.warning(
                f"Redis unavailable ({e}). Using in-memory fallback for OTP storage."
            )
            # In-memory Fallback
            now = time.time()
            cooldown_expiry = self._memory_cooldown.get(email_clean, 0)
            if now < cooldown_expiry:
                remaining = int(cooldown_expiry - now)
                return False, f"Please wait {remaining} seconds before requesting a new code."

            self._memory_store[email_clean] = {
                "hashed_otp": self._hash_otp(otp),
                "attempts": 0,
                "expires_at": now + OTP_EXPIRY_SECONDS,
            }
            self._memory_cooldown[email_clean] = now + RESEND_COOLDOWN_SECONDS
            return True, "OTP generated successfully."

    def verify_otp(self, email: str, entered_otp: str) -> tuple[bool, str]:
        """
        Verifies the provided OTP against the hashed value in Redis or in-memory fallback.
        Enforces maximum attempt rate-limiting and removes the OTP upon success.
        Returns (is_valid, message).
        """
        email_clean = email.strip().lower()
        otp_key = f"otp:{email_clean}"

        try:
            # Try Redis verification first
            raw_data = self.client.get(otp_key)
            if not raw_data:
                # Check in-memory store if Redis had no key or was down
                return self._verify_in_memory(email_clean, entered_otp)

            data = json.loads(raw_data)

            if data.get("attempts", 0) >= MAX_ATTEMPTS:
                self.client.delete(otp_key)
                return False, "Maximum verification attempts exceeded. Please request a new code."

            if self._hash_otp(entered_otp.strip()) != data.get("hashed_otp"):
                data["attempts"] = data.get("attempts", 0) + 1
                remaining_ttl = self.client.ttl(otp_key)
                if remaining_ttl > 0:
                    self.client.setex(otp_key, remaining_ttl, json.dumps(data))
                return False, "Invalid verification code."

            # Successfully verified: clean up OTP key and cooldown key
            self.client.delete(otp_key)
            self.client.delete(f"otp_cooldown:{email_clean}")
            return True, "Email verified successfully."

        except (RedisConnectionError, RedisTimeoutError, Exception) as e:
            logger.warning(
                f"Redis unavailable ({e}). Verifying OTP via in-memory fallback."
            )
            return self._verify_in_memory(email_clean, entered_otp)

    def _verify_in_memory(self, email: str, entered_otp: str) -> tuple[bool, str]:
        now = time.time()
        record = self._memory_store.get(email)

        if not record or now > record.get("expires_at", 0):
            self._memory_store.pop(email, None)
            return False, "Verification code has expired or does not exist."

        if record.get("attempts", 0) >= MAX_ATTEMPTS:
            self._memory_store.pop(email, None)
            return False, "Maximum verification attempts exceeded. Please request a new code."

        if self._hash_otp(entered_otp.strip()) != record.get("hashed_otp"):
            record["attempts"] = record.get("attempts", 0) + 1
            return False, "Invalid verification code."

        # Success: cleanup
        self._memory_store.pop(email, None)
        self._memory_cooldown.pop(email, None)
        return True, "Email verified successfully."


otp_service = OTPService()
