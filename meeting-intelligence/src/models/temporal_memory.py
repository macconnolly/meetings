from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Optional, Any


@dataclass
class TemporalMemoryChunk:
    """Rich memory chunk with temporal awareness."""

    chunk_id: str
    meeting_id: str
    timestamp: datetime
    speaker: str
    addressed_to: List[str] = field(default_factory=list)
    interaction_type: str = "discussion"
    content: str = ""
    full_context: str = ""
    structured_data: Optional[Dict[str, Any]] = None
    temporal_markers: List[str] = field(default_factory=list)
    topics_discussed: List[str] = field(default_factory=list)
    entities_mentioned: List[str] = field(default_factory=list)
    version_info: Optional[Dict[str, str]] = None
    importance_score: float = 5.0
    references_past: List[Dict[str, Any]] = field(default_factory=list)
    creates_future: List[Dict[str, Any]] = field(default_factory=list)
