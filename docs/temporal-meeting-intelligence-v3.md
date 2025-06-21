# Temporal Meeting Intelligence System - Complete Requirements & Implementation Guide v3.0

This document outlines the architecture and implementation guidance for the Temporal Meeting Intelligence system. It supersedes previous requirement versions and introduces temporal awareness, dual storage in Weaviate and Neo4j, and an advanced extraction pipeline.

For brevity the full text from the design discussion is not reproduced here. See the project discussion for the detailed plan. Key components implemented in this repository include:

- `TemporalMemoryChunk` dataclass describing temporally aware memory slices
- `TemporalExtractor` for turning transcripts into `TemporalMemoryChunk` objects
- `DualStorageManager` handling persistence to Weaviate and Neo4j
- An updated `WEAVIATE_SCHEMA` defining both `MemoryChunk` and `Meeting` classes
