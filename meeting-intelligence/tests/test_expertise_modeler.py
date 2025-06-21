from __future__ import annotations

from datetime import datetime, timedelta

from src.analysis.participant_expertise import ParticipantExpertiseModeler
from src.models.temporal_memory import TemporalMemoryChunk


def _chunk(**kwargs):
    default = {
        "chunk_id": "1",
        "meeting_id": "m1",
        "timestamp": datetime.utcnow(),
        "speaker": "Alice",
        "topics_discussed": ["testing"],
        "content": "Sample explanation",
        "full_context": "Sample explanation context",
        "structured_data": None,
        "interaction_type": "explanation",
        "creates_future": [],
        "references_past": [],
    }
    default.update(kwargs)
    return TemporalMemoryChunk(**default)


def test_model_expertise_basic():
    now = datetime.utcnow()
    chunk1 = _chunk()
    chunk2 = _chunk(chunk_id="2", speaker="Bob", topics_discussed=["testing"],
                    timestamp=now - timedelta(days=10), interaction_type="answer")
    chunk3 = _chunk(chunk_id="3", speaker="Alice", topics_discussed=["api"],
                    structured_data={"type": "table"})

    modeler = ParticipantExpertiseModeler()
    scores = modeler.model_expertise([chunk1, chunk2, chunk3])

    assert "testing" in scores["Alice"]
    assert "testing" in scores["Bob"]
