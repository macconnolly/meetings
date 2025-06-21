from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Dict, List

from ..models.temporal_memory import TemporalMemoryChunk


class ParticipantExpertiseModeler:
    """Build expertise profiles for participants."""

    def model_expertise(self, chunks: List[TemporalMemoryChunk]) -> Dict[str, Dict[str, float]]:
        """Analyze chunks and score participant expertise by topic."""
        self._reference_counts = self._build_reference_counts(chunks)
        expertise_scores: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

        for chunk in chunks:
            if chunk.interaction_type in ["explanation", "answer", "decision"]:
                topics = chunk.topics_discussed
                for topic in topics:
                    quality_score = self._calculate_contribution_quality(chunk)
                    age_days = (datetime.now() - chunk.timestamp).days
                    recency_factor = 1.0 / (1.0 + 0.01 * age_days)
                    expertise_scores[chunk.speaker][topic] += quality_score * recency_factor

        return self._normalize_expertise_scores(expertise_scores)

    def _build_reference_counts(self, chunks: List[TemporalMemoryChunk]) -> Dict[str, int]:
        counts = defaultdict(int)
        for chunk in chunks:
            for ref in chunk.references_past:
                target_id = ref.get("target_chunk_id")
                if target_id:
                    counts[target_id] += 1
        return counts

    def _calculate_contribution_quality(self, chunk: TemporalMemoryChunk) -> float:
        factors = {
            "length": min(len(chunk.content) / 500, 1.0),
            "has_structured_data": 2.0 if chunk.structured_data else 1.0,
            "leads_to_decision": 1.5 if self._leads_to_decision(chunk) else 1.0,
            "referenced_later": self._count_future_references(chunk) * 0.5,
        }
        return sum(factors.values()) / len(factors)

    def _leads_to_decision(self, chunk: TemporalMemoryChunk) -> bool:
        if getattr(chunk, "memory_type", "") == "Decision" or chunk.interaction_type == "decision":
            return True
        for future in chunk.creates_future:
            if future.get("type") == "decision":
                return True
        return False

    def _count_future_references(self, chunk: TemporalMemoryChunk) -> int:
        return self._reference_counts.get(chunk.chunk_id, 0)

    def _normalize_expertise_scores(
        self, scores: Dict[str, Dict[str, float]]
    ) -> Dict[str, Dict[str, float]]:
        normalized = {}
        for speaker, topic_scores in scores.items():
            if not topic_scores:
                normalized[speaker] = {}
                continue
            max_score = max(topic_scores.values())
            normalized[speaker] = {
                topic: round(score / max_score, 3) for topic, score in topic_scores.items()
            }
        return normalized
