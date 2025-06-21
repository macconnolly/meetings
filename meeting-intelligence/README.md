# Meeting Intelligence System

This project implements a Python-based Meeting Intelligence System. It processes meeting emails, extracts structured "memory" objects and stores them in vector and graph databases. The system is designed to run on Python **3.11+** and uses type hints throughout the codebase.

The project now includes a minimal implementation of the **Temporal Meeting Intelligence System**. The `temporal` package provides:

- `TemporalExtractor` – extracts temporally aware memory chunks using OpenAI.
- `DualStorageManager` – stores meetings and chunks in both Weaviate and Neo4j.
- `TemporalQueryProcessor` – performs simple temporal queries.
- `api.py` – FastAPI application exposing ingestion and query endpoints.
- `neo4j_schema.py` – applies the Neo4j graph constraints described in the requirements.

This implementation is intentionally lightweight but demonstrates the core concepts described in the requirements.
