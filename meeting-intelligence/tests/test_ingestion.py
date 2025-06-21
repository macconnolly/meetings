from __future__ import annotations

import asyncio
from pathlib import Path

import pytest

from src.ingestion.email_parser import EmailParser
from src.ingestion.pipeline import IngestionPipeline
from src.models.memory_objects import MemoryChunk, Meeting, Person, MemoryType, InteractionType
from datetime import datetime


class DummyWeaviateClient:
    def __init__(self) -> None:
        self.objects = []
        class DataObject:
            def __init__(self, outer):
                self.outer = outer
            def create(self, data, class_name):
                self.outer.objects.append((class_name, data))
        class Client:
            def __init__(self, outer):
                self.data_object = DataObject(outer)
        self.client = Client(self)


class DummyNeo4jClient:
    def __init__(self) -> None:
        self.queries = []
        class Session:
            def __init__(self, outer):
                self.outer = outer
            def run(self, query, **params):
                self.outer.queries.append((query, params))
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc, tb):
                pass
        class Driver:
            def __init__(self, outer):
                self.outer = outer
            def session(self):
                return Session(self.outer)
        self.driver = Driver(self)


class DummyExtractor:
    async def extract_temporal_chunks(self, transcript: str, meeting: Meeting, history):
        chunk = MemoryChunk(
            meeting_id=meeting.meeting_id,
            timestamp=meeting.date,
            speaker="Alice",
            addressed_to=["Bob"],
            content=transcript,
            full_context=transcript,
            memory_type=MemoryType.TOPIC,
            interaction_type=InteractionType.DISCUSSION,
        )
        return [chunk]


@pytest.fixture()
def sample_path() -> Path:
    return Path(__file__).resolve().parents[1] / "examples" / "standup.eml"


def test_email_parser(sample_path: Path) -> None:
    parser = EmailParser()
    text = parser.parse(sample_path)
    assert "Transcript" in text


def test_pipeline_ingest(sample_path: Path) -> None:
    pipeline = IngestionPipeline(DummyWeaviateClient(), DummyNeo4jClient())
    pipeline.extractor = DummyExtractor()
    summary = asyncio.run(pipeline.ingest_email(sample_path))
    assert summary["chunk_count"] >= 1
