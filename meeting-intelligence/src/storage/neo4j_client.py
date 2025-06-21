from __future__ import annotations

try:
    from neo4j import GraphDatabase
except Exception:  # pragma: no cover - optional for tests
    GraphDatabase = None  # type: ignore


class Neo4jClient:
    def __init__(self, uri: str, user: str, password: str) -> None:
        self.driver = GraphDatabase.driver(uri, auth=(user, password)) if GraphDatabase else None

    def close(self) -> None:
        if self.driver:
            self.driver.close()
