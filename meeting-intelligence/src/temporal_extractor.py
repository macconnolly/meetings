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
    def __init__(self) -> None:
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

    def extract_temporal_chunks(
        self,
        transcript: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Extract temporally-aware memory chunks from transcript"""
        sections = self._segment_transcript(transcript)
        all_chunks: List[TemporalMemoryChunk] = []
        for section in sections:
            chunks = self._extract_section_chunks(section, meeting_metadata, historical_context)
            enhanced = self._enhance_temporal_links(chunks, historical_context, meeting_metadata)
            all_chunks.extend(enhanced)
        return self._identify_version_chains(all_chunks)

    def _segment_transcript(self, transcript: str) -> List[str]:
        speaker_pattern = r"([A-Z][a-z]+):\s*(.+?)(?=\n[A-Z][a-z]+:|$)"
        matches = re.findall(speaker_pattern, transcript, re.DOTALL)
        if matches:
            sections: List[str] = []
            current = ""
            for i, (speaker, content) in enumerate(matches):
                current += f"{speaker}: {content.strip()}\n"
                if i < len(matches) - 1 and self._is_section_boundary(content, matches[i + 1][1]):
                    sections.append(current.strip())
                    current = ""
            if current:
                sections.append(current.strip())
            return sections
        return [p.strip() for p in transcript.split("\n\n") if p.strip()]

    def _is_section_boundary(self, current: str, next_content: str) -> bool:
        return current.strip().endswith("?") or len(current) > 300

    def _extract_section_chunks(
        self,
        section: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        historical_topics = []
        for ctx in historical_context[-5:]:
            historical_topics.extend([f"{ctx['meeting_date']}: {', '.join(ctx['topics'])}"])
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You extract temporal memory chunks from meeting transcripts."},
                {
                    "role": "user",
                    "content": self.extraction_prompt.format(
                        meeting_context=json.dumps(meeting_metadata, indent=2),
                        historical_topics="\n".join(historical_topics),
                        transcript_section=section,
                    ),
                },
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        try:
            result = json.loads(response.choices[0].message.content)
            chunks_data = result.get("chunks", [])
            chunks: List[TemporalMemoryChunk] = []
            for i, chunk_data in enumerate(chunks_data):
                chunk = TemporalMemoryChunk(
                    chunk_id=f"{meeting_metadata['meeting_id']}_chunk_{i}",
                    meeting_id=meeting_metadata["meeting_id"],
                    timestamp=meeting_metadata["date"],
                    **chunk_data,
                )
                chunks.append(chunk)
            return chunks
        except Exception as e:  # pragma: no cover - extraction errors
            print(f"Error parsing extraction response: {e}")
            return []

    def _enhance_temporal_links(
        self,
        chunks: List[TemporalMemoryChunk],
        historical_context: List[Dict[str, Any]],
        meeting_metadata: Dict[str, Any],
    ) -> List[TemporalMemoryChunk]:
        for chunk in chunks:
            for marker in chunk.temporal_markers:
                if "last week" in marker.lower():
                    last_week_meetings = self._find_meetings_in_range(
                        historical_context, days_back=7, days_forward=0, from_date=meeting_metadata["date"]
                    )
                    for meeting in last_week_meetings:
                        chunk.references_past.append(
                            {
                                "type": "temporal_reference",
                                "reference": f"meeting_{meeting['meeting_id']}",
                                "confidence": 0.8,
                            }
                        )
                elif "previous version" in marker.lower() or "v" in marker:
                    chunk.references_past.append(
                        {"type": "version_reference", "reference": "previous_version", "confidence": 0.9}
                    )
            for topic in chunk.topics_discussed:
                related = self._find_related_historical_chunks(topic, historical_context)
                for rel in related[:3]:
                    chunk.references_past.append(
                        {
                            "type": "topic_continuation",
                            "reference": rel["chunk_id"],
                            "confidence": rel["similarity"],
                        }
                    )
        return chunks

    def _identify_version_chains(self, chunks: List[TemporalMemoryChunk]) -> List[TemporalMemoryChunk]:
        artifact_chunks: Dict[str, List[TemporalMemoryChunk]] = {}
        for chunk in chunks:
            if chunk.version_info and chunk.version_info.get("artifact"):
                artifact = chunk.version_info["artifact"]
                artifact_chunks.setdefault(artifact, []).append(chunk)
        for artifact, chunk_list in artifact_chunks.items():
            sorted_chunks = sorted(chunk_list, key=lambda c: c.version_info.get("version", ""))
            for i in range(len(sorted_chunks) - 1):
                cur = sorted_chunks[i]
                nxt = sorted_chunks[i + 1]
                cur.creates_future.append(
                    {
                        "type": "version_evolution",
                        "description": f"Evolves to {nxt.version_info.get('version')}",
                        "reference": nxt.chunk_id,
                    }
                )
                nxt.references_past.append(
                    {"type": "version_evolution", "reference": cur.chunk_id, "confidence": 1.0}
                )
        return chunks

    # Helper stubs
    def _find_meetings_in_range(self, historical: List[Dict[str, Any]], days_back: int, days_forward: int, from_date: datetime) -> List[Dict[str, Any]]:
        return historical

    def _find_related_historical_chunks(self, topic: str, historical: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return []
