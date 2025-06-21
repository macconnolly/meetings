from __future__ import annotations

from typing import Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    openai_apikey: str

    # Neo4j
    neo4j_uri: str = "bolt://neo4j:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str

    # Weaviate
    weaviate_host: str = "weaviate"
    weaviate_port: int = 8080
    weaviate_api_key: Optional[str] = None

    # Redis (unused yet but defined for completeness)
    redis_host: str = "redis"
    redis_port: int = 6379

    @property
    def weaviate_url(self) -> str:
        return f"http://{self.weaviate_host}:{self.weaviate_port}"

    class Config:
        env_file = '.env'
