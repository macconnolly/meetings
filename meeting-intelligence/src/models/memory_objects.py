from __future__ import annotations

from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import uuid4

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


class MemoryContent(BaseModel):
    """Structured content extracted from the transcript."""

    primary: str
    context: Optional[str] = ""
    raw: Optional[str] = ""

    @validator("primary", "context", "raw", pre=True, always=True)
    def strip_text(cls, value: Optional[str]) -> str:
        return value.strip() if isinstance(value, str) else ""


class MemoryEntities(BaseModel):
    """Entities referenced in this memory object."""

    people: List[str] = Field(default_factory=list)
    artifacts: List[str] = Field(default_factory=list)
    projects: List[str] = Field(default_factory=list)


class TemporalInfo(BaseModel):
    """Temporal references and dependencies."""

    references: List[str] = Field(default_factory=list)
    deadlines: List[datetime] = Field(default_factory=list)
    dependencies: List[str] = Field(default_factory=list)


class MemoryObject(BaseModel):
    """Represents a piece of information extracted from a meeting."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    custom_id: Optional[str] = None
    meeting_id: str
    type: MemoryType
    timestamp: datetime
    content: MemoryContent
    entities: MemoryEntities = Field(default_factory=MemoryEntities)
    temporal: TemporalInfo = Field(default_factory=TemporalInfo)
    confidence: float = Field(..., ge=0.0, le=1.0)
    metadata: Optional[Dict[str, Any]] = None
    related_to: Optional[List[str]] = None
