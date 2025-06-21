from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any


class Relation(str, Enum):
    PARTICIPATED_IN = "PARTICIPATED_IN"
    DECISION_OF = "DECISION_OF"
    ACTION_OF = "ACTION_OF"
    DISCUSSED_IN = "DISCUSSED_IN"
    PRECEDED = "PRECEDED"
    WORKED_ON = "WORKED_ON"


@dataclass
class Node:
    label: str
    key: str
    properties: Dict[str, Any]

    def merge_cypher(self) -> str:
        all_props = {self.key: self.properties.get(self.key)} | self.properties
        props = ", ".join(f"{k}: ${k}" for k in all_props)
        return f"MERGE (n:{self.label} {{{self.key}: ${self.key}}}) SET n += {{{props}}}"


@dataclass
class Meeting(Node):
    label: str = "Meeting"
    key: str = "meetingId"


@dataclass
class Person(Node):
    label: str = "Person"
    key: str = "email"


@dataclass
class Artifact(Node):
    label: str = "Artifact"
    key: str = "artifactId"


@dataclass
class Decision(Node):
    label: str = "Decision"
    key: str = "decisionId"


@dataclass
class ActionItem(Node):
    label: str = "ActionItem"
    key: str = "actionId"


@dataclass
class Topic(Node):
    label: str = "Topic"
    key: str = "topicId"


def create_relationship_query(start_label: str, end_label: str, rel: Relation, properties: Dict[str, Any] | None = None) -> str:
    props = ''
    if properties:
        props = ' {' + ', '.join(f"{k}: ${k}" for k in properties) + '}'
    return f"MERGE (a:{start_label})-[r:{rel.value}{props}]->(b:{end_label})"

