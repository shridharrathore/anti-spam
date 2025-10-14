from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings

CONFIG_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    app_name: str = "AntiSpam Admin API"
    debug: bool = True
    database_url: str = "sqlite+aiosqlite:///./antispm.db"

    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = 0.0
    openai_max_output_tokens: int = 256
    cors_allow_origins: List[str] = ["http://localhost:5173"]

    class Config:
        env_file = CONFIG_ENV_FILE
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
