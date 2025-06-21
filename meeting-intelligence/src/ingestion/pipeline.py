from __future__ import annotations

import argparse
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .email_parser import EmailParser
from .memory_factory import TemporalExtractor
from ..models.memory_objects import Meeting, Person, MemoryChunk
from ..storage.weaviate_client import WeaviateClient
from ..storage.neo4j_client import Neo4jClient


class IngestionPipeline:
    """Orchestrates parsing emails and storing memories."""

    def __init__(
        self,
        weaviate_client: Optional[WeaviateClient] = None,
        neo4j_client: Optional[Neo4jClient] = None,
    ) -> None:
        self.weaviate_client = weaviate_client
        self.neo4j_client = neo4j_client
        self.parser = EmailParser()
        self.extractor = TemporalExtractor()

    async def ingest_email(self, path: Path) -> Dict[str, Any]:
        """Parse an email file and store extracted memories."""
        transcript = self.parser.parse(path)
        if transcript is None:
            raise ValueError(f"Failed to parse {path}")

        meeting = Meeting(
            title=path.stem,
            date=datetime.utcnow(),
            participants=[Person(name="Unknown")],
            platform="email",
            project="demo",
            meeting_type="unspecified",
            duration=0,
        )

        chunks: List[MemoryChunk] = await self.extractor.extract_temporal_chunks(
            transcript, meeting, []
        )

        if self.weaviate_client is not None:
            for chunk in chunks:
                try:
                    self.weaviate_client.client.data_object.create(
                        chunk.dict(), "MemoryChunk"
                    )
                except Exception:
                    pass

        if self.neo4j_client is not None:
            for chunk in chunks:
                try:
                    with self.neo4j_client.driver.session() as session:
                        session.run("RETURN $chunk", chunk=chunk.dict())
                except Exception:
                    pass

        return {"chunk_count": len(chunks)}


async def _async_main(path: Path) -> None:
    pipeline = IngestionPipeline()
    summary = await pipeline.ingest_email(path)
    print(summary)


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest a .eml file")
    parser.add_argument("path", type=Path, help="Path to .eml file")
    args = parser.parse_args()
    asyncio.run(_async_main(args.path))


if __name__ == "__main__":
    main()
