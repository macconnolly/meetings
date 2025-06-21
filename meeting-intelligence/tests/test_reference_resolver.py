from datetime import datetime, timedelta

from src.ingestion.implicit_reference_resolver import ImplicitReferenceResolver
from src.models.temporal_memory import TemporalMemoryChunk


def test_resolve_implicit_reference():
    resolver = ImplicitReferenceResolver()

    chunk = TemporalMemoryChunk(
        chunk_id="c2",
        meeting_id="m2",
        timestamp=datetime(2024, 5, 10),
        speaker="Alice",
        content="Let's go with the original design",
    )

    historical_context = [
        {
            "chunks": [
                {
                    "chunk_id": "c1",
                    "timestamp": datetime(2024, 5, 1),
                    "content": "We created the initial design",
                    "confidence": 0.9,
                }
            ]
        }
    ]

    refs = resolver.resolve_implicit_references(chunk, historical_context)
    assert refs
    assert refs[0]["resolved_to"] == "c1"
    assert refs[0]["confidence"] < 0.9

