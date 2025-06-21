# CImplementation Guide - Meeting Intelligence System

## Overview

This guide helps you implement the Meeting Intelligence System using Codex breaking down the comprehensive requirements into focused, manageable tasks that play to Codex's strengths.

---

## Initial Setup

### Step 1: Project Initialization

**First Prompt to Codex:**
```
Create a new Python project for a Temporal Meeting Intelligence System with this structure:

temporal-meeting-intelligence/
├── README.md
├── requirements.txt
├── docker-compose.yml
├── .env.example
├── .gitignore
├── temporal-meeting-intelligence-requirements.md [I'll provide this file]
├── src/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── memory_objects.py
│   │   ├── weaviate_schemas.py
│   │   └── neo4j_models.py
│   ├── ingestion/
│   │   ├── __init__.py
│   │   ├── email_parser.py
│   │   └── memory_factory.py
│   ├── storage/
│   │   ├── __init__.py
│   │   ├── weaviate_client.py
│   │   └── neo4j_client.py
│   └── config/
│       ├── __init__.py
│       └── settings.py
├── tests/
│   └── __init__.py
└── examples/
    └── sample_meeting.eml

Use Python 3.11+, include type hints, and set up a basic README with project description.
```

### Step 2: Docker Environment

**Next Prompt:**
```
Create a docker-compose.yml that sets up:
1. Weaviate 1.24+ with text2vec-openai module enabled
2. Neo4j 5.x Community Edition
3. Redis for caching
4. A Python development container for our app

Include proper environment variables, volume mounts, and networking. Also create a .env.example with all needed configuration variables.
```

---

## Phase 1: Foundation (Weeks 1-4)

### Task 1: Data Models (Reference: Requirements Section 2.1.3, 2.2)

**Prompt:**
```
Looking at temporal-meeting-intelligence-requirements.md sections 2.1.3 and 2.2, implement:

1. In models/memory_objects.py:
   - Create the MemoryObject Pydantic model with all fields from the schema
   - Add MemoryType enum (Decision, Action, Topic, Question, Commitment, Reference, Risk, Temporal)
   - Include validation for confidence scores and temporal references

2. In models/weaviate_schemas.py:
   - Define the Weaviate class schemas for MemoryObject and Meeting
   - Include all properties with correct data types and indexing settings
   - Add the text2vec-openai configuration

3. In models/neo4j_models.py:
   - Create node classes for Meeting, Person, Artifact, Decision, ActionItem, Topic
   - Define relationship types as enums
   - Include methods for creating Cypher queries
```

### Task 2: Storage Clients

**Prompt:**
```
Implement the storage layer clients:

1. In storage/weaviate_client.py:
   - Create WeaviateClient class with connection management
   - Add methods for creating schemas, storing memory objects, and searching
   - Include vector search and hybrid search capabilities
   - Add proper error handling and retries

2. In storage/neo4j_client.py:
   - Create Neo4jClient class with connection pooling
   - Add methods for creating nodes and relationships
   - Include graph traversal queries up to 3 hops
   - Add temporal relationship tracking
```

### Task 3: Email Parser

**Prompt:**
```
In ingestion/email_parser.py, create an EmailParser class that:
1. Parses .eml files to extract meeting metadata and transcript text
2. Handles various email formats and encodings
3. Extracts participant information from headers
4. Identifies meeting date/time from various formats
5. Returns a structured MeetingData object

Include comprehensive error handling for malformed emails.
```

### Task 4: Basic Memory Factory

**Prompt:**
```
In ingestion/memory_factory.py, implement a MemoryFactory that:
1. Takes parsed meeting text and metadata
2. Uses OpenAI API to extract 8-15 memory objects per meeting
3. Implements the extraction prompt from requirements section 2.1.2
4. Validates extracted data against our Pydantic models
5. Calculates confidence scores
6. Returns a list of validated MemoryObject instances

Include the prompt template as a configurable constant.
```

### Task 5: Configuration Management

**Prompt:**
```
In config/settings.py, create a Settings class using Pydantic that manages:
1. API keys (OpenAI, OpenRouter)
2. Database connection strings
3. Model selection and parameters
4. Processing limits and timeouts
5. Feature flags for different phases

Load from environment variables with sensible defaults.
```

### Task 6: Ingestion Pipeline

**Prompt:**
```
Create src/ingestion/pipeline.py that orchestrates the full ingestion flow:
1. Accept .eml file path or content
2. Parse email using EmailParser
3. Extract memories using MemoryFactory
4. Generate embeddings for vector search
5. Store in both Weaviate and Neo4j
6. Build relationships in Neo4j
7. Return ingestion summary with statistics

Include logging, error handling, and transaction management.
```

### Task 7: Test Data and Scripts

**Prompt:**
```
Create testing infrastructure:

1. In examples/, add 3 sample .eml files representing different meeting types
2. In tests/test_ingestion.py, create unit tests for the parser and memory factory
3. Create scripts/ingest_sample.py that processes the example emails
4. Create scripts/verify_storage.py that confirms data is correctly stored
```

---

## Phase 2: Intelligence Layer (Weeks 5-8)

### Task 8: Advanced Memory Extraction

**Prompt:**
```
Enhance the MemoryFactory to implement temporal awareness from the requirements:

1. Add temporal marker detection (references to past/future meetings)
2. Implement entity linking (people, artifacts, projects)
3. Add emotion and confidence detection
4. Create relationship extraction between memory objects
5. Implement the full extraction schema from section 2.1.2

Update the prompts to capture the nuanced context described in the requirements.
```

### Task 9: Query Orchestrator Foundation

**Prompt:**
```
Create src/query/orchestrator.py implementing the initial query processing:

1. QueryPlan class that analyzes user queries (section 2.3.1)
2. Identify query type, temporal scope, and entities mentioned
3. Infer implicit needs (like checking commitments when asking about slides)
4. Generate initial Weaviate and Neo4j queries
5. Return structured query plan

Reference the UC examples from requirements section 1.2.
```

### Task 10: Context Builder v1

**Prompt:**
```
Create src/query/context_builder.py with basic context assembly:

1. Execute vector searches in Weaviate
2. Run graph queries in Neo4j
3. Combine results into a ContextGraph structure
4. Handle deduplication by customId
5. Calculate basic relevance scores

This is the simple version before iterative refinement.
```

---

## Phase 3: Advanced Capabilities (Weeks 9-12)

### Task 11: Iterative Query Refinement

**Prompt:**
```
Implement the full IterativeContextBuilder from requirements section 2.3.2:

1. Add gap analysis - identify missing context
2. Generate refined queries based on gaps
3. Implement the iterative loop (max 5 iterations)
4. Add relationship expansion up to 3 hops
5. Include temporal chain building

This is where the system gets smart about finding hidden connections.
```

### Task 12: LLM Orchestration

**Prompt:**
```
Create src/llm/orchestrator.py implementing the OpenRouter integration:

1. Model selection based on query complexity
2. Prompt management for different operations
3. Token budget tracking
4. Fallback handling between models
5. Response parsing and validation

Use the configuration from requirements section 4.3.
```

### Task 13: Response Assembly

**Prompt:**
```
Create src/assembly/response_generator.py that implements the final response generation:

1. Take assembled context and create nuanced responses
2. Include temporal evolution narratives
3. Add source attribution and confidence scores
4. Format for different output types (JSON, Markdown, HTML)
5. Implement the response template from section 2.4.2

The responses should match the quality shown in the example in section 2.4.2.
```

### Task 14: API Layer

**Prompt:**
```
Create src/api/main.py using FastAPI:

1. POST /ingest - Accept .eml files for processing
2. POST /ask - Handle natural language queries
3. GET /context/{query_id} - Retrieve assembled context
4. GET /health - System health check
5. WebSocket /ask/stream - Streaming responses

Include authentication, rate limiting, and OpenAPI documentation.
```

---

## Testing Strategy

### Integration Test Suite

**Prompt:**
```
Create comprehensive integration tests in tests/integration/:

1. Test the full ingestion pipeline with various email formats
2. Test complex queries requiring multiple iterations
3. Test temporal queries that span multiple meetings
4. Test error scenarios and recovery
5. Create performance benchmarks

Use the test scenarios from requirements section 6.1.
```

### Quality Validation

**Prompt:**
```
Create scripts/validate_quality.py that:

1. Runs the quality metrics from requirements section 6.2
2. Calculates extraction precision/recall
3. Measures response relevance and completeness
4. Tracks temporal accuracy
5. Generates a quality report

This helps ensure we meet the 70% confidence target.
```

---

## Deployment Preparation

### Production Configuration

**Prompt:**
```
Create production deployment configuration:

1. kubernetes/ directory with Helm charts
2. Production Dockerfiles with multi-stage builds  
3. GitHub Actions workflows for CI/CD
4. Monitoring setup with Grafana dashboards
5. Terraform scripts for cloud resources

Follow the deployment architecture from requirements section 4.2.
```

---

## Tips for Success with Claude Code

### 1. Incremental Development
- Complete each task fully before moving to the next
- Test each component in isolation
- Commit working code frequently

### 2. Use the Requirements
- Reference specific sections when asking questions
- Keep the requirements file in the project root
- Quote exact schemas and specifications

### 3. Debugging with Claude Code
```
When something isn't working, can you:
1. Check the logs for errors
2. Add debug print statements
3. Verify the data flow
4. Test with simpler inputs
```

### 4. Performance Optimization
```
This query is taking too long. Can you:
1. Profile the code to find bottlenecks
2. Add caching where appropriate
3. Optimize the database queries
4. Implement batch processing
```

### 5. Managing Complexity
- Build simple versions first, then enhance
- Use clear function and variable names
- Add comprehensive docstrings
- Create helper utilities for common tasks

---

## Common Pitfalls to Avoid

1. **Don't try to build everything at once** - Follow the phases
2. **Don't skip error handling** - Add it from the start
3. **Don't hardcode configurations** - Use environment variables
4. **Don't ignore performance** - Test with realistic data volumes
5. **Don't forget logging** - It's crucial for debugging

---

## Success Checklist

### Phase 1 Complete When:
- [ ] Can ingest .eml files and extract memories
- [ ] Memories are stored in both Weaviate and Neo4j
- [ ] Basic searches return relevant results
- [ ] All models have validation and type hints
- [ ] Docker environment runs smoothly

### Phase 2 Complete When:
- [ ] Temporal markers are properly extracted
- [ ] Relationships are tracked in Neo4j
- [ ] Basic query orchestration works
- [ ] Context assembly returns relevant memories
- [ ] API endpoint accepts queries

### Phase 3 Complete When:
- [ ] Iterative refinement improves results
- [ ] Complex temporal queries work correctly
- [ ] Confidence scoring is accurate
- [ ] Response quality meets requirements
- [ ] System handles edge cases gracefully

---

## Next Steps

1. Save this guide as `claude-code-guide.md` in your project
2. Save the requirements as `temporal-meeting-intelligence-requirements.md`
3. Start with the Project Initialization prompt
4. Work through Phase 1 tasks sequentially
5. Test thoroughly before moving to Phase 2

Remember: Claude Code excels at creating well-structured code, managing files, and debugging. Use it as your coding partner, referencing the requirements and this guide to stay on track.

Good luck with your implementation! 🚀
