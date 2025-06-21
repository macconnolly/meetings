from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Any, Optional

from ..models.memory_objects import MemoryChunk
from ..storage.dual_storage_manager import DualStorageManager


class QueryType(str, Enum):
    """Canonical query types supported by the system."""

    PRE_MEETING = "pre_meeting"
    GAP_ANALYSIS = "gap_analysis"
    COMMITMENT_TRACKING = "commitment_tracking"
    DECISION_ARCHAEOLOGY = "decision_archaeology"
    CROSS_PROJECT = "cross_project"
    STATUS_CHECK = "status_check"
    GENERAL = "general"


@dataclass
class QueryPlan:
    original_query: str
    query_type: QueryType
    temporal_scope: str = "recent"
    entities: List[str] = field(default_factory=list)
    implicit_needs: List[str] = field(default_factory=list)
    required_context_types: List[str] = field(default_factory=list)

    @staticmethod
    def from_query(query: str) -> "QueryPlan":
        q = query.lower()
        if "board" in q or "pre-meeting" in q:
            qtype = QueryType.PRE_MEETING
        elif "slide" in q or "deck" in q:
            qtype = QueryType.GAP_ANALYSIS
        elif "commit" in q:
            qtype = QueryType.COMMITMENT_TRACKING
        elif "why did" in q or "decision" in q:
            qtype = QueryType.DECISION_ARCHAEOLOGY
        elif "cross" in q or "affect my project" in q:
            qtype = QueryType.CROSS_PROJECT
        elif "status" in q or "blocked" in q:
            qtype = QueryType.STATUS_CHECK
        else:
            qtype = QueryType.GENERAL
        return QueryPlan(original_query=query, query_type=qtype)


class TemporalQueryOrchestrator:
    """Coordinates retrieval and context assembly for queries."""

    def __init__(self, storage: DualStorageManager) -> None:
        self.storage = storage

    async def process_query(self, query: str) -> Dict[str, Any]:
        plan = QueryPlan.from_query(query)
        initial = await self._initial_retrieve(plan)
        enriched = await self._recursive_enrich(plan, initial)
        aggregated = self._aggregate(enriched)
        answer = self._format_response(plan, aggregated)
        return answer

    async def _initial_retrieve(self, plan: QueryPlan) -> List[MemoryChunk]:
        # Placeholder retrieval using Weaviate semantic search
        # In production this would query both stores based on plan
        return []

    async def _recursive_enrich(self, plan: QueryPlan, context: List[MemoryChunk]) -> List[MemoryChunk]:
        iterations = 0
        while iterations < 3 and self._needs_more_context(plan, context):
            more = await self._fetch_additional(plan, context)
            context.extend(more)
            context = self._deduplicate(context)
            iterations += 1
        return context

    async def _fetch_additional(self, plan: QueryPlan, context: List[MemoryChunk]) -> List[MemoryChunk]:
        # Placeholder for additional retrieval logic
        return []

    def _needs_more_context(self, plan: QueryPlan, context: List[MemoryChunk]) -> bool:
        return len(context) < 5

    def _deduplicate(self, chunks: List[MemoryChunk]) -> List[MemoryChunk]:
        seen = set()
        unique: List[MemoryChunk] = []
        for c in chunks:
            if c.chunk_id not in seen:
                unique.append(c)
                seen.add(c.chunk_id)
        return unique

    def _aggregate(self, chunks: List[MemoryChunk]) -> Dict[str, Any]:
        # Simple scoring by importance
        aggregated = sorted(chunks, key=lambda c: c.importance_score, reverse=True)
        return {"memories": [c.dict() for c in aggregated]}

    def _format_response(self, plan: QueryPlan, aggregated: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "query_type": plan.query_type.value,
            "results": aggregated,
        }

