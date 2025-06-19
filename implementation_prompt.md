# Autonomous LLM Implementation Prompt

## 🎯 Mission Statement
You are implementing a Meeting Intelligence System that transforms meeting transcripts into actionable business intelligence. Your goal is to enable teams to prepare any deliverable in under 15 minutes by leveraging intelligent memory creation and context assembly.

---

## 🏗️ System Architecture Overview

### Core Components
1. **AIProcessor**: Extracts 60+ structured properties from transcripts
2. **MemoryFactory**: Creates 8-15 specialized memory objects per meeting
3. **SupermemoryClient**: Manages memory storage and retrieval via API
4. **ContextAssembler**: Aggregates relevant memories for deliverable prep
5. **RateLimitManager**: Ensures API compliance and performance

### Data Flow
```
Transcript → AIProcessor → Structured Data (60+ properties)
    ↓
MemoryFactory → 8-15 Memory Objects
    ↓
SupermemoryClient → Stored in Supermemory
    ↓
ContextAssembler → Intelligent Search & Aggregation
    ↓
Deliverable Context (< 15 minutes)
```

---

## 📋 Current Implementation Status

### ✅ Completed (Phases 1-13)
- Project infrastructure and configuration
- SupermemoryClient with v3 API integration
- Basic MemoryFactory with idempotency
- AIProcessor with OpenRouter integration
- Organization scoping with containerTags
- Windows environment compatibility

### 🚧 In Progress (Phases 14-19)
- **Phase 14**: Enhanced Schema Implementation (CRITICAL)
- **Phase 15**: ContextAssembler Implementation (CRITICAL)
- **Phase 16**: Rich Memory Content Generation (HIGH)
- **Phase 17**: Advanced Helper Functions (HIGH)
- **Phase 18**: Rate Limiting Enhancement (MEDIUM)
- **Phase 19**: Comprehensive Testing (HIGH)

---

## 🎬 Implementation Instructions

### Step 1: Understand the Current State
1. Review `TASK_TRACKER.md` for detailed phase breakdown
2. Check completed phases (1-13) to understand existing patterns
3. Identify which phase you're implementing (14-19)

### Step 2: Enhanced Schema Implementation (Phase 14)
**Priority: CRITICAL - Required for all advanced features**

#### Task 14.1: Update config/schema.js
```javascript
// Replace entire file contents with comprehensive schema
module.exports = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: [
    "meeting_title", "meeting_date", "participants", "meeting_id",
    "executive_summary", "detailed_minutes", "decisions", "action_items",
    "stakeholder_intelligence", "deliverable_intelligence", 
    "intelligence_metadata"
  ],
  properties: {
    // Core Meeting Information
    meeting_title: {
      type: "string",
      minLength: 5,
      maxLength: 200
    },
    meeting_date: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$"
    },
    participants: {
      type: "array",
      items: { type: "string" },
      minItems: 1
    },
    
    // Executive Summary
    executive_summary: {
      type: "string",
      minLength: 100,
      maxLength: 2000
    },
    executive_summary_bullets: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 10
    },
    
    // Detailed Minutes with Sections
    detailed_minutes: {
      type: "object",
      required: ["sections"],
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "key_points"],
            properties: {
              title: { type: "string" },
              key_points: { type: "array", items: { type: "string" } },
              stakeholders_mentioned: { type: "array", items: { type: "string" } },
              deliverables_discussed: { type: "array", items: { type: "string" } },
              requirements_evolution: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    requirement: { type: "string" },
                    previous_state: { type: "string" },
                    current_state: { type: "string" },
                    change_reason: { type: "string" }
                  }
                }
              },
              section_urgency: {
                type: "string",
                enum: ["critical", "urgent", "important", "routine"]
              },
              section_priority: {
                type: "integer",
                minimum: 1,
                maximum: 5
              }
            }
          }
        }
      }
    },
    
    // Add all 60+ properties as specified in meetings.md
    // ... continue with decisions, action_items, stakeholder_intelligence, etc.
  }
};
```

#### Task 14.2: Update AIProcessor System Prompt
```javascript
// In src/core/AIProcessor.js
buildSystemPrompt() {
  const enhancedSchema = require('../config/schema.js');
  
  return `You are an expert meeting analyst. Extract structured data from the transcript.

CRITICAL: You must extract ALL properties defined in the schema below.
Missing required fields will cause the response to be rejected.

Schema to follow:
${JSON.stringify(enhancedSchema, null, 2)}

Requirements:
1. Extract all 60+ properties from the schema
2. Infer stakeholder intelligence from their contributions
3. Identify all decisions with implementation timelines
4. Map entity relationships between people, projects, and deliverables
5. Assess meeting urgency and strategic importance

Return a valid JSON object matching the schema exactly.`;
}
```

### Step 3: ContextAssembler Implementation (Phase 15)
**Priority: CRITICAL - Core business value**

#### Create src/core/ContextAssembler.js
```javascript
class ContextAssembler {
  constructor(supermemoryClient) {
    this.client = supermemoryClient;
    this.logger = console;
  }

  async assembleDeliverableContext(deliverableRequest) {
    // Validate request
    const { name, type, audience, topic } = deliverableRequest;
    if (!name || !type || !audience || !topic) {
      throw new Error('Invalid deliverable request');
    }

    // Build 7 parallel search queries
    const searchQueries = [
      {
        name: 'stakeholder_intelligence',
        query: {
          q: `${audience} preferences communication format requirements`,
          containerTags: ['org_main', 'stakeholder-intelligence'],
          limit: 15
        }
      },
      {
        name: 'deliverable_specifications',
        query: {
          q: `${type} requirements specifications format examples template`,
          containerTags: ['org_main', 'deliverables'],
          filters: { deliverable_type: type },
          limit: 20
        }
      },
      // ... add remaining 5 search queries
    ];

    // Execute searches in parallel
    const startTime = Date.now();
    const searchResults = await this.executeSearchQueries(searchQueries);
    
    // Enhance context with analysis
    const enhancedContext = await this.enhanceContextPackage(
      searchResults,
      deliverableRequest
    );
    
    // Calculate confidence and add metadata
    enhancedContext.confidence = this.calculateContextConfidence(
      searchResults,
      deliverableRequest
    );
    
    enhancedContext.metadata = {
      processingTime: Date.now() - startTime,
      totalResults: this.countTotalResults(searchResults),
      categoriesFound: Object.keys(searchResults).length
    };
    
    return enhancedContext;
  }

  async executeSearchQueries(searchQueries) {
    const results = {};
    
    // Execute all searches in parallel
    const searchPromises = searchQueries.map(async (searchConfig) => {
      try {
        const response = await this.client.searchMemories(searchConfig.query);
        return {
          name: searchConfig.name,
          results: response.results || [],
          metadata: response.metadata
        };
      } catch (error) {
        this.logger.error(`Search failed for ${searchConfig.name}:`, error);
        return {
          name: searchConfig.name,
          results: [],
          error: error.message
        };
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Organize results by category name
    searchResults.forEach(result => {
      results[result.name] = result.results;
    });
    
    return results;
  }

  // Implement all enhancement methods...
}
```

### Step 4: Rich Memory Content (Phase 16)
**Priority: HIGH - Enables effective search**

#### Update MemoryFactory Methods
```javascript
_createExecutiveSummaryMemory(meetingData) {
  const content = `# Executive Summary: ${meetingData.meeting_title}

## Meeting Intelligence
**Meeting Type:** ${this.formatMeetingType(meetingData.meeting_type)}
**Strategic Importance:** ${meetingData.intelligence_metadata.strategic_importance}
**Decision Density:** ${this.calculateDecisionDensity(meetingData)} decisions per hour
**Stakeholder Count:** ${meetingData.participants.length} participants
**Follow-up Required:** ${meetingData.intelligence_metadata.follow_up_required ? 'Yes' : 'No'}

## Executive Overview
${meetingData.executive_summary}

## Key Takeaways
${meetingData.executive_summary_bullets.map(bullet => `- ${bullet}`).join('\n')}

## Impact Areas
${this.generateImpactAnalysis(meetingData)}

## Next Steps Summary
${this.summarizeNextSteps(meetingData)}`;

  const metadata = {
    meeting_id: meetingData.meeting_id,
    meeting_date: meetingData.meeting_date,
    meeting_title: meetingData.meeting_title,
    content_type: 'executive_summary',
    meeting_type: meetingData.meeting_type,
    strategic_importance: meetingData.intelligence_metadata.strategic_importance,
    priority: this.calculatePriority(meetingData),
    decision_count: meetingData.decisions?.length || 0,
    action_item_count: meetingData.action_items?.length || 0,
    deliverable_count: meetingData.deliverable_intelligence?.length || 0,
    stakeholder_count: meetingData.participants.length,
    follow_up_required: meetingData.intelligence_metadata.follow_up_required,
    escalation_needed: meetingData.intelligence_metadata.escalation_needed,
    cross_project_relevance: meetingData.intelligence_metadata.cross_project_relevance,
    impact_areas: this.extractImpactAreas(meetingData),
    departments: meetingData.intelligence_metadata.departments || [],
    resource_impact: this.hasResourceImplications(meetingData)
  };

  return {
    content,
    metadata,
    userId: this.userId,
    customId: `${meetingData.meeting_id}|executive_summary|main`,
    containerTags: this.calculateContainerTags(meetingData, 'executive_summary', {})
  };
}
```

### Step 5: Testing Your Implementation

#### Unit Tests
```javascript
// Test schema validation
describe('Schema Validation', () => {
  it('should validate complete meeting data', () => {
    const schema = require('../config/schema.js');
    const validator = new Validator(schema);
    const sampleData = require('./fixtures/sample-meeting-data.json');
    
    const result = validator.validate(sampleData);
    assert.ok(result.valid, `Validation failed: ${result.errors}`);
  });
});
```

#### Integration Tests
```javascript
// Test end-to-end pipeline
describe('Pipeline Integration', () => {
  it('should process meeting and create all memories', async () => {
    const transcript = await loadTestTranscript();
    const result = await pipeline.process(transcript);
    
    assert.ok(result.memories.length >= 8, 'Too few memories created');
    assert.ok(result.memories.length <= 15, 'Too many memories created');
    
    // Verify memory types
    const memoryTypes = result.memories.map(m => m.metadata.content_type);
    assert.ok(memoryTypes.includes('executive_summary'));
    assert.ok(memoryTypes.includes('decision'));
    assert.ok(memoryTypes.includes('action_item'));
  });
});
```

---

## 🎯 Success Criteria

### For Each Implementation
1. **Completeness**: All specified properties/methods implemented
2. **Quality**: Rich, searchable content in all memories
3. **Performance**: Meets throughput requirements
4. **Testing**: >80% code coverage with meaningful tests
5. **Documentation**: Clear comments and updated docs

### System-Level Goals
- Process 20 meetings/day automatically
- Generate 8-15 memories per meeting
- Enable <15 minute deliverable preparation
- Achieve >80% context assembly confidence
- Maintain 99.9% system availability

---

## 🚨 Critical Implementation Notes

### 1. Schema Completeness
The enhanced schema with 60+ properties is CRITICAL. Without it:
- AI cannot extract rich intelligence
- ContextAssembler has no data to search
- Deliverable preparation remains manual

### 2. Memory Content Quality
Rich markdown content is ESSENTIAL for search. Each memory must:
- Have clear section headers
- Include all relevant metadata
- Use consistent formatting
- Contain searchable keywords

### 3. Container Tags Strategy
Tags enable efficient filtering. Always include:
- `org_main` (required)
- Project code
- Content type
- Priority/urgency level
- Department tags
- Special flags (approved, has-deadline, etc.)

### 4. Error Handling
Never let errors cascade. Always:
- Log errors with context
- Provide safe defaults
- Continue processing other items
- Report failures in summary

### 5. Performance Considerations
- Use Promise.all() for parallel operations
- Implement rate limiting proactively
- Cache frequently accessed data
- Monitor API usage continuously

---

## 📚 Reference Implementation Order

1. **Week 1**: Schema + AIProcessor Integration
2. **Week 2**: ContextAssembler Core + Search
3. **Week 3**: Rich Memory Content + Helpers
4. **Week 4**: Testing + Performance + Polish

Follow this order to maintain dependencies and ensure each component builds on the previous work.

---

## 🤝 Getting Help

1. Review `TASK_TRACKER.md` for detailed requirements
2. Check existing implementations in completed phases
3. Look for patterns in test files
4. Use the copilot_instructions.md for coding patterns
5. Validate against the business goals

Remember: The goal is to transform how teams handle meeting follow-ups, reducing hours of work to minutes through intelligent automation.