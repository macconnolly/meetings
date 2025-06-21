from __future__ import annotations

from typing import Any, Dict

try:
    import weaviate
except Exception:  # pragma: no cover - optional for tests
    weaviate = None  # type: ignore


class WeaviateClient:
    def __init__(self, url: str) -> None:
        self.client = weaviate.Client(url) if weaviate else None

    def create_schema(self, schema: Dict[str, Any]) -> None:
        if self.client:
            self.client.schema.create_class(schema)
