# AI Copilot Implementation Instructions

## 🤖 Purpose
This guide helps AI assistants (GitHub Copilot, Claude, GPT-4, etc.) understand and implement the Meeting Intelligence System effectively. Follow these patterns for consistent, high-quality code generation.

---

## 🎯 System Overview for AI Context

### What You're Building
A **Meeting Intelligence System** that:
1. Processes meeting transcripts into structured data (60+ properties)
2. Creates 8-15 granular memory objects per meeting
3. Enables <15 minute deliverable preparation via ContextAssembler
4. Handles 20 meetings/day at production scale

### Core Business Value
- **Before**: 2-3 hours to prepare meeting deliverables
- **After**: <15 minutes with intelligent context assembly
- **ROI**: 10x productivity gain for meeting follow-ups

---

## 🏗️ Architecture Patterns to Follow

### 1. Memory Object Structure
```javascript
// ALWAYS use this structure for memory objects
{
  content: "# Markdown formatted content with sections",
  metadata: {
    // Required base metadata
    meeting_id: "PROJECT-WORKSTREAM-YYYYMMDD-TYPE",
    meeting_date: "YYYY-MM-DD",
    meeting_title: "Full Meeting Title",
    content_type: "executive_summary|decision|action_item|...",
    
    // Content-specific metadata (20+ fields)
    // Add ALL relevant fields from schema
  },
  userId: "user-uuid",
  customId: "meeting_id|content_type|identifier",
  containerTags: ["org_main", "project", "content_type", "priority", ...]
}
```

### 2. Error Handling Pattern
```javascript
// ALWAYS wrap API calls with try-catch and logging
try {
  const result = await operation();
  logger.info('Operation successful', { 
    operation: 'operationName',
    result: result.id || result.length 
  });
  return result;
} catch (error) {
  logger.error('Operation failed', {
    operation: 'operationName',
    error: error.message,
    stack: error.stack
  });
  // Decide: throw error or return safe default
  throw error; // If critical
  // OR
  return { error: error.message, data: [] }; // If recoverable
}
```

### 3. Async/Await Pattern
```javascript
// ALWAYS use async/await instead of promises
// Good
async function processData(data) {
  const processed = await transformData(data);
  const validated = await validateData(processed);
  return await saveData(validated);
}

// Avoid
function processData(data) {
  return transformData(data)
    .then(processed => validateData(processed))
    .then(validated => saveData(validated));
}
```

---

## 📝 Code Generation Guidelines

### 1. When Implementing Schema (Phase 5)
```javascript
// In config/schema.js, structure like this:
module.exports = {
  type: "object",
  required: ["meeting_title", "meeting_date", "participants", ...],
  properties: {
    // Group related properties
    // Core Meeting Info
    meeting_title: {
      type: "string",
      minLength: 5,
      maxLength: 200,
      description: "Clear, descriptive meeting title"
    },
    
    // Intelligence Metadata (group at end)
    intelligence_metadata: {
      type: "object",
      properties: {
        meeting_urgency: {
          type: "string",
          enum: ["critical", "urgent", "important", "routine"]
        },
        // ... more metadata
      }
    }
  }
};
```

### 2. When Implementing ContextAssembler (Phase 6)
```javascript
class ContextAssembler {
  constructor(supermemoryClient) {
    this.client = supermemoryClient;
    this.logger = console; // Use injected logger in production
  }

  async assembleDeliverableContext(deliverableRequest) {
    // 1. Validate input
    this.validateRequest(deliverableRequest);
    
    // 2. Build search queries (7 parallel searches)
    const searchQueries = this.buildSearchQueries(deliverableRequest);
    
    // 3. Execute searches in parallel
    const startTime = Date.now();
    const searchResults = await this.executeSearchQueries(searchQueries);
    
    // 4. Enhance context with analysis
    const enhancedContext = await this.enhanceContextPackage(
      searchResults,
      deliverableRequest
    );
    
    // 5. Log performance metrics
    const processingTime = Date.now() - startTime;
    this.logger.info('Context assembly complete', {
      processingTime,
      confidence: enhancedContext.confidence.score,
      resultCount: enhancedContext.metadata.totalResults
    });
    
    return enhancedContext;
  }
  
  // IMPORTANT: Break down complex methods into smaller functions
  buildSearchQueries(request) {
    return [
      this.buildStakeholderQuery(request),
      this.buildDeliverableQuery(request),
      this.buildDecisionQuery(request),
      // ... etc
    ];
  }
}
```

### 3. When Implementing Memory Content (Phase 7)
```javascript
// In MemoryFactory, use template literals for readability
_createExecutiveSummaryMemory(meetingData) {
  const {
    meeting_title,
    executive_summary,
    executive_summary_bullets,
    intelligence_metadata
  } = meetingData;

  // Build content with clear sections
  const content = `# Executive Summary: ${meeting_title}

## Meeting Intelligence
**Meeting Type:** ${this.formatMeetingType(meetingData.meeting_type)}
**Strategic Importance:** ${intelligence_metadata.strategic_importance}
**Decision Density:** ${this.calculateDecisionDensity(meetingData)} decisions per hour
**Stakeholder Count:** ${meetingData.participants.length} participants

## Executive Overview
${executive_summary}

## Key Takeaways
${this.formatBulletPoints(executive_summary_bullets)}

## Impact Areas
${this.generateImpactAnalysis(meetingData)}

## Next Steps Summary
${this.summarizeNextSteps(meetingData)}`;

  // Build comprehensive metadata
  const metadata = {
    meeting_id: meetingData.meeting_id,
    meeting_date: meetingData.meeting_date,
    meeting_title: meeting_title,
    content_type: 'executive_summary',
    // Add ALL relevant metadata fields
    strategic_importance: intelligence_metadata.strategic_importance,
    decision_count: meetingData.decisions?.length || 0,
    action_item_count: meetingData.action_items?.length || 0,
    // ... continue with all fields
  };

  return {
    content,
    metadata,
    customId: `${meetingData.meeting_id}|executive_summary|main`,
    containerTags: this.calculateContainerTags(meetingData, 'executive_summary', {})
  };
}
```

### 4. When Implementing Helper Functions (Phase 8)
```javascript
// Group related functions together with clear naming
// In helpers.js:

// ID Generation Functions
function generateDecisionId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `DCN-${project}-${date}-${sequence}`;
}

// Scoring Functions (always return bounded values)
function calculateEngagementScore(stakeholder) {
  let score = 5; // Base score
  
  // Clear scoring logic with comments
  if (stakeholder.questions_asked?.length > 0) {
    score += stakeholder.questions_asked.length * 0.5; // 0.5 points per question
  }
  
  if (stakeholder.concerns_expressed?.length > 0) {
    score += stakeholder.concerns_expressed.length * 0.3; // 0.3 points per concern
  }
  
  // Map engagement level to score adjustment
  const engagementAdjustment = {
    'very_high': 3,
    'high': 2,
    'moderate': 0,
    'low': -2,
    'very_low': -3
  };
  
  score += engagementAdjustment[stakeholder.engagement_level] || 0;
  
  // Ensure score stays within bounds
  return Math.max(1, Math.min(10, Math.round(score)));
}

// Content Analysis Functions
function extractTopicsFromSection(section) {
  const topics = new Set(); // Use Set to avoid duplicates
  
  // Extract from multiple sources
  const sources = [
    section.title,
    ...(section.key_points || []),
    ...(section.deliverables_discussed || [])
  ];
  
  sources.forEach(text => {
    if (!text) return;
    
    // Extract meaningful words (5+ characters, not common)
    const words = text.toLowerCase()
      .match(/\b[a-z]{5,}\b/g) || [];
    
    words.forEach(word => {
      if (!commonWords.includes(word)) {
        topics.add(word);
      }
    });
  });
  
  return Array.from(topics).slice(0, 10); // Limit to top 10
}
```

---

## 🧪 Testing Patterns

### 1. Unit Test Structure
```javascript
describe('ComponentName', () => {
  // Setup
  let component;
  
  beforeEach(() => {
    component = new Component();
  });
  
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      assert.equal(result.property, expectedValue);
    });
    
    it('should handle edge case', () => {
      // Test null, undefined, empty arrays, etc.
    });
    
    it('should handle error case', () => {
      // Test error conditions
      assert.throws(() => {
        component.methodName(invalidInput);
      }, /Expected error message/);
    });
  });
});
```

### 2. Integration Test Structure
```javascript
describe('Integration: Pipeline', () => {
  // Use real components but mock external services
  let pipeline;
  let mockSupermemoryClient;
  
  before(async () => {
    mockSupermemoryClient = createMockClient();
    pipeline = new Pipeline(mockSupermemoryClient);
  });
  
  it('should process meeting end-to-end', async () => {
    // Full workflow test
    const transcript = await loadTestTranscript();
    const result = await pipeline.process(transcript);
    
    // Validate complete output
    assert.ok(result.memories.length >= 8);
    assert.ok(result.confidence > 0);
  });
});
```

---

## 🚀 Performance Optimization Patterns

### 1. Batch Operations
```javascript
// Process in batches to avoid memory issues
async function processBatch(items, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    
    results.push(...batchResults);
    
    // Log progress
    logger.info(`Processed ${i + batch.length}/${items.length} items`);
  }
  
  return results;
}
```

### 2. Caching Pattern
```javascript
class CachedService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }
  
  async getData(key) {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    
    // Fetch fresh data
    const data = await this.fetchData(key);
    
    // Update cache
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

---

## 📋 Common Pitfalls to Avoid

### 1. API Integration
```javascript
// ❌ Wrong: Using GET for Supermemory list
const response = await axios.get('/v3/memories/list?tags=org_main');

// ✅ Correct: Using POST with JSON body
const response = await axios.post('/v3/memories/list', {
  tags: ['org_main'],
  limit: 20,
  userId: this.userId
});
```

### 2. Error Handling
```javascript
// ❌ Wrong: Swallowing errors
try {
  await riskyOperation();
} catch (error) {
  // Silent failure
}

// ✅ Correct: Log and handle appropriately
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  
  // Decide based on criticality
  if (isCritical) {
    throw error; // Propagate
  } else {
    return defaultValue; // Recover
  }
}
```

### 3. Memory Object Creation
```javascript
// ❌ Wrong: Missing required fields
const memory = {
  content: "Some content",
  metadata: { title: "Title" }
};

// ✅ Correct: Include all required fields
const memory = {
  content: "# Properly formatted markdown content",
  metadata: {
    meeting_id: meetingData.meeting_id,
    meeting_date: meetingData.meeting_date,
    meeting_title: meetingData.meeting_title,
    content_type: 'decision',
    // ... all required metadata
  },
  userId: this.userId,
  customId: this.generateCustomId(meetingData, 'decision', index),
  containerTags: this.calculateContainerTags(meetingData, 'decision', decision)
};
```

---

## 🔧 Development Workflow

### 1. Before Starting a Task
1. Read the relevant section in `TASK_TRACKER.md`
2. Review existing code in related files
3. Check test files for expected behavior
4. Understand the business value of your task

### 2. While Implementing
1. Follow existing patterns in the codebase
2. Add comprehensive JSDoc comments
3. Write tests alongside implementation
4. Use meaningful variable and function names
5. Keep functions small and focused (< 50 lines)

### 3. Before Committing
1. Run all tests: `npm test`
2. Check test coverage: `npm run test:coverage`
3. Verify no console.log statements in production code
4. Update relevant documentation
5. Add entry to tracker.md progress

---

## 🎓 Learning Resources

### Key Files to Study
1. **For API Integration**: `src/core/SupermemoryClient.js`
2. **For Memory Creation**: `src/core/MemoryFactory.js`
3. **For Schema Structure**: `config/schema.js` (when implemented)
4. **For Testing Patterns**: `test/integration/pipeline.test.js`

### Understanding the Domain
- **Meeting Intelligence**: Extracting actionable insights from meetings
- **Memory Objects**: Granular, searchable units of information
- **Context Assembly**: Combining memories to prepare deliverables
- **Container Tags**: Hierarchical categorization system

### Best Practices
1. **Consistency**: Follow existing patterns
2. **Clarity**: Code should be self-documenting
3. **Completeness**: Implement all specified properties
4. **Performance**: Consider scale (20 meetings/day)
5. **Reliability**: Handle errors gracefully