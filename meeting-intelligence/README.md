# Meeting Intelligence System

This project implements a Python-based Meeting Intelligence System. It processes meeting emails, extracts structured "memory" objects and stores them in vector and graph databases. The system is designed to run on Python **3.11+** and uses type hints throughout the codebase.

The project is currently in its initialization phase. Future phases will add advanced extraction, storage and query capabilities based on the `meeting-intelligence-requirements.md` specifications.


## Configuration

Runtime configuration is managed via a `.env` file loaded by `Settings`. The following variables are supported (all optional with sane defaults):

| Variable | Description | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | API key for OpenAI models | `''` |
| `OPENROUTER_API_KEY` | API key for OpenRouter models | `''` |
| `NEO4J_URI` | Neo4j connection string | `bolt://neo4j:7687` |
| `NEO4J_USER` | Neo4j username | `neo4j` |
| `NEO4J_PASSWORD` | Neo4j password | `''` |
| `REDIS_HOST` | Redis host | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `WEAVIATE_HOST` | Weaviate host | `weaviate` |
| `WEAVIATE_PORT` | Weaviate port | `8080` |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o` |
| `OPENROUTER_MODEL` | OpenRouter model name | `google/gemini-2.5-flash-preview-05-20` |
| `BATCH_SIZE` | Batch size for processing jobs | `8` |
| `PROCESSING_TIMEOUT` | Timeout (ms) for processing operations | `300000` |
| `ENABLE_VECTOR_STORE` | Toggle usage of the vector store | `true` |
| `ENABLE_GRAPH_STORE` | Toggle usage of the graph store | `true` |

Create a `.env` file based on `.env.example` and adjust values as needed.

Example `.eml` files are located in the `examples/` directory. To ingest one of
the samples using the pipeline run:

```bash
PYTHONPATH=meeting-intelligence python -m src.ingestion.pipeline meeting-intelligence/examples/standup.eml
```

The command parses the email, extracts memory chunks and stores them using the
configured storage backends.
