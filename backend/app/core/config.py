from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ExpanceTracker API"
    app_version: str = "1.0.0"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./expance_tracker.db"

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
