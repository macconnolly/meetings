from __future__ import annotations

"""Temporal extraction module.
Derived from the Temporal Meeting Intelligence System specification v3.0.
This module provides classes to extract temporally aware memory chunks
from meeting transcripts.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
import json
import re

from openai import OpenAI


@dataclass
class TemporalMemoryChunk:
    """Memory chunk with temporal awareness."""

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
    """Extract temporally aware chunks from transcripts using an LLM."""

    def __init__(self) -> None:
        self.client = OpenAI()
        self.extraction_prompt = (
            """
You are analyzing a meeting transcript to extract temporal memory chunks.

Meeting Context:
{meeting_context}

Previous Meeting Topics (for temporal linking):
{historical_topics}

Transcript Section:
{transcript_section}

Extract detailed memory chunks that capture interaction details,
temporal awareness, structured content and linking information.
Format the result as JSON with a top level 'chunks' array.
"""
        )

    def extract_temporal_chunks(
        self,
        transcript: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Extract temporally aware memory chunks from transcript."""
        sections = self._segment_transcript(transcript)
        all_chunks: List[TemporalMemoryChunk] = []
        for section in sections:
            chunks = self._extract_section_chunks(section, meeting_metadata, historical_context)
            enhanced = self._enhance_temporal_links(chunks, historical_context, meeting_metadata)
            all_chunks.extend(enhanced)
        return self._identify_version_chains(all_chunks)

    def _segment_transcript(self, transcript: str) -> List[str]:
        """Segment transcript into sections based on speaker cues."""
        pattern = r"([A-Z][a-z]+):\s*(.+?)(?=\n[A-Z][a-z]+:|$)"
        matches = re.findall(pattern, transcript, re.DOTALL)
        if not matches:
            return [p.strip() for p in transcript.split("\n\n") if p.strip()]

        sections: List[str] = []
        current = ""
        for i, (speaker, content) in enumerate(matches):
            current += f"{speaker}: {content.strip()}\n"
            if i < len(matches) - 1 and content.strip().endswith("."):
                sections.append(current.strip())
                current = ""
        if current:
            sections.append(current.strip())
        return sections

    def _extract_section_chunks(
        self,
        section: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Call the LLM to extract chunks from a section."""
        historical_topics = [
            f"{ctx['meeting_date']}: {', '.join(ctx['topics'])}"
            for ctx in historical_context[-5:]
        ]
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
        except Exception as exc:  # pragma: no cover - placeholder
            print(f"Error parsing extraction response: {exc}")
            return []

    def _enhance_temporal_links(
        self,
        chunks: List[TemporalMemoryChunk],
        historical_context: List[Dict[str, Any]],
        meeting_metadata: Dict[str, Any],
    ) -> List[TemporalMemoryChunk]:
        """Add temporal linking information to chunks."""
        for chunk in chunks:
            for marker in chunk.temporal_markers:
                if "last week" in marker.lower():
                    related = self._find_meetings_in_range(
                        historical_context,
                        days_back=7,
                        days_forward=0,
                        from_date=meeting_metadata["date"],
                    )
                    for meeting in related:
                        chunk.references_past.append(
                            {
                                "type": "temporal_reference",
                                "reference": f"meeting_{meeting['meeting_id']}",
                                "confidence": 0.8,
                            }
                        )
                elif "previous version" in marker.lower() or "v" in marker:
                    chunk.references_past.append(
                        {
                            "type": "version_reference",
                            "reference": "previous_version",
                            "confidence": 0.9,
                        }
                    )
        return chunks

    def _find_meetings_in_range(
        self,
        history: List[Dict[str, Any]],
        days_back: int,
        days_forward: int,
        from_date: datetime,
    ) -> List[Dict[str, Any]]:
        """Helper to filter historical meetings in a date range."""
        start = from_date - timedelta(days=days_back)
        end = from_date + timedelta(days=days_forward)
        return [m for m in history if start <= m["date"] <= end]

    def _find_related_historical_chunks(
        self, topic: str, historical_context: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Return related chunks from historical context matching a topic."""
        related: List[Dict[str, Any]] = []
        for meeting in historical_context:
            for chunk in meeting.get("chunks", []):
                if topic.lower() in [t.lower() for t in chunk.get("topics", [])]:
                    related.append({
                        "chunk_id": chunk.get("chunk_id", ""),
                        "similarity": 0.7,  # Placeholder score
                    })
        return related

    def _identify_version_chains(self, chunks: List[TemporalMemoryChunk]) -> List[TemporalMemoryChunk]:
        """Link chunks that describe version evolution."""
        artifact_chunks: Dict[str, List[TemporalMemoryChunk]] = {}
        for chunk in chunks:
            info = chunk.version_info
            if info and info.get("artifact"):
                artifact_chunks.setdefault(info["artifact"], []).append(chunk)

        for artifact, c_list in artifact_chunks.items():
            sorted_chunks = sorted(c_list, key=lambda c: c.version_info.get("version", ""))
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
                    {
                        "type": "version_evolution",
                        "reference": cur.chunk_id,
                        "confidence": 1.0,
                    }
                )
        return chunks
