# Meeting Intelligence System

This project implements a Python-based Meeting Intelligence System. It processes meeting emails, extracts structured "memory" objects and stores them in vector and graph databases. The system is designed to run on Python **3.11+** and uses type hints throughout the codebase.

The project is currently in its initialization phase. Future phases will add advanced extraction, storage and query capabilities based on the `meeting-intelligence-requirements.md` specifications.

## Usage

Example `.eml` files are located in the `examples/` directory. To ingest one of
the samples using the pipeline run:

```bash
PYTHONPATH=meeting-intelligence python -m src.ingestion.pipeline meeting-intelligence/examples/standup.eml
```

The command parses the email, extracts memory chunks and stores them using the
configured storage backends.
