# Detailed Implementation Task Plan - Temporal Meeting Intelligence

## Task Breakdown (Function-Level Detail)

### Phase 2.1: Core Question Extraction (CRITICAL)

**File**: `/meeting-intelligence/src/ingestion/core_question_extractor.py`

```python
class CoreQuestionExtractor:
    def __init__(self):
        self.friction_patterns = [
            r"(still|remain|continue)\s+(blocked|stuck|waiting)",
            r"need\s+(decision|approval|answer)",
            r"can't\s+(move forward|proceed|continue)",
            r"waiting\s+for\s+(decision|approval|answer)"
        ]
    
    def extract_core_question(self, chunk: MemoryChunk) -> Optional[Dict]:
        """Extract friction signals and convert to core questions"""
        # 1. Detect friction signals using regex patterns
        # 2. Extract context around friction
        # 3. Use LLM to convert to specific question
        # 4. Analyze impact on team/project
        # 5. Return structured core question data
    
    def _detect_friction_signals(self, content: str) -> List[Dict]:
        """Find friction indicators in content"""
        # Implementation needed
        
    def _extract_core_question_llm(self, friction_context: str) -> str:
        """Use LLM to extract specific question from friction"""
        # Prompt: "Convert this friction signal to a specific question"
        # Implementation needed
        
    def _analyze_impact(self, question: str, context: str) -> str:
        """Determine impact of unresolved question"""
        # Implementation needed
```

**Tasks**:
1. Implement friction pattern detection
2. Create LLM prompt for question extraction  
3. Add impact analysis logic
4. Store core_question as Chunk property
5. Test with sample friction scenarios

### Phase 2.2: Enhanced Implicit Reference Resolution (CRITICAL)

**File**: `/meeting-intelligence/src/ingestion/implicit_reference_resolver.py`

```python
class ImplicitReferenceResolver:
    def __init__(self):
        self.implicit_patterns = [
            r"the original (\w+)",
            r"that (\w+) we discussed",
            r"our (\w+) approach", 
            r"the (\w+) from last time"
        ]
    
    def resolve_implicit_references(self, chunk: MemoryChunk, historical_context: List[Dict]) -> List[Dict]:
        """Resolve vague references with confidence decay"""
        # 1. Extract implicit reference patterns
        # 2. Find candidates from historical context
        # 3. Apply confidence decay based on time distance
        # 4. Score candidates by semantic similarity
        # 5. Return resolved references with confidence
        
    def _find_candidates(self, reference: str, historical_context: List[Dict]) -> List[Dict]:
        """Find potential targets for implicit reference"""
        # Implementation needed
        
    def _apply_confidence_decay(self, candidates: List[Dict], time_distance_days: int) -> List[Dict]:
        """Apply exponential confidence decay"""
        # confidence *= math.exp(-0.1 * time_distance)
        # Implementation needed
        
    def _score_semantic_similarity(self, reference: str, candidates: List[Dict]) -> List[Dict]:
        """Score candidates by semantic similarity"""
        # Implementation needed
```

**Tasks**:
1. Implement pattern extraction for implicit references
2. Build candidate finding logic
3. Add confidence decay calculation
4. Create semantic similarity scoring
5. Test with real meeting examples

### Phase 2.3: Date Calculation Implementation (USER REQUIREMENT)

**File**: `/meeting-intelligence/src/ingestion/temporal_date_calculator.py`

```python
class TemporalDateCalculator:
    def __init__(self):
        self.relative_patterns = {
            "last_week": r"last\s+week",
            "next_friday": r"next\s+friday",
            "yesterday": r"yesterday",
            "by_end_month": r"by\s+(end\s+of\s+)?month"
        }
    
    def calculate_actual_dates(self, temporal_refs: List[str], reference_date: datetime) -> Dict[str, datetime]:
        """Convert temporal references to actual dates"""
        # 1. Parse each temporal reference
        # 2. Calculate actual date based on reference_date
        # 3. Handle edge cases (weekends, month boundaries)
        # 4. Return mapping of reference → actual date
        
    def _calculate_last_week(self, reference_date: datetime) -> Dict[str, datetime]:
        """Calculate last week date range"""
        # Monday to Sunday of previous week
        # Implementation needed
        
    def _calculate_next_friday(self, reference_date: datetime) -> datetime:
        """Calculate next Friday date"""
        # Handle if reference_date is Friday
        # Implementation needed
        
    def _calculate_relative_date(self, pattern: str, reference_date: datetime) -> datetime:
        """Generic relative date calculation"""
        # Implementation needed
```

**Tasks**:
1. Implement date calculation for common patterns
2. Handle edge cases and ambiguity
3. Add support for business days vs calendar days
4. Test with various reference dates
5. Integrate with TemporalExtractor

### Phase 2.4: Unresolved Thread Tracking

**File**: `/meeting-intelligence/src/analysis/unresolved_thread_tracker.py`

```python
class UnresolvedThreadTracker:
    def __init__(self, neo4j: Neo4jClient) -> None:
        self.neo4j_driver = neo4j.driver

    def track_unresolved_threads(self, chunks: List[TemporalMemoryChunk]) -> Dict[str, List[Dict]]:
        """Identify unanswered questions and unresolved issues"""
        # Implementation described in requirements
```

**Tasks**:
1. Implement `_find_answer_for_question` to match answers with questions
2. Implement `_check_future_meetings` using Neo4j queries
3. Aggregate unresolved items by days outstanding
4. Integrate tracker results into reports
5. Add tests covering unanswered question detection

### Phase 3.1: DualStorageManager (CRITICAL - v3 Core)

**File**: `/meeting-intelligence/src/storage/dual_storage_manager.py`

```python
class DualStorageManager:
    def __init__(self, weaviate_url: str, neo4j_uri: str, neo4j_auth: tuple):
        # Initialize both clients with connection pooling
        # Set up schemas if they don't exist
        # Implement health checking
        
    async def store_meeting(self, meeting: Meeting, chunks: List[MemoryChunk]) -> bool:
        """Store meeting in both databases with transaction consistency"""
        # 1. Validate input data
        # 2. Begin transaction (manual coordination)
        # 3. Store in Weaviate
        # 4. Store in Neo4j with relationships
        # 5. Create temporal links
        # 6. Commit or rollback on failure
        
    async def store_memory_chunk(self, chunk: MemoryChunk) -> bool:
        """Store individual chunk in both stores"""
        # Implementation needed
        
    async def create_temporal_relationship(self, from_chunk: str, to_chunk: str, rel_type: str, properties: Dict) -> bool:
        """Create temporal relationship in Neo4j"""
        # Implementation needed
        
    async def semantic_search(self, query: str, filters: Optional[Dict] = None, limit: int = 20) -> List[MemoryChunk]:
        """Search Weaviate for relevant chunks"""
        # 1. Build where filter from filters dict
        # 2. Execute vector search
        # 3. Convert results to MemoryChunk objects
        # 4. Apply post-processing filters
        
    async def graph_traversal(self, start_nodes: List[str], relationships: List[str], max_depth: int = 3) -> Dict:
        """Traverse Neo4j graph for temporal context"""
        # 1. Build Cypher query for traversal
        # 2. Execute with parameters
        # 3. Process results into structured format
        # 4. Handle large result sets
        
    def _ensure_schemas(self):
        """Ensure both database schemas exist"""
        # Weaviate schema creation
        # Neo4j constraints and indexes
        # Implementation needed
        
    def _create_weaviate_object(self, chunk: MemoryChunk) -> Dict:
        """Convert MemoryChunk to Weaviate object"""
        # Implementation needed
        
    def _create_neo4j_nodes_and_relationships(self, meeting: Meeting, chunks: List[MemoryChunk]):
        """Create Neo4j graph structure"""
        # Implementation needed
```

**Tasks**:
1. Implement dual-store coordination with consistency
2. Build Weaviate operations (store, search, update)
3. Build Neo4j operations (store, traverse, relationships)
4. Add transaction management across both stores
5. Implement error handling and rollback
6. Add connection pooling and health checks
7. Test with concurrent operations

### Phase 3.2: Query Orchestration Engine (CRITICAL - v3 Core)

**File**: `/meeting-intelligence/src/query/temporal_query_orchestrator.py`

```python
class TemporalQueryOrchestrator:
    def __init__(self, storage_manager: DualStorageManager):
        self.storage = storage_manager
        self.llm_client = OpenAI()
        
    async def process_query(self, query: str, user_context: Optional[Dict] = None) -> TemporalQueryResult:
        """Main query processing pipeline"""
        # 1. Understand query intent and temporal scope
        # 2. Plan retrieval strategy
        # 3. Execute dual retrieval (Weaviate + Neo4j)
        # 4. Iterative refinement if needed
        # 5. Assemble temporal response
        # 6. Generate follow-up suggestions
        
    async def _understand_query_intent(self, query: str, user_context: Optional[Dict]) -> Dict:
        """Analyze query to understand intent and scope"""
        # LLM prompt to classify:
        # - Primary intent (specific_interaction, technical_content, evolution_tracking, etc.)
        # - Temporal scope (current_only, historical, evolution)
        # - People involved (speaker, addressed_to)
        # - Technical focus (artifact_type, version_interest)
        # Implementation needed
        
    async def _plan_retrieval_strategy(self, intent: Dict) -> Dict:
        """Plan how to retrieve information based on intent"""
        # Determine:
        # - Weaviate search parameters
        # - Neo4j traversal requirements  
        # - Need for iterative refinement
        # - Expected result format
        # Implementation needed
        
    async def _execute_dual_retrieval(self, query: str, strategy: Dict) -> Tuple[List[MemoryChunk], Dict]:
        """Execute coordinated retrieval from both stores"""
        # 1. Parallel execution of Weaviate search and Neo4j traversal
        # 2. Initial result fusion
        # 3. Gap identification
        # Implementation needed
        
    async def _iterative_refinement(self, initial_results: Tuple, query: str, intent: Dict) -> Tuple[List[MemoryChunk], Dict]:
        """Refine results through additional queries if needed"""
        # 1. Identify gaps in temporal context
        # 2. Generate refinement queries
        # 3. Execute additional searches
        # 4. Merge results
        # Implementation needed
        
    async def _assemble_temporal_response(self, chunks: List[MemoryChunk], temporal_context: Dict, intent: Dict, query: str) -> str:
        """Generate final response with temporal awareness"""
        # LLM prompt based on intent type:
        # - For evolution_tracking: show progression timeline
        # - For technical_content: format structured data
        # - For specific_interaction: provide precise answer with attribution
        # Implementation needed
```

**Tasks**:
1. Implement query intent understanding with LLM
2. Build retrieval strategy planning
3. Coordinate dual retrieval (parallel execution)
4. Add iterative refinement logic
5. Create temporal-aware response assembly
6. Test with various query types
7. Optimize for performance

### Phase 3.3: Expertise Modeling (USER REQUIREMENT)

**File**: `/meeting-intelligence/src/analysis/expertise_analyzer.py`

```python
class ExpertiseAnalyzer:
    def __init__(self, storage_manager: DualStorageManager):
        self.storage = storage_manager
        
    async def analyze_expertise_nightly(self):
        """Nightly batch process to analyze expertise patterns"""
        # 1. Group meetings by category (standup, review, planning)
        # 2. For each category, analyze speaking patterns
        # 3. Weight expertise by speaking time, technical depth, decision influence
        # 4. Create/update (Person)-[:EXPERT_IN]->(Topic) relationships
        # 5. Track expertise evolution over time
        
    async def _analyze_speaking_patterns(self, meeting_category: str) -> Dict[str, Dict]:
        """Analyze who speaks about what in specific meeting types"""
        # Query Neo4j for meeting patterns
        # Calculate speaking time per topic per person
        # Implementation needed
        
    async def _calculate_expertise_scores(self, speaking_patterns: Dict) -> Dict[str, Dict]:
        """Calculate expertise scores based on multiple factors"""
        # Factors:
        # - Speaking time on topic
        # - Technical depth of contributions
        # - Decision influence (how often their suggestions are adopted)
        # - Consistency across meetings
        # Implementation needed
        
    async def _update_expertise_graph(self, expertise_scores: Dict):
        """Update Neo4j with expertise relationships"""
        # Create/update (Person)-[:EXPERT_IN {confidence, category, last_updated}]->(Topic)
        # Track expertise changes over time
        # Implementation needed
        
    async def _track_expertise_evolution(self, person: str, topic: str) -> Dict:
        """Track how person's expertise in topic has evolved"""
        # Implementation needed
```

**Tasks**:
1. Implement nightly batch analysis
2. Build speaking pattern analysis
3. Create expertise scoring algorithm
4. Update Neo4j with expertise relationships
5. Add expertise evolution tracking
6. Schedule as cron job

### Phase 4.1: Predictive Context Assembly (USER REQUIREMENT)

**File**: `/meeting-intelligence/src/prediction/predictive_context_assembler.py`

```python
class PredictiveContextAssembler:
    def __init__(self, storage_manager: DualStorageManager, query_processor: TemporalQueryOrchestrator):
        self.storage = storage_manager
        self.query_processor = query_processor
        
    async def enhance_query_response(self, query: str, answer: str, context: Dict) -> Dict:
        """Add predictive insights to query response"""
        # 1. Predict likely follow-up questions
        # 2. Identify preparation needs
        # 3. Find unresolved threads
        # 4. Calculate prediction confidence
        
    async def _predict_follow_up_questions(self, query: str, answer: str, context: Dict) -> List[PredictedQuestion]:
        """Predict what user will likely ask next"""
        # Method 1: Pattern-based from Neo4j (historical question sequences)
        # Method 2: LLM-based prediction 
        # Method 3: Rule-based (data model changes → migration questions)
        # Implementation needed
        
    async def _identify_preparation_needs(self, predicted_questions: List) -> List[PreparationItem]:
        """Identify what user needs to prepare for predicted questions"""
        # Analyze each predicted question
        # Determine data/people/documents needed
        # Create actionable preparation items
        # Implementation needed
        
    async def _find_unresolved_threads(self, context: Dict) -> List[Dict]:
        """Find questions/issues that were never resolved"""
        # Query Neo4j for questions without resolution
        # Filter by relevance to current context
        # Calculate urgency/importance
        # Implementation needed
        
    async def generate_meeting_prep_brief(self, meeting_info: Dict, user_email: str) -> Dict:
        """Generate preparation brief for upcoming meeting"""
        # 1. Analyze historical patterns for similar meetings
        # 2. Predict likely questions from each participant
        # 3. Generate preparation checklist
        # 4. Find relevant unresolved items
        # Implementation needed
```

**Tasks**:
1. Implement follow-up question prediction
2. Build preparation need analysis
3. Create unresolved thread detection
4. Generate meeting prep briefs
5. Add confidence scoring for predictions
6. Test with real meeting scenarios

### Phase 5.1: FastAPI Implementation

**File**: `/meeting-intelligence/src/api/main.py`

```python
@app.post("/meetings/ingest")
async def ingest_meeting(meeting: MeetingIngest, background_tasks: BackgroundTasks):
    """Ingest meeting transcript with full temporal processing"""
    # 1. Validate input
    # 2. Extract temporal chunks
    # 3. Apply core question extraction
    # 4. Resolve implicit references  
    # 5. Store in dual storage
    # 6. Return processing status
    
@app.post("/query")
async def process_query(query: Query) -> TemporalQueryResponse:
    """Main query endpoint with temporal intelligence"""
    # 1. Use TemporalQueryOrchestrator
    # 2. Apply predictive enhancements
    # 3. Format response with temporal context
    # 4. Include follow-up suggestions
    
@app.post("/query/predictive")
async def query_with_predictions(query: Query) -> PredictiveQueryResponse:
    """Enhanced query with predictive insights"""
    # 1. Process standard query
    # 2. Add predictive context assembly
    # 3. Include preparation recommendations
    # 4. Show unresolved threads
    
@app.get("/meetings/{meeting_id}/prep-brief")
async def get_meeting_prep_brief(meeting_id: str, user_email: str):
    """Generate preparation brief for upcoming meeting"""
    # Implementation using PredictiveContextAssembler
```

**Tasks**:
1. Implement all API endpoints
2. Add request validation and error handling
3. Create response models
4. Add authentication and rate limiting
5. Document API with OpenAPI
6. Test with Postman/automated tests

## Critical Integration Points

### Data Flow Integration
1. **Ingestion** → **Core Question Extraction** → **Implicit Reference Resolution** → **Dual Storage**
2. **Query** → **Intent Understanding** → **Dual Retrieval** → **Context Assembly** → **Predictive Enhancement** → **Response**

### Testing Strategy
1. **Unit tests**: Each class/function tested independently
2. **Integration tests**: Full pipeline testing with real data
3. **Performance tests**: Load testing with concurrent operations
4. **Validation tests**: Accuracy testing with ground truth

### Dependencies & Order
1. Must complete DualStorageManager before query processing
2. Core question extraction can be developed in parallel
3. Predictive features depend on having historical data
4. API layer depends on all core components

This detailed plan provides function-level implementation guidance while maintaining the architectural integrity of the v3 specification.