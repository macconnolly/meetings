from __future__ import annotations

from pydantic import BaseSettings


class Settings(BaseSettings):
    openai_apikey: str
    neo4j_password: str

    class Config:
        env_file = '.env'
