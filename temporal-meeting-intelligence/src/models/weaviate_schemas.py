from __future__ import annotations

from typing import Dict, Any


def memory_object_schema() -> Dict[str, Any]:
    """Return Weaviate schema for MemoryObject."""
    return {
        "class": "MemoryObject",
        "properties": [
            {"name": "meeting_id", "dataType": ["string"]},
            {"name": "type", "dataType": ["string"]},
            {"name": "content", "dataType": ["text"]},
            {"name": "confidence", "dataType": ["number"]},
        ],
        "vectorizer": "text2vec-openai",
    }


def meeting_schema() -> Dict[str, Any]:
    return {
        "class": "Meeting",
        "properties": [
            {"name": "subject", "dataType": ["text"]},
            {"name": "date", "dataType": ["date"]},
        ],
        "vectorizer": "text2vec-openai",
    }
