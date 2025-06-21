from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

from .temporal_extractor import TemporalExtractor
from .storage_manager import DualStorageManager
from .temporal_query_processor import TemporalQueryProcessor

app = FastAPI(title="Temporal Meeting Intelligence API", version="3.0")

storage_manager = DualStorageManager(
    weaviate_url="http://weaviate:8080",
    neo4j_uri="bolt://neo4j:7687",
    neo4j_auth=("neo4j", "password"),
)

temporal_extractor = TemporalExtractor()
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
    user_context: Optional[Dict[str, Any]] = None

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    evolution_found: bool
    chunks_used: int
    follow_up_suggestions: List[str]
    query_time_ms: int

@app.post("/meetings/ingest", response_model=Dict[str, Any])
async def ingest_meeting(meeting: MeetingIngest, background_tasks: BackgroundTasks):
    if not meeting.meeting_id:
        meeting.meeting_id = f"meeting_{uuid.uuid4().hex[:8]}"
    meeting_metadata = {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "date": meeting.date,
        "participants": meeting.participants,
        "platform": meeting.platform,
        "project": meeting.project,
        "type": meeting.meeting_type,
    }
    historical_context: List[Dict[str, Any]] = []
    chunks = temporal_extractor.extract_temporal_chunks(
        transcript=meeting.transcript,
        meeting_metadata=meeting_metadata,
        historical_context=historical_context,
    )
    background_tasks.add_task(storage_manager.store_meeting, meeting_metadata, chunks)
    return {"meeting_id": meeting.meeting_id, "status": "processing", "chunks_extracted": len(chunks)}

@app.post("/query", response_model=QueryResponse)
async def query_meetings(query: Query):
    start_time = datetime.now()
    result = query_processor.process_query(query.query, query.user_context)
    duration = int((datetime.now() - start_time).total_seconds() * 1000)
    return QueryResponse(
        answer=result.answer,
        confidence=result.confidence,
        evolution_found=result.evolution_found,
        chunks_used=len(result.chunks_used),
        follow_up_suggestions=result.follow_up_suggestions,
        query_time_ms=duration,
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
