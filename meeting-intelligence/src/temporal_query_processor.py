import json
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
from openai import OpenAI

from .storage_manager import DualStorageManager
from .temporal_extractor import TemporalMemoryChunk

@dataclass
class TemporalQueryResult:
    answer: str
    chunks_used: List[TemporalMemoryChunk]
    temporal_context: Dict[str, Any]
    evolution_found: bool
    confidence: float
    follow_up_suggestions: List[str]

class TemporalQueryProcessor:
    def __init__(self, storage_manager: DualStorageManager) -> None:
        self.storage = storage_manager
        self.client = OpenAI()

    def process_query(self, query: str, user_context: Optional[Dict[str, Any]] = None) -> TemporalQueryResult:
        understanding = self._understand_query_intent(query, user_context)
        semantic_chunks = self._semantic_search(query, understanding, limit=20)
        temporal_context = self._get_temporal_context(semantic_chunks, understanding)
        result = self._assemble_temporal_response(query, semantic_chunks, temporal_context, understanding)
        return result

    def _understand_query_intent(self, query: str, user_context: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        prompt = """
Analyze this query about meeting content:
Query: {query}
Current date: {current_date}
User context: {user_context}
Return a JSON with primary_intent and temporal_scope.
"""
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "Analyze queries"},
                {
                    "role": "user",
                    "content": prompt.format(
                        query=query,
                        current_date=datetime.now().isoformat(),
                        user_context=json.dumps(user_context or {}),
                    ),
                },
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    def _semantic_search(self, query: str, understanding: Dict[str, Any], limit: int = 20) -> List[TemporalMemoryChunk]:
        result = self.storage.weaviate_client.query.get(
            "MemoryChunk",
            ["chunkId", "content", "speaker", "timestamp"],
        ).with_near_text({"concepts": [query]}).with_limit(limit).do()
        chunks: List[TemporalMemoryChunk] = []
        if result and "data" in result and "Get" in result["data"]:
            for chunk_data in result["data"]["Get"]["MemoryChunk"]:
                chunk = TemporalMemoryChunk(
                    chunk_id=chunk_data["chunkId"],
                    meeting_id="unknown",
                    timestamp=datetime.fromisoformat(chunk_data["timestamp"]),
                    speaker=chunk_data["speaker"],
                    content=chunk_data["content"],
                )
                chunks.append(chunk)
        return chunks

    def _get_temporal_context(self, chunks: List[TemporalMemoryChunk], understanding: Dict[str, Any]) -> Dict[str, Any]:
        return {}

    def _assemble_temporal_response(
        self,
        query: str,
        chunks: List[TemporalMemoryChunk],
        temporal_context: Dict[str, Any],
        understanding: Dict[str, Any],
    ) -> TemporalQueryResult:
        formatted_chunks = "\n".join(c.content for c in chunks)
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "Answer questions about meetings"},
                {
                    "role": "user",
                    "content": f"Query: {query}\n\n{formatted_chunks}",
                },
            ],
            temperature=0.1,
        )
        answer = response.choices[0].message.content
        return TemporalQueryResult(
            answer=answer,
            chunks_used=chunks,
            temporal_context=temporal_context,
            evolution_found=False,
            confidence=0.5,
            follow_up_suggestions=[],
        )
