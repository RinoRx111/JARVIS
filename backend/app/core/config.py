import os
from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env"),
        env_file_encoding="utf-8", 
        extra="ignore"
    )

    # --- SYSTEM CONFIGURATION ---
    ENV: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "JARVIS - AI Operating System"

    # --- SECURITY ---
    SECRET_KEY: str = "generate_a_secure_jwt_secret_key_here_minimum_32_chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # --- DATABASE ---
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "secure_postgres_password_here"
    POSTGRES_DB: str = "jarvis_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[str] = None

    # --- VECTOR STORE ---
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000

    # --- RUNTIMES & MODELS ---
    DEFAULT_LLM_PROVIDER: str = "openai"
    OLLAMA_API_URL: str = "http://localhost:11434"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # --- VOICE PROVIDERS ---
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"

    # --- GOOGLE OAUTH2 ---
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    # --- INTEGRATION TOKENS ---
    GITHUB_TOKEN: Optional[str] = None
    WEATHER_API_KEY: Optional[str] = None
    NEWS_API_KEY: Optional[str] = None

    # --- AUTOMATION & SANDBOX ---
    WORKSPACE_DIR: str = "/tmp/jarvis_workspace"
    PLAYWRIGHT_HEADLESS: bool = True
    PLAYWRIGHT_TIMEOUT: int = 30000

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()

# Ensure workspace exists
os.makedirs(settings.WORKSPACE_DIR, exist_ok=True)
