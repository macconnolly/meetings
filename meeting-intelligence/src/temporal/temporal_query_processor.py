from __future__ import annotations

"""Query processor with temporal awareness.

This is a simplified version of the ``TemporalQueryProcessor`` described in the
requirements.  It demonstrates how a query is analysed, relevant memory chunks
are retrieved from Weaviate and additional temporal context is fetched from
Neo4j.  Only the most important logic is implemented so that the module remains
compact and easy to extend.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional
import json

try:
    from openai import OpenAI
except Exception:  # pragma: no cover - openai may not be installed
    OpenAI = None  # type: ignore

from .temporal_extractor import TemporalMemoryChunk
from .storage_manager import DualStorageManager


@dataclass
class TemporalQueryResult:
    answer: str
    chunks_used: List[TemporalMemoryChunk]
    temporal_context: Dict[str, Any]
    confidence: float = 0.0


class TemporalQueryProcessor:
    """Process natural language queries about meetings."""

    def __init__(self, storage_manager: DualStorageManager) -> None:
        self.storage = storage_manager
        self.client = OpenAI() if OpenAI else None

    # ------------------------------------------------------------------
    def process_query(
        self, query: str, user_context: Optional[Dict[str, Any]] = None
    ) -> TemporalQueryResult:
        """Process ``query`` and return a :class:`TemporalQueryResult`."""

        understanding = self._understand_query_intent(query, user_context)
        chunks = self._semantic_search(query, understanding)
        temporal = self._get_temporal_context(chunks)
        answer = self._generate_answer(query, chunks, temporal, understanding)
        return TemporalQueryResult(
            answer=answer, chunks_used=chunks, temporal_context=temporal, confidence=0.5
        )

    # ------------------------------------------------------------------
    def _understand_query_intent(
        self, query: str, user_context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Use a small prompt to analyse ``query``."""

        if not self.client:
            return {"primary_intent": "general"}

        prompt = f"Analyse the user query and return the primary intent as JSON. Query: {query}"
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    def _semantic_search(self, query: str, understanding: Dict[str, Any]) -> List[TemporalMemoryChunk]:
        """Search Weaviate for relevant chunks."""

        result = (
            self.storage.weaviate_client.query.get(
                "MemoryChunk", ["chunkId", "content", "speaker", "timestamp"]
            )
            .with_near_text({"concepts": [query]})
            .with_limit(10)
            .do()
        )
        chunks: List[TemporalMemoryChunk] = []
        if result and "data" in result and "Get" in result["data"]:
            for raw in result["data"]["Get"].get("MemoryChunk", []):
                chunks.append(
                    TemporalMemoryChunk(
                        chunk_id=raw["chunkId"],
                        meeting_id="",
                        timestamp=datetime.fromisoformat(raw["timestamp"]),
                        speaker=raw.get("speaker", ""),
                        content=raw.get("content", ""),
                    )
                )
        return chunks

    def _get_temporal_context(self, chunks: List[TemporalMemoryChunk]) -> Dict[str, Any]:
        """Fetch basic temporal neighbours from Neo4j."""

        if not chunks:
            return {}
        first = chunks[0].chunk_id
        query = (
            "MATCH (c:Chunk {chunkId: $id})-[:SPOKEN_IN]->(m:Meeting)\n"
            "OPTIONAL MATCH (prev:Meeting)-[:PRECEDED]->(m)\n"
            "RETURN m.meetingId AS meeting, prev.meetingId AS previous"
        )
        with self.storage.neo4j_driver.session() as session:
            record = session.run(query, id=first).single()
        return dict(record) if record else {}

    def _generate_answer(
        self,
        query: str,
        chunks: List[TemporalMemoryChunk],
        temporal: Dict[str, Any],
        understanding: Dict[str, Any],
    ) -> str:
        """Create a plain text answer summarising the chunks."""

        if not self.client:
            # Simple concatenation for environments without OpenAI
            joined = "\n".join(c.content for c in chunks)
            return f"Stub response to '{query}':\n{joined}"

        prompt = (
            "Answer the following question using the provided meeting excerpts.\n"
            f"Question: {query}\n"
            f"Excerpts: {json.dumps([c.content for c in chunks])}\n"
            f"Temporal: {json.dumps(temporal)}"
        )
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        return response.choices[0].message.content
