from __future__ import annotations

import json
import re
import math
from typing import List, Dict, Optional, Any, Tuple, Set
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import asyncio
from concurrent.futures import ThreadPoolExecutor
import numpy as np

from openai import AsyncOpenAI
import anthropic

from ..models.memory_objects import (
    MemoryChunk, MemoryType, InteractionType, 
    TemporalReference, VersionInfo, StructuredData,
    Person, Meeting
)


@dataclass
class ExtractionContext:
    """Context for memory extraction."""
    meeting: Meeting
    historical_topics: List[Dict[str, Any]]
    previous_meetings: List[Dict[str, Any]]
    known_entities: Dict[str, List[str]]  # type -> list of entities
    

@dataclass 
class TemporalConfidence:
    """Confidence that decays over time but can be reinforced."""
    initial_confidence: float
    last_reinforced: datetime
    reinforcement_count: int = 0
    
    def get_current_confidence(self) -> float:
        """Calculate current confidence with temporal decay."""
        days_elapsed = (datetime.utcnow() - self.last_reinforced).days
        decay_factor = math.exp(-0.1 * days_elapsed)
        return self.initial_confidence * decay_factor
        
    def reinforce(self, evidence_strength: float = 0.1):
        """Reinforce confidence with new evidence."""
        self.initial_confidence = min(1.0, self.initial_confidence + evidence_strength)
        self.last_reinforced = datetime.utcnow()
        self.reinforcement_count += 1


@dataclass
class ImplicitReference:
    """An implicit reference that needs resolution."""
    text: str
    reference_type: str  # "temporal", "person", "artifact", "decision"
    context_window: str
    possible_targets: List[Dict[str, Any]] = field(default_factory=list)
    

class TemporalExtractor:
    """Advanced temporal-aware memory extraction with unique capabilities."""
    
    def __init__(self, openai_api_key: Optional[str] = None, anthropic_api_key: Optional[str] = None):
        self.openai_client = AsyncOpenAI(api_key=openai_api_key) if openai_api_key else None
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=anthropic_api_key) if anthropic_api_key else None
        
        # Caches for efficiency
        self.semantic_cache = {}
        self.reference_resolution_cache = {}
        
        # Patterns for temporal detection
        self.temporal_patterns = {
            "past_reference": [
                r"(last|previous)\s+(week|month|meeting|session)",
                r"(as|like)\s+we\s+(discussed|mentioned|decided)",
                r"(previously|earlier|before)",
                r"(used to|originally|initially)"
            ],
            "future_reference": [
                r"(next|upcoming|future)\s+(week|month|meeting|sprint)",
                r"(will|going to|plan to|intend to)",
                r"(by|until|before)\s+\w+day",
                r"(deadline|due date|target date)"
            ],
            "version_reference": [
                r"v\d+(\.\d+)?",
                r"version\s+\d+",
                r"(updated|revised|new)\s+version",
                r"(replaces|supersedes|deprecates)"
            ],
            "evolution_marker": [
                r"(evolved|changed|transformed)\s+(from|into)",
                r"(builds on|extends|enhances)",
                r"(replaces|supersedes|deprecates)",
                r"(updated|revised|modified)"
            ]
        }
        
        self.extraction_prompt = """You are analyzing a meeting transcript to extract temporal memory chunks with deep contextual understanding.

Meeting Context:
{meeting_context}

Historical Context (Previous Meetings):
{historical_topics}

Transcript Section:
{transcript_section}

Extract memory chunks with these advanced capabilities:

1. **Interaction Analysis**:
   - Identify speaker and ALL people addressed (directly or implicitly)
   - Classify interaction type precisely: request, question, answer, decision, commitment, update, explanation
   - Capture the exact content and full surrounding context
   - Score importance (1-10) based on: decision impact, commitment creation, problem solving, strategic value

2. **Temporal Intelligence**:
   - Identify ALL temporal references (explicit and implicit)
   - Detect version evolution ("v2 of the design", "updated approach")
   - Find status transitions ("now complete", "still blocked")
   - Identify evolution markers ("building on", "replacing", "extends")
   - Extract deadlines and time commitments

3. **Implicit Reference Resolution**:
   - Mark implicit references that need resolution: "that issue" → what issue?
   - "The decision we made" → which decision?
   - "What John suggested" → what specific suggestion?
   - "The current approach" → what approach?

4. **Structured Content Extraction**:
   - Tables, schemas, data models, API specs
   - Technical specifications and requirements
   - Process descriptions and workflows
   - Keep exact formatting for technical content

5. **Semantic Evolution Tracking**:
   - Note when terminology changes: "schema" → "data model"
   - Track concept evolution: "simple cache" → "distributed cache" → "Redis cluster"
   - Identify when old terms are deprecated

6. **Confidence Scoring**:
   - Rate extraction confidence (0.0-1.0)
   - Higher confidence for: explicit statements, repeated confirmations, formal decisions
   - Lower confidence for: ambiguous references, conflicting information, uncertain phrasing

Format each chunk as JSON with this structure:
{
    "speaker": "Name",
    "addressed_to": ["Name1", "Name2"],
    "interaction_type": "request|question|answer|decision|commitment|update|explanation",
    "memory_type": "Decision|Action|Topic|Question|Commitment|Reference|Risk|Temporal|Request|Technical",
    "content": "The main content",
    "full_context": "Include 2-3 sentences before and after for context",
    "temporal_markers": ["last week", "v2", "updated version", "by Friday"],
    "implicit_references": [
        {
            "text": "that issue",
            "type": "artifact|decision|person|event",
            "needs_resolution": true
        }
    ],
    "topics_discussed": ["testing framework", "data model", "performance"],
    "entities_mentioned": ["PersonName", "SystemName", "ProjectName"],
    "structured_data": {
        "type": "table|schema|specification|model|api|process",
        "content": "formatted content preserving structure",
        "format": "markdown|json|yaml|sql",
        "title": "descriptive title"
    },
    "version_info": {
        "artifact": "what this is about",
        "version": "current version",
        "previous_version": "if mentioned",
        "changes": ["what changed"]
    },
    "evolution_markers": ["builds on", "replaces", "extends"],
    "status_markers": ["complete", "in progress", "blocked"],
    "importance_score": 7,
    "confidence": 0.85,
    "references_past": [
        {
            "type": "explicit|implicit",
            "reference": "last week's decision about caching",
            "confidence": 0.9
        }
    ],
    "creates_future": [
        {
            "type": "action|commitment|follow_up|deadline",
            "description": "implement the new schema",
            "owner": "John",
            "due": "2024-01-15"
        }
    ],
    "semantic_evolution": {
        "term_changes": {"old_term": "new_term"},
        "concept_evolution": "how the concept has evolved"
    }
}

Extract 3-8 chunks per transcript section. Focus on high-value interactions that show temporal evolution, commitments, decisions, or technical specifications.
"""

    async def extract_temporal_chunks(self,
                                    transcript: str,
                                    meeting: Meeting,
                                    historical_context: List[Dict[str, Any]]) -> List[MemoryChunk]:
        """Extract memory chunks with advanced temporal awareness."""
        
        # Build extraction context
        context = ExtractionContext(
            meeting=meeting,
            historical_topics=self._summarize_historical_topics(historical_context),
            previous_meetings=self._get_recent_meetings(historical_context),
            known_entities=self._extract_known_entities(historical_context)
        )
        
        # Segment transcript intelligently
        segments = self._segment_transcript(transcript)
        
        # Extract chunks in parallel for efficiency
        tasks = []
        for segment in segments:
            task = self._extract_segment_chunks(segment, context)
            tasks.append(task)
            
        segment_results = await asyncio.gather(*tasks)
        
        # Flatten results
        all_chunks = []
        for chunks in segment_results:
            all_chunks.extend(chunks)
            
        # Post-processing
        all_chunks = await self._resolve_implicit_references(all_chunks, context)
        all_chunks = self._detect_semantic_drift(all_chunks, historical_context)
        all_chunks = self._identify_version_chains(all_chunks)
        all_chunks = self._calculate_temporal_confidence(all_chunks)
        
        return all_chunks
    
    def _segment_transcript(self, transcript: str) -> List[str]:
        """Intelligently segment transcript into coherent sections."""
        lines = transcript.strip().split('\n')
        segments = []
        current_segment = []
        current_speaker = None
        
        for line in lines:
            # Simple pattern - can be made more sophisticated
            speaker_match = re.match(r'^(\w+):\s*(.+)$', line)
            
            if speaker_match:
                speaker = speaker_match.group(1)
                content = speaker_match.group(2)
                
                # Start new segment if speaker changes and we have content
                if current_speaker and speaker != current_speaker and len(current_segment) > 3:
                    segments.append('\n'.join(current_segment))
                    current_segment = [line]
                    current_speaker = speaker
                else:
                    current_segment.append(line)
                    current_speaker = speaker
            else:
                current_segment.append(line)
                
        # Add final segment
        if current_segment:
            segments.append('\n'.join(current_segment))
            
        return segments
    
    async def _extract_segment_chunks(self, 
                                     segment: str, 
                                     context: ExtractionContext) -> List[MemoryChunk]:
        """Extract chunks from a transcript segment."""
        
        # Prepare the prompt
        prompt = self.extraction_prompt.format(
            meeting_context=json.dumps({
                "meeting_id": context.meeting.meeting_id,
                "title": context.meeting.title,
                "date": context.meeting.date.isoformat(),
                "participants": [p.name for p in context.meeting.participants],
                "type": context.meeting.meeting_type
            }),
            historical_topics=json.dumps(context.historical_topics),
            transcript_section=segment
        )
        
        # Call LLM
        if self.openai_client:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": "You are an expert at extracting temporal meeting intelligence."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            extracted_data = json.loads(response.choices[0].message.content)
        else:
            # Fallback for testing without LLM
            extracted_data = self._mock_extraction(segment)
            
        # Convert to MemoryChunk objects
        chunks = []
        for chunk_data in extracted_data.get("chunks", []):
            chunk = self._create_memory_chunk(chunk_data, context.meeting)
            chunks.append(chunk)
            
        return chunks
    
    def _create_memory_chunk(self, data: Dict[str, Any], meeting: Meeting) -> MemoryChunk:
        """Create a MemoryChunk from extracted data."""
        
        # Parse temporal references
        temporal_refs = []
        for ref_text in data.get("temporal_markers", []):
            temporal_refs.append(TemporalReference(
                type=self._classify_temporal_reference(ref_text),
                text=ref_text,
                confidence=0.8
            ))
            
        # Parse version info
        version_info = None
        if data.get("version_info"):
            vi = data["version_info"]
            version_info = VersionInfo(
                artifact=vi.get("artifact", ""),
                version=vi.get("version", ""),
                previous_version=vi.get("previous_version"),
                changes=vi.get("changes", [])
            )
            
        # Parse structured data
        structured_data = None
        if data.get("structured_data"):
            sd = data["structured_data"]
            structured_data = StructuredData(
                type=sd.get("type", ""),
                content=sd.get("content", ""),
                format=sd.get("format", "markdown"),
                title=sd.get("title")
            )
            
        # Create the chunk
        chunk = MemoryChunk(
            meeting_id=meeting.meeting_id,
            timestamp=meeting.date,  # Would be more precise with actual timestamp
            speaker=data.get("speaker", "Unknown"),
            addressed_to=data.get("addressed_to", []),
            content=data.get("content", ""),
            full_context=data.get("full_context", ""),
            memory_type=MemoryType(data.get("memory_type", "Topic")),
            interaction_type=InteractionType(data.get("interaction_type", "discussion")),
            topics_discussed=data.get("topics_discussed", []),
            entities_mentioned=data.get("entities_mentioned", []),
            temporal_markers=data.get("temporal_markers", []),
            temporal_references=temporal_refs,
            references_past=data.get("references_past", []),
            creates_future=data.get("creates_future", []),
            version_info=version_info,
            evolution_markers=data.get("evolution_markers", []),
            structured_data=structured_data,
            importance_score=data.get("importance_score", 5.0),
            confidence=data.get("confidence", 0.8),
            status_markers=data.get("status_markers", [])
        )
        
        return chunk
    
    def _classify_temporal_reference(self, ref_text: str) -> str:
        """Classify a temporal reference."""
        ref_lower = ref_text.lower()
        
        if any(pattern in ref_lower for pattern in ["last", "previous", "earlier", "before"]):
            return "past_reference"
        elif any(pattern in ref_lower for pattern in ["next", "upcoming", "will", "future"]):
            return "future_reference"
        elif any(pattern in ref_lower for pattern in ["deadline", "due", "by"]):
            return "deadline"
        else:
            return "temporal_marker"
    
    async def _resolve_implicit_references(self, 
                                         chunks: List[MemoryChunk], 
                                         context: ExtractionContext) -> List[MemoryChunk]:
        """Resolve implicit references across chunks."""
        
        # Build reference index
        reference_index = self._build_reference_index(chunks, context)
        
        # Resolve each chunk's implicit references
        for chunk in chunks:
            implicit_refs = self._extract_implicit_references(chunk)
            
            for ref in implicit_refs:
                candidates = self._find_reference_candidates(ref, reference_index, chunk)
                
                if candidates:
                    best_match = self._score_reference_candidates(ref, candidates, chunk)
                    
                    if best_match and best_match["score"] > 0.7:
                        # Add to references_past
                        chunk.references_past.append({
                            "type": "implicit",
                            "reference": ref.text,
                            "resolved_to": best_match["candidate"]["id"],
                            "confidence": best_match["score"]
                        })
                        
        return chunks
    
    def _extract_implicit_references(self, chunk: MemoryChunk) -> List[ImplicitReference]:
        """Extract implicit references from chunk content."""
        implicit_refs = []
        
        # Patterns for implicit references
        patterns = [
            (r"(that|the)\s+(issue|problem|bug)", "artifact"),
            (r"(that|the)\s+(decision|choice)", "decision"),
            (r"what\s+(\w+)\s+(said|mentioned|suggested)", "person"),
            (r"(the|that)\s+(meeting|discussion)", "event"),
            (r"(the|our)\s+(approach|solution|plan)", "artifact"),
            (r"(the|that)\s+(requirement|spec|specification)", "artifact")
        ]
        
        for pattern, ref_type in patterns:
            matches = re.finditer(pattern, chunk.content, re.IGNORECASE)
            for match in matches:
                implicit_refs.append(ImplicitReference(
                    text=match.group(0),
                    reference_type=ref_type,
                    context_window=chunk.content[max(0, match.start()-50):match.end()+50]
                ))
                
        return implicit_refs
    
    def _detect_semantic_drift(self, 
                              chunks: List[MemoryChunk], 
                              historical_context: List[Dict[str, Any]]) -> List[MemoryChunk]:
        """Detect and annotate semantic drift in terminology."""
        
        # Build historical term usage
        historical_terms = self._build_historical_term_map(historical_context)
        
        for chunk in chunks:
            # Check each entity/topic for semantic drift
            drift_detected = {}
            
            for term in chunk.topics_discussed + chunk.entities_mentioned:
                historical_usage = historical_terms.get(term.lower(), [])
                
                if historical_usage:
                    # Check if usage has changed
                    current_context = f"{chunk.speaker}: {chunk.content}"
                    
                    if self._has_semantic_drift(term, current_context, historical_usage):
                        # Find the likely current equivalent
                        equivalent = self._find_semantic_equivalent(term, current_context, historical_terms)
                        if equivalent:
                            drift_detected[term] = equivalent
                            
            # Add drift information to chunk
            if drift_detected:
                chunk.metadata = chunk.metadata or {}
                chunk.metadata["semantic_drift"] = drift_detected
                
        return chunks
    
    def _calculate_temporal_confidence(self, chunks: List[MemoryChunk]) -> List[MemoryChunk]:
        """Calculate temporal confidence for relationships."""
        
        for chunk in chunks:
            # Create temporal confidence for past references
            for ref in chunk.references_past:
                if "confidence" in ref:
                    ref["temporal_confidence"] = TemporalConfidence(
                        initial_confidence=ref["confidence"],
                        last_reinforced=datetime.utcnow()
                    )
                    
            # Adjust confidence based on temporal distance
            for ref in chunk.temporal_references:
                if ref.target_date:
                    days_diff = abs((datetime.utcnow() - ref.target_date).days)
                    # Confidence decreases with temporal distance
                    ref.confidence *= math.exp(-0.01 * days_diff)
                    
        return chunks
    
    def _summarize_historical_topics(self, historical_context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Summarize historical topics for context."""
        topics = []
        
        for meeting in historical_context[-10:]:  # Last 10 meetings
            topics.append({
                "meeting_id": meeting.get("meeting_id"),
                "date": meeting.get("date"),
                "main_topics": meeting.get("topics", []),
                "key_decisions": meeting.get("decisions", []),
                "open_items": meeting.get("open_items", [])
            })
            
        return topics
    
    def _get_recent_meetings(self, historical_context: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get recent meetings for reference."""
        return historical_context[-5:] if historical_context else []
    
    def _extract_known_entities(self, historical_context: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Extract known entities from historical context."""
        entities = {
            "people": set(),
            "systems": set(),
            "projects": set(),
            "artifacts": set()
        }
        
        for meeting in historical_context:
            entities["people"].update(meeting.get("participants", []))
            entities["systems"].update(meeting.get("systems_mentioned", []))
            entities["projects"].update(meeting.get("projects", []))
            entities["artifacts"].update(meeting.get("artifacts", []))
            
        return {k: list(v) for k, v in entities.items()}
    
    def _identify_version_chains(self, chunks: List[MemoryChunk]) -> List[MemoryChunk]:
        """Identify version evolution chains across chunks."""
        
        # Group chunks by artifact
        artifact_chunks = {}
        for chunk in chunks:
            if chunk.version_info:
                artifact = chunk.version_info.artifact
                if artifact not in artifact_chunks:
                    artifact_chunks[artifact] = []
                artifact_chunks[artifact].append(chunk)
                
        # Build version chains
        for artifact, version_chunks in artifact_chunks.items():
            # Sort by version
            version_chunks.sort(key=lambda c: c.version_info.version if c.version_info else "")
            
            # Link versions
            for i in range(len(version_chunks) - 1):
                current = version_chunks[i]
                next_version = version_chunks[i + 1]
                
                # Add forward reference
                current.creates_future.append({
                    "type": "version_evolution",
                    "description": f"Evolves to {next_version.version_info.version}",
                    "target_chunk_id": next_version.chunk_id
                })
                
                # Add backward reference
                next_version.references_past.append({
                    "type": "version_evolution",
                    "reference": f"Previous version {current.version_info.version}",
                    "target_chunk_id": current.chunk_id,
                    "confidence": 0.95
                })
                
        return chunks
    
    def _build_reference_index(self, 
                              chunks: List[MemoryChunk], 
                              context: ExtractionContext) -> Dict[str, List[Dict[str, Any]]]:
        """Build an index of referenceable items."""
        index = {
            "decisions": [],
            "artifacts": [],
            "people": [],
            "events": []
        }
        
        for chunk in chunks:
            if chunk.memory_type == MemoryType.DECISION:
                index["decisions"].append({
                    "id": chunk.chunk_id,
                    "content": chunk.content,
                    "speaker": chunk.speaker,
                    "timestamp": chunk.timestamp
                })
                
            if chunk.memory_type == MemoryType.TECHNICAL and chunk.structured_data:
                index["artifacts"].append({
                    "id": chunk.chunk_id,
                    "title": chunk.structured_data.title or "Unnamed",
                    "type": chunk.structured_data.type,
                    "content_preview": chunk.content[:100]
                })
                
        # Add known entities
        for person in context.meeting.participants:
            index["people"].append({
                "id": person.name,
                "name": person.name,
                "role": person.role
            })
            
        return index
    
    def _find_reference_candidates(self, 
                                  ref: ImplicitReference, 
                                  index: Dict[str, List[Dict]], 
                                  chunk: MemoryChunk) -> List[Dict[str, Any]]:
        """Find candidates for an implicit reference."""
        candidates = []
        
        # Get candidates based on reference type
        if ref.reference_type in index:
            # Filter by temporal proximity
            for candidate in index[ref.reference_type]:
                if "timestamp" in candidate:
                    # Prefer recent references
                    time_diff = (chunk.timestamp - candidate["timestamp"]).total_seconds() / 3600
                    if time_diff < 168:  # Within a week
                        candidates.append(candidate)
                else:
                    candidates.append(candidate)
                    
        return candidates[:5]  # Top 5 candidates
    
    def _score_reference_candidates(self, 
                                   ref: ImplicitReference, 
                                   candidates: List[Dict], 
                                   chunk: MemoryChunk) -> Optional[Dict[str, Any]]:
        """Score reference candidates to find best match."""
        if not candidates:
            return None
            
        scores = []
        
        for candidate in candidates:
            score = 0.0
            
            # Semantic similarity (would use embeddings in production)
            if "content" in candidate:
                # Simple keyword overlap for now
                ref_words = set(ref.context_window.lower().split())
                candidate_words = set(candidate["content"].lower().split())
                overlap = len(ref_words & candidate_words) / len(ref_words | candidate_words)
                score += overlap * 0.5
                
            # Temporal proximity
            if "timestamp" in candidate:
                time_diff = abs((chunk.timestamp - candidate["timestamp"]).total_seconds() / 3600)
                proximity_score = math.exp(-0.01 * time_diff)
                score += proximity_score * 0.3
                
            # Speaker relevance
            if "speaker" in candidate and candidate["speaker"] == chunk.speaker:
                score += 0.2
                
            scores.append({"candidate": candidate, "score": score})
            
        # Return best match
        return max(scores, key=lambda x: x["score"])
    
    def _build_historical_term_map(self, historical_context: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """Build a map of historical term usage."""
        term_map = {}
        
        for meeting in historical_context:
            for chunk in meeting.get("chunks", []):
                for term in chunk.get("topics", []) + chunk.get("entities", []):
                    term_lower = term.lower()
                    if term_lower not in term_map:
                        term_map[term_lower] = []
                        
                    term_map[term_lower].append({
                        "context": chunk.get("content", ""),
                        "date": meeting.get("date"),
                        "meeting_id": meeting.get("meeting_id")
                    })
                    
        return term_map
    
    def _has_semantic_drift(self, term: str, current_context: str, historical_usage: List[Dict]) -> bool:
        """Check if a term's usage has semantically drifted."""
        # In production, this would use embeddings to compare contexts
        # For now, simple heuristic
        
        if len(historical_usage) < 3:
            return False
            
        # Check if the term appears with different surrounding words
        current_words = set(current_context.lower().split())
        
        historical_word_sets = []
        for usage in historical_usage[-5:]:
            historical_word_sets.append(set(usage["context"].lower().split()))
            
        # Calculate average overlap
        overlaps = []
        for hist_words in historical_word_sets:
            overlap = len(current_words & hist_words) / len(current_words | hist_words)
            overlaps.append(overlap)
            
        avg_overlap = sum(overlaps) / len(overlaps)
        
        # If overlap is low, semantic drift likely occurred
        return avg_overlap < 0.3
    
    def _find_semantic_equivalent(self, 
                                 term: str, 
                                 current_context: str, 
                                 historical_terms: Dict[str, List[Dict]]) -> Optional[str]:
        """Find the semantic equivalent of a drifted term."""
        # In production, this would use embeddings to find similar terms
        # For now, return None
        return None
    
    def _mock_extraction(self, segment: str) -> Dict[str, Any]:
        """Mock extraction for testing without LLM."""
        return {
            "chunks": [{
                "speaker": "John",
                "addressed_to": ["Sarah", "Tom"],
                "interaction_type": "discussion",
                "memory_type": "Topic",
                "content": "We need to update the data model to v3",
                "full_context": segment[:200],
                "temporal_markers": ["update", "v3"],
                "topics_discussed": ["data model"],
                "entities_mentioned": ["John", "Sarah", "Tom"],
                "importance_score": 7,
                "confidence": 0.85
            }]
        }