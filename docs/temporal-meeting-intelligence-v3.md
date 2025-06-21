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

CREATE CONSTRAINT chunk_unique IF NOT EXISTS 
  ON (c:Chunk) ASSERT c.chunkId IS UNIQUE;

CREATE CONSTRAINT topic_unique IF NOT EXISTS 
  ON (t:Topic) ASSERT t.topicId IS UNIQUE;

CREATE CONSTRAINT artifact_unique IF NOT EXISTS 
  ON (a:Artifact) ASSERT a.artifactId IS UNIQUE;

CREATE CONSTRAINT decision_unique IF NOT EXISTS 
  ON (d:Decision) ASSERT d.decisionId IS UNIQUE;

CREATE CONSTRAINT person_unique IF NOT EXISTS 
  ON (p:Person) ASSERT p.email IS UNIQUE;

// Temporal Relationship Types
// Meeting succession
(m1:Meeting)-[:PRECEDED {days: 3}]->(m2:Meeting)

// Topic evolution
(t1:Topic)-[:DISCUSSED_IN {duration_minutes: 15}]->(m:Meeting)
(t1:Topic)-[:EVOLVED_INTO {reason: "Requirements changed"}]->(t2:Topic)
(t1:Topic)-[:SPLIT_INTO]->(t2:Topic)
(t1:Topic)-[:MERGED_WITH]->(t2:Topic)

// Decision evolution
(d1:Decision)-[:MADE_IN]->(m:Meeting)
(d1:Decision)-[:MADE_BY]->(p:Person)
(d2:Decision)-[:SUPERSEDES {reason: "New information", date: date()}]->(d1:Decision)
(d:Decision)-[:REVERSED {reason: "Technical constraints"}]->(d2:Decision)

// Artifact versioning
(a1:Artifact {version: "v1"})-[:EVOLVED_TO]->(a2:Artifact {version: "v2"})
(a:Artifact)-[:DISCUSSED_IN {context: "Review session"}]->(m:Meeting)
(p:Person)-[:MODIFIED {changes: ["Added columns", "Updated types"]}]->(a:Artifact)

// Interaction relationships
(c:Chunk)-[:SPOKEN_BY]->(p:Person)
(c:Chunk)-[:ADDRESSED_TO]->(p:Person)
(c:Chunk)-[:REFERENCES]->(c2:Chunk)
(c:Chunk)-[:RESPONDS_TO]->(c2:Chunk)
(c:Chunk)-[:CONTAINS_DECISION]->(d:Decision)
(c:Chunk)-[:DISCUSSES_ARTIFACT]->(a:Artifact)

// Temporal chains
(c1:Chunk)-[:TEMPORAL_REFERENCE {reference: "last week"}]->(c2:Chunk)
(c1:Chunk)-[:UPDATES_STATUS {from: "pending", to: "complete"}]->(item:ActionItem)
```

---

## 3. Implementation Components

### 3.1 Temporal-Aware Extraction Pipeline

```python
# temporal_extractor.py
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from dataclasses import dataclass, field
import re
from openai import OpenAI

@dataclass
class TemporalMemoryChunk:
    """Memory chunk with full temporal awareness"""
    chunk_id: str
    meeting_id: str
    timestamp: datetime
    speaker: str
    addressed_to: List[str] = field(default_factory=list)
    interaction_type: str = "discussion"
    content: str = ""
    full_context: str = ""
    structured_data: Optional[Dict[str, Any]] = None
    temporal_markers: List[str] = field(default_factory=list)
    topics_discussed: List[str] = field(default_factory=list)
    entities_mentioned: List[str] = field(default_factory=list)
    version_info: Optional[Dict[str, str]] = None
    importance_score: float = 5.0
    references_past: List[Dict[str, Any]] = field(default_factory=list)
    creates_future: List[Dict[str, Any]] = field(default_factory=list)

class TemporalExtractor:
    def __init__(self):
        self.client = OpenAI()
        self.extraction_prompt = """
You are analyzing a meeting transcript to extract temporal memory chunks.

Meeting Context:
{meeting_context}

Previous Meeting Topics (for temporal linking):
{historical_topics}

Transcript Section:
{transcript_section}

Extract detailed memory chunks that capture:

1. **Interaction Details**:
   - Speaker and who they're addressing
   - Type: request, question, answer, decision, explanation, discussion
   - The exact content of what was said
   - Surrounding context for understanding

2. **Temporal Awareness**:
   - References to past meetings/discussions ("as we discussed last week")
   - Version references ("v2 of the design", "updated from previous")
   - Status updates ("this is now complete", "still pending from Tuesday")
   - Evolution markers ("building on", "replacing", "supersedes")
   - Future commitments ("by next Friday", "for tomorrow's meeting")

3. **Structured Content**:
   - Data models (tables, schemas)
   - Technical specifications
   - Lists or enumerations
   - Code or configuration

4. **Linking Information**:
   - What past items this references
   - What future work this creates
   - How this relates to ongoing topics

Format each chunk as JSON:
{
    "speaker": "Name",
    "addressed_to": ["Names"] or [],
    "interaction_type": "request|question|answer|decision|explanation|discussion",
    "content": "The main content",
    "full_context": "Include surrounding discussion",
    "temporal_markers": ["last week", "v2", "updated version"],
    "topics_discussed": ["data model", "testing framework"],
    "entities_mentioned": ["PersonName", "SystemName", "ProjectName"],
    "structured_data": {
        "type": "table|schema|list|specification",
        "content": "formatted content",
        "format": "markdown|sql|json"
    },
    "version_info": {
        "artifact": "what this is about",
        "version": "current version",
        "previous_version": "if mentioned"
    },
    "importance_score": 1-10,
    "references_past": [
        {
            "type": "explicit|implicit",
            "reference": "what is referenced",
            "confidence": 0.0-1.0
        }
    ],
    "creates_future": [
        {
            "type": "action|commitment|follow_up",
            "description": "what needs to happen",
            "owner": "who will do it",
            "due": "when if mentioned"
        }
    ]
}

Focus on capturing rich temporal context and evolution of ideas.
"""

    def extract_temporal_chunks(self, 
                               transcript: str, 
                               meeting_metadata: Dict,
                               historical_context: List[Dict]) -> List[TemporalMemoryChunk]:
        """Extract temporally-aware memory chunks from transcript"""
        
        # Segment transcript into coherent sections
        sections = self._segment_transcript(transcript)
        
        all_chunks = []
        for section in sections:
            # Extract chunks with temporal awareness
            chunks = self._extract_section_chunks(
                section, 
                meeting_metadata,
                historical_context
            )
            
            # Enhance with temporal linking
            enhanced_chunks = self._enhance_temporal_links(
                chunks,
                historical_context,
                meeting_metadata
            )
            
            all_chunks.extend(enhanced_chunks)
        
        # Post-process for version chains
        all_chunks = self._identify_version_chains(all_chunks)
        
        return all_chunks
    
    def _segment_transcript(self, transcript: str) -> List[str]:
        """Intelligently segment transcript into coherent sections"""
        
        # First try speaker-based segmentation
        speaker_pattern = r'([A-Z][a-z]+):\s*(.+?)(?=\n[A-Z][a-z]+:|$)'
        matches = re.findall(speaker_pattern, transcript, re.DOTALL)
        
        if matches:
            # Group consecutive utterances into coherent sections
            sections = []
            current_section = ""
            
            for i, (speaker, content) in enumerate(matches):
                current_section += f"{speaker}: {content.strip()}\n"
                
                # Check if this completes a thought
                if (i < len(matches) - 1 and 
                    self._is_section_boundary(content, matches[i+1][1])):
                    sections.append(current_section.strip())
                    current_section = ""
            
            if current_section:
                sections.append(current_section.strip())
                
            return sections
        else:
            # Fallback to paragraph-based segmentation
            return [p.strip() for p in transcript.split('\n\n') if p.strip()]
    
    def _extract_section_chunks(self,
                               section: str,
                               meeting_metadata: Dict,
                               historical_context: List[Dict]) -> List[TemporalMemoryChunk]:
        """Extract chunks from a transcript section"""
        
        # Prepare historical topics for context
        historical_topics = []
        for ctx in historical_context[-5:]:  # Last 5 meetings
            historical_topics.extend([
                f"{ctx['meeting_date']}: {', '.join(ctx['topics'])}"
            ])
        
        # Call LLM for extraction
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system", 
                    "content": "You extract temporal memory chunks from meeting transcripts."
                },
                {
                    "role": "user",
                    "content": self.extraction_prompt.format(
                        meeting_context=json.dumps(meeting_metadata, indent=2),
                        historical_topics='\n'.join(historical_topics),
                        transcript_section=section
                    )
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        try:
            result = json.loads(response.choices[0].message.content)
            chunks_data = result.get('chunks', [])
            
            # Convert to TemporalMemoryChunk objects
            chunks = []
            for i, chunk_data in enumerate(chunks_data):
                chunk = TemporalMemoryChunk(
                    chunk_id=f"{meeting_metadata['meeting_id']}_chunk_{i}",
                    meeting_id=meeting_metadata['meeting_id'],
                    timestamp=meeting_metadata['date'],
                    **chunk_data
                )
                chunks.append(chunk)
            
            return chunks
        
        except Exception as e:
            print(f"Error parsing extraction response: {e}")
            return []
    
    def _enhance_temporal_links(self,
                               chunks: List[TemporalMemoryChunk],
                               historical_context: List[Dict],
                               meeting_metadata: Dict) -> List[TemporalMemoryChunk]:
        """Enhance chunks with explicit temporal links"""
        
        for chunk in chunks:
            # Enhance temporal references
            for marker in chunk.temporal_markers:
                if "last week" in marker.lower():
                    # Find meetings from last week
                    last_week_meetings = self._find_meetings_in_range(
                        historical_context,
                        days_back=7,
                        days_forward=0,
                        from_date=meeting_metadata['date']
                    )
                    
                    for meeting in last_week_meetings:
                        chunk.references_past.append({
                            "type": "temporal_reference",
                            "reference": f"meeting_{meeting['meeting_id']}",
                            "confidence": 0.8
                        })
                
                elif "previous version" in marker.lower() or "v" in marker:
                    # Look for version references
                    chunk.references_past.append({
                        "type": "version_reference",
                        "reference": "previous_version",
                        "confidence": 0.9
                    })
            
            # Enhance with topic-based linking
            for topic in chunk.topics_discussed:
                related_chunks = self._find_related_historical_chunks(
                    topic,
                    historical_context
                )
                
                for related in related_chunks[:3]:  # Top 3 related
                    chunk.references_past.append({
                        "type": "topic_continuation",
                        "reference": related['chunk_id'],
                        "confidence": related['similarity']
                    })
        
        return chunks
    
    def _identify_version_chains(self, 
                                chunks: List[TemporalMemoryChunk]) -> List[TemporalMemoryChunk]:
        """Identify and link version chains within chunks"""
        
        # Group chunks by artifact
        artifact_chunks = {}
        for chunk in chunks:
            if chunk.version_info and chunk.version_info.get('artifact'):
                artifact = chunk.version_info['artifact']
                if artifact not in artifact_chunks:
                    artifact_chunks[artifact] = []
                artifact_chunks[artifact].append(chunk)
        
        # Link versions within same meeting
        for artifact, artifact_chunk_list in artifact_chunks.items():
            # Sort by version if possible
            sorted_chunks = sorted(
                artifact_chunk_list,
                key=lambda c: c.version_info.get('version', '')
            )
            
            # Create version links
            for i in range(len(sorted_chunks) - 1):
                current = sorted_chunks[i]
                next_chunk = sorted_chunks[i + 1]
                
                current.creates_future.append({
                    "type": "version_evolution",
                    "description": f"Evolves to {next_chunk.version_info.get('version')}",
                    "reference": next_chunk.chunk_id
                })
                
                next_chunk.references_past.append({
                    "type": "version_evolution",
                    "reference": current.chunk_id,
                    "confidence": 1.0
                })
        
        return chunks

class TechnicalContentExtractor:
    """Specialized extractor for technical content"""
    
    def __init__(self):
        self.client = OpenAI()
        
    def extract_data_model(self, chunk_content: str) -> Optional[Dict[str, Any]]:
        """Extract data model or schema from discussion"""
        
        prompt = """
Extract any data model or schema from this discussion.

Content:
{content}

If a data model/schema is discussed, extract it as:
{
    "type": "sql_table|json_schema|class_definition",
    "name": "model/table name",
    "structure": {
        // For SQL tables:
        "columns": [
            {
                "name": "column_name",
                "type": "data_type",
                "constraints": ["NOT NULL", "PRIMARY KEY", etc],
                "description": "what this stores"
            }
        ],
        "indexes": [...],
        "relationships": [...]
    },
    "version": "if mentioned",
    "notes": ["additional context"]
}

Return null if no data model found.
"""
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Extract data models and schemas from technical discussions."
                },
                {
                    "role": "user",
                    "content": prompt.format(content=chunk_content)
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result if result and result.get('type') else None
    
    def extract_technical_specification(self, chunk_content: str) -> Optional[Dict[str, Any]]:
        """Extract any technical specification"""
        
        prompt = """
Extract technical specifications from this discussion.

Content:
{content}

Look for:
- API specifications
- Configuration requirements  
- Architecture descriptions
- Performance requirements
- Integration specifications

Format appropriately based on content type.
Return null if no technical specification found.
"""
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Extract technical specifications from discussions."
                },
                {
                    "role": "user",
                    "content": prompt.format(content=chunk_content)
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result if result else None
```

### 3.2 Dual Storage Implementation

```python
# storage_manager.py
import weaviate
from neo4j import GraphDatabase
import numpy as np
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import json

class DualStorageManager:
    """Manages storage across Weaviate and Neo4j"""
    
    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple):
        # Initialize Weaviate client
        self.weaviate_client = weaviate.Client(
            url=weaviate_url,
            additional_headers={
                "X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")
            }
        )
        
        # Initialize Neo4j driver
        self.neo4j_driver = GraphDatabase.driver(
            neo4j_uri,
            auth=neo4j_auth
        )
        
        # Ensure schemas exist
        self._ensure_schemas()
    
    def store_meeting(self, 
                     meeting_metadata: Dict,
                     chunks: List[TemporalMemoryChunk]) -> bool:
        """Store meeting and chunks in both databases"""
        
        try:
            # Store in Weaviate
            self._store_in_weaviate(meeting_metadata, chunks)
            
            # Store in Neo4j with relationships
            self._store_in_neo4j(meeting_metadata, chunks)
            
            # Create temporal links
            self._create_temporal_links(meeting_metadata, chunks)
            
            return True
            
        except Exception as e:
            print(f"Storage error: {e}")
            return False
    
    def _store_in_weaviate(self, 
                          meeting_metadata: Dict,
                          chunks: List[TemporalMemoryChunk]):
        """Store meeting and chunks in Weaviate"""
        
        # Store meeting
        meeting_object = {
            "meetingId": meeting_metadata["meeting_id"],
            "title": meeting_metadata["title"],
            "date": meeting_metadata["date"].isoformat(),
            "participants": meeting_metadata["participants"],
            "platform": meeting_metadata.get("platform", "unknown"),
            "project": meeting_metadata.get("project", ""),
            "meetingType": meeting_metadata.get("type", "discussion"),
            "duration": meeting_metadata.get("duration", 60),
            "summary": meeting_metadata.get("summary", "")
        }
        
        self.weaviate_client.data_object.create(
            data_object=meeting_object,
            class_name="Meeting"
        )
        
        # Store chunks
        with self.weaviate_client.batch as batch:
            for chunk in chunks:
                chunk_object = {
                    "chunkId": chunk.chunk_id,
                    "meetingId": chunk.meeting_id,
                    "timestamp": chunk.timestamp.isoformat(),
                    "speaker": chunk.speaker,
                    "addressedTo": chunk.addressed_to,
                    "interactionType": chunk.interaction_type,
                    "content": chunk.content,
                    "fullContext": chunk.full_context,
                    "structuredData": chunk.structured_data,
                    "temporalMarkers": chunk.temporal_markers,
                    "topicsDiscussed": chunk.topics_discussed,
                    "entitiesMentioned": chunk.entities_mentioned,
                    "versionInfo": chunk.version_info,
                    "importanceScore": chunk.importance_score
                }
                
                batch.add_data_object(
                    data_object=chunk_object,
                    class_name="MemoryChunk"
                )
    
    def _store_in_neo4j(self,
                       meeting_metadata: Dict,
                       chunks: List[TemporalMemoryChunk]):
        """Store meeting and chunks in Neo4j with relationships"""
        
        with self.neo4j_driver.session() as session:
            # Create meeting node
            session.write_transaction(
                self._create_meeting_node_tx,
                meeting_metadata
            )
            
            # Create chunk nodes and relationships
            for chunk in chunks:
                session.write_transaction(
                    self._create_chunk_node_tx,
                    chunk,
                    meeting_metadata
                )
                
                # Create person nodes and relationships
                self._create_person_relationships(session, chunk)
                
                # Create topic nodes and relationships
                self._create_topic_relationships(session, chunk)
                
                # Create artifact relationships if applicable
                if chunk.version_info:
                    self._create_artifact_relationships(session, chunk)
    
    def _create_temporal_links(self,
                              meeting_metadata: Dict,
                              chunks: List[TemporalMemoryChunk]):
        """Create temporal relationships in Neo4j"""
        
        with self.neo4j_driver.session() as session:
            # Link to previous meetings
            session.write_transaction(
                self._link_to_previous_meetings_tx,
                meeting_metadata
            )
            
            # Create evolution chains
            for chunk in chunks:
                if chunk.references_past:
                    session.write_transaction(
                        self._create_reference_links_tx,
                        chunk
                    )
                
                if chunk.creates_future:
                    session.write_transaction(
                        self._create_future_links_tx,
                        chunk
                    )
    
    @staticmethod
    def _create_meeting_node_tx(tx, meeting_metadata):
        query = """
        MERGE (m:Meeting {meetingId: $meeting_id})
        SET m.title = $title,
            m.date = datetime($date),
            m.participants = $participants,
            m.platform = $platform,
            m.project = $project,
            m.type = $type
        """
        
        tx.run(query, 
               meeting_id=meeting_metadata["meeting_id"],
               title=meeting_metadata["title"],
               date=meeting_metadata["date"].isoformat(),
               participants=meeting_metadata["participants"],
               platform=meeting_metadata.get("platform", "unknown"),
               project=meeting_metadata.get("project", ""),
               type=meeting_metadata.get("type", "discussion"))
    
    @staticmethod
    def _create_chunk_node_tx(tx, chunk, meeting_metadata):
        query = """
        MERGE (c:Chunk {chunkId: $chunk_id})
        SET c.content = $content,
            c.speaker = $speaker,
            c.timestamp = datetime($timestamp),
            c.interactionType = $interaction_type,
            c.importanceScore = $importance
            
        WITH c
        MATCH (m:Meeting {meetingId: $meeting_id})
        MERGE (c)-[:SPOKEN_IN]->(m)
        """
        
        tx.run(query,
               chunk_id=chunk.chunk_id,
               content=chunk.content,
               speaker=chunk.speaker,
               timestamp=chunk.timestamp.isoformat(),
               interaction_type=chunk.interaction_type,
               importance=chunk.importance_score,
               meeting_id=meeting_metadata["meeting_id"])
    
    @staticmethod
    def _link_to_previous_meetings_tx(tx, meeting_metadata):
        """Link meeting to previous meetings"""
        query = """
        MATCH (current:Meeting {meetingId: $current_id})
        MATCH (previous:Meeting)
        WHERE previous.date < current.date
        AND previous.project = current.project
        WITH current, previous
        ORDER BY previous.date DESC
        LIMIT 1
        MERGE (previous)-[:PRECEDED]->(current)
        """
        
        tx.run(query, current_id=meeting_metadata["meeting_id"])
```

### 3.3 Temporal Query Processing

```python
from typing import List, Dict, Optional, Any, Tuple
import json
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class TemporalQueryResult:
    """Result from temporal query processing"""
    answer: str
    chunks_used: List[TemporalMemoryChunk]
    temporal_context: Dict[str, Any]
    evolution_found: bool
    confidence: float
    follow_up_suggestions: List[str]

class TemporalQueryProcessor:
    """Process queries with temporal awareness"""
    
    def __init__(self, storage_manager: DualStorageManager):
        self.storage = storage_manager
        self.client = OpenAI()
        
    def process_query(self, 
                     query: str,
                     user_context: Optional[Dict] = None) -> TemporalQueryResult:
        """Process query with full temporal awareness"""
        
        # Step 1: Understand query intent
        query_understanding = self._understand_query_intent(query, user_context)
        
        # Step 2: Retrieve relevant chunks from Weaviate
        semantic_chunks = self._semantic_search(
            query,
            query_understanding,
            limit=20
        )
        
        # Step 3: Get temporal context from Neo4j
        temporal_context = self._get_temporal_context(
            semantic_chunks,
            query_understanding
        )
        
        # Step 4: Iterative refinement if needed
        if self._needs_refinement(semantic_chunks, temporal_context, query_understanding):
            semantic_chunks, temporal_context = self._refine_context(
                semantic_chunks,
                temporal_context,
                query_understanding,
                query
            )
        
        # Step 5: Assemble response
        result = self._assemble_temporal_response(
            query,
            semantic_chunks,
            temporal_context,
            query_understanding
        )
        
        return result
    
    def _understand_query_intent(self, 
                                query: str,
                                user_context: Optional[Dict]) -> Dict:
        """Understand the temporal intent of the query"""
        
        prompt = """
Analyze this query about meeting content:

Query: {query}
Current date: {current_date}
User context: {user_context}

Determine:

1. **Primary Intent**:
   - specific_interaction (who said what to whom)
   - technical_content (data models, specs, architecture)
   - decision_tracking (what was decided)
   - evolution_tracking (how something changed)
   - status_check (current state of something)

2. **Temporal Scope**:
   - specific_time (today, yesterday, last week)
   - current_only (just want latest)
   - historical (want full history)
   - evolution (want to see changes over time)

3. **People Involved**:
   - speaker: who said it
   - addressed_to: who it was said to
   - mentioned: people referenced

4. **Technical Focus**:
   - artifact_type (data model, API, architecture)
   - version_interest (latest, specific, all)
   - format_needed (table, schema, diagram)

5. **Expected Response**:
   - direct_answer (specific fact)
   - technical_structure (formatted data)
   - narrative (story of evolution)
   - comparison (differences between versions)

Examples:
- "What did Jeff ask Tom for?" → specific_interaction, direct_answer
- "Current data model?" → technical_content, current_only, technical_structure
- "How has X evolved?" → evolution_tracking, historical, narrative

Return as JSON.
"""
        
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Analyze queries to understand intent and temporal scope."
                },
                {
                    "role": "user",
                    "content": prompt.format(
                        query=query,
                        current_date=datetime.now().isoformat(),
                        user_context=json.dumps(user_context or {})
                    )
                }
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _semantic_search(self,
                        query: str,
                        understanding: Dict,
                        limit: int = 20) -> List[TemporalMemoryChunk]:
        """Search Weaviate for semantically relevant chunks"""
        
        # Build where filter based on understanding
        where_filter = None
        
        if understanding.get("people_involved"):
            where_conditions = []
            
            if understanding["people_involved"].get("speaker"):
                where_conditions.append({
                    "path": ["speaker"],
                    "operator": "Equal",
                    "valueString": understanding["people_involved"]["speaker"]
                })
            
            if understanding["people_involved"].get("addressed_to"):
                where_conditions.append({
                    "path": ["addressedTo"],
                    "operator": "ContainsAny",
                    "valueStringArray": understanding["people_involved"]["addressed_to"]
                })
            
            if where_conditions:
                where_filter = {
                    "operator": "And",
                    "operands": where_conditions
                } if len(where_conditions) > 1 else where_conditions[0]
        
        # Add temporal filters if specific time mentioned
        if understanding["temporal_scope"] == "specific_time":
            # Parse time references and add date filters
            pass
        
        # Perform search
        result = self.storage.weaviate_client.query.get(
            "MemoryChunk",
            ["chunkId", "content", "speaker", "addressedTo", "timestamp",
             "interactionType", "structuredData", "versionInfo", "temporalMarkers"]
        ).with_near_text({
            "concepts": [query]
        }).with_where(where_filter).with_limit(limit).do()
        
        # Convert to TemporalMemoryChunk objects
        chunks = []
        if result and "data" in result and "Get" in result["data"]:
            for chunk_data in result["data"]["Get"]["MemoryChunk"]:
                chunk = TemporalMemoryChunk(
                    chunk_id=chunk_data["chunkId"],
                    content=chunk_data["content"],
                    speaker=chunk_data["speaker"],
                    # ... map other fields
                )
                chunks.append(chunk)
        
        return chunks
    
    def _get_temporal_context(self,
                             chunks: List[TemporalMemoryChunk],
                             understanding: Dict) -> Dict[str, Any]:
        """Get temporal context from Neo4j based on chunks and query intent"""
        
        temporal_context = {
            "evolution_chains": {},
            "version_history": {},
            "temporal_neighbors": {},
            "decision_progression": {}
        }
        
        with self.storage.neo4j_driver.session() as session:
            # Based on query intent, get different temporal contexts
            if understanding["primary_intent"] == "evolution_tracking":
                temporal_context["evolution_chains"] = self._get_evolution_chains(
                    session,
                    chunks,
                    understanding
                )
            
            elif understanding["primary_intent"] == "technical_content":
                if understanding["temporal_scope"] in ["historical", "evolution"]:
                    temporal_context["version_history"] = self._get_version_history(
                        session,
                        chunks,
                        understanding
                    )
            
            elif understanding["primary_intent"] == "decision_tracking":
                temporal_context["decision_progression"] = self._get_decision_progression(
                    session,
                    chunks
                )
            
            # Always get temporal neighbors for context
            temporal_context["temporal_neighbors"] = self._get_temporal_neighbors(
                session,
                chunks,
                window_days=7
            )
        
        return temporal_context
    
    def _get_evolution_chains(self, session, chunks: List[TemporalMemoryChunk], understanding: Dict) -> Dict:
        """Trace evolution of topics through time"""
        
        query = """
        UNWIND $chunk_ids AS chunk_id
        MATCH (c:Chunk {chunkId: chunk_id})-[:DISCUSSES]->(t:Topic)
        
        // Find evolution path
        MATCH path = (t)-[:EVOLVED_INTO|SPLIT_INTO|MERGED_WITH*0..5]->(evolved:Topic)
        
        // Get all chunks discussing these topics
        MATCH (related:Chunk)-[:DISCUSSES]->(topic)
        WHERE topic IN nodes(path)
        
        WITH t.name as original_topic, 
             collect(DISTINCT {
                 topic: topic.name,
                 chunks: collect(DISTINCT {
                     id: related.chunkId,
                     content: related.content,
                     date: related.timestamp,
                     speaker: related.speaker
                 })
             }) as evolution
        
        RETURN original_topic, evolution
        """
        
        result = session.run(query, chunk_ids=[c.chunk_id for c in chunks])
        
        evolution_chains = {}
        for record in result:
            topic = record["original_topic"]
            evolution_chains[topic] = self._format_evolution_chain(record["evolution"])
        
        return evolution_chains
    
    def _get_version_history(self, session, chunks: List[TemporalMemoryChunk], understanding: Dict) -> Dict:
        """Get version history for artifacts"""
        
        # Extract artifact names from chunks
        artifacts = set()
        for chunk in chunks:
            if chunk.version_info and chunk.version_info.get("artifact"):
                artifacts.add(chunk.version_info["artifact"])
        
        if not artifacts:
            return {}
        
        query = """
        UNWIND $artifacts AS artifact_name
        MATCH (a:Artifact {name: artifact_name})
        
        // Find all versions
        MATCH path = (a)-[:EVOLVED_TO*0..10]->(latest:Artifact)
        WHERE NOT (latest)-[:EVOLVED_TO]->()
        
        // Get all versions in path
        WITH artifact_name, nodes(path) as versions
        UNWIND versions as version
        
        // Get chunks discussing each version
        MATCH (c:Chunk)-[:DISCUSSES_ARTIFACT]->(version)
        
        RETURN artifact_name,
               version.version as version_number,
               version.created as created_date,
               collect({
                   chunk_id: c.chunkId,
                   content: c.content,
                   speaker: c.speaker,
                   meeting: c.meetingId
               }) as discussions
        ORDER BY artifact_name, version.created
        """
        
        result = session.run(query, artifacts=list(artifacts))
        
        version_history = {}
        for record in result:
            artifact = record["artifact_name"]
            if artifact not in version_history:
                version_history[artifact] = []
            
            version_history[artifact].append({
                "version": record["version_number"],
                "created": record["created_date"],
                "discussions": record["discussions"]
            })
        
        return version_history
    
    def _refine_context(self,
                       initial_chunks: List[TemporalMemoryChunk],
                       initial_context: Dict,
                       understanding: Dict,
                       query: str) -> Tuple[List[TemporalMemoryChunk], Dict]:
        """Iteratively refine context by identifying and filling gaps"""
        
        # Identify gaps in current context
        gaps = self._identify_context_gaps(
            initial_chunks,
            initial_context,
            understanding,
            query
        )
        
        if not gaps:
            return initial_chunks, initial_context
        
        # Generate queries to fill gaps
        gap_queries = self._generate_gap_filling_queries(gaps, understanding)
        
        # Execute gap queries
        additional_chunks = []
        additional_context = {}
        
        for gap_query in gap_queries:
            if gap_query["type"] == "semantic_search":
                new_chunks = self._semantic_search(
                    gap_query["query"],
                    gap_query["understanding"],
                    limit=10
                )
                additional_chunks.extend(new_chunks)
            
            elif gap_query["type"] == "graph_traversal":
                with self.storage.neo4j_driver.session() as session:
                    new_context = self._execute_graph_query(
                        session,
                        gap_query["query"],
                        gap_query["parameters"]
                    )
                    additional_context.update(new_context)
        
        # Merge results
        all_chunks = initial_chunks + additional_chunks
        merged_context = self._merge_contexts(initial_context, additional_context)
        
        return all_chunks, merged_context
    
    def _assemble_temporal_response(self,
                                   query: str,
                                   chunks: List[TemporalMemoryChunk],
                                   temporal_context: Dict,
                                   understanding: Dict) -> TemporalQueryResult:
        """Assemble final response with temporal awareness"""
        
        # Prepare context for LLM
        formatted_chunks = self._format_chunks_for_response(chunks)
        formatted_temporal = self._format_temporal_context(temporal_context)
        
        # Generate response based on query type
        if understanding["primary_intent"] == "specific_interaction":
            response_prompt = self._get_interaction_response_prompt()
        elif understanding["primary_intent"] == "technical_content":
            response_prompt = self._get_technical_response_prompt()
        elif understanding["primary_intent"] == "evolution_tracking":
            response_prompt = self._get_evolution_response_prompt()
        else:
            response_prompt = self._get_general_response_prompt()
        
        # Generate response
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "Provide precise, temporally-aware answers from meeting content."
                },
                {
                    "role": "user",
                    "content": response_prompt.format(
                        query=query,
                        understanding=json.dumps(understanding, indent=2),
                        chunks=formatted_chunks,
                        temporal_context=formatted_temporal
                    )
                }
            ],
            temperature=0.1
        )
        
        answer = response.choices[0].message.content
        
        # Generate follow-up suggestions
        follow_ups = self._generate_follow_up_suggestions(
            query,
            chunks,
            temporal_context,
            understanding
        )
        
        # Calculate confidence
        confidence = self._calculate_confidence(
            chunks,
            temporal_context,
            understanding
        )
        
        return TemporalQueryResult(
            answer=answer,
            chunks_used=chunks,
            temporal_context=temporal_context,
            evolution_found=bool(temporal_context.get("evolution_chains")),
            confidence=confidence,
            follow_up_suggestions=follow_ups
        )
    
    def _get_technical_response_prompt(self) -> str:
        """Prompt for technical content responses"""
        return """
Answer this technical query using the meeting content:

Query: {query}
Intent: {understanding}

Meeting chunks:
{chunks}

Temporal context:
{temporal_context}

Instructions:
1. If asking for current version, provide the latest with version number
2. If technical structure (table, schema), format it properly in markdown
3. Include who discussed it and when
4. If multiple versions exist, clarify which is being shown
5. Note any pending changes or discussions about future versions

For data models/schemas:
- Use markdown tables for table structures
- Use code blocks for JSON schemas or code
- Include all fields, types, and constraints mentioned
- Note any fields that were debated or might change

Be precise and include all technical details discussed.
"""
```

### 3.4 Example API Implementation

```python
# api.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

app = FastAPI(title="Temporal Meeting Intelligence API", version="3.0")

# Initialize components
storage_manager = DualStorageManager(
    weaviate_url="http://localhost:8080",
    neo4j_uri="bolt://localhost:7687",
    neo4j_auth=("neo4j", "password")
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
    """Ingest a meeting transcript"""
    
    # Generate meeting ID if not provided
    if not meeting.meeting_id:
        meeting.meeting_id = f"meeting_{uuid.uuid4().hex[:8]}"
    
    # Prepare metadata
    meeting_metadata = {
        "meeting_id": meeting.meeting_id,
        "title": meeting.title,
        "date": meeting.date,
        "participants": meeting.participants,
        "platform": meeting.platform,
        "project": meeting.project,
        "type": meeting.meeting_type
    }
    
    # Get historical context (last 10 meetings from same project)
    historical_context = storage_manager.get_historical_context(
        project=meeting.project,
        before_date=meeting.date,
        limit=10
    )
    
    # Extract temporal chunks
    chunks = temporal_extractor.extract_temporal_chunks(
        transcript=meeting.transcript,
        meeting_metadata=meeting_metadata,
        historical_context=historical_context
    )
    
    # Store in background
    background_tasks.add_task(
        storage_manager.store_meeting,
        meeting_metadata,
        chunks
    )
    
    return {
        "meeting_id": meeting.meeting_id,
        "status": "processing",
        "chunks_extracted": len(chunks),
        "message": "Meeting is being processed in the background"
    }

@app.post("/query", response_model=QueryResponse)
async def query_meetings(query: Query):
    """Query the meeting intelligence system"""
    
    start_time = datetime.now()
    
    # Process query
    result = query_processor.process_query(
        query=query.query,
        user_context=query.user_context
    )
    
    # Calculate response time
    response_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
    
    return QueryResponse(
        answer=result.answer,
        confidence=result.confidence,
        evolution_found=result.evolution_found,
        chunks_used=len(result.chunks_used),
        follow_up_suggestions=result.follow_up_suggestions,
        query_time_ms=response_time_ms
    )

@app.get("/meetings/{meeting_id}/context")
async def get_meeting_context(meeting_id: str):
    """Get full temporal context for a meeting"""
    
    with storage_manager.neo4j_driver.session() as session:
        # Get meeting details
        meeting_query = """
        MATCH (m:Meeting {meetingId: $meeting_id})
        OPTIONAL MATCH (m)<-[:PRECEDED]-(prev:Meeting)
        OPTIONAL MATCH (m)-[:PRECEDED]->(next:Meeting)
        OPTIONAL MATCH (m)<-[:SPOKEN_IN]-(c:Chunk)
        
        RETURN m as meeting,
               prev.meetingId as previous_meeting,
               next.meetingId as next_meeting,
               count(DISTINCT c) as chunk_count
        """
        
        result = session.run(meeting_query, meeting_id=meeting_id).single()
        
        if not result:
            raise HTTPException(404, "Meeting not found")
        
        # Get topics discussed
        topics_query = """
        MATCH (m:Meeting {meetingId: $meeting_id})<-[:SPOKEN_IN]-(c:Chunk)-[:DISCUSSES]->(t:Topic)
        RETURN DISTINCT t.name as topic
        """
        
        topics = [r["topic"] for r in session.run(topics_query, meeting_id=meeting_id)]
        
        return {
            "meeting_id": meeting_id,
            "previous_meeting": result["previous_meeting"],
            "next_meeting": result["next_meeting"],
            "chunk_count": result["chunk_count"],
            "topics_discussed": topics
        }

@app.get("/evolution/{topic}")
async def get_topic_evolution(topic: str):
    """Get the evolution history of a topic"""
    
    with storage_manager.neo4j_driver.session() as session:
        evolution_query = """
        MATCH (t:Topic {name: $topic})
        OPTIONAL MATCH evolution = (t)-[:EVOLVED_INTO|SPLIT_INTO|MERGED_WITH*]->(evolved:Topic)
        
        WITH t, evolved
        MATCH (c:Chunk)-[:DISCUSSES]->(topic)
        WHERE topic = t OR topic = evolved
        
        RETURN topic.name as topic_name,
               c.chunkId as chunk_id,
               c.content as content,
               c.speaker as speaker,
               c.timestamp as timestamp
        ORDER BY c.timestamp
        """
        
        results = session.run(evolution_query, topic=topic).data()
        
        if not results:
            raise HTTPException(404, f"No evolution history found for topic: {topic}")
        
        # Group by topic version
        evolution_timeline = {}
        for result in results:
            topic_name = result["topic_name"]
            if topic_name not in evolution_timeline:
                evolution_timeline[topic_name] = []
            
            evolution_timeline[topic_name].append({
                "chunk_id": result["chunk_id"],
                "content": result["content"],
                "speaker": result["speaker"],
                "timestamp": result["timestamp"]
            })
        
        return {
            "topic": topic,
            "evolution_timeline": evolution_timeline,
            "total_discussions": len(results)
        }

@app.get("/health")
async def health_check():
    """System health check"""
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {}
    }
    
    # Check Weaviate
    try:
        schema = storage_manager.weaviate_client.schema.get()
        health_status["components"]["weaviate"] = {
            "status": "healthy",
            "classes": len(schema.get("classes", []))
        }
    except Exception as e:
        health_status["components"]["weaviate"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    # Check Neo4j
    try:
        with storage_manager.neo4j_driver.session() as session:
            result = session.run("MATCH (n) RETURN count(n) as count LIMIT 1").single()
            health_status["components"]["neo4j"] = {
                "status": "healthy",
                "node_count": result["count"]
            }
    except Exception as e:
        health_status["components"]["neo4j"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    return health_status
```

---

## 4. Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

#### Week 1: Environment Setup & Basic Models
- Set up Docker environment with Weaviate and Neo4j
- Implement basic data models
- Create simple extraction pipeline
- Test with 5 sample meetings

#### Week 2: Temporal Extraction
- Implement TemporalExtractor with LLM prompts
- Add temporal marker detection
- Create reference linking logic
- Validate extraction quality

#### Week 3: Dual Storage
- Implement DualStorageManager
- Create Weaviate schema and indexes
- Build Neo4j graph relationships
- Test storage and retrieval

**Validation Criteria:**
- Successfully extract 10+ chunks per meeting
- Identify temporal markers with 80% accuracy
- Store and retrieve from both databases
- Link meetings temporally in Neo4j

### Phase 2: Query Intelligence (Weeks 4-6)

#### Week 4: Basic Query Processing
- Implement query understanding
- Build semantic search in Weaviate
- Create simple response assembly
- Test with 20 real queries

#### Week 5: Temporal Context
- Implement Neo4j traversal queries
- Build evolution chain tracking
- Add version history retrieval
- Test temporal queries

#### Week 6: Response Assembly
- Implement response formatting
- Add technical content handling
- Create follow-up suggestions
- Optimize query performance

**Validation Criteria:**
- Answer basic queries correctly
- Retrieve temporal context accurately
- Format technical content properly
- Response time < 5 seconds

### Phase 3: Advanced Features (Weeks 7-9)

#### Week 7: Iterative Refinement
- Implement gap detection
- Build refinement loops
- Add context merging
- Test with complex queries

#### Week 8: Technical Extractors
- Add specialized extractors
- Handle data models and schemas
- Extract specifications
- Test with technical meetings

#### Week 9: Evolution Tracking
- Build evolution visualizations
- Add decision progression
- Create pattern detection
- Test evolution queries

**Validation Criteria:**
- Complex queries answered accurately
- Technical content extracted cleanly
- Evolution chains traced correctly
- Confidence scores meaningful

### Phase 4: Production Readiness (Weeks 10-12)

#### Week 10: Performance Optimization
- Add caching layers
- Optimize database queries
- Implement batch processing
- Load test with 100 queries

#### Week 11: Monitoring & Operations
- Add comprehensive logging
- Implement metrics collection
- Create admin dashboards
- Build backup procedures

#### Week 12: Integration & Polish
- Complete API documentation
- Add user authentication
- Implement rate limiting
- Final testing and fixes

**Validation Criteria:**
- Handle 50 concurrent queries
- 99.9% uptime over test period
- Complete API documentation
- All security measures in place

---

## 5. Testing & Validation

### 5.1 Test Data Requirements

```python
class TestDataGenerator:
    """Generate realistic test data for validation"""
    
    def generate_test_meetings(self, count: int = 20) -> List[Dict]:
        """Generate test meetings with temporal relationships"""
        
        meeting_templates = [
            {
                "type": "architecture_review",
                "topics": ["data model", "API design", "performance"],
                "has_technical_content": True,
                "has_decisions": True
            },
            {
                "type": "standup",
                "topics": ["progress updates", "blockers", "next steps"],
                "has_technical_content": False,
                "has_decisions": False
            },
            {
                "type": "planning",
                "topics": ["sprint goals", "task assignment", "timelines"],
                "has_technical_content": True,
                "has_decisions": True
            }
        ]
        
        meetings = []
        
        # Generate meeting sequence with evolution
        for i in range(count):
            template = meeting_templates[i % len(meeting_templates)]
            
            # Create meeting with temporal references
            meeting = self._generate_meeting_from_template(
                template,
                meeting_number=i,
                previous_meetings=meetings[-3:] if meetings else []
            )
            
            meetings.append(meeting)
        
        return meetings
    
    def generate_test_queries(self) -> List[Dict]:
        """Generate test queries with expected results"""
        
        return [
            {
                "query": "What did John ask Sarah to do in yesterday's standup?",
                "type": "specific_interaction",
                "expected_elements": ["speaker:John", "addressed_to:Sarah", "temporal:yesterday"]
            },
            {
                "query": "What's the current version of the user table schema?",
                "type": "technical_content",
                "expected_elements": ["artifact:user_table", "version:latest", "format:table"]
            },
            {
                "query": "How has our API authentication approach evolved?",
                "type": "evolution_tracking",
                "expected_elements": ["topic:API_authentication", "evolution:multiple_versions"]
            },
            {
                "query": "What decisions were made about the migration timeline?",
                "type": "decision_tracking",
                "expected_elements": ["topic:migration", "decision:timeline", "rationale:included"]
            }
        ]
```

### 5.2 Validation Criteria

```python
class SystemValidator:
    """Validate system meets requirements"""
    
    def validate_extraction_quality(self, meetings: List[Dict]) -> Dict[str, float]:
        """Validate extraction meets quality standards"""
        
        metrics = {
            "chunks_per_meeting": [],
            "temporal_markers_found": [],
            "interactions_identified": [],
            "technical_content_extracted": []
        }
        
        for meeting in meetings:
            chunks = self.extractor.extract_temporal_chunks(
                meeting["transcript"],
                meeting["metadata"],
                []
            )
            
            metrics["chunks_per_meeting"].append(len(chunks))
            metrics["temporal_markers_found"].append(
                sum(len(c.temporal_markers) for c in chunks)
            )
            # ... calculate other metrics
        
        return {
            "avg_chunks_per_meeting": np.mean(metrics["chunks_per_meeting"]),
            "temporal_marker_rate": np.mean(metrics["temporal_markers_found"]),
            "extraction_quality_score": self._calculate_quality_score(metrics)
        }
    
    def validate_query_accuracy(self, test_queries: List[Dict]) -> Dict[str, float]:
        """Validate query responses are accurate"""
        
        results = {
            "correct_answers": 0,
            "partial_answers": 0,
            "failed_answers": 0,
            "response_times": []
        }
        
        for test_query in test_queries:
            start_time = datetime.now()
            result = self.query_processor.process_query(test_query["query"])
            response_time = (datetime.now() - start_time).total_seconds()
            
            # Check if response contains expected elements
            accuracy = self._check_response_accuracy(
                result.answer,
                test_query["expected_elements"]
            )
            
            if accuracy == 1.0:
                results["correct_answers"] += 1
            elif accuracy > 0.5:
                results["partial_answers"] += 1
            else:
                results["failed_answers"] += 1
            
            results["response_times"].append(response_time)
        
        total_queries = len(test_queries)
        return {
            "accuracy_rate": results["correct_answers"] / total_queries,
            "partial_rate": results["partial_answers"] / total_queries,
            "failure_rate": results["failed_answers"] / total_queries,
            "avg_response_time": np.mean(results["response_times"]),
            "p95_response_time": np.percentile(results["response_times"], 95)
        }
```

---

## 6. Operational Considerations

### 6.1 Monitoring & Alerting

```yaml
metrics:
  ingestion:
    - name: meetings_processed_per_hour
      type: counter
      alert_threshold: < 5
    - name: chunks_extracted_per_meeting
      type: histogram
      alert_threshold: < 8
    - name: extraction_error_rate
      type: gauge
      alert_threshold: > 0.05
  
  query_performance:
    - name: query_latency_ms
      type: histogram
      buckets: [100, 500, 1000, 5000, 10000]
      alert_threshold: p95 > 5000
    - name: temporal_context_retrieval_ms
      type: histogram
      alert_threshold: p95 > 2000
    - name: confidence_scores
      type: histogram
      alert_threshold: avg < 0.7
  
  storage:
    - name: weaviate_object_count
      type: gauge
    - name: neo4j_node_count
      type: gauge
    - name: neo4j_relationship_count
      type: gauge
    - name: storage_growth_rate_gb_per_day
      type: gauge
      alert_threshold: > 10
  
  llm_usage:
    - name: tokens_used_per_query
      type: histogram
    - name: llm_cost_per_hour
      type: gauge
      alert_threshold: > 50
    - name: llm_error_rate
      type: gauge
      alert_threshold: > 0.01

alerts:
  - name: High Query Latency
    condition: query_latency_ms.p95 > 5000
    severity: warning
    notification: slack
  
  - name: Low Extraction Quality
    condition: chunks_extracted_per_meeting.avg < 8
    severity: warning
    notification: email
  
  - name: LLM Cost Spike
    condition: llm_cost_per_hour > 100
    severity: critical
    notification: pagerduty
```

### 6.2 Backup & Recovery

```python
class BackupManager:
    """Manage backups for both databases"""
    
    def __init__(self, storage_manager: DualStorageManager):
        self.storage = storage_manager
        self.s3_client = boto3.client('s3')
        self.backup_bucket = os.getenv('BACKUP_BUCKET')
    
    def backup_weaviate(self) -> str:
        """Backup Weaviate data to S3"""
        
        # Create backup via Weaviate API
        backup_id = f"weaviate_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        self.storage.weaviate_client.backup.create(
            backup_id=backup_id,
            backend='s3',
            bucket=self.backup_bucket,
            path=f"weaviate/{backup_id}"
        )
        
        return backup_id
    
    def backup_neo4j(self) -> str:
        """Backup Neo4j data"""
        
        backup_id = f"neo4j_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Export to CSV files
        with self.storage.neo4j_driver.session() as session:
            # Export nodes
            nodes_query = """
            CALL apoc.export.csv.query(
                "MATCH (n) RETURN n",
                "nodes.csv",
                {}
            )
            """
            
            # Export relationships
            rels_query = """
            CALL apoc.export.csv.query(
                "MATCH ()-[r]->() RETURN r",
                "relationships.csv",
                {}
            )
            """
            
            session.run(nodes_query)
            session.run(rels_query)
        
        # Upload to S3
        for file in ['nodes.csv', 'relationships.csv']:
            self.s3_client.upload_file(
                file,
                self.backup_bucket,
                f"neo4j/{backup_id}/{file}"
            )
        
        return backup_id
    
    def restore_from_backup(self, backup_id: str):
        """Restore both databases from backup"""
        
        # Restore Weaviate
        self.storage.weaviate_client.backup.restore(
            backup_id=backup_id,
            backend='s3',
            bucket=self.backup_bucket,
            path=f"weaviate/{backup_id}"
        )
        
        # Restore Neo4j
        # Download CSV files from S3
        # Import using LOAD CSV commands
        pass
```

### 6.3 Cost Management

```python
class CostTracker:
    """Track and optimize LLM costs"""
    
    def __init__(self):
        self.cost_per_1k_tokens = {
            "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
            "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
            "text-embedding-3-small": {"input": 0.00002, "output": 0}
        }
        
    def track_query_cost(self, query: str, response: Any, model: str) -> float:
        """Track cost of a single query"""
        
        input_tokens = self._count_tokens(query)
        output_tokens = self._count_tokens(response)
        
        input_cost = (input_tokens / 1000) * self.cost_per_1k_tokens[model]["input"]
        output_cost = (output_tokens / 1000) * self.cost_per_1k_tokens[model]["output"]
        
        total_cost = input_cost + output_cost
        
        # Log to metrics
        self._log_cost_metric(model, total_cost)
        
        return total_cost
    
    def optimize_costs(self, monthly_budget: float) -> Dict[str, Any]:
        """Provide cost optimization recommendations"""
        
        current_run_rate = self._calculate_monthly_run_rate()
        
        if current_run_rate > monthly_budget:
            return {
                "status": "over_budget",
                "current_run_rate": current_run_rate,
                "recommendations": [
                    "Use GPT-3.5 for simple queries",
                    "Implement more aggressive caching",
                    "Batch similar queries together",
                    "Reduce context window for non-critical queries"
                ]
            }
        
        return {
            "status": "within_budget",
            "current_run_rate": current_run_rate,
            "budget_remaining": monthly_budget - current_run_rate
        }
```

---

## 7. Success Validation

### 7.1 System Requirements Validation

<function_calls>
<invoke name="sequential-thinking:sequentialthinking">
<parameter name="nextThoughtNeeded">true
