from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_ENV: str = "dev"
    LOG_LEVEL: str = "INFO"
    STORAGE_ROOT: str = "museagent"
    EMBEDDING_BACKEND: str = "panns"
    FAISS_METRIC: str = "cosine"
    ENABLE_GENERATION: bool = False
    ENABLE_SEGMENTS: bool = False

    class Config:
        env_file = ".env"


settings = Settings()


