# Meeting Intelligence System - Comprehensive Requirements & Architecture v2.0

## Executive Summary

The Meeting Intelligence System is a sophisticated temporal knowledge platform that transforms meeting transcripts into actionable business intelligence. Unlike traditional meeting summarization tools, this system understands how context evolves across time, tracks complex dependencies between decisions and actions, and provides nuanced responses that factor in historical patterns, commitments, and implicit requirements.

### Key Differentiators
- **Temporal Intelligence**: Tracks how topics, decisions, and commitments evolve across meetings
- **Contextual Awareness**: Understands implicit needs (e.g., "update the date" based on deadline changes)
- **Iterative Refinement**: LLM-driven queries that progressively build comprehensive context
- **Dual-Store Architecture**: Combines semantic search (Weaviate) with relationship tracking (Neo4j)

### Business Value
- Reduce meeting preparation time from hours to minutes
- Never miss critical commitments or dependencies
- Understand project evolution and decision rationale
- Surface hidden connections and potential risks

---

## 1. System Overview

### 1.1 Core Concept
The system ingests meeting transcripts (.eml format initially), processes them through an LLM to extract structured "Memory Objects," stores these in both vector (Weaviate) and graph (Neo4j) databases, and uses an orchestration layer to iteratively assemble nuanced responses to complex queries.

### 1.2 Primary Use Cases

#### UC1: Pre-Meeting Intelligence
**Query**: "What do I need to know for the 2pm board meeting?"
**System Response**: Summary of relevant past decisions, open action items, unresolved questions, and suggested talking points based on temporal context.

#### UC2: Deliverable Gap Analysis
**Query**: "What additional slides should I add to tomorrow's deck?"
**System Response**: Missing content based on commitments, identified themes without slides, required updates based on new information, and dependencies on others' work.

#### UC3: Commitment Tracking
**Query**: "What did John commit to delivering this week?"
**System Response**: All commitments with deadlines, status based on subsequent meetings, dependencies on John's deliverables, and risk assessment if behind schedule.

#### UC4: Decision Archaeology
**Query**: "Why did we decide to delay the product launch?"
**System Response**: Original decision context, evolution of reasoning across meetings, key stakeholders involved, and alternative options considered.

#### UC5: Cross-Project Intelligence
**Query**: "How might the infrastructure changes affect my project?"
**System Response**: Relevant discussions from other projects, identified dependencies, similar past situations, and recommended stakeholders to consult.

### 1.3 System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   EML Ingestion │────▶│ Memory Factory  │────▶│  Dual Storage   │
│     Pipeline    │     │ (LLM Extraction)│     │ Weaviate + Neo4j│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Interface │◀────│ Context Assembly│◀────│ Query Orchestrator│
│   (API/Web)     │     │    (LLM)        │     │ (Iterative LLM) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. Functional Architecture

### 2.1 Ingestion Pipeline

#### 2.1.1 Input Processing
- **Supported Formats**: .eml files (Phase 1), Teams/Zoom transcripts (Phase 2)
- **Batch Processing**: Handle up to 50 meetings concurrently
- **Real-time Processing**: Webhook support for immediate processing

#### 2.1.2 Memory Factory (LLM Extraction)

The Memory Factory uses specialized prompts to extract structured data from transcripts:

```python
EXTRACTION_PROMPT = """
Analyze this meeting transcript and extract:

1. METADATA
   - Meeting title, date, duration
   - Participants (name, role, attendance type)
   - Project/initiative context

2. MEMORY OBJECTS (create 8-15 per meeting)
   
   a) Decisions
      - What was decided
      - Who made the decision
      - Rationale provided
      - Dependencies/prerequisites
      - Confidence level (firm/tentative/proposed)
   
   b) Action Items
      - Description
      - Owner
      - Due date (explicit or inferred)
      - Dependencies
      - Success criteria
   
   c) Topics Discussed
      - Main theme
      - Sub-topics covered
      - Time spent (approximate)
      - Participants involved
      - Outcome (resolved/tabled/needs follow-up)
   
   d) Questions Raised
      - Question text
      - Asked by whom
      - Answered/unanswered
      - If answered, by whom and summary
      - Follow-up needed
   
   e) Commitments
      - Who committed
      - What they committed to
      - By when
      - To whom
      - Conditions/dependencies
   
   f) References
      - Documents mentioned
      - Previous meetings referenced
      - External resources cited
      - People mentioned but not present
   
   g) Risks/Issues
      - Risk/issue description
      - Severity assessment
      - Proposed mitigations
      - Owner of resolution
   
   h) Temporal Markers
      - References to past events ("as discussed last week")
      - Future references ("by next sprint")
      - Deadline mentions
      - Schedule dependencies

3. EMOTIONAL CONTEXT
   - Overall meeting tone
   - Points of tension/disagreement
   - Enthusiasm indicators
   - Confidence levels in decisions

4. ARTIFACT TRACKING
   - Documents/files being worked on
   - Version references
   - Modification commitments
   - Review assignments

Output as structured JSON following the MemoryObject schema.
"""
```

#### 2.1.3 Memory Object Schema

```typescript
interface MemoryObject {
  id: string;                    // UUID
  customId: string;              // Human-readable ID
  type: MemoryType;              // Decision|Action|Topic|Question|Commitment|Reference|Risk|Temporal
  meetingId: string;             // Source meeting
  timestamp: Date;               // When in the meeting
  content: {
    primary: string;             // Main content
    context: string;             // Surrounding context
    raw: string;                 // Original transcript excerpt
  };
  entities: {
    people: Person[];            // People involved
    artifacts: Artifact[];       // Documents/files referenced
    projects: string[];          // Related projects
  };
  temporal: {
    references: TemporalRef[];   // Past/future references
    deadlines: Date[];           // Mentioned deadlines
    dependencies: string[];      // Temporal dependencies
  };
  confidence: number;            // Extraction confidence (0-1)
  metadata: Map<string, any>;    // Type-specific metadata
}
```

### 2.2 Storage Architecture

#### 2.2.1 Weaviate Configuration (v1.24+)

```javascript
// Weaviate Schema Definition
const meetingSchema = {
  classes: [
    {
      class: 'MemoryObject',
      description: 'Core memory unit from meetings',
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'text-embedding-3-small',
          type: 'text',
          options: {
            waitForModel: true,
            useGPU: true,
            vectorizeClassName: false
          }
        }
      },
      properties: [
        {
          name: 'content',
          dataType: ['text'],
          description: 'Primary content of the memory',
          moduleConfig: {
            'text2vec-openai': {
              skip: false,
              vectorizePropertyName: false
            }
          }
        },
        {
          name: 'contextualContent',
          dataType: ['text'],
          description: 'Full context including surrounding discussion'
        },
        {
          name: 'meetingId',
          dataType: ['string'],
          indexInverted: true,
          indexFilterable: true,
          indexSearchable: false
        },
        {
          name: 'memoryType',
          dataType: ['string'],
          indexInverted: true,
          indexFilterable: true
        },
        {
          name: 'timestamp',
          dataType: ['date'],
          indexInverted: true,
          indexRangeFilters: true
        },
        {
          name: 'involvedPeople',
          dataType: ['string[]'],
          indexInverted: true
        },
        {
          name: 'referencedArtifacts',
          dataType: ['string[]'],
          indexInverted: true
        },
        {
          name: 'confidence',
          dataType: ['number'],
          indexInverted: true,
          indexRangeFilters: true
        }
      ],
      invertedIndexConfig: {
        indexTimestamps: true,
        indexNullState: true,
        indexPropertyLength: true
      },
      replicationConfig: {
        factor: 3
      }
    },
    {
      class: 'Meeting',
      description: 'Meeting metadata and summary',
      properties: [
        {
          name: 'title',
          dataType: ['string'],
          indexInverted: true,
          indexSearchable: true
        },
        {
          name: 'date',
          dataType: ['date'],
          indexInverted: true,
          indexRangeFilters: true
        },
        {
          name: 'participants',
          dataType: ['string[]'],
          indexInverted: true
        },
        {
          name: 'duration',
          dataType: ['int']
        },
        {
          name: 'project',
          dataType: ['string'],
          indexInverted: true,
          indexFilterable: true
        },
        {
          name: 'transcriptUrl',
          dataType: ['string']
        },
        {
          name: 'summary',
          dataType: ['text'],
          description: 'AI-generated meeting summary'
        }
      ]
    }
  ]
};
```

#### 2.2.2 Neo4j Graph Model

```cypher
// Node Types
CREATE CONSTRAINT meeting_id IF NOT EXISTS 
  ON (m:Meeting) ASSERT m.meetingId IS UNIQUE;

CREATE CONSTRAINT person_email IF NOT EXISTS 
  ON (p:Person) ASSERT p.email IS UNIQUE;

CREATE CONSTRAINT artifact_id IF NOT EXISTS 
  ON (a:Artifact) ASSERT a.artifactId IS UNIQUE;

CREATE CONSTRAINT decision_id IF NOT EXISTS 
  ON (d:Decision) ASSERT d.decisionId IS UNIQUE;

CREATE CONSTRAINT action_id IF NOT EXISTS 
  ON (a:ActionItem) ASSERT a.actionId IS UNIQUE;

CREATE CONSTRAINT topic_id IF NOT EXISTS 
  ON (t:Topic) ASSERT t.topicId IS UNIQUE;

// Relationship Types with Properties
// Temporal Relationships
(m1:Meeting)-[:PRECEDED_BY {days_between: 3}]->(m2:Meeting)
(t1:Topic)-[:EVOLVED_FROM {confidence: 0.8}]->(t2:Topic)
(d1:Decision)-[:SUPERSEDES {reason: "Updated requirements"}]->(d2:Decision)

// Commitment Relationships  
(p:Person)-[:COMMITTED_TO {date: datetime(), confidence: "firm"}]->(a:ActionItem)
(a:ActionItem)-[:DUE_BY {date: date()}]->(deadline:Deadline)
(a1:ActionItem)-[:DEPENDS_ON {critical: true}]->(a2:ActionItem)

// Artifact Relationships
(a:Artifact)-[:VERSION_OF {version: 3}]->(parent:Artifact)
(p:Person)-[:WORKING_ON {since: datetime()}]->(a:Artifact)
(m:Meeting)-[:DISCUSSED {duration_minutes: 15}]->(a:Artifact)

// Decision Relationships
(d:Decision)-[:MADE_BY]->(p:Person)
(d:Decision)-[:MADE_IN]->(m:Meeting)
(d:Decision)-[:AFFECTS]->(proj:Project)
(d:Decision)-[:BASED_ON]->(rationale:Rationale)

// Topic Evolution
(t:Topic)-[:DISCUSSED_IN {time_spent: 20}]->(m:Meeting)
(t:Topic)-[:OWNED_BY]->(p:Person)
(t:Topic)-[:RELATES_TO]->(proj:Project)
```

### 2.3 Query Orchestration Engine

#### 2.3.1 Query Planning

When a user query arrives, the Query Planner LLM analyzes it to determine:

```python
class QueryPlan:
    def __init__(self, user_query: str):
        self.original_query = user_query
        self.query_type = self.classify_query()
        self.temporal_scope = self.extract_temporal_scope()
        self.entities_mentioned = self.extract_entities()
        self.implicit_needs = self.infer_implicit_needs()
        self.required_context_types = self.determine_context_types()
    
    def classify_query(self) -> QueryType:
        # Classify into: pre_meeting, gap_analysis, commitment_tracking,
        # decision_archaeology, cross_project, status_check, etc.
        pass
    
    def extract_temporal_scope(self) -> TemporalScope:
        # Identify time boundaries: specific dates, relative times,
        # or open-ended historical search
        pass
    
    def infer_implicit_needs(self) -> List[ImplicitNeed]:
        # E.g., "slides for tomorrow" implies:
        # - Check existing slide commitments
        # - Identify discussed topics without slides  
        # - Find deadline/date changes
        # - Look for dependencies on others' work
        pass
```

#### 2.3.2 Iterative Context Building

```python
class IterativeContextBuilder:
    def __init__(self, query_plan: QueryPlan, weaviate: WeaviateClient, neo4j: Neo4jClient):
        self.plan = query_plan
        self.weaviate = weaviate
        self.neo4j = neo4j
        self.context_graph = ContextGraph()
        self.iteration_count = 0
        self.max_iterations = 5
    
    async def build_context(self) -> ContextGraph:
        # Phase 1: Initial broad search
        initial_memories = await self.initial_search()
        self.context_graph.add_memories(initial_memories)
        
        # Phase 2: Iterative refinement
        while self.needs_more_context() and self.iteration_count < self.max_iterations:
            gaps = self.identify_context_gaps()
            refined_queries = self.generate_refined_queries(gaps)
            
            # Execute refined queries in parallel
            results = await asyncio.gather(*[
                self.execute_refined_query(q) for q in refined_queries
            ])
            
            self.context_graph.add_memories(results)
            self.iteration_count += 1
        
        # Phase 3: Relationship expansion
        await self.expand_relationships()
        
        return self.context_graph
    
    def identify_context_gaps(self) -> List[ContextGap]:
        # LLM analyzes current context to find:
        # - Mentioned but not loaded entities
        # - Temporal gaps in narrative
        # - Unresolved references
        # - Missing dependency chains
        pass
    
    async def expand_relationships(self):
        # Neo4j graph traversal up to 3 hops
        for node in self.context_graph.get_expansion_candidates():
            expanded = await self.neo4j.traverse(
                start_node=node,
                relationship_types=['DEPENDS_ON', 'EVOLVED_FROM', 'SUPERSEDES'],
                max_depth=3,
                filters=self.plan.temporal_scope
            )
            self.context_graph.add_relationships(expanded)
```

#### 2.3.3 Context Scoring & Ranking

```python
class ContextScorer:
    def __init__(self):
        self.weights = {
            'temporal_relevance': 0.25,      # How recent/relevant in time
            'entity_overlap': 0.20,          # Mentions same people/artifacts
            'topic_similarity': 0.20,        # Semantic similarity
            'dependency_strength': 0.15,     # Graph connection strength
            'confidence_score': 0.10,        # Extraction confidence
            'query_alignment': 0.10          # Direct relevance to query
        }
    
    def score_memory(self, memory: MemoryObject, query_context: QueryContext) -> float:
        scores = {
            'temporal_relevance': self.calc_temporal_relevance(memory, query_context),
            'entity_overlap': self.calc_entity_overlap(memory, query_context),
            'topic_similarity': self.calc_semantic_similarity(memory, query_context),
            'dependency_strength': self.calc_graph_distance(memory, query_context),
            'confidence_score': memory.confidence,
            'query_alignment': self.calc_query_alignment(memory, query_context)
        }
        
        return sum(scores[k] * self.weights[k] for k in scores)
```

### 2.4 Context Assembly & Response Generation

#### 2.4.1 Final Context Structure

```typescript
interface AssembledContext {
  // Core context
  primaryMemories: MemoryObject[];        // Directly relevant memories
  supportingMemories: MemoryObject[];     // Supporting context
  
  // Temporal understanding
  timeline: TimelineEvent[];              // Chronological event sequence
  evolutionChains: EvolutionChain[];      // How topics/decisions evolved
  
  // Commitments & dependencies
  activeCommitments: Commitment[];        // Open commitments
  dependencies: DependencyGraph;          // What depends on what
  
  // Gaps & risks
  identifiedGaps: Gap[];                  // Missing information/actions
  risks: Risk[];                          // Identified risks
  
  // Metadata
  confidenceBreakdown: ConfidenceMetrics; // Per-category confidence
  temporalCoverage: TemporalCoverage;     // Time periods covered
  sourceAttribution: SourceMap;           // Memory → source meeting mapping
}
```

#### 2.4.2 Response Generation Prompt

```python
RESPONSE_GENERATION_PROMPT = """
Given the assembled context, generate a response that:

1. DIRECTLY ANSWERS the user's question
2. PROVIDES NUANCED CONTEXT including:
   - Temporal evolution (how things changed over time)
   - Dependencies and blockers
   - Implicit requirements (things not directly asked but needed)
   - Confidence levels where uncertainty exists

3. STRUCTURES THE RESPONSE with:
   - Direct answer first
   - Supporting context with temporal markers
   - Specific recommendations/actions
   - Important caveats or assumptions

4. INCLUDES ATTRIBUTION:
   - Link statements to specific meetings/speakers
   - Indicate confidence levels
   - Flag inferences vs. direct evidence

5. ACTIONABLE INSIGHTS:
   - What needs to be done
   - By whom and by when
   - What dependencies exist
   - What risks to monitor

Context: {assembled_context}
User Query: {user_query}

Generate response:
"""
```

---

## 3. Non-Functional Requirements

### 3.1 Performance Requirements

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Query Response Time (P50) | < 30 seconds | End-to-end from API call to response |
| Query Response Time (P95) | < 2 minutes | Including complex multi-hop queries |
| Query Response Time (P99) | < 5 minutes | For exhaustive historical searches |
| Ingestion Speed | < 5 seconds/meeting | From upload to searchable |
| Concurrent Users | 100 | Simultaneous active sessions |
| Concurrent Queries | 50 | Parallel query processing |
| Daily Meeting Ingestion | 500+ meetings | 24-hour processing capacity |

### 3.2 Scalability Requirements

- **Vector Storage**: Support 10M+ memory objects with sub-second search
- **Graph Storage**: Handle 50M+ nodes and 200M+ relationships
- **Query Complexity**: Process queries requiring up to 1000 memory objects
- **Temporal Range**: Efficiently query across 2+ years of meeting history

### 3.3 Reliability & Availability

- **System Availability**: 99.9% uptime (8.76 hours downtime/year)
- **Data Durability**: 99.999999999% (11 nines) 
- **RPO (Recovery Point Objective)**: < 1 hour
- **RTO (Recovery Time Objective)**: < 4 hours
- **Graceful Degradation**: Partial results on component failure

### 3.4 Security Requirements

#### 3.4.1 Data Protection
- **Encryption at Rest**: AES-256 for all stored data
- **Encryption in Transit**: TLS 1.3 minimum
- **Key Management**: AWS KMS or HashiCorp Vault
- **Data Residency**: Configurable by deployment region

#### 3.4.2 Access Control
- **Authentication**: OIDC/SAML 2.0 support
- **Authorization**: RBAC with project-level permissions
- **Audit Logging**: All access and queries logged
- **Data Isolation**: Multi-tenant data separation

#### 3.4.3 Privacy & Compliance
- **PII Handling**: Automatic PII detection and masking
- **GDPR Compliance**: Right to deletion, data portability
- **Retention Policies**: Configurable per organization
- **Audit Trail**: Complete lineage from source to response

### 3.5 Monitoring & Observability

```yaml
# Key Metrics to Track
ingestion:
  - meetings_processed_per_hour
  - memory_objects_created_per_meeting
  - extraction_confidence_distribution
  - ingestion_errors_by_type

query_performance:
  - query_latency_by_type
  - context_assembly_iterations
  - memories_retrieved_per_query
  - cache_hit_rate

storage:
  - vector_index_size
  - graph_traversal_time
  - storage_usage_by_type
  - index_rebuild_frequency

llm_usage:
  - tokens_consumed_by_operation
  - llm_latency_by_model
  - fallback_trigger_rate
  - cost_per_query

quality:
  - user_satisfaction_score
  - context_completeness_score
  - response_accuracy_metrics
  - false_positive_rate
```

---

## 4. Technical Architecture

### 4.1 System Components

```yaml
# Microservices Architecture
services:
  ingestion-service:
    runtime: Python 3.11
    framework: FastAPI
    dependencies:
      - email-parser
      - langchain
      - weaviate-client
      - neo4j-driver
    scaling: Horizontal auto-scaling based on queue depth
  
  memory-factory:
    runtime: Python 3.11
    framework: Celery
    dependencies:
      - openai
      - anthropic
      - custom-prompt-library
    scaling: Worker pool with GPU support
  
  query-orchestrator:
    runtime: Node.js 20
    framework: NestJS
    dependencies:
      - graphql
      - bull-queue
      - opentelemetry
    scaling: Horizontal with sticky sessions
  
  context-assembly:
    runtime: Python 3.11
    framework: Ray
    dependencies:
      - numpy
      - pandas
      - networkx
    scaling: Distributed compute cluster
  
  api-gateway:
    runtime: Go 1.21
    framework: Kong
    features:
      - Rate limiting
      - Authentication
      - Request routing
      - Circuit breaking
```

### 4.2 Infrastructure Requirements

```yaml
# Production Deployment
weaviate_cluster:
  version: "1.24+"
  nodes:
    - type: c6i.4xlarge
      count: 3
      role: data
    - type: m6i.2xlarge  
      count: 2
      role: query
  storage:
    type: gp3
    size: 2TB
    iops: 16000
  backup:
    frequency: hourly
    retention: 30 days

neo4j_cluster:
  version: "5.x"
  edition: Enterprise
  deployment: Aura DS
  size: M30 (32GB RAM, 8 vCPUs)
  storage: 1TB SSD
  read_replicas: 2

cache_layer:
  redis:
    version: "7.x"
    deployment: ElastiCache
    node_type: r6g.xlarge
    replication: Multi-AZ
    
message_queue:
  kafka:
    version: "3.x"
    brokers: 3
    retention: 7 days
    partitions:
      ingestion: 10
      queries: 20
```

### 4.3 LLM Configuration

```python
# OpenRouter Configuration
LLM_CONFIG = {
    'primary_model': {
        'provider': 'anthropic',
        'model': 'claude-3-opus-20240229',
        'max_tokens': 4096,
        'temperature': 0.3,
        'use_cases': ['extraction', 'complex_queries']
    },
    'secondary_model': {
        'provider': 'mistralai',
        'model': 'mixtral-8x7b-instruct',
        'max_tokens': 4096,
        'temperature': 0.5,
        'use_cases': ['summarization', 'simple_queries']
    },
    'fallback_model': {
        'provider': 'openai',
        'model': 'gpt-4-turbo-preview',
        'max_tokens': 4096,
        'temperature': 0.7,
        'use_cases': ['creative_tasks', 'edge_cases']
    },
    'embedding_model': {
        'provider': 'openai',
        'model': 'text-embedding-3-small',
        'dimensions': 1536
    }
}

# Cost optimization rules
COST_OPTIMIZATION = {
    'token_budgets': {
        'extraction': 2000,
        'query_planning': 500,
        'context_assembly': 3000,
        'response_generation': 1500
    },
    'model_selection_rules': [
        {'if': 'query_complexity < 0.3', 'use': 'secondary_model'},
        {'if': 'token_count > 3000', 'use': 'primary_model'},
        {'if': 'failure_count > 1', 'use': 'fallback_model'}
    ]
}
```

---

## 5. Implementation Roadmap

### 5.1 Phase 1: Foundation (Weeks 1-4)

**Deliverables:**
- Core data models in Weaviate and Neo4j
- Basic ingestion pipeline for .eml files
- Memory extraction with simple prompts
- Basic storage and retrieval

**Success Criteria:**
- Successfully ingest and store 100 test meetings
- Retrieve memories with >90% accuracy
- Sub-second vector search performance

### 5.2 Phase 2: Intelligence Layer (Weeks 5-8)

**Deliverables:**
- Advanced memory extraction with temporal awareness
- Graph relationship building
- Query orchestration engine v1
- Iterative context building

**Success Criteria:**
- Extract 8-15 quality memories per meeting
- Build accurate temporal chains
- Answer basic queries with relevant context

### 5.3 Phase 3: Advanced Capabilities (Weeks 9-12)

**Deliverables:**
- Full iterative query refinement
- Complex traversal algorithms
- Confidence scoring system
- Gap analysis and risk identification

**Success Criteria:**
- Handle complex multi-hop queries
- Achieve >70% confidence on well-represented topics
- Identify gaps and dependencies accurately

### 5.4 Phase 4: Production Hardening (Weeks 13-16)

**Deliverables:**
- Performance optimization
- Monitoring and alerting
- Security hardening
- User interface and API documentation

**Success Criteria:**
- Meet all performance SLAs
- Pass security audit
- Successfully onboard first users

### 5.5 Phase 5: Scale & Enhance (Ongoing)

**Planned Enhancements:**
- Real-time meeting integration
- Multi-language support
- Advanced visualization
- Predictive analytics
- PowerPoint/document generation

---

## 6. Testing Strategy

### 6.1 Test Data Requirements

```python
TEST_SCENARIOS = {
    'simple_queries': {
        'count': 100,
        'types': ['single_meeting', 'specific_person', 'date_range'],
        'expected_response_time': '< 30s'
    },
    'complex_queries': {
        'count': 50,
        'types': ['multi_hop', 'temporal_evolution', 'gap_analysis'],
        'expected_response_time': '< 2m'
    },
    'edge_cases': {
        'count': 25,
        'types': ['conflicting_info', 'sparse_data', 'circular_dependencies'],
        'expected_behavior': 'graceful_handling'
    }
}

TEST_MEETING_CORPUS = {
    'total_meetings': 500,
    'projects': 10,
    'participants': 50,
    'time_span': '6 months',
    'meeting_types': [
        'standup',
        'planning',
        'review',
        'decision',
        'brainstorm'
    ],
    'complexity_distribution': {
        'simple': 0.3,      # Single topic, clear outcomes
        'medium': 0.5,      # Multiple topics, some dependencies
        'complex': 0.2      # Many topics, complex dependencies
    }
}
```

### 6.2 Quality Metrics

```python
QUALITY_METRICS = {
    'extraction_quality': {
        'precision': 'Correct memories / Total extracted',
        'recall': 'Found memories / Total possible',
        'f1_score': 'Harmonic mean of precision and recall',
        'target': 0.85
    },
    'response_quality': {
        'relevance': 'User rating of response relevance (1-5)',
        'completeness': 'All aspects of query addressed',
        'accuracy': 'Factual correctness of statements',
        'target': 4.2  # Average score
    },
    'temporal_accuracy': {
        'sequence_correctness': 'Events in right order',
        'date_accuracy': 'Dates correctly identified',
        'evolution_tracking': 'Changes tracked accurately',
        'target': 0.90
    }
}
```

### 6.3 Load Testing

```yaml
load_test_scenarios:
  baseline:
    concurrent_users: 10
    queries_per_minute: 30
    meeting_ingestion_rate: 5/min
    duration: 1 hour
    
  stress:
    concurrent_users: 100
    queries_per_minute: 200
    meeting_ingestion_rate: 20/min
    duration: 30 minutes
    
  spike:
    initial_users: 10
    spike_to: 200
    spike_duration: 5 minutes
    recovery_time: "< 2 minutes"
    
  endurance:
    concurrent_users: 50
    queries_per_minute: 100
    meeting_ingestion_rate: 10/min
    duration: 24 hours
    memory_leak_threshold: "< 5% growth"
```

---

## 7. Operational Procedures

### 7.1 Deployment Process

```yaml
deployment_pipeline:
  stages:
    - name: Build
      steps:
        - Run unit tests
        - Build containers
        - Security scanning
        - Push to registry
    
    - name: Staging
      steps:
        - Deploy to staging
        - Run integration tests
        - Load testing
        - Quality validation
    
    - name: Production
      steps:
        - Blue-green deployment
        - Canary rollout (5% → 25% → 50% → 100%)
        - Health checks
        - Rollback on failure

  rollback_criteria:
    - Error rate > 5%
    - Response time > 2x baseline
    - Memory usage > 90%
    - CPU usage > 85%
```

### 7.2 Monitoring & Alerting

```yaml
alerts:
  critical:
    - name: Service Down
      condition: health_check_failures > 3
      notification: PagerDuty
      
    - name: High Error Rate  
      condition: error_rate > 10%
      window: 5 minutes
      notification: PagerDuty + Slack
      
    - name: Data Loss Risk
      condition: ingestion_backlog > 1000
      notification: On-call engineer
      
  warning:
    - name: Slow Queries
      condition: p95_latency > 3 minutes
      window: 15 minutes
      notification: Slack
      
    - name: High LLM Costs
      condition: hourly_cost > $100
      notification: Engineering manager
      
    - name: Low Confidence Scores
      condition: avg_confidence < 0.6
      window: 1 hour
      notification: ML team
```

### 7.3 Backup & Recovery

```yaml
backup_strategy:
  weaviate:
    frequency: Every 6 hours
    retention: 30 days
    method: Snapshot to S3
    test_restore: Weekly
    
  neo4j:
    frequency: Daily
    retention: 30 days  
    method: Online backup
    test_restore: Weekly
    
  configurations:
    frequency: On change
    retention: Unlimited
    method: Git repository
    
recovery_procedures:
  data_corruption:
    1. Identify corruption scope
    2. Isolate affected components
    3. Restore from latest clean backup
    4. Replay transactions from audit log
    5. Validate data integrity
    
  complete_failure:
    1. Activate DR site
    2. Restore from S3 backups
    3. Replay message queue
    4. Validate system health
    5. Update DNS/routing
```

---

## 8. Cost Analysis

### 8.1 Infrastructure Costs (Monthly)

| Component | Specification | Estimated Cost |
|-----------|--------------|----------------|
| Weaviate Cluster | 3x c6i.4xlarge + 2x m6i.2xlarge | $2,800 |
| Neo4j Aura DS | M30 instance | $3,500 |
| Redis Cache | ElastiCache r6g.xlarge | $400 |
| Kafka Cluster | 3x m5.large | $600 |
| Application Servers | 6x m5.xlarge | $1,200 |
| Load Balancer | ALB + data transfer | $200 |
| Storage | 5TB S3 + 3TB EBS | $400 |
| **Subtotal** | | **$9,100** |

### 8.2 LLM Costs (Monthly - 500 meetings/day)

| Operation | Model | Tokens/Operation | Daily Volume | Monthly Cost |
|-----------|-------|-----------------|--------------|--------------|
| Extraction | Claude Opus | 3,000 | 500 meetings | $2,250 |
| Query Planning | Mixtral | 500 | 1,000 queries | $150 |
| Context Assembly | Claude Opus | 2,000 | 1,000 queries | $3,000 |
| Response Gen | Claude Opus | 1,500 | 1,000 queries | $2,250 |
| Embeddings | text-embedding-3 | 1,000 | 10,000 objects | $100 |
| **Subtotal** | | | | **$7,750** |

### 8.3 Total Cost of Ownership

| Category | Monthly Cost | Annual Cost |
|----------|--------------|-------------|
| Infrastructure | $9,100 | $109,200 |
| LLM Usage | $7,750 | $93,000 |
| Support & Maintenance | $2,000 | $24,000 |
| Monitoring & Security | $500 | $6,000 |
| **Total** | **$19,350** | **$232,200** |

### 8.4 Cost Optimization Strategies

1. **Intelligent Caching**: Cache frequent queries and static context
2. **Model Selection**: Use cheaper models for simple operations
3. **Batch Processing**: Group similar operations to reduce API calls
4. **Compression**: Compress stored transcripts and memories
5. **Retention Policies**: Archive old data to cheaper storage

---

## 9. Risk Analysis & Mitigation

### 9.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM API Rate Limits | High | Medium | Multi-provider fallback, request queuing |
| Vector/Graph Drift | High | Medium | Regular re-indexing, consistency checks |
| Context Window Limits | Medium | High | Intelligent chunking, summarization |
| Hallucination in Extraction | High | Low | Confidence scoring, human validation |
| Performance Degradation | High | Medium | Auto-scaling, query optimization |

### 9.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data Privacy Breach | Critical | Low | Encryption, access controls, audit logs |
| Inaccurate Intelligence | High | Medium | Confidence scores, source attribution |
| User Adoption | High | Medium | Training, intuitive UI, quick wins |
| Cost Overrun | Medium | Medium | Usage monitoring, budget alerts |
| Vendor Lock-in | Medium | Low | Abstraction layers, standard formats |

### 9.3 Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Key Person Dependency | High | Medium | Documentation, knowledge sharing |
| Backup Failure | Critical | Low | Automated testing, multiple locations |
| Scaling Issues | High | Medium | Load testing, capacity planning |
| Integration Failures | Medium | Medium | Circuit breakers, graceful degradation |

---

## 10. Success Criteria & KPIs

### 10.1 Technical KPIs

```python
TECHNICAL_KPIS = {
    'performance': {
        'query_response_time_p95': '<2 minutes',
        'ingestion_throughput': '>50 meetings/minute',
        'system_availability': '>99.9%',
        'error_rate': '<1%'
    },
    'quality': {
        'extraction_f1_score': '>0.85',
        'query_relevance_score': '>4.2/5',
        'false_positive_rate': '<5%',
        'context_completeness': '>80%'
    },
    'efficiency': {
        'cache_hit_rate': '>60%',
        'compute_utilization': '60-80%',
        'storage_efficiency': '>70%',
        'cost_per_query': '<$0.10'
    }
}
```

### 10.2 Business KPIs

```python
BUSINESS_KPIS = {
    'user_adoption': {
        'daily_active_users': '>100',
        'queries_per_user_per_day': '>5',
        'user_retention_30d': '>80%',
        'nps_score': '>40'
    },
    'value_delivery': {
        'meeting_prep_time_saved': '>75%',
        'missed_commitments_caught': '>90%',
        'decision_retrieval_accuracy': '>95%',
        'roi': '>300%'
    },
    'operational': {
        'meetings_processed_daily': '>500',
        'unique_projects_tracked': '>50',
        'average_query_complexity': '>3 hops',
        'insights_acted_upon': '>60%'
    }
}
```

---

## 11. Appendices

### A. Sample Queries and Expected Responses

```python
SAMPLE_QUERIES = [
    {
        'query': "What slides do I need to add for tomorrow's board deck?",
        'expected_capabilities': [
            'Identify current deck contents',
            'Find unfulfilled slide commitments',
            'Recognize discussed but unassigned topics',
            'Check for deadline/content updates',
            'Identify dependencies on others'
        ]
    },
    {
        'query': "How has our pricing strategy evolved over the last quarter?",
        'expected_capabilities': [
            'Track pricing discussions chronologically',
            'Identify decision points and rationale',
            'Show superseded decisions',
            'Link to market feedback discussions',
            'Highlight unresolved questions'
        ]
    },
    {
        'query': "What are the blockers for the Q2 product launch?",
        'expected_capabilities': [
            'Aggregate risks from multiple meetings',
            'Track mitigation status',
            'Identify dependency chains',
            'Surface unassigned issues',
            'Prioritize by impact'
        ]
    }
]
```

### B. Prompt Engineering Guidelines

```python
PROMPT_PRINCIPLES = {
    'clarity': 'Use specific, unambiguous language',
    'structure': 'Organize with clear sections and numbering',
    'examples': 'Provide 2-3 examples of expected output',
    'constraints': 'Explicitly state what NOT to do',
    'format': 'Specify exact output format (JSON schema)',
    'validation': 'Include self-check instructions',
    'context': 'Provide sufficient background information'
}

PROMPT_TEMPLATE = '''
You are a Meeting Intelligence Analyst. Your task is to {task_description}.

## Context
{relevant_context}

## Instructions
1. {instruction_1}
2. {instruction_2}
...

## Expected Output Format
{output_schema}

## Examples
{examples}

## Important Notes
- {constraint_1}
- {constraint_2}

## Self-Validation
Before returning your response, verify:
- {validation_check_1}
- {validation_check_2}
'''
```

### C. Integration Specifications

```yaml
# Meeting Platform Integrations (Phase 2)
integrations:
  microsoft_teams:
    api_version: "v1.0"
    auth_method: "OAuth 2.0"
    permissions:
      - OnlineMeetings.Read
      - OnlineMeetingTranscript.Read.All
    webhook_events:
      - meeting.ended
      - transcript.ready
      
  zoom:
    api_version: "v2"
    auth_method: "Server-to-Server OAuth"
    permissions:
      - meeting:read
      - recording:read
    webhook_events:
      - meeting.ended
      - recording.completed
      
  google_meet:
    api_version: "v1"
    auth_method: "Service Account"
    permissions:
      - calendar.readonly
      - drive.readonly
    polling_interval: "5 minutes"
```

### D. Glossary

| Term | Definition |
|------|------------|
| **Memory Object** | Atomic unit of extracted meeting intelligence |
| **Temporal Marker** | Reference to time-based context (past/future) |
| **Evolution Chain** | Sequence showing how a topic/decision changed |
| **Context Graph** | Assembled memories with relationships |
| **Confidence Score** | Weighted measure of response completeness |
| **Gap Analysis** | Identification of missing information/actions |
| **Iterative Refinement** | Progressive context building through multiple queries |
| **Dual-Store Architecture** | Combined vector (Weaviate) and graph (Neo4j) storage |
| **GraphRAG** | Retrieval using both embeddings and relationships |

---

## 12. Conclusion

This Meeting Intelligence System represents a paradigm shift in how organizations capture and leverage meeting knowledge. By combining temporal awareness, iterative intelligence, and sophisticated context assembly, it transforms raw conversations into actionable business intelligence.

The system's strength lies not in simple search or summarization, but in understanding the complex web of commitments, decisions, and evolving topics that define organizational knowledge. It serves as an intelligent partner that understands not just what was said, but what it means in context and what needs to happen next.

Success depends on careful implementation of the dual-store architecture, thoughtful prompt engineering, and continuous refinement based on user feedback. The phased approach allows for incremental value delivery while building toward the full vision of temporal meeting intelligence.
