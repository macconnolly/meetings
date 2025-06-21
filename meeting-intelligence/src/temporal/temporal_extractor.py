from __future__ import annotations

"""Temporal extraction pipeline for the Meeting Intelligence System.

This module implements the :class:`TemporalExtractor` used to turn meeting
transcripts into temporally aware memory chunks.  The implementation follows
the specification from the `Temporal Meeting Intelligence System - Complete
Requirements & Implementation Guide v3.0` document.

The extractor segments transcripts, calls OpenAI to perform structured
extraction and enriches the results with temporal links.

The class is intentionally lightweight – many helper methods are simplified
placeholders so the module can run in environments without all production
dependencies.  It can be expanded with the full logic when the rest of the
system is implemented.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional
import json
import re

try:  # OpenAI is optional for tests
    from openai import OpenAI
except Exception:  # pragma: no cover - openai may not be installed
    OpenAI = None  # type: ignore


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
    """Extract temporally aware chunks from meeting transcripts."""

    def __init__(self) -> None:
        self.client = OpenAI() if OpenAI else None
        self.extraction_prompt = """
You are analyzing a meeting transcript to extract temporal memory chunks.

Meeting Context:
{meeting_context}

Previous Meeting Topics (for temporal linking):
{historical_topics}

Transcript Section:
{transcript_section}

Return a JSON object with a ``chunks`` field containing a list of extracted
memory chunks as described in the system requirements.
"""

    def extract_temporal_chunks(
        self,
        transcript: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Extract :class:`TemporalMemoryChunk` instances from ``transcript``."""

        sections = self._segment_transcript(transcript)
        all_chunks: List[TemporalMemoryChunk] = []
        for section in sections:
            chunks = self._extract_section_chunks(
                section, meeting_metadata, historical_context
            )
            all_chunks.extend(chunks)
        return all_chunks

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------
    def _segment_transcript(self, transcript: str) -> List[str]:
        """Simple speaker based segmentation."""

        pattern = r"([A-Z][a-z]+):\s*(.+?)(?=\n[A-Z][a-z]+:|$)"
        matches = re.findall(pattern, transcript, re.DOTALL)
        if not matches:
            return [transcript]

        sections: List[str] = []
        current = []
        for speaker, content in matches:
            current.append(f"{speaker}: {content.strip()}")
        if current:
            sections.append("\n".join(current))
        return sections

    def _extract_section_chunks(
        self,
        section: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Call the LLM to extract structured chunks from one section."""

        if not self.client:
            # In test environments without OpenAI we return a simple stub
            chunk = TemporalMemoryChunk(
                chunk_id=f"{meeting_metadata['meeting_id']}_0",
                meeting_id=meeting_metadata["meeting_id"],
                timestamp=meeting_metadata.get("date", datetime.utcnow()),
                speaker="unknown",
                content=section.strip(),
            )
            return [chunk]

        historical_topics = [
            f"{ctx.get('meeting_date')}: {', '.join(ctx.get('topics', []))}"
            for ctx in historical_context[-5:]
        ]

        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You extract temporal memory chunks from meeting transcripts.",
                },
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
            data = result.get("chunks", [])
        except Exception:  # pragma: no cover - network/parse issues
            data = []

        chunks: List[TemporalMemoryChunk] = []
        for idx, chunk_data in enumerate(data):
            chunks.append(
                TemporalMemoryChunk(
                    chunk_id=f"{meeting_metadata['meeting_id']}_chunk_{idx}",
                    meeting_id=meeting_metadata["meeting_id"],
                    timestamp=meeting_metadata.get("date", datetime.utcnow()),
                    speaker=chunk_data.get("speaker", ""),
                    addressed_to=chunk_data.get("addressed_to", []),
                    interaction_type=chunk_data.get("interaction_type", "discussion"),
                    content=chunk_data.get("content", ""),
                    full_context=chunk_data.get("full_context", ""),
                    structured_data=chunk_data.get("structured_data"),
                    temporal_markers=chunk_data.get("temporal_markers", []),
                    topics_discussed=chunk_data.get("topics_discussed", []),
                    entities_mentioned=chunk_data.get("entities_mentioned", []),
                    version_info=chunk_data.get("version_info"),
                    importance_score=chunk_data.get("importance_score", 5.0),
                    references_past=chunk_data.get("references_past", []),
                    creates_future=chunk_data.get("creates_future", []),
                )
            )
        return chunks
