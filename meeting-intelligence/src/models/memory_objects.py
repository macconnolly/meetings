from __future__ import annotations

from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, validator


class MemoryType(str, Enum):
    DECISION = "Decision"
    ACTION = "Action"
    TOPIC = "Topic"
    QUESTION = "Question"
    COMMITMENT = "Commitment"
    REFERENCE = "Reference"
    RISK = "Risk"
    TEMPORAL = "Temporal"


class MemoryObject(BaseModel):
    """Represents a piece of information extracted from a meeting."""

    id: Optional[str] = None
    meeting_id: str
    type: MemoryType
    content: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    related_to: Optional[List[str]] = None

    @validator("content")
    def strip_content(cls, value: str) -> str:
        return value.strip()
