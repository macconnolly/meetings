"""Convenience accessors for the Meeting Intelligence package."""

from __future__ import annotations

from .config.settings import Settings
from .storage import Neo4jClient, WeaviateClient


def create_default_clients() -> tuple[WeaviateClient, Neo4jClient]:
    """Instantiate storage clients using environment configuration."""

    settings = Settings()
    weaviate = WeaviateClient(
        url=settings.weaviate_url,
        api_key=settings.weaviate_api_key,
    )
    neo4j = Neo4jClient(
        uri=settings.neo4j_uri,
        user=settings.neo4j_user,
        password=settings.neo4j_password,
    )
    return weaviate, neo4j


__all__ = ["create_default_clients", "WeaviateClient", "Neo4jClient", "Settings"]

