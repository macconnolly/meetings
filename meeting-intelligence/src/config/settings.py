from __future__ import annotations

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application configuration with environment overrides."""

    openai_apikey: str = Field(..., env="OPENAI_API_KEY")
    weaviate_url: str = Field("http://localhost:8080", env="WEAVIATE_URL")
    neo4j_uri: str = Field("bolt://localhost:7687", env="NEO4J_URI")
    neo4j_user: str = Field("neo4j", env="NEO4J_USER")
    neo4j_password: str = Field(..., env="NEO4J_PASSWORD")
    openai_model: str = Field("gpt-4-turbo-preview", env="OPENAI_MODEL")
    max_memories: int = Field(15, env="MAX_MEMORIES")
    request_timeout: int = Field(30, env="REQUEST_TIMEOUT")
    feature_phase: str = Field("phase1", env="FEATURE_PHASE")

    class Config:
        env_file = ".env"
        case_sensitive = False
