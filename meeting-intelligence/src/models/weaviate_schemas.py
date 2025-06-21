from __future__ import annotations

from typing import Dict, Any, List

_EMBEDDING_MODULE = {
    "text2vec-openai": {
        "model": "text-embedding-3-small",
        "type": "text",
        "options": {"waitForModel": True, "useGPU": True, "vectorizeClassName": False},
    }
}


def memory_object_schema() -> Dict[str, Any]:
    """Return Weaviate schema for MemoryObject."""

    properties: List[Dict[str, Any]] = [
        {
            "name": "content",
            "dataType": ["text"],
            "description": "Primary content of the memory",
            "moduleConfig": {"text2vec-openai": {"skip": False, "vectorizePropertyName": False}},
        },
        {
            "name": "contextualContent",
            "dataType": ["text"],
            "description": "Full context including surrounding discussion",
        },
        {"name": "meetingId", "dataType": ["string"], "indexInverted": True, "indexFilterable": True},
        {"name": "memoryType", "dataType": ["string"], "indexInverted": True, "indexFilterable": True},
        {"name": "timestamp", "dataType": ["date"], "indexInverted": True, "indexRangeFilters": True},
        {"name": "involvedPeople", "dataType": ["string[]"], "indexInverted": True},
        {"name": "referencedArtifacts", "dataType": ["string[]"], "indexInverted": True},
        {"name": "confidence", "dataType": ["number"], "indexInverted": True, "indexRangeFilters": True},
    ]

    return {
        "class": "MemoryObject",
        "description": "Core memory unit from meetings",
        "vectorizer": "text2vec-openai",
        "moduleConfig": _EMBEDDING_MODULE,
        "properties": properties,
        "invertedIndexConfig": {
            "indexTimestamps": True,
            "indexNullState": True,
            "indexPropertyLength": True,
        },
        "replicationConfig": {"factor": 3},
    }


def meeting_schema() -> Dict[str, Any]:
    properties: List[Dict[str, Any]] = [
        {"name": "title", "dataType": ["string"], "indexInverted": True, "indexSearchable": True},
        {"name": "date", "dataType": ["date"], "indexInverted": True, "indexRangeFilters": True},
        {"name": "participants", "dataType": ["string[]"], "indexInverted": True},
        {"name": "duration", "dataType": ["int"]},
        {"name": "project", "dataType": ["string"], "indexInverted": True, "indexFilterable": True},
        {"name": "transcriptUrl", "dataType": ["string"]},
        {"name": "summary", "dataType": ["text"], "description": "AI-generated meeting summary"},
    ]

    return {
        "class": "Meeting",
        "description": "Meeting metadata and summary",
        "vectorizer": "text2vec-openai",
        "moduleConfig": _EMBEDDING_MODULE,
        "properties": properties,
    }
