from __future__ import annotations

from enum import Enum


class Relation(str, Enum):
    PARTICIPATED_IN = "PARTICIPATED_IN"
    DECISION_OF = "DECISION_OF"
    ACTION_OF = "ACTION_OF"


def create_meeting_node(meeting_id: str) -> str:
    return f"MERGE (m:Meeting { '{ id: \"' + meeting_id + '\"' } })"