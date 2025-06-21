from __future__ import annotations

from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum


class NodeType(str, Enum):
    """Types of nodes in the temporal graph."""
    MEETING = "Meeting"
    CHUNK = "Chunk"
    PERSON = "Person"
    TOPIC = "Topic"
    DECISION = "Decision"
    ACTION_ITEM = "ActionItem"
    ARTIFACT = "Artifact"
    COMMITMENT = "Commitment"
    VERSION = "Version"


class RelationshipType(str, Enum):
    """Types of relationships in the temporal graph."""
    # Meeting relationships
    PRECEDED = "PRECEDED"
    FOLLOWED_BY = "FOLLOWED_BY"
    
    # Chunk relationships
    SPOKEN_BY = "SPOKEN_BY"
    ADDRESSED_TO = "ADDRESSED_TO"
    REFERENCES = "REFERENCES"
    RESPONDS_TO = "RESPONDS_TO"
    
    # Temporal evolution
    EVOLVED_INTO = "EVOLVED_INTO"
    EVOLVED_FROM = "EVOLVED_FROM"
    SUPERSEDES = "SUPERSEDES"
    SUPERSEDED_BY = "SUPERSEDED_BY"
    BUILDS_ON = "BUILDS_ON"
    UPDATES_STATUS = "UPDATES_STATUS"
    
    # Topic relationships
    DISCUSSED_IN = "DISCUSSED_IN"
    SPLIT_INTO = "SPLIT_INTO"
    MERGED_WITH = "MERGED_WITH"
    
    # Decision relationships
    MADE_BY = "MADE_BY"
    MADE_IN = "MADE_IN"
    REVERSED = "REVERSED"
    
    # Artifact relationships
    EVOLVED_TO = "EVOLVED_TO"
    VERSION_OF = "VERSION_OF"
    MODIFIED = "MODIFIED"
    DISCUSSES_ARTIFACT = "DISCUSSES_ARTIFACT"
    
    # Action/Commitment relationships
    ASSIGNED_TO = "ASSIGNED_TO"
    DEPENDS_ON = "DEPENDS_ON"
    BLOCKS = "BLOCKS"
    COMPLETED_IN = "COMPLETED_IN"
    
    # Content relationships
    CONTAINS_DECISION = "CONTAINS_DECISION"
    CONTAINS_ACTION = "CONTAINS_ACTION"
    CONTAINS_COMMITMENT = "CONTAINS_COMMITMENT"


def get_neo4j_constraints() -> List[str]:
    """Get all constraint creation statements for Neo4j."""
    return [
        # Node constraints
        "CREATE CONSTRAINT meeting_unique IF NOT EXISTS ON (m:Meeting) ASSERT m.meetingId IS UNIQUE",
        "CREATE CONSTRAINT chunk_unique IF NOT EXISTS ON (c:Chunk) ASSERT c.chunkId IS UNIQUE",
        "CREATE CONSTRAINT topic_unique IF NOT EXISTS ON (t:Topic) ASSERT t.topicId IS UNIQUE",
        "CREATE CONSTRAINT artifact_unique IF NOT EXISTS ON (a:Artifact) ASSERT a.artifactId IS UNIQUE",
        "CREATE CONSTRAINT decision_unique IF NOT EXISTS ON (d:Decision) ASSERT d.decisionId IS UNIQUE",
        "CREATE CONSTRAINT person_unique IF NOT EXISTS ON (p:Person) ASSERT p.email IS UNIQUE",
        "CREATE CONSTRAINT action_unique IF NOT EXISTS ON (a:ActionItem) ASSERT a.actionId IS UNIQUE",
        "CREATE CONSTRAINT commitment_unique IF NOT EXISTS ON (c:Commitment) ASSERT c.commitmentId IS UNIQUE",
        "CREATE CONSTRAINT version_unique IF NOT EXISTS ON (v:Version) ASSERT v.versionId IS UNIQUE",
        
        # Index creation for performance
        "CREATE INDEX meeting_date IF NOT EXISTS FOR (m:Meeting) ON (m.date)",
        "CREATE INDEX chunk_timestamp IF NOT EXISTS FOR (c:Chunk) ON (c.timestamp)",
        "CREATE INDEX topic_name IF NOT EXISTS FOR (t:Topic) ON (t.name)",
        "CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)",
        "CREATE INDEX artifact_name IF NOT EXISTS FOR (a:Artifact) ON (a.name)",
        "CREATE INDEX decision_date IF NOT EXISTS FOR (d:Decision) ON (d.date)",
    ]


def get_neo4j_indexes() -> List[str]:
    """Get additional index creation statements for query performance."""
    return [
        # Text search indexes
        "CREATE FULLTEXT INDEX topic_search IF NOT EXISTS FOR (t:Topic) ON EACH [t.name, t.description]",
        "CREATE FULLTEXT INDEX decision_search IF NOT EXISTS FOR (d:Decision) ON EACH [d.content, d.rationale]",
        "CREATE FULLTEXT INDEX chunk_search IF NOT EXISTS FOR (c:Chunk) ON EACH [c.content]",
        
        # Composite indexes for common queries
        "CREATE INDEX chunk_meeting_speaker IF NOT EXISTS FOR (c:Chunk) ON (c.meetingId, c.speaker)",
        "CREATE INDEX action_assignee_status IF NOT EXISTS FOR (a:ActionItem) ON (a.assignee, a.status)",
    ]


class GraphNode:
    """Base class for graph nodes."""
    
    def __init__(self, node_type: NodeType, properties: Dict[str, Any]):
        self.node_type = node_type
        self.properties = properties
        self.labels = [node_type.value]
    
    def to_cypher_properties(self) -> str:
        """Convert properties to Cypher property string."""
        props = []
        for key, value in self.properties.items():
            if isinstance(value, str):
                props.append(f"{key}: '{value}'")
            elif isinstance(value, datetime):
                props.append(f"{key}: datetime('{value.isoformat()}')")
            elif isinstance(value, list):
                props.append(f"{key}: {value}")
            else:
                props.append(f"{key}: {value}")
        return "{" + ", ".join(props) + "}"


class GraphRelationship:
    """Base class for graph relationships."""
    
    def __init__(self, 
                 rel_type: RelationshipType,
                 from_node_id: str,
                 to_node_id: str,
                 properties: Optional[Dict[str, Any]] = None):
        self.rel_type = rel_type
        self.from_node_id = from_node_id
        self.to_node_id = to_node_id
        self.properties = properties or {}
    
    def to_cypher(self) -> str:
        """Generate Cypher for creating this relationship."""
        props = ""
        if self.properties:
            prop_strs = []
            for key, value in self.properties.items():
                if isinstance(value, str):
                    prop_strs.append(f"{key}: '{value}'")
                elif isinstance(value, datetime):
                    prop_strs.append(f"{key}: datetime('{value.isoformat()}')")
                else:
                    prop_strs.append(f"{key}: {value}")
            props = " {" + ", ".join(prop_strs) + "}"
        
        return f"[:{self.rel_type.value}{props}]"


class TemporalChain:
    """Represents a chain of temporal evolution."""
    
    def __init__(self, chain_type: str):
        self.chain_type = chain_type
        self.nodes: List[Dict[str, Any]] = []
        self.relationships: List[Dict[str, Any]] = []
    
    def add_node(self, node_id: str, node_type: str, properties: Dict[str, Any]):
        """Add a node to the temporal chain."""
        self.nodes.append({
            "id": node_id,
            "type": node_type,
            "properties": properties
        })
    
    def add_relationship(self, from_id: str, to_id: str, rel_type: str, properties: Dict[str, Any] = None):
        """Add a relationship in the temporal chain."""
        self.relationships.append({
            "from": from_id,
            "to": to_id,
            "type": rel_type,
            "properties": properties or {}
        })
    
    def get_latest(self) -> Optional[Dict[str, Any]]:
        """Get the latest node in the chain."""
        return self.nodes[-1] if self.nodes else None
    
    def get_evolution_path(self) -> List[str]:
        """Get the evolution path as a list of node IDs."""
        if not self.nodes:
            return []
        
        path = [self.nodes[0]["id"]]
        for rel in self.relationships:
            if rel["from"] == path[-1]:
                path.append(rel["to"])
        
        return path


def create_temporal_queries() -> Dict[str, str]:
    """Get common temporal query templates."""
    return {
        "find_evolution_chain": """
            MATCH path = (start)-[:EVOLVED_INTO|EVOLVED_FROM|SUPERSEDES*]-(end)
            WHERE start.{id_field} = $start_id
            RETURN path
        """,
        
        "find_topic_history": """
            MATCH (t:Topic {name: $topic_name})-[:DISCUSSED_IN]->(m:Meeting)
            WITH t, m
            ORDER BY m.date
            OPTIONAL MATCH (t)-[:EVOLVED_INTO]->(next:Topic)
            OPTIONAL MATCH (prev:Topic)-[:EVOLVED_INTO]->(t)
            RETURN t, m, prev, next
        """,
        
        "find_decision_supersession": """
            MATCH path = (d1:Decision)-[:SUPERSEDES*]->(d2:Decision)
            WHERE d1.decisionId = $decision_id
            RETURN path
        """,
        
        "find_artifact_versions": """
            MATCH path = (a1:Artifact)-[:EVOLVED_TO*]->(a2:Artifact)
            WHERE a1.name = $artifact_name
            RETURN path
            ORDER BY length(path) DESC
            LIMIT 1
        """,
        
        "find_temporal_references": """
            MATCH (c1:Chunk)-[r:REFERENCES|TEMPORAL_REFERENCE]->(c2:Chunk)
            WHERE c1.chunkId = $chunk_id
            RETURN c1, r, c2
        """,
        
        "find_status_updates": """
            MATCH (c:Chunk)-[u:UPDATES_STATUS]->(item)
            WHERE item.id = $item_id
            RETURN c, u, item
            ORDER BY c.timestamp
        """,
        
        "trace_commitment_evolution": """
            MATCH (c:Commitment {commitmentId: $commitment_id})
            OPTIONAL MATCH (c)<-[:CONTAINS_COMMITMENT]-(chunk:Chunk)
            OPTIONAL MATCH (c)-[:ASSIGNED_TO]->(person:Person)
            OPTIONAL MATCH (c)-[:DEPENDS_ON]->(dep)
            OPTIONAL MATCH (c)-[:COMPLETED_IN]->(meeting:Meeting)
            RETURN c, chunk, person, dep, meeting
        """
    }