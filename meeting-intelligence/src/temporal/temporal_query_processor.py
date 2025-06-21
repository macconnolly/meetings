from __future__ import annotations

"""Temporal query processing utilities.
This is a trimmed down adaptation of the specification to demonstrate
basic temporal query functionality.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import json
from datetime import datetime

from openai import OpenAI

from .temporal_extractor import TemporalMemoryChunk
from .storage_manager import DualStorageManager


@dataclass
class TemporalQueryResult:
    answer: str
    chunks_used: List[TemporalMemoryChunk]
    confidence: float


class TemporalQueryProcessor:
    """Process user queries with temporal awareness."""

    def __init__(self, storage_manager: DualStorageManager) -> None:
        self.storage = storage_manager
        self.client = OpenAI()

    def process_query(self, query: str) -> TemporalQueryResult:
        understanding = self._understand_query_intent(query)
        chunks = self._semantic_search(query, understanding, limit=5)
        answer = self._assemble_response(query, chunks, understanding)
        return TemporalQueryResult(answer=answer, chunks_used=chunks, confidence=0.5)

    def _understand_query_intent(self, query: str) -> Dict[str, Any]:
        prompt = (
            "Analyze this query about meeting content and return JSON with a simple intent field.\n"
            f"Query: {query}\n"
        )
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        try:
            return json.loads(response.choices[0].message.content)
        except Exception:
            return {"intent": "unknown"}

    def _semantic_search(self, query: str, understanding: Dict[str, Any], limit: int) -> List[TemporalMemoryChunk]:
        result = self.storage.weaviate_client.query.get(
            "MemoryChunk", ["chunkId", "content", "speaker", "timestamp"]
        ).with_near_text({"concepts": [query]}).with_limit(limit).do()
        chunks: List[TemporalMemoryChunk] = []
        for c in result.get("data", {}).get("Get", {}).get("MemoryChunk", []):
            chunks.append(
                TemporalMemoryChunk(
                    chunk_id=c["chunkId"],
                    meeting_id="",  # unknown
                    timestamp=datetime.fromisoformat(c["timestamp"]),
                    speaker=c.get("speaker", ""),
                    content=c.get("content", ""),
                )
            )
        return chunks

    def _assemble_response(self, query: str, chunks: List[TemporalMemoryChunk], understanding: Dict[str, Any]) -> str:
        context = "\n".join(f"- {c.speaker}: {c.content}" for c in chunks)
        prompt = (
            "Use the following meeting snippets to answer the query.\n"
            f"Query: {query}\n\n{context}"
        )
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return response.choices[0].message.content
