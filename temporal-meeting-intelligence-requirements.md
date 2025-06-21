# Temporal Meeting Intelligence System - Complete Requirements & Implementation Guide v3.0

## Executive Summary

The Temporal Meeting Intelligence System is an advanced platform that provides deep contextual understanding of meeting discussions and tracks how decisions, specifications, and plans evolve over time. Unlike simple meeting summarization tools, this system understands the temporal progression of ideas and can answer nuanced questions about specific interactions, technical specifications, and decision evolution across multiple meetings.

### Core Capabilities

1. **Contextual Question Answering**: "What did Jeff ask Tom for in the standup?" → Precise answer with full context
2. **Temporal Evolution Tracking**: "How has our data model evolved?" → Shows v1→v2→v3 progression with rationale
3. **Technical Specification Retrieval**: "What table structure did we discuss?" → Returns formatted technical details
4. **Decision Archaeology**: "Why did we change our approach?" → Traces decision evolution with context

### Key Innovation

The system combines:
- **Weaviate** for semantic search across all meeting content
- **Neo4j** for tracking temporal relationships and evolution
- **LLM Orchestration** for intelligent extraction and contextual assembly
- **Iterative Refinement** to build complete temporal context

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query Interface                       │
│                   "What's the current data model?"                │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────┐
│                    LLM Query Orchestrator                        │
│        - Understands temporal intent                             │
│        - Plans retrieval strategy                                │
│        - Manages iterative refinement                            │
└──────────┬────────────────────────────────────┬─────────────────┘
           │                                    │
┌──────────▼──────────┐              ┌─────────▼─────────┐
│   Weaviate 1.24+    │              │     Neo4j 5.x     │
│                     │              │                   │
│ Semantic Search:    │              │ Temporal Graph:   │
│ - Meeting chunks    │◄────────────►│ - Evolution chains│
│ - Embeddings        │              │ - Relationships   │
│ - Full context      │              │ - Version history │
└─────────────────────┘              └───────────────────┘
           │                                    │
┌──────────▼────────────────────────────────────▼─────────┐
│              Context Assembly & Response Generation      │
│         - Combines semantic and temporal results         │
│         - Formats technical content                      │
│         - Provides evolution narrative                   │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

```python
# Example query flow
query = "What's the current version of the test framework data model?"

# Step 1: Query Understanding
understanding = {
    "intent": "retrieve_technical_spec",
    "temporal_scope": "current_with_history",
    "subject": "test framework data model",
    "format_needed": "structured_table"
}

# Step 2: Dual Retrieval
weaviate_results = semantic_search("test framework data model")
neo4j_results = get_evolution_chain("test_framework_data_model")

# Step 3: Iterative Refinement
if gaps_identified:
    additional_context = fill_temporal_gaps()

# Step 4: Assembly
response = assemble_temporal_response(weaviate_results, neo4j_results)
```

---

## 2. Data Models

### 2.1 Weaviate Schema

```python
# Complete Weaviate schema for temporal meeting intelligence
WEAVIATE_SCHEMA = {
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
                        "useGPU": True
                    }
                }
            },
            "properties": [
                {
                    "name": "chunkId",
                    "dataType": ["string"],
                    "description": "Unique identifier",
                    "indexInverted": True
                },
                {
                    "name": "meetingId", 
                    "dataType": ["string"],
                    "description": "Source meeting identifier",
                    "indexInverted": True,
                    "indexFilterable": True
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
                    "indexFilterable": True
                },
                {
                    "name": "addressedTo",
                    "dataType": ["string[]"],
                    "description": "Who was addressed",
                    "indexInverted": True
                },
                {
                    "name": "interactionType",
                    "dataType": ["string"],
                    "description": "request|question|answer|decision|discussion",
                    "indexInverted": True,
                    "indexFilterable": True
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
                    "description": "Surrounding conversation for context"
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
                        }
                    ]
                },
                {
                    "name": "temporalMarkers",
                    "dataType": ["string[]"],
                    "description": "Time references found",
                    "indexInverted": True
                },
                {
                    "name": "topicsDiscussed",
                    "dataType": ["string[]"],
                    "description": "Main topics in this chunk",
                    "indexInverted": True
                },
                {
                    "name": "entitiesMentioned",
                    "dataType": ["string[]"],
                    "description": "People, systems, projects referenced",
                    "indexInverted": True
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
                    "name": "importanceScore",
                    "dataType": ["number"],
                    "description": "1-10 importance rating",
                    "indexInverted": True,
                    "indexRangeFilters": True
                }
            ],
            "invertedIndexConfig": {
                "indexTimestamps": True,
                "indexNullState": True,
                "indexPropertyLength": True
            }
        },
        {
            "class": "Meeting",
            "description": "Meeting metadata and summary",
            "properties": [
                {
                    "name": "meetingId",
                    "dataType": ["string"],
                    "indexInverted": True
                },
                {
                    "name": "title",
                    "dataType": ["string"],
                    "indexSearchable": True
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
                    "indexInverted": True
                },
                {
                    "name": "platform",
                    "dataType": ["string"],
                    "description": "Teams, Zoom, etc."
                },
                {
                    "name": "project",
                    "dataType": ["string"],
                    "indexInverted": True,
                    "indexFilterable": True
                },
                {
                    "name": "meetingType",
                    "dataType": ["string"],
                    "description": "standup, review, planning, etc.",
                    "indexInverted": True
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
                    "description": "AI-generated summary"
                }
            ]
        }
    ]
}
```

### 2.2 Neo4j Graph Schema

```cypher
// Node Types with Properties
CREATE CONSTRAINT meeting_unique IF NOT EXISTS 
  ON (m:Meeting) ASSERT m.meetingId IS UNIQUE;
...
```

*(truncated for brevity)*
*** End Patch
