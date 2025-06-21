from __future__ import annotations

"""FastAPI application exposing the meeting intelligence API.

This module wires together the :class:`TemporalExtractor`, :class:`DualStorageManager`
and :class:`TemporalQueryProcessor` into a small HTTP service.  Only the main
endpoints are implemented so that automated tests can exercise the basic
workflow.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from .temporal_extractor import TemporalExtractor
from .storage_manager import DualStorageManager
from .temporal_query_processor import TemporalQueryProcessor


app = FastAPI(title="Temporal Meeting Intelligence API", version="3.0")

# Instantiate core components using local configuration
storage_manager = DualStorageManager(
    weaviate_url="http://localhost:8080",
    neo4j_uri="bolt://localhost:7687",
    neo4j_auth=("neo4j", "password"),
)
extractor = TemporalExtractor()
query_processor = TemporalQueryProcessor(storage_manager)


class MeetingIngest(BaseModel):
    title: str
    date: datetime
    participants: List[str]
    transcript: str
    meeting_id: Optional[str] = None


class Query(BaseModel):
    query: str
    user_context: Optional[Dict[str, Any]] = None


@app.post("/meetings/ingest")
async def ingest_meeting(meeting: MeetingIngest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Ingest a meeting transcript in the background."""

    mid = meeting.meeting_id or f"meeting_{uuid.uuid4().hex[:8]}"
    metadata = {
        "meeting_id": mid,
        "title": meeting.title,
        "date": meeting.date,
        "participants": meeting.participants,
    }
    chunks = extractor.extract_temporal_chunks(meeting.transcript, metadata, [])
    background_tasks.add_task(storage_manager.store_meeting, metadata, chunks)
    return {"meeting_id": mid, "chunks": len(chunks)}


@app.post("/query")
async def query_meetings(payload: Query) -> Dict[str, Any]:
    """Answer a natural language query."""

    result = query_processor.process_query(payload.query, payload.user_context)
    return {
        "answer": result.answer,
        "chunks_used": len(result.chunks_used),
        "confidence": result.confidence,
    }


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Return a minimal health status."""

    try:
        schema = storage_manager.weaviate_client.schema.get()
        weaviate_status = "healthy" if schema else "unhealthy"
    except Exception as exc:  # pragma: no cover - network issues
        raise HTTPException(503, f"Weaviate error: {exc}")

    return {"weaviate": weaviate_status, "neo4j": "unknown"}
