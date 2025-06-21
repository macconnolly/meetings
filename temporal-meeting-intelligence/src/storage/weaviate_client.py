from __future__ import annotations

from typing import Any, Dict

import weaviate


class WeaviateClient:
    def __init__(self, url: str) -> None:
        self.client = weaviate.Client(url)

    def create_schema(self, schema: Dict[str, Any]) -> None:
        self.client.schema.create_class(schema)
