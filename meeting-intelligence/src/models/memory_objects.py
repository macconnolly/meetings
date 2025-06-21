from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, validator
import uuid


class MemoryType(str, Enum):
    """Types of memory chunks that can be extracted from meetings."""
    DECISION = "Decision"
    ACTION = "Action"
    TOPIC = "Topic"
    QUESTION = "Question"
    COMMITMENT = "Commitment"
    REFERENCE = "Reference"
    RISK = "Risk"
    TEMPORAL = "Temporal"
    REQUEST = "Request"
    TECHNICAL = "Technical"


class InteractionType(str, Enum):
    """Types of interactions between participants."""
    REQUEST = "request"
    QUESTION = "question"
    ANSWER = "answer"
    DECISION = "decision"
    DISCUSSION = "discussion"
    COMMITMENT = "commitment"
    UPDATE = "update"


class TemporalReference(BaseModel):
    """A reference to past or future time/events."""
    type: str = Field(..., description="past_reference|future_reference|deadline")
    text: str = Field(..., description="The temporal reference text")
    target_date: Optional[datetime] = None
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class VersionInfo(BaseModel):
    """Version information for artifacts/specifications."""
    version: str
    previous_version: Optional[str] = None
    artifact: str
    changes: List[str] = Field(default_factory=list)
    rationale: Optional[str] = None


class StructuredData(BaseModel):
    """Extracted structured data like tables, schemas, specifications."""
    type: str = Field(..., description="table|schema|specification|model|api")
    content: str
    format: str = Field(..., description="markdown|json|yaml|sql")
    title: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Person(BaseModel):
    """A person mentioned or participating in the meeting."""
    name: str
    email: Optional[str] = None
    role: Optional[str] = None


class MemoryChunk(BaseModel):
    """
    Core memory unit extracted from meetings with temporal awareness.
    Represents an atomic piece of information with full context.
    """
    # Identifiers
    chunk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    meeting_id: str
    
    # Temporal information
    timestamp: datetime = Field(..., description="When this was said in the meeting")
    
    # Participants
    speaker: str
    addressed_to: List[str] = Field(default_factory=list)
    
    # Content
    content: str = Field(..., description="The main content")
    full_context: str = Field(..., description="Surrounding conversation for context")
    
    # Classification
    memory_type: MemoryType
    interaction_type: InteractionType
    
    # Extracted information
    topics_discussed: List[str] = Field(default_factory=list)
    entities_mentioned: List[str] = Field(default_factory=list)
    temporal_markers: List[str] = Field(default_factory=list)
    
    # Temporal awareness
    temporal_references: List[TemporalReference] = Field(default_factory=list)
    references_past: List[Dict[str, Any]] = Field(default_factory=list)
    creates_future: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Version tracking
    version_info: Optional[VersionInfo] = None
    evolution_markers: List[str] = Field(default_factory=list)
    
    # Structured data
    structured_data: Optional[StructuredData] = None
    
    # Metadata
    importance_score: float = Field(default=5.0, ge=1.0, le=10.0)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    status_markers: List[str] = Field(default_factory=list)
    
    @validator("content", "full_context")
    def strip_text(cls, value: str) -> str:
        return value.strip()
    
    @validator("addressed_to", "topics_discussed", "entities_mentioned")
    def clean_list(cls, value: List[str]) -> List[str]:
        return [item.strip() for item in value if item.strip()]
    
    def is_temporal(self) -> bool:
        """Check if this chunk has temporal significance."""
        return bool(
            self.temporal_references or 
            self.temporal_markers or 
            self.version_info or
            self.evolution_markers
        )
    
    def references_person(self, person: str) -> bool:
        """Check if this chunk references a specific person."""
        person_lower = person.lower()
        return any(
            person_lower in text.lower() 
            for text in [self.speaker] + self.addressed_to + self.entities_mentioned
        )


class Meeting(BaseModel):
    """Meeting metadata and summary information."""
    meeting_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    date: datetime
    participants: List[Person]
    platform: str = Field(..., description="Teams, Zoom, Slack, etc.")
    project: str
    meeting_type: str = Field(..., description="standup, review, planning, etc.")
    transcript_url: Optional[str] = None
    duration: int = Field(..., description="Duration in minutes")
    summary: Optional[str] = None
    
    # Extracted metadata
    key_decisions: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    topics_covered: List[str] = Field(default_factory=list)
    follow_up_required: List[str] = Field(default_factory=list)
    
    @validator("title")
    def strip_title(cls, value: str) -> str:
        return value.strip()
    
    def get_participant_names(self) -> List[str]:
        """Get list of participant names."""
        return [p.name for p in self.participants]


class ExtractionMetadata(BaseModel):
    """Metadata about the extraction process."""
    extraction_timestamp: datetime = Field(default_factory=datetime.utcnow)
    llm_model: str
    extraction_version: str = "1.0"
    chunk_count: int
    processing_time_seconds: float
    confidence_distribution: Dict[str, float] = Field(default_factory=dict)