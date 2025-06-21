from __future__ import annotations

from typing import Any, Dict, Iterable, Optional

from neo4j import GraphDatabase, Driver
from neo4j.exceptions import Neo4jError


class Neo4jClient:
    """Simple wrapper around the Neo4j driver."""

    def __init__(self, uri: str, user: str, password: str) -> None:
        self.driver: Driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self) -> None:
        self.driver.close()

    def execute(self, cypher: str, parameters: Optional[Dict[str, Any]] = None) -> Iterable[Dict[str, Any]]:
        """Execute a Cypher query and return results."""
        with self.driver.session() as session:
            try:
                result = session.run(cypher, parameters or {})
                return list(result.data())
            except Neo4jError as exc:
                raise RuntimeError(f"Neo4j query error: {exc}") from exc

    def create_node(self, cypher: str, parameters: Dict[str, Any]) -> None:
        self.execute(cypher, parameters)

    def create_relationship(self, cypher: str, parameters: Dict[str, Any]) -> None:
        self.execute(cypher, parameters)

    def traverse(self, start_id: str, relationship_types: list[str], max_depth: int = 3) -> Iterable[Dict[str, Any]]:
        match_rel = "|".join(f":{r}" for r in relationship_types)
        cypher = (
            f"MATCH (n {{meetingId: $start_id}})-[r{match_rel}*1..{max_depth}]->(m) "
            f"RETURN m, r"
        )
        return self.execute(cypher, {"start_id": start_id})
