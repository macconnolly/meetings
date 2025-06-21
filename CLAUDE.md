# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Meeting Intelligence System that processes meeting transcripts (.eml files) and transforms them into actionable business intelligence using AI. The system uses a dual-store architecture combining vector search (Weaviate) and graph relationships (Neo4j) to provide temporal-aware insights about meetings, decisions, commitments, and project evolution.

**Core Architecture:**
- **Ingestion Pipeline**: Processes .eml meeting transcripts 
- **Memory Factory**: LLM-powered extraction of structured "Memory Objects" from meeting content
- **Dual Storage**: Weaviate for semantic/vector search + Neo4j for relationship tracking + Redis for caching
- **Query Orchestration**: Iterative context building for complex temporal queries

## Development Environment

The system runs entirely in Docker containers. All development should be done within the containerized environment.

### Starting the Environment
```bash
cd meeting-intelligence
docker-compose up -d
```

This starts:
- Weaviate (vector DB) on port 8080
- Neo4j (graph DB) on ports 7474 (web UI) and 7687 (bolt)
- Redis (cache) on port 6379  
- Python app container with FastAPI on port 8000

### Working in the Container
```bash
# Execute commands in the app container
docker-compose exec app bash

# Install dependencies 
docker-compose exec app pip install -r requirements.txt

# Run the application
docker-compose exec app uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Configuration
Create a `.env` file in the `meeting-intelligence/` directory with:
```
OPENAI_APIKEY=your_key_here
NEO4J_PASSWORD=your_password_here
```

## Code Architecture

**Python 3.11+ with type hints throughout**

### Core Components

**`src/models/`**: Data models and schemas
- `memory_objects.py`: Core MemoryObject model with 8 types (Decision, Action, Topic, Question, Commitment, Reference, Risk, Temporal)
- `neo4j_models.py`: Graph relationship models
- `weaviate_schemas.py`: Vector database schemas

**`src/ingestion/`**: Input processing pipeline
- `email_parser.py`: Parses .eml files to extract meeting content
- `memory_factory.py`: LLM-powered extraction of structured memories from raw meeting text

**`src/storage/`**: Database clients and operations
- `weaviate_client.py`: Vector database operations for semantic search
- `neo4j_client.py`: Graph database operations for relationship tracking

**`src/config/`**: Configuration management
- `settings.py`: Pydantic-based settings from environment variables

### Key Design Patterns

**Memory Objects**: The fundamental unit of extracted meeting intelligence. Each MemoryObject has:
- Type classification (Decision, Action, Topic, etc.)
- Content with confidence scoring
- Meeting source attribution
- Temporal and relationship metadata

**Dual Storage Strategy**: 
- Weaviate stores memory content for semantic similarity search
- Neo4j tracks relationships, dependencies, and temporal evolution
- Both are queried together for comprehensive context assembly

**Temporal Intelligence**: The system tracks how topics, decisions, and commitments evolve across meetings over time, enabling queries about project history and decision rationale.

## Database Access

**Neo4j Web UI**: http://localhost:7474 (auth: neo4j/[NEO4J_PASSWORD])
**Weaviate**: http://localhost:8080
**Redis**: localhost:6379

## Testing

Tests are located in `tests/` directory. The codebase currently has basic structure but comprehensive testing should be implemented as development progresses.

## Important Notes

- This system requires Python 3.11+ due to typing features
- All LLM operations require valid OPENAI_APIKEY in environment  
- The project is in early development phase - many advanced features described in requirements are not yet implemented
- Focus on the Python implementation in `meeting-intelligence/` - other directories contain legacy/cleanup artifacts