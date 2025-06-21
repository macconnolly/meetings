"""FastAPI application exposing the temporal meeting intelligence API."""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel

from .temporal_extractor import TemporalExtractor
from .temporal_query_processor import TemporalQueryProcessor
from .storage_manager import DualStorageManager


app = FastAPI(title="Temporal Meeting Intelligence API", version="0.1")

storage_manager = DualStorageManager(
    weaviate_url="http://localhost:8080",
    neo4j_uri="bolt://localhost:7687",
    neo4j_auth=("neo4j", "password"),
)
extractor = TemporalExtractor()
query_processor = TemporalQueryProcessor(storage_manager)


class MeetingIngest(BaseModel):
    meeting_id: Optional[str] = None
    title: str
    date: datetime
    participants: List[str]
    transcript: str
    platform: str = "Teams"
    project: str = ""
    meeting_type: str = "discussion"


class Query(BaseModel):
    query: str


class QueryResponse(BaseModel):
    answer: str
    confidence: float
    chunks_used: int
    query_time_ms: int


@app.post("/meetings/ingest", response_model=Dict[str, Any])
async def ingest_meeting(meeting: MeetingIngest, background_tasks: BackgroundTasks) -> Dict[str, Any]:
    if not meeting.meeting_id:
        meeting.meeting_id = f"meeting_{uuid.uuid4().hex[:8]}"
    metadata = {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "date": meeting.date,
        "participants": meeting.participants,
        "platform": meeting.platform,
        "project": meeting.project,
        "type": meeting.meeting_type,
    }
    chunks = extractor.extract_temporal_chunks(meeting.transcript, metadata, [])
    background_tasks.add_task(storage_manager.store_meeting, metadata, chunks)
    return {"meeting_id": meeting.meeting_id, "chunks": len(chunks)}


@app.post("/query", response_model=QueryResponse)
async def query_meetings(q: Query) -> QueryResponse:
    start = datetime.now()
    result = query_processor.process_query(q.query)
    elapsed = int((datetime.now() - start).total_seconds() * 1000)
    return QueryResponse(
        answer=result.answer,
        confidence=result.confidence,
        chunks_used=len(result.chunks_used),
        query_time_ms=elapsed,
    )


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
