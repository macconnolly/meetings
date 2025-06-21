from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from ..models.temporal_memory import TemporalMemoryChunk
from ..storage.neo4j_client import Neo4jClient


class UnresolvedThreadTracker:
    """Utility for tracking unanswered questions and unresolved issues."""

    def __init__(self, neo4j: Neo4jClient) -> None:
        self.neo4j_driver = neo4j.driver

    def _find_answer_for_question(
        self, question: TemporalMemoryChunk, answers: List[TemporalMemoryChunk]
    ) -> bool:
        """Check if any answer addresses the question."""
        for ans in answers:
            if ans.timestamp >= question.timestamp and question.speaker in ans.addressed_to:
                return True
        return False

    def _check_future_meetings(self, question: TemporalMemoryChunk) -> bool:
        """Query Neo4j for answers in later meetings."""
        query = (
            "MATCH (q:Chunk {chunkId: $cid})-[:SPOKEN_IN]->(m:Meeting)<-[:SPOKEN_IN]-(a:Chunk) "
            "WHERE a.interactionType = 'answer' AND a.timestamp > q.timestamp "
            "RETURN a LIMIT 1"
        )
        with self.neo4j_driver.session() as session:
            result = session.run(query, cid=question.chunk_id)
            return result.single() is not None

    def track_unresolved_threads(
        self, chunks: List[TemporalMemoryChunk]
    ) -> Dict[str, List[Dict[str, object]]]:
        """Identify questions or issues that remain unresolved."""

        threads = {
            "unanswered_questions": [],
            "unassigned_tasks": [],
            "unresolved_issues": [],
        }

        questions = [c for c in chunks if c.interaction_type == "question"]
        answers = [c for c in chunks if c.interaction_type == "answer"]

        for question in questions:
            has_answer = self._find_answer_for_question(question, answers)
            if not has_answer:
                if not self._check_future_meetings(question):
                    threads["unanswered_questions"].append(
                        {
                            "question": question.content,
                            "asked_by": question.speaker,
                            "asked_in": question.meeting_id,
                            "importance": question.importance_score,
                            "days_unresolved": (datetime.now() - question.timestamp).days,
                        }
                    )

        # TODO: track unassigned tasks and unresolved issues from chunks
        # This requires additional classification logic not yet implemented.

        # Identify stale questions from Neo4j older than 7 days with no answers
        with self.neo4j_driver.session() as session:
            query = (
                "MATCH (q:Chunk {interactionType: 'question'}) "
                "WHERE NOT EXISTS { MATCH (q)-[:ANSWERED_BY]->(:Chunk) } "
                "AND q.timestamp < datetime() - duration('P7D') "
                "RETURN q ORDER BY q.importance_score DESC"
            )
            results = session.run(query)
            for record in results:
                q = record["q"]
                threads["unanswered_questions"].append(
                    {
                        "question": q["content"],
                        "asked_by": q.get("speaker", "unknown"),
                        "asked_in": q.get("meetingId", ""),
                        "importance": q.get("importanceScore", 5.0),
                        "days_unresolved": (
                            datetime.now()
                            - datetime.fromisoformat(q["timestamp"])
                        ).days,
                    }
                )

        return threads
