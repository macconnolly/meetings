import json
import importlib.util
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

SRC_DIR = Path(__file__).resolve().parents[1] / "src"
PACKAGE = "temporal_meeting_intelligence"

# Dynamically load package modules so relative imports work
def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)  # type: ignore
    return module

models_module = _load_module(
    f"{PACKAGE}.models.memory_objects", SRC_DIR / "models" / "memory_objects.py"
)

# Now load the package init which depends on the modules above
pkg = _load_module(PACKAGE, SRC_DIR / "__init__.py")
ingestion_pkg = _load_module(f"{PACKAGE}.ingestion", SRC_DIR / "ingestion" / "__init__.py")
memory_module = _load_module(
    f"{PACKAGE}.ingestion.memory_factory", SRC_DIR / "ingestion" / "memory_factory.py"
)

MemoryFactory = memory_module.MemoryFactory
MemoryType = models_module.MemoryType


class DummyChoice:
    def __init__(self, content: str) -> None:
        self.message = MagicMock(content=content)


class DummyResponse:
    def __init__(self, content: str) -> None:
        self.choices = [DummyChoice(content)]


def test_create_memories_parses_response() -> None:
    fake_client = MagicMock()
    memories_json = json.dumps([
        {"type": MemoryType.TOPIC, "content": "Discuss project", "confidence": 0.9},
        {"type": MemoryType.DECISION, "content": "Approve design", "confidence": 0.8},
        {"type": MemoryType.ACTION, "content": "Update docs", "confidence": 0.7},
        {"type": MemoryType.QUESTION, "content": "Timeline?", "confidence": 0.6},
        {"type": MemoryType.COMMITMENT, "content": "Deliver prototype", "confidence": 0.7},
        {"type": MemoryType.RISK, "content": "Schedule slip", "confidence": 0.5},
        {"type": MemoryType.REFERENCE, "content": "See spec", "confidence": 0.85},
        {"type": MemoryType.TEMPORAL, "content": "Next week", "confidence": 0.6},
    ])
    fake_client.chat.completions.create.return_value = DummyResponse(memories_json)

    factory = MemoryFactory(client=fake_client)
    memories = factory.create_memories("text", "m1")

    assert len(memories) == 8
    assert memories[0].meeting_id == "m1"
    assert memories[0].type == MemoryType.TOPIC
    fake_client.chat.completions.create.assert_called_once()


