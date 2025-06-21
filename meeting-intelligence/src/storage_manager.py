import os
from typing import List, Dict, Any
from datetime import datetime
import weaviate
from neo4j import GraphDatabase

from .temporal_extractor import TemporalMemoryChunk

class DualStorageManager:
    """Manage storage across Weaviate and Neo4j"""

    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple) -> None:
        self.weaviate_client = weaviate.Client(
            url=weaviate_url,
            additional_headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")},
        )
        self.neo4j_driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        self._ensure_schemas()

    def _ensure_schemas(self) -> None:  # pragma: no cover - schema setup
        try:
            self.weaviate_client.schema.get()
        except Exception:
            pass

    def store_meeting(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> bool:
        try:
            self._store_in_weaviate(meeting_metadata, chunks)
            self._store_in_neo4j(meeting_metadata, chunks)
            self._create_temporal_links(meeting_metadata, chunks)
            return True
        except Exception as e:  # pragma: no cover - external storage
            print(f"Storage error: {e}")
            return False

    def _store_in_weaviate(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> None:
        meeting_object = {
            "meetingId": meeting_metadata["meeting_id"],
            "title": meeting_metadata["title"],
            "date": meeting_metadata["date"].isoformat(),
            "participants": meeting_metadata["participants"],
            "platform": meeting_metadata.get("platform", "unknown"),
            "project": meeting_metadata.get("project", ""),
            "meetingType": meeting_metadata.get("type", "discussion"),
            "duration": meeting_metadata.get("duration", 60),
            "summary": meeting_metadata.get("summary", ""),
        }
        self.weaviate_client.data_object.create(meeting_object, class_name="Meeting")
        with self.weaviate_client.batch as batch:
            for chunk in chunks:
                chunk_object = {
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
                }
                batch.add_data_object(chunk_object, class_name="MemoryChunk")

    def _store_in_neo4j(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> None:
        with self.neo4j_driver.session() as session:
            session.write_transaction(self._create_meeting_node_tx, meeting_metadata)
            for chunk in chunks:
                session.write_transaction(self._create_chunk_node_tx, chunk, meeting_metadata)

    @staticmethod
    def _create_meeting_node_tx(tx, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (m:Meeting {meetingId: $meeting_id})\n"
            "SET m.title = $title, m.date = datetime($date), m.participants = $participants, "
            "m.platform = $platform, m.project = $project, m.type = $type"
        )
        tx.run(
            query,
            meeting_id=meeting_metadata["meeting_id"],
            title=meeting_metadata["title"],
            date=meeting_metadata["date"].isoformat(),
            participants=meeting_metadata["participants"],
            platform=meeting_metadata.get("platform", "unknown"),
            project=meeting_metadata.get("project", ""),
            type=meeting_metadata.get("type", "discussion"),
        )

    @staticmethod
    def _create_chunk_node_tx(tx, chunk: TemporalMemoryChunk, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MERGE (c:Chunk {chunkId: $chunk_id})\n"
            "SET c.content = $content, c.speaker = $speaker, c.timestamp = datetime($timestamp), "
            "c.interactionType = $interaction_type, c.importanceScore = $importance\n"
            "WITH c MATCH (m:Meeting {meetingId: $meeting_id}) MERGE (c)-[:SPOKEN_IN]->(m)"
        )
        tx.run(
            query,
            chunk_id=chunk.chunk_id,
            content=chunk.content,
            speaker=chunk.speaker,
            timestamp=chunk.timestamp.isoformat(),
            interaction_type=chunk.interaction_type,
            importance=chunk.importance_score,
            meeting_id=meeting_metadata["meeting_id"],
        )

    def _create_temporal_links(self, meeting_metadata: Dict[str, Any], chunks: List[TemporalMemoryChunk]) -> None:
        with self.neo4j_driver.session() as session:
            session.write_transaction(self._link_to_previous_meetings_tx, meeting_metadata)

    @staticmethod
    def _link_to_previous_meetings_tx(tx, meeting_metadata: Dict[str, Any]) -> None:
        query = (
            "MATCH (current:Meeting {meetingId: $current_id})\n"
            "MATCH (previous:Meeting)\n"
            "WHERE previous.date < current.date AND previous.project = current.project\n"
            "WITH current, previous ORDER BY previous.date DESC LIMIT 1\n"
            "MERGE (previous)-[:PRECEDED]->(current)"
        )
        tx.run(query, current_id=meeting_metadata["meeting_id"])
