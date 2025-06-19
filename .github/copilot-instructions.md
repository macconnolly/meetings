# GitHub Copilot Instructions for Enhanced Meeting Intelligence System

## Project Context
You are working on the **Enhanced Meeting Intelligence System** - a sophisticated system that transforms meeting transcripts into searchable memory objects and enables rapid deliverable preparation through advanced context assembly.

## Primary Reference Documents
1. **`TASK_TRACKER.md`** - Complete implementation roadmap with 40-59 development days of detailed tasks
2. **`meetings.md`** - Complete technical specification (5061 lines) with schemas, examples, and implementation details
3. **Current codebase** in `src/core/`, `src/utils/`, `config/`, and `test/` directories

## System Architecture Overview
```
EmailProcessor → AIProcessor → MemoryFactory → SupermemoryClient
                     ↓
               ContextAssembler (searches memories to assemble deliverable context)
                     ↓
              Helper Functions (analysis, scoring, risk assessment)
```

## Core Components Implementation Status

### ✅ COMPLETED
- Basic pipeline (EmailProcessor, AIProcessor, MemoryFactory, SupermemoryClient)
- Memory creation and Supermemory API integration
- Basic helper functions and configuration

### 🚧 IN PROGRESS (refer to TASK_TRACKER.md for detailed tasks)
- **Phase 14**: Complete schema implementation (`config/schema.js`)
- **Phase 15**: ContextAssembler implementation (`src/core/ContextAssembler.js`)
- **Phase 16**: Rich memory content generation (enhanced `MemoryFactory.js`)
- **Phase 17**: Advanced helper functions (`src/utils/helpers.js`)

## Copilot Coding Guidelines

### 1. Schema and Data Structures
When working with meeting data or memory objects, ALWAYS refer to:
- **Complete schema**: `meetings.md` lines 18-800 for all required properties
- **Memory object structure**: Base format with `content`, `userId`, `containerTags`, `metadata`, `customId`
- **Container tags**: Use `calculateContainerTags()` helper function, always include `["org_main", projectCode, contentType]`

### 2. ContextAssembler Implementation
When implementing ContextAssembler features:
- **7 search query types**: stakeholder_intelligence, deliverable_specifications, decision_context, implementation_insights, cross_project_context, action_context, risk_context
- **Search query format**: `{ q: "search terms", containerTags: [...], filters: {...}, limit: number }`
- **Context enhancement**: Implement all helper methods listed in TASK_TRACKER.md Phase 15.3
- **Confidence scoring**: Use weighted algorithm (deliverable_specifications: 30%, stakeholder_intelligence: 25%, etc.)

### 3. Memory Content Generation
When generating memory content:
- **Rich markdown format**: Follow templates in `meetings.md` lines 1202-2200 for each memory type
- **Required sections**: Each memory type has specific required markdown sections (## headers)
- **Metadata completeness**: Include ALL metadata fields specified for each content type
- **Container tags**: Use content-specific tags (e.g., `approved-decisions`, `owner-${slugify(owner)}`)

### 4. Helper Functions
When implementing analysis functions:
- **Scoring ranges**: Most scores are 1-5 or 1-10, with specific calculation logic
- **Risk assessment**: Use 5-point scale (1=low, 5=high) with documented criteria
- **Communication analysis**: Generate actionable recommendations based on stakeholder preferences
- **Content analysis**: Extract topics, relationships, and patterns using keyword matching

### 5. API Integration Patterns
When working with SupermemoryClient:
- **Rate limiting**: ALWAYS use `rateLimitManager.executeWithRateLimit()` for API calls
- **Error handling**: Implement retry logic and graceful degradation
- **Batch operations**: Process in chunks with progress logging
- **Search API**: Use POST `/v3/memories/list` with JSON body (not GET with query params)

### 6. Testing Patterns
When writing tests:
- **Integration tests**: Test full pipeline with sample data from `test/fixtures/`
- **Unit tests**: Test individual helper functions with edge cases
- **Performance tests**: Validate 20 meetings/day and 15-minute context assembly targets
- **Validation tests**: Ensure memory content matches specification format

## Code Generation Rules

### Variable Naming
- Use camelCase for functions and variables
- Use snake_case for metadata fields (matching schema)
- Use kebab-case for container tags
- Use UPPER_CASE for constants

### Function Signatures
```javascript
// Memory creation functions
function create[Type]Memories(meetingData) → Array<MemoryObject>

// Analysis functions  
function calculate[Metric](inputData) → number (1-10 scale)
function assess[Risk]Risk(inputData) → number (1-5 scale)
function extract[Content](inputData) → Array<string>

// ContextAssembler methods
async assembleDeliverableContext(deliverableRequest) → ContextPackage
async executeSearchQueries(searchQueries) → Object
enhanceContextPackage(contextPackage, deliverableRequest) → EnhancedContext
```

### Error Handling Pattern
```javascript
try {
  const result = await operation();
  this.logger.info('Operation successful', { details });
  return result;
} catch (error) {
  this.logger.error('Operation failed', { error: error.message, context });
  throw new Error(`Specific error description: ${error.message}`);
}
```

## Key Implementation References

### Memory Object Template
```javascript
{
  content: "# Title\n\n## Section\nContent...",
  userId: "organization_main",
  containerTags: calculateContainerTags(meetingData, contentType, objectData),
  metadata: {
    content_type: "executive_summary|decision|action_item|stakeholder_intelligence|deliverable_intelligence|entity_relationship|implementation_insights|cross_project",
    meeting_id: meetingData.meeting_id,
    project: extractProjectCode(meetingData.meeting_id),
    date: meetingData.meeting_date,
    // Type-specific fields...
  },
  customId: `${meetingData.meeting_id}|${contentType}|${uniqueKey}`
}
```

### Search Query Template
```javascript
{
  name: "search_category",
  query: {
    q: `${deliverableRequest.topic} relevant search terms`,
    containerTags: ["org_main", "category-specific"],
    filters: {
      AND: [
        { key: "content_type", value: "target_type", negate: false },
        { key: "specific_field", value: "target_value", negate: false }
      ]
    },
    limit: 15
  }
}
```

## Development Priorities
Refer to TASK_TRACKER.md for current implementation priorities:
1. **Phase 14**: Complete schema (5-7 days)
2. **Phase 15**: ContextAssembler (8-12 days)  
3. **Phase 16**: Rich memory content (10-15 days)
4. **Phase 17**: Advanced helpers (6-8 days)

## Success Criteria
- Process 20 meetings/day generating 8-15 memory objects each
- Assemble deliverable context in <15 minutes with >60% confidence
- All memory content matches `meetings.md` specification format
- All tests pass with proper error handling and performance benchmarks

When suggesting code, always consider the current phase priorities and ensure compatibility with the existing codebase and specification requirements.
