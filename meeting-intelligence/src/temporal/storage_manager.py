from __future__ import annotations

"""Dual storage manager for Weaviate and Neo4j.
This is a simplified implementation based on the
Temporal Meeting Intelligence System specification v3.0.
"""

from typing import Any, Dict, List
from datetime import datetime
import os
import json

import weaviate
from neo4j import GraphDatabase

from .neo4j_schema import apply_constraints

from .temporal_extractor import TemporalMemoryChunk


class DualStorageManager:
    """Manage storing of meetings and chunks in Weaviate and Neo4j."""

    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple) -> None:
        self.weaviate_client = weaviate.Client(
            url=weaviate_url,
            additional_headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")},
        )
        self.neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        apply_constraints(self.neo4j_driver)

    def store_meeting(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> bool:
        """Store meeting metadata and chunks."""
        try:
            self._store_in_weaviate(meeting_metadata, chunks)
            self._store_in_neo4j(meeting_metadata, chunks)
            return True
        except Exception as exc:  # pragma: no cover - placeholder
            print(f"Storage error: {exc}")
            return False

    def _store_in_weaviate(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> None:
        meeting_obj = {
            "meetingId": meeting_metadata["meeting_id"],
            "title": meeting_metadata["title"],
            "date": meeting_metadata["date"].isoformat(),
            "participants": meeting_metadata.get("participants", []),
        }
        self.weaviate_client.data_object.create(meeting_obj, class_name="Meeting")
        with self.weaviate_client.batch as batch:
            for chunk in chunks:
                batch.add_data_object(
                    {
                        "chunkId": chunk.chunk_id,
                        "meetingId": chunk.meeting_id,
                        "timestamp": chunk.timestamp.isoformat(),
                        "speaker": chunk.speaker,
                        "addressedTo": chunk.addressed_to,
                        "interactionType": chunk.interaction_type,
                        "content": chunk.content,
                    },
                    class_name="MemoryChunk",
                )

    def _store_in_neo4j(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> None:
        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_meeting_node_tx, meeting_metadata)
            for chunk in chunks:
                session.write_transaction(self._create_chunk_node_tx, chunk, meeting_metadata)

    @staticmethod
    def _create_meeting_node_tx(tx, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (m:Meeting {meetingId: $mid}) "
            "SET m.title = $title, m.date = datetime($date)"
        )
        tx.run(query, mid=meeting_metadata["meeting_id"], title=meeting_metadata["title"], date=meeting_metadata["date"].isoformat())

    @staticmethod
    def _create_chunk_node_tx(tx, chunk: TemporalMemoryChunk, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (c:Chunk {chunkId: $cid}) "
            "SET c.content = $content, c.speaker = $speaker, c.timestamp = datetime($ts) "
            "WITH c MATCH (m:Meeting {meetingId: $mid}) MERGE (c)-[:SPOKEN_IN]->(m)"
        )
        tx.run(
            query,
            cid=chunk.chunk_id,
            content=chunk.content,
            speaker=chunk.speaker,
            ts=chunk.timestamp.isoformat(),
            mid=meeting_metadata["meeting_id"],
        )
