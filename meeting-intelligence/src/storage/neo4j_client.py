from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from neo4j import GraphDatabase
from neo4j.exceptions import Neo4jError


logger = logging.getLogger(__name__)


class Neo4jClient:
    """Lightweight Neo4j wrapper with CRUD and traversal utilities."""

    def __init__(
        self,
        uri: str,
        user: str,
        password: str,
        database: str = "neo4j",
        max_pool_size: int = 10,
    ) -> None:
        self.driver = GraphDatabase.driver(
            uri,
            auth=(user, password),
            max_connection_pool_size=max_pool_size,
        )
        self.database = database

    # ------------------------------------------------------------------
    # Connection helpers
    # ------------------------------------------------------------------
    def close(self) -> None:
        self.driver.close()

    def _run(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Iterable[Any]:
        try:
            with self.driver.session(database=self.database) as session:
                return list(session.run(query, parameters or {}))
        except Neo4jError as exc:  # pragma: no cover - network dependent
            logger.error("Neo4j query failed: %s", exc)
            raise

    # ------------------------------------------------------------------
    # CRUD operations
    # ------------------------------------------------------------------
    def create_node(self, label: str, properties: Dict[str, Any]) -> None:
        query = f"CREATE (n:{label} $props)"
        self._run(query, {"props": properties})

    def get_node(self, label: str, key: str, value: Any) -> Optional[Dict[str, Any]]:
        query = f"MATCH (n:{label} {{{key}: $val}}) RETURN n LIMIT 1"
        records = self._run(query, {"val": value})
        return records[0]["n"] if records else None

    def update_node(self, label: str, key: str, value: Any, updates: Dict[str, Any]) -> None:
        query = f"MATCH (n:{label} {{{key}: $val}}) SET n += $updates"
        self._run(query, {"val": value, "updates": updates})

    def delete_node(self, label: str, key: str, value: Any) -> None:
        query = f"MATCH (n:{label} {{{key}: $val}}) DETACH DELETE n"
        self._run(query, {"val": value})

    # ------------------------------------------------------------------
    # Relationship operations
    # ------------------------------------------------------------------
    def create_relationship(
        self,
        from_label: str,
        from_key: str,
        from_value: Any,
        rel_type: str,
        to_label: str,
        to_key: str,
        to_value: Any,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        props = properties or {}
        props.setdefault("created_at", datetime.utcnow().isoformat())
        query = (
            f"MATCH (a:{from_label} {{{from_key}: $from_val}}), (b:{to_label} {{{to_key}: $to_val}}) "
            f"MERGE (a)-[r:{rel_type}]->(b) SET r += $props"
        )
        self._run(query, {"from_val": from_value, "to_val": to_value, "props": props})

    # ------------------------------------------------------------------
    # Graph traversal
    # ------------------------------------------------------------------
    def traverse(
        self,
        start_label: str,
        start_key: str,
        start_value: Any,
        relationship_types: List[str],
        max_depth: int = 3,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        rel_pattern = "|".join(relationship_types)
        where_clause = ""
        if filters:
            conditions = [f"n.{k} = ${k}" for k in filters]
            where_clause = "WHERE " + " AND ".join(conditions)
        query = (
            f"MATCH (start:{start_label} {{{start_key}: $start_val}})"
            f"-[:{rel_pattern}*1..{max_depth}]->(n) {where_clause} RETURN DISTINCT n"
        )
        params = {"start_val": start_value}
        if filters:
            params.update(filters)
        records = self._run(query, params)
        return [record["n"] for record in records]

