from __future__ import annotations

import os
from typing import List, Dict, Any
import logging

try:
    import weaviate
except Exception:  # pragma: no cover - optional for tests
    weaviate = None  # type: ignore
try:
    from neo4j import GraphDatabase
except Exception:  # pragma: no cover - optional for tests
    GraphDatabase = None  # type: ignore

from ..models.memory_objects import MemoryChunk


class DualStorageManager:
    """Store data in both Weaviate and Neo4j."""

    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple) -> None:
        if weaviate:
            self.weaviate_client = weaviate.Client(
                url=weaviate_url,
                additional_headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY", "")},
            )
        else:
            self.weaviate_client = None
        if GraphDatabase:
            self.neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        else:
            self.neo4j_driver = None

    def close(self) -> None:
        if self.neo4j_driver:
            self.neo4j_driver.close()

    def store_meeting(
        self, meeting_metadata: Dict[str, Any], chunks: List[MemoryChunk]
    ) -> bool:
        """Store meeting data in both databases."""
        try:
            self._store_in_weaviate(meeting_metadata, chunks)
            self._store_in_neo4j(meeting_metadata, chunks)
            return True
        except (weaviate.exceptions.WeaviateBaseError, Exception) as exc:
            logging.error(f"Storage error: {exc}", exc_info=True)
            return False

    def _store_in_weaviate(
        self, meeting_metadata: Dict[str, Any], chunks: List[MemoryChunk]
    ) -> None:
        if not self.weaviate_client:
            return
        meeting_object = {
            "meetingId": meeting_metadata["meeting_id"],
            "title": meeting_metadata["title"],
            "date": meeting_metadata["date"].isoformat(),
            "participants": meeting_metadata.get("participants", []),
            "platform": meeting_metadata.get("platform", "unknown"),
            "project": meeting_metadata.get("project", ""),
            "meetingType": meeting_metadata.get("type", "discussion"),
        }
        self.weaviate_client.data_object.create(meeting_object, class_name="Meeting")
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
                        "fullContext": chunk.full_context,
                        "structuredData": chunk.structured_data,
                        "temporalMarkers": chunk.temporal_markers,
                        "topicsDiscussed": chunk.topics_discussed,
                        "entitiesMentioned": chunk.entities_mentioned,
                        "versionInfo": chunk.version_info,
                        "importanceScore": chunk.importance_score,
                    },
                    class_name="MemoryChunk",
                )

    def _store_in_neo4j(
        self, meeting_metadata: Dict[str, Any], chunks: List[MemoryChunk]
    ) -> None:
        if not self.neo4j_driver:
            return
        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_meeting_tx, meeting_metadata)
            for chunk in chunks:
                session.write_transaction(
                    self._create_chunk_tx, chunk, meeting_metadata
                )

    @staticmethod
    def _create_meeting_tx(tx, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (m:Meeting {meetingId: $id}) "
            "SET m.title=$title, m.date=datetime($date)"
        )
        tx.run(
            query,
            id=meeting_metadata["meeting_id"],
            title=meeting_metadata["title"],
            date=meeting_metadata["date"].isoformat(),
        )

    @staticmethod
    def _create_chunk_tx(
        tx, chunk: MemoryChunk, meeting_metadata: Dict[str, Any]
    ) -> None:
        query = (
            "MERGE (c:Chunk {chunkId: $cid}) "
            "SET c.content=$content, c.speaker=$speaker, c.timestamp=datetime($ts), "
            "c.addressedTo=$addressed_to, c.interactionType=$interaction_type, "
            "c.fullContext=$full_context, c.structuredData=$structured_data, "
            "c.temporalMarkers=$temporal_markers, c.topicsDiscussed=$topics_discussed, "
            "c.entitiesMentioned=$entities_mentioned, c.versionInfo=$version_info, "
            "c.importanceScore=$importance_score "
            "WITH c MATCH (m:Meeting {meetingId: $mid}) MERGE (c)-[:SPOKEN_IN]->(m)"
        )
        tx.run(
            query,
            cid=chunk.chunk_id,
            content=chunk.content,
            speaker=chunk.speaker,
            ts=chunk.timestamp.isoformat(),
            addressed_to=chunk.addressed_to,
            interaction_type=chunk.interaction_type,
            full_context=chunk.full_context,
            structured_data=chunk.structured_data,
            temporal_markers=chunk.temporal_markers,
            topics_discussed=chunk.topics_discussed,
            entities_mentioned=chunk.entities_mentioned,
            version_info=chunk.version_info,
            importance_score=chunk.importance_score,
            mid=meeting_metadata["meeting_id"],
        )

