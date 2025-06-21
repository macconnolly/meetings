from __future__ import annotations

from typing import List

from ..models.memory_objects import MemoryObject, MemoryType


class MemoryFactory:
    """Stub for future memory extraction logic."""

    def create_memories(self, text: str, meeting_id: str) -> List[MemoryObject]:
        return [
            MemoryObject(meeting_id=meeting_id, type=MemoryType.TOPIC, content=text, confidence=1.0)
        ]
