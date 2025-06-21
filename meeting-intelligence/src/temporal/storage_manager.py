from __future__ import annotations

"""Dual storage manager combining Weaviate and Neo4j.

This module provides a simplified implementation of the `DualStorageManager`
from the requirements document.  It stores `TemporalMemoryChunk` objects in both
Weaviate (for semantic search) and Neo4j (for temporal relationship tracking).

Only a subset of the full production functionality is implemented here.  The
methods focus on the key interactions needed for tests and basic usage.  Error
handling is intentionally minimal to keep the example concise.
"""

from typing import Any, Dict, List
from datetime import datetime
import os

import weaviate
from neo4j import GraphDatabase

from .temporal_extractor import TemporalMemoryChunk


class DualStorageManager:
    """Store meetings and memory chunks in Weaviate and Neo4j."""

    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple) -> None:
        self.weaviate_client = weaviate.Client(
            url=weaviate_url,
            additional_headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY", "")},
        )
        self.neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)

    # ------------------------------------------------------------------
    # Meeting storage
    # ------------------------------------------------------------------
    def store_meeting(
        self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]
    ) -> bool:
        """Store a meeting and its chunks in both databases."""

        self._store_in_weaviate(meeting_metadata, chunks)
        self._store_in_neo4j(meeting_metadata, chunks)
        return True

    # ------------------------------------------------------------------
    # Weaviate helpers
    # ------------------------------------------------------------------
    def _store_in_weaviate(
        self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]
    ) -> None:
        meeting_obj = {
            "meetingId": meeting_metadata["meeting_id"],
            "title": meeting_metadata["title"],
            "date": meeting_metadata.get("date", datetime.utcnow()).isoformat(),
            "participants": meeting_metadata.get("participants", []),
        }
        self.weaviate_client.data_object.create(meeting_obj, class_name="Meeting")

        with self.weaviate_client.batch as batch:
            for chunk in chunks:
                obj = {
                    "chunkId": chunk.chunk_id,
                    "meetingId": chunk.meeting_id,
                    "timestamp": chunk.timestamp.isoformat(),
                    "speaker": chunk.speaker,
                    "content": chunk.content,
                    "topicsDiscussed": chunk.topics_discussed,
                }
                batch.add_data_object(obj, class_name="MemoryChunk")

    # ------------------------------------------------------------------
    # Neo4j helpers
    # ------------------------------------------------------------------
    def _store_in_neo4j(
        self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]
    ) -> None:
        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_meeting_node_tx, meeting_metadata)
            for chunk in chunks:
                session.write_transaction(self._create_chunk_node_tx, chunk)

    @staticmethod
    def _create_meeting_node_tx(tx, metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (m:Meeting {meetingId: $id}) "
            "SET m.title = $title, m.date = datetime($date)"
        )
        tx.run(
            query,
            id=metadata["meeting_id"],
            title=metadata["title"],
            date=metadata.get("date", datetime.utcnow()).isoformat(),
        )

    @staticmethod
    def _create_chunk_node_tx(tx, chunk: TemporalMemoryChunk) -> None:
        query = (
            "MERGE (c:Chunk {chunkId: $id}) "
            "SET c.content = $content, c.speaker = $speaker, "
            "c.timestamp = datetime($ts)"
        )
        tx.run(
            query,
            id=chunk.chunk_id,
            content=chunk.content,
            speaker=chunk.speaker,
            ts=chunk.timestamp.isoformat(),
        )
