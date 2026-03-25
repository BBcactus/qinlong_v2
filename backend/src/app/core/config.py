from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/qinlong"

    # AI
    DEFAULT_AI_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o"
    SECONDARY_AI_BASE_URL: str = ""
    SECONDARY_AI_API_KEY: str = ""
    SECONDARY_AI_MODEL: str = ""

    # CLS
    CLS_BASE_URL: str = "https://x-quote.cls.cn"
    CLS_USER_AGENT: str = "qinlong-panel/0.2"
    CLS_TOKEN: str = ""
    CLS_UID: str = ""

    # App
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]


settings = Settings()
