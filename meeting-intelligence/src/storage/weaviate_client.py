from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional

import weaviate
from weaviate import Client
from weaviate.auth import AuthApiKey
from weaviate.exceptions import WeaviateBaseError


logger = logging.getLogger(__name__)


class WeaviateClient:
    """Wrapper around the Weaviate SDK providing basic CRUD and search methods."""

    def __init__(
        self,
        url: str,
        api_key: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3,
    ) -> None:
        auth = AuthApiKey(api_key) if api_key else None
        self.client: Client = Client(url, auth_client_secret=auth, timeout_config=(timeout, timeout))
        self.max_retries = max_retries

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _retry(self, func, *args, **kwargs):
        last_exc: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except WeaviateBaseError as exc:  # pragma: no cover - network dependent
                last_exc = exc
                logger.warning("Weaviate error on attempt %s/%s: %s", attempt, self.max_retries, exc)
                time.sleep(min(2 ** attempt, 8))
        if last_exc:
            raise last_exc

    # ------------------------------------------------------------------
    # Schema operations
    # ------------------------------------------------------------------
    def create_schema(self, schema: Dict[str, Any]) -> None:
        """Create a Weaviate class schema if it doesn't already exist."""

        def _create() -> None:
            existing = {c["class"] for c in self.client.schema.get_all()["classes"]}
            if schema.get("class") not in existing:
                self.client.schema.create_class(schema)

        self._retry(_create)

    def delete_schema(self, class_name: str) -> None:
        """Delete a Weaviate class schema."""

        self._retry(self.client.schema.delete_class, class_name)

    # ------------------------------------------------------------------
    # CRUD for objects
    # ------------------------------------------------------------------
    def add_object(self, class_name: str, data: Dict[str, Any], uuid: Optional[str] = None) -> str:
        """Store an object in Weaviate and return its UUID."""

        def _add() -> str:
            return self.client.data_object.create(data, class_name=class_name, uuid=uuid)

        return self._retry(_add)

    def update_object(self, class_name: str, uuid: str, data: Dict[str, Any]) -> None:
        self._retry(self.client.data_object.update, uuid, data, class_name)

    def get_object(self, class_name: str, uuid: str) -> Optional[Dict[str, Any]]:
        def _get() -> Optional[Dict[str, Any]]:
            return self.client.data_object.get_by_id(uuid, class_name)

        return self._retry(_get)

    def delete_object(self, class_name: str, uuid: str) -> None:
        self._retry(self.client.data_object.delete, uuid, class_name)

    # ------------------------------------------------------------------
    # Search operations
    # ------------------------------------------------------------------
    def vector_search(
        self,
        class_name: str,
        vector: List[float],
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        properties: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        query = self.client.query.get(class_name, properties or ["*"])
        query = query.with_near_vector({"vector": vector}).with_limit(top_k)
        if filters:
            query = query.with_where(filters)
        result = self._retry(query.do)
        return result.get("data", {}).get("Get", {}).get(class_name, [])

    def hybrid_search(
        self,
        class_name: str,
        text: str,
        top_k: int = 10,
        vector: Optional[List[float]] = None,
        alpha: float = 0.5,
        filters: Optional[Dict[str, Any]] = None,
        properties: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        query = self.client.query.get(class_name, properties or ["*"])
        query = query.with_hybrid(query=text, vector=vector, alpha=alpha).with_limit(top_k)
        if filters:
            query = query.with_where(filters)
        result = self._retry(query.do)
        return result.get("data", {}).get("Get", {}).get(class_name, [])

