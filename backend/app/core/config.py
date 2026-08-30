from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ExpanceTracker API"
    app_version: str = "1.0.0"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./expance_tracker.db"

    @field_validator("database_url", mode="before")
    @classmethod
    def check_db_url(cls, v: str) -> str:
        import os
        db_url = os.getenv("APP_DATABASE_URL") or os.getenv("DATABASE_URL") or v
        if not db_url or "sqlite" in db_url:
            pg_user = os.getenv("POSTGRES_USER")
            pg_pass = os.getenv("POSTGRES_PASSWORD")
            pg_db = os.getenv("POSTGRES_DB")
            pg_host = os.getenv("POSTGRES_HOST", "db" if os.path.exists("/.dockerenv") else "localhost")
            pg_port = os.getenv("POSTGRES_PORT", "5432")
            if pg_user and pg_pass and pg_db:
                db_url = f"postgresql+psycopg://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"
        if db_url and db_url.startswith("postgresql://"):
            return db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return db_url

    @field_validator("redis_url", mode="before")
    @classmethod
    def check_redis_url(cls, v: str) -> str:
        import os
        return os.getenv("REDIS_URL") or os.getenv("APP_REDIS_URL") or v or "redis://localhost:6379/0"
    # --- Authentication & JWT Settings ---
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60*24*7 # 7 days
    reset_token_expire_minutes: int = 30
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
    ]

    # --- LLM Configurations (Production Best Practice) ---
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    llm_provider: str = "ollama"  # 1. Default provider set to 'ollama'
    llm_model: str = "llama3.2"  # 2. Set default local model (e.g. 'llama3.2')
    ollama_base_url: str = (
        "http://localhost:11434"  # 3. Add base url for local Ollama API
    )

    # --- Redis Configuration ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Email & Brevo Configuration ---
    brevo_api_key: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_tls: bool = True
    emails_from_email: str = "noreply@expensetracker.local"
    emails_from_name: str = "ExpenseTracker"

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
