from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from openai import OpenAI
from pydantic import ValidationError

from ..models.memory_objects import MemoryObject


class MemoryFactory:
    """Extract structured memories from meeting transcripts using OpenAI."""

    PROMPT_TEMPLATE: str = (
        "You are an assistant that extracts key memory objects from a meeting "
        "transcript. Using the provided metadata and transcript, identify between "
        "8 and 15 short memories capturing decisions, actions, topics, questions, "
        "commitments, references, risks, or temporal notes. Each memory should "
        "include `type`, `content`, a `confidence` score between 0 and 1, and an "
        "optional `related_to` list. Respond only with a JSON array of objects.\n\n"
        "Meeting metadata:\n{metadata}\n\nTranscript:\n{transcript}"
    )

    def __init__(self, client: Optional[OpenAI] = None) -> None:
        self.client = client or OpenAI()

    def create_memories(
        self, text: str, meeting_id: str, metadata: Optional[Dict[str, Any]] = None
    ) -> List[MemoryObject]:
        """Create memory objects from transcript text."""

        prompt = self.PROMPT_TEMPLATE.format(
            metadata=json.dumps(metadata or {}, ensure_ascii=False, indent=2),
            transcript=text,
        )

        response = self.client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {
                    "role": "system",
                    "content": "Extract structured memories from meeting transcripts.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )

        try:
            raw = json.loads(response.choices[0].message.content)
        except (json.JSONDecodeError, IndexError) as exc:  # pragma: no cover
            raise RuntimeError("Invalid response from OpenAI") from exc

        if not isinstance(raw, list):
            raise RuntimeError("OpenAI response must be a list of memory objects")

        memories: List[MemoryObject] = []
        for item in raw:
            if not isinstance(item, dict):
                continue

            item.setdefault("related_to", None)
            item.setdefault("confidence", 0.7)

            try:
                mem = MemoryObject(meeting_id=meeting_id, **item)
                memories.append(mem)
            except ValidationError:
                continue

        if len(memories) < 8:
            raise RuntimeError("Extraction returned fewer than 8 valid memories")
        if len(memories) > 15:
            memories = memories[:15]

        return memories


__all__ = ["MemoryFactory"]
