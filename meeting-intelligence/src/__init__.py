"""Meeting Intelligence package."""

from .models.temporal_memory import TemporalMemoryChunk
from .analysis.participant_expertise import ParticipantExpertiseModeler

__all__ = [
    "TemporalMemoryChunk",
    "ParticipantExpertiseModeler",
]
