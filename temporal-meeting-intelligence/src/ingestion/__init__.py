"""Ingestion package providing parsing and memory extraction utilities."""

from .email_parser import EmailParser
from .memory_factory import MemoryFactory

__all__ = ["EmailParser", "MemoryFactory"]
