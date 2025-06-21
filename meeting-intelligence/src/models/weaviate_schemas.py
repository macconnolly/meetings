from __future__ import annotations

from typing import Dict, Any, List

# Full Weaviate schema for the Temporal Meeting Intelligence system
WEAVIATE_SCHEMA: Dict[str, Any] = {
    "classes": [
        {
            "class": "MemoryChunk",
            "description": "Atomic unit of meeting memory with temporal awareness",
            "vectorizer": "text2vec-openai",
            "moduleConfig": {
                "text2vec-openai": {
                    "model": "text-embedding-3-small",
                    "type": "text",
                    "options": {"waitForModel": True, "useGPU": True},
                }
            },
            "properties": [
                {"name": "chunkId", "dataType": ["string"], "indexInverted": True},
                {
                    "name": "meetingId",
                    "dataType": ["string"],
                    "indexInverted": True,
                    "indexFilterable": True,
                },
                {
                    "name": "timestamp",
                    "dataType": ["date"],
                    "indexInverted": True,
                    "indexRangeFilters": True,
                },
                {
                    "name": "speaker",
                    "dataType": ["string"],
                    "indexInverted": True,
                    "indexFilterable": True,
                },
                {
                    "name": "addressedTo",
                    "dataType": ["string[]"],
                    "indexInverted": True,
                },
                {
                    "name": "interactionType",
                    "dataType": ["string"],
                    "indexInverted": True,
                    "indexFilterable": True,
                },
                {
                    "name": "content",
                    "dataType": ["text"],
                    "indexSearchable": True,
                    "moduleConfig": {
                        "text2vec-openai": {
                            "skip": False,
                            "vectorizePropertyName": False,
                        }
                    },
                },
                {"name": "fullContext", "dataType": ["text"]},
                {"name": "structuredData", "dataType": ["object"]},
                {
                    "name": "temporalMarkers",
                    "dataType": ["string[]"],
                    "indexInverted": True,
                },
                {
                    "name": "topicsDiscussed",
                    "dataType": ["string[]"],
                    "indexInverted": True,
                },
                {
                    "name": "entitiesMentioned",
                    "dataType": ["string[]"],
                    "indexInverted": True,
                },
                {"name": "versionInfo", "dataType": ["object"]},
                {
                    "name": "importanceScore",
                    "dataType": ["number"],
                    "indexInverted": True,
                    "indexRangeFilters": True,
                },
            ],
            "invertedIndexConfig": {
                "indexTimestamps": True,
                "indexNullState": True,
                "indexPropertyLength": True,
            },
        },
        {
            "class": "Meeting",
            "description": "Meeting metadata and summary",
            "properties": [
                {"name": "meetingId", "dataType": ["string"], "indexInverted": True},
                {"name": "title", "dataType": ["string"], "indexSearchable": True},
                {
                    "name": "date",
                    "dataType": ["date"],
                    "indexInverted": True,
                    "indexRangeFilters": True,
                },
                {
                    "name": "participants",
                    "dataType": ["string[]"],
                    "indexInverted": True,
                },
                {"name": "platform", "dataType": ["string"]},
                {
                    "name": "project",
                    "dataType": ["string"],
                    "indexInverted": True,
                    "indexFilterable": True,
                },
                {"name": "meetingType", "dataType": ["string"], "indexInverted": True},
                {"name": "transcriptUrl", "dataType": ["string"]},
                {"name": "duration", "dataType": ["int"]},
                {"name": "summary", "dataType": ["text"]},
            ],
        },
    ]
}


def memory_object_schema() -> Dict[str, Any]:
    """Backward compatibility alias."""
    return WEAVIATE_SCHEMA["classes"][0]


def meeting_schema() -> Dict[str, Any]:
    return WEAVIATE_SCHEMA["classes"][1]
