from __future__ import annotations

"""Utility to apply the Neo4j graph schema for the temporal system."""

from neo4j import Driver

# Cypher statements to ensure constraints exist
CONSTRAINT_QUERIES = [
    "CREATE CONSTRAINT meeting_unique IF NOT EXISTS ON (m:Meeting) ASSERT m.meetingId IS UNIQUE",
    "CREATE CONSTRAINT chunk_unique IF NOT EXISTS ON (c:Chunk) ASSERT c.chunkId IS UNIQUE",
    "CREATE CONSTRAINT topic_unique IF NOT EXISTS ON (t:Topic) ASSERT t.topicId IS UNIQUE",
    "CREATE CONSTRAINT artifact_unique IF NOT EXISTS ON (a:Artifact) ASSERT a.artifactId IS UNIQUE",
    "CREATE CONSTRAINT decision_unique IF NOT EXISTS ON (d:Decision) ASSERT d.decisionId IS UNIQUE",
    "CREATE CONSTRAINT person_unique IF NOT EXISTS ON (p:Person) ASSERT p.email IS UNIQUE",
]


def apply_constraints(driver: Driver) -> None:
    """Create unique constraints defined by the schema."""
    with driver.session() as session:
        for query in CONSTRAINT_QUERIES:
            session.run(query)
