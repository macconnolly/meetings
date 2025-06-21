"""Temporal extraction utilities."""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import List, Dict, Optional, Any

from openai import OpenAI

from ..models.temporal_memory import TemporalMemoryChunk


class TemporalExtractor:
    """Extract temporally aware memory chunks from transcripts."""

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

Return output as JSON with a `chunks` list.
"""

    def extract_temporal_chunks(
        self,
        transcript: str,
        meeting_metadata: Dict[str, Any],
        historical_context: List[Dict[str, Any]],
    ) -> List[TemporalMemoryChunk]:
        """Extract temporal chunks from a transcript."""

        sections = self._segment_transcript(transcript)
        all_chunks: List[TemporalMemoryChunk] = []
        for section in sections:
            chunks = self._extract_section_chunks(
                section, meeting_metadata, historical_context
            )
            all_chunks.extend(chunks)
        return all_chunks

    def _segment_transcript(self, transcript: str) -> List[str]:
        """Segment transcript using speaker labels as hints."""
        pattern = r"([A-Z][a-z]+):\s*(.+?)(?=\n[A-Z][a-z]+:|$)"
        matches = re.findall(pattern, transcript, re.DOTALL)
        if not matches:
            return [p.strip() for p in transcript.split("\n\n") if p.strip()]
        sections = []
        current = ""
        for idx, (speaker, content) in enumerate(matches):
            current += f"{speaker}: {content.strip()}\n"
            if idx < len(matches) - 1 and content.strip().endswith("."):
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
        """Call the LLM to extract chunks for a section."""
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
            data = json.loads(response.choices[0].message.content)
        except Exception:
            return []
        chunks = []
        for idx, chunk_data in enumerate(data.get("chunks", [])):
            chunk = TemporalMemoryChunk(
                chunk_id=f"{meeting_metadata['meeting_id']}_chunk_{idx}",
                meeting_id=meeting_metadata["meeting_id"],
                timestamp=meeting_metadata["date"],
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
            chunks.append(chunk)
        return chunks
