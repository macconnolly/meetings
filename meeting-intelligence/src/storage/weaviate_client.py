from __future__ import annotations

from typing import Any, Dict, List, Optional

import weaviate
from weaviate import Client
from weaviate.exceptions import WeaviateBaseError


class WeaviateClient:
    """Wrapper around the Weaviate client with helper operations."""

    def __init__(self, url: str, api_key: Optional[str] = None) -> None:
        headers = {"X-OpenAI-Api-Key": api_key} if api_key else None
        self.client = Client(url=url, additional_headers=headers)

    def create_schema(self, schema: Dict[str, Any]) -> None:
        try:
            self.client.schema.create_class(schema)
        except WeaviateBaseError as exc:
            if "already exists" not in str(exc):
                raise

    def store_object(self, class_name: str, data: Dict[str, Any]) -> str:
        """Store a single object and return its id."""

        try:
            obj = self.client.data_object.create(data, class_name)
            return obj.get("id", "")
        except WeaviateBaseError as exc:
            raise RuntimeError(f"Weaviate store error: {exc}") from exc

    def batch_store(self, class_name: str, objects: List[Dict[str, Any]]) -> None:
        """Store objects in batch."""

        with self.client.batch as batch:
            for obj in objects:
                batch.add_data_object(obj, class_name)

    def hybrid_search(self, class_name: str, query: str, limit: int = 10) -> Dict[str, Any]:
        """Perform hybrid search with vector and keyword."""

        return (
            self.client.query.get(class_name, ["*"])
            .with_hybrid(query, alpha=0.5)
            .with_limit(limit)
            .do()
        )

    def semantic_search(self, class_name: str, query: str, limit: int = 10) -> Dict[str, Any]:
        return (
            self.client.query.get(class_name, ["*"])
            .with_near_text({"concepts": [query]})
            .with_limit(limit)
            .do()
        )
