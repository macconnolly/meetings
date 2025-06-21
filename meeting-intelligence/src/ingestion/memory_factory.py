from __future__ import annotations

from typing import List
import json

from openai import OpenAI

from ..models.memory_objects import MemoryObject

EXTRACTION_PROMPT = (
    "You are extracting structured memory objects from a meeting transcript. "
    "Return 8-15 JSON objects in a field called 'memories' following this schema:\n"
    "{schema}\nTranscript:\n{text}\n"
)


class MemoryFactory:
    """LLM-backed memory extraction."""

    def __init__(self, client: OpenAI | None = None) -> None:
        self.client = client or OpenAI()

    def create_memories(self, text: str, meeting_id: str) -> List[MemoryObject]:
        schema = {
            "id": "string",
            "customId": "string",
            "type": "string",
            "timestamp": "date",
            "content": {"primary": "string"},
        }

        prompt = EXTRACTION_PROMPT.format(schema=schema, text=text)
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        try:
            data = json.loads(response.choices[0].message.content)
            memories_data = data.get("memories", [])
        except Exception:
            memories_data = []

        memories: List[MemoryObject] = []
        for mem in memories_data:
            try:
                memories.append(MemoryObject(meeting_id=meeting_id, **mem))
            except Exception:
                continue

        return memories
