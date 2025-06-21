from __future__ import annotations

from typing import Dict, List, Any


def get_weaviate_schema() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get the complete Weaviate schema for temporal meeting intelligence.
    
    Returns the schema configuration for all classes needed in Weaviate.
    """
    return {
        "classes": [
            {
                "class": "MemoryChunk",
                "description": "Atomic unit of meeting memory with temporal awareness",
                "vectorizer": "text2vec-openai",
                "moduleConfig": {
                    "text2vec-openai": {
                        "model": "text-embedding-3-small",
                        "type": "text",
                        "options": {
                            "waitForModel": True,
                            "useGPU": True,
                            "vectorizeClassName": False
                        }
                    }
                },
                "properties": [
                    {
                        "name": "chunkId",
                        "dataType": ["string"],
                        "description": "Unique identifier",
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "meetingId", 
                        "dataType": ["string"],
                        "description": "Source meeting identifier",
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "timestamp",
                        "dataType": ["date"],
                        "description": "When this was said in the meeting",
                        "indexInverted": True,
                        "indexRangeFilters": True
                    },
                    {
                        "name": "speaker",
                        "dataType": ["string"],
                        "description": "Who said this",
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "addressedTo",
                        "dataType": ["string[]"],
                        "description": "Who was addressed",
                        "indexInverted": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "interactionType",
                        "dataType": ["string"],
                        "description": "request|question|answer|decision|discussion|commitment|update",
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "memoryType",
                        "dataType": ["string"],
                        "description": "Type of memory chunk",
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "content",
                        "dataType": ["text"],
                        "description": "What was said",
                        "indexSearchable": True,
                        "moduleConfig": {
                            "text2vec-openai": {
                                "skip": False,
                                "vectorizePropertyName": False
                            }
                        }
                    },
                    {
                        "name": "fullContext",
                        "dataType": ["text"],
                        "description": "Surrounding conversation for context",
                        "indexSearchable": True
                    },
                    {
                        "name": "structuredData",
                        "dataType": ["object"],
                        "description": "Extracted tables, schemas, specs",
                        "nestedProperties": [
                            {
                                "name": "type",
                                "dataType": ["string"]
                            },
                            {
                                "name": "content", 
                                "dataType": ["text"]
                            },
                            {
                                "name": "format",
                                "dataType": ["string"]
                            },
                            {
                                "name": "title",
                                "dataType": ["string"]
                            }
                        ]
                    },
                    {
                        "name": "temporalMarkers",
                        "dataType": ["string[]"],
                        "description": "Time references found",
                        "indexInverted": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "topicsDiscussed",
                        "dataType": ["string[]"],
                        "description": "Main topics in this chunk",
                        "indexInverted": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "entitiesMentioned",
                        "dataType": ["string[]"],
                        "description": "People, systems, projects referenced",
                        "indexInverted": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "versionInfo",
                        "dataType": ["object"],
                        "description": "Version information if applicable",
                        "nestedProperties": [
                            {
                                "name": "version",
                                "dataType": ["string"]
                            },
                            {
                                "name": "previousVersion",
                                "dataType": ["string"]
                            },
                            {
                                "name": "artifact",
                                "dataType": ["string"]
                            }
                        ]
                    },
                    {
                        "name": "evolutionMarkers",
                        "dataType": ["string[]"],
                        "description": "Evolution indicators (updated, revised, supersedes)",
                        "indexInverted": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "statusMarkers",
                        "dataType": ["string[]"],
                        "description": "Status indicators (pending, complete, blocked)",
                        "indexInverted": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "importanceScore",
                        "dataType": ["number"],
                        "description": "1-10 importance rating",
                        "indexInverted": True,
                        "indexRangeFilters": True
                    },
                    {
                        "name": "confidence",
                        "dataType": ["number"],
                        "description": "Extraction confidence 0-1",
                        "indexInverted": True,
                        "indexRangeFilters": True
                    }
                ],
                "invertedIndexConfig": {
                    "indexTimestamps": True,
                    "indexNullState": True,
                    "indexPropertyLength": True
                },
                "replicationConfig": {
                    "factor": 3
                }
            },
            {
                "class": "Meeting",
                "description": "Meeting metadata and summary",
                "vectorizer": "text2vec-openai",
                "moduleConfig": {
                    "text2vec-openai": {
                        "model": "text-embedding-3-small",
                        "type": "text",
                        "options": {
                            "waitForModel": True,
                            "vectorizeClassName": False
                        }
                    }
                },
                "properties": [
                    {
                        "name": "meetingId",
                        "dataType": ["string"],
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": False
                    },
                    {
                        "name": "title",
                        "dataType": ["string"],
                        "indexSearchable": True,
                        "indexInverted": True
                    },
                    {
                        "name": "date",
                        "dataType": ["date"],
                        "indexInverted": True,
                        "indexRangeFilters": True
                    },
                    {
                        "name": "participants",
                        "dataType": ["string[]"],
                        "indexInverted": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "platform",
                        "dataType": ["string"],
                        "description": "Teams, Zoom, etc.",
                        "indexInverted": True,
                        "indexFilterable": True
                    },
                    {
                        "name": "project",
                        "dataType": ["string"],
                        "indexInverted": True,
                        "indexFilterable": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "meetingType",
                        "dataType": ["string"],
                        "description": "standup, review, planning, etc.",
                        "indexInverted": True,
                        "indexFilterable": True
                    },
                    {
                        "name": "transcriptUrl",
                        "dataType": ["string"]
                    },
                    {
                        "name": "duration",
                        "dataType": ["int"],
                        "description": "Duration in minutes"
                    },
                    {
                        "name": "summary",
                        "dataType": ["text"],
                        "description": "AI-generated summary",
                        "indexSearchable": True,
                        "moduleConfig": {
                            "text2vec-openai": {
                                "skip": False,
                                "vectorizePropertyName": False
                            }
                        }
                    },
                    {
                        "name": "keyDecisions",
                        "dataType": ["string[]"],
                        "description": "Key decisions made",
                        "indexInverted": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "actionItems",
                        "dataType": ["string[]"],
                        "description": "Action items identified",
                        "indexInverted": True,
                        "indexSearchable": True
                    },
                    {
                        "name": "topicsCovered",
                        "dataType": ["string[]"],
                        "description": "Topics discussed",
                        "indexInverted": True,
                        "indexSearchable": True
                    }
                ],
                "invertedIndexConfig": {
                    "indexTimestamps": True,
                    "indexNullState": True,
                    "indexPropertyLength": True
                }
            }
        ]
    }


def create_weaviate_indices(client) -> None:
    """
    Create additional indices for optimal query performance.
    
    Args:
        client: Weaviate client instance
    """
    # These indices are created automatically based on the schema configuration
    # Additional custom indices can be added here if needed
    pass


def validate_schema(client) -> bool:
    """
    Validate that the schema was created correctly.
    
    Args:
        client: Weaviate client instance
        
    Returns:
        bool: True if schema is valid
    """
    try:
        schema = client.schema.get()
        required_classes = {"MemoryChunk", "Meeting"}
        existing_classes = {cls["class"] for cls in schema.get("classes", [])}
        
        return required_classes.issubset(existing_classes)
    except Exception as e:
        print(f"Schema validation error: {e}")
        return False