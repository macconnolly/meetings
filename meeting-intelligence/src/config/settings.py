from __future__ import annotations

from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # API keys
    openai_api_key: str = Field('', env="OPENAI_API_KEY")
    openrouter_api_key: str = Field('', env="OPENROUTER_API_KEY")

    # Database connections
    neo4j_uri: str = Field('bolt://neo4j:7687', env="NEO4J_URI")
    neo4j_user: str = Field('neo4j', env="NEO4J_USER")
    neo4j_password: str = Field('', env="NEO4J_PASSWORD")
    redis_host: str = Field('redis', env="REDIS_HOST")
    redis_port: int = Field(6379, env="REDIS_PORT")
    weaviate_host: str = Field('weaviate', env="WEAVIATE_HOST")
    weaviate_port: int = Field(8080, env="WEAVIATE_PORT")

    # Model selection
    openai_model: str = Field('gpt-4o', env="OPENAI_MODEL")
    openrouter_model: str = Field('google/gemini-2.5-flash-preview-05-20', env="OPENROUTER_MODEL")

    # Processing limits
    batch_size: int = Field(8, env="BATCH_SIZE")
    processing_timeout: int = Field(300_000, env="PROCESSING_TIMEOUT")

    # Feature flags
    enable_vector_store: bool = Field(True, env="ENABLE_VECTOR_STORE")
    enable_graph_store: bool = Field(True, env="ENABLE_GRAPH_STORE")

    class Config:
        env_file = '.env'
