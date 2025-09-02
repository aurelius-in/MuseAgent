from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    STORAGE_ROOT: str = "museagent"
    EMBEDDING_BACKEND: str = "panns"
    FAISS_METRIC: str = "cosine"
    ENABLE_GENERATION: bool = False
    ENABLE_SEGMENTS: bool = False
    # Security
    API_KEY: Optional[str] = None
    REQUIRE_API_KEY: bool = False
    # Rate limiting (demo-safe)
    RATE_LIMIT_RPS: int = 8
    RATE_LIMIT_BURST: int = 16

    class Config:
        env_file = ".env"


settings = Settings()


