from __future__ import annotations

import re
import math
from datetime import datetime
from typing import List, Dict, Any

from ..models.temporal_memory import TemporalMemoryChunk


class ImplicitReferenceResolver:
    """Resolve vague references in a chunk using temporal confidence decay."""

    implicit_patterns = [
        r"the original (\w+)",
        r"that (\w+) we discussed",
        r"our (\w+) approach",
        r"the (\w+) from last time",
    ]

    def resolve_implicit_references(
        self, chunk: TemporalMemoryChunk, historical_context: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Return resolved references with confidence values."""
        references: List[Dict[str, Any]] = []

        for pattern in self.implicit_patterns:
            matches = re.findall(pattern, chunk.content, re.IGNORECASE)
            for match in matches:
                candidates = self._find_candidates(match, historical_context)
                if not candidates:
                    continue

                for candidate in candidates:
                    ts = candidate.get("timestamp")
                    if isinstance(ts, datetime):
                        time_distance = (chunk.timestamp - ts).days
                    else:
                        time_distance = 0
                    decay_factor = math.exp(-0.1 * time_distance)
                    candidate["confidence"] *= decay_factor

                best_match = max(candidates, key=lambda x: x["confidence"])
                references.append(
                    {
                        "implicit_reference": match,
                        "resolved_to": best_match.get("chunk_id"),
                        "confidence": best_match.get("confidence"),
                        "reasoning": "Temporal proximity and semantic match",
                    }
                )
        return references

    def _find_candidates(
        self, reference: str, historical_context: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Find potential targets for an implicit reference."""
        candidates: List[Dict[str, Any]] = []
        ref_lower = reference.lower()
        for meeting in historical_context:
            for chunk in meeting.get("chunks", []):
                content = chunk.get("content", "").lower()
                if ref_lower in content:
                    candidates.append(
                        {
                            "chunk_id": chunk.get("chunk_id"),
                            "timestamp": chunk.get("timestamp"),
                            "confidence": chunk.get("confidence", 0.8),
                        }
                    )
        return candidates
