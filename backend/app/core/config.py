from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ExpanceTracker API"
    app_version: str = "1.0.0"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./expance_tracker.db"
    # --- Authentication & JWT Settings ---
    secret_key: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60*24*7 # 7 days
    reset_token_expire_minutes: int = 30

    # --- LLM Configurations (Production Best Practice) ---
    gemini_api_key: str | None = None
    openai_api_key: str | None = None
    llm_provider: str = "ollama"  # 1. Default provider set to 'ollama'
    llm_model: str = "llama3.2"  # 2. Set default local model (e.g. 'llama3.2')
    ollama_base_url: str = (
        "http://localhost:11434"  # 3. Add base url for local Ollama API
    )

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


settings = Settings()
