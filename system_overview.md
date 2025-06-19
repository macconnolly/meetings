# Meeting Intelligence System - Quick Reference & Troubleshooting

## 🎯 System At A Glance

### What It Does
Transforms meeting transcripts → 60+ structured properties → 8-15 memory objects → <15 min deliverable prep

### Core Value Proposition
- **Before**: 2-3 hours to prepare meeting deliverables
- **After**: <15 minutes with intelligent context assembly
- **Scale**: 20 meetings/day capacity

---

## 🏗️ Architecture Quick Reference

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Transcript    │────▶│   AIProcessor    │────▶│ Structured Data │
└─────────────────┘     └──────────────────┘     │  (60+ props)    │
                                                  └────────┬────────┘
                                                           │
                        ┌──────────────────┐              ▼
                        │ ContextAssembler │     ┌─────────────────┐
                        │                  │◀────│  MemoryFactory  │
                        └────────┬─────────┘     └────────┬────────┘
                                 │                         │
                        ┌────────▼─────────┐              ▼
                        │   Deliverable    │     ┌─────────────────┐
                        │     Context      │     │ SupermemoryAPI  │
                        └──────────────────┘     └─────────────────┘
```

### Key Components
| Component | Purpose | Status | Location |
|-----------|---------|--------|----------|
| AIProcessor | Extract 60+ properties from transcript | ✅ Basic | `src/core/AIProcessor.js` |
| MemoryFactory | Create 8-15 memory objects | ✅ Basic | `src/core/MemoryFactory.js` |
| SupermemoryClient | API integration (v3) | ✅ Working | `src/core/SupermemoryClient.js` |
| ContextAssembler | Search & aggregate memories | 🔴 TODO | `src/core/ContextAssembler.js` |
| RateLimitManager | API throttling | 🔴 TODO | `src/utils/RateLimitManager.js` |

---

## 🚀 Quick Commands

### Run the Pipeline
```bash
# Process a single transcript
node pipe.js --transcript ./test/fixtures/sample-transcript.txt

# Process with custom meeting data
node pipe.js --meeting-data ./data/meeting-2025-01-21.json

# Test mode (no API calls)
node pipe.js --test-mode

# With context assembly demo (when implemented)
node pipe.js --assemble-context
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- test/integration/pipeline.test.js

# Run with coverage
npm run test:coverage

# Run performance benchmarks
npm run test:performance
```

### Debugging
```bash
# Enable debug logging
DEBUG=* node pipe.js

# Test Supermemory connection
node test/manual/test-supermemory-connection.js

# Validate schema
node test/manual/validate-schema.js
```

---

## 🔧 Troubleshooting Guide

### Issue: Memory Retrieval Returns 404
**Symptom**: Created memories cannot be retrieved
**Cause**: Using GET instead of POST for `/v3/memories/list`
**Solution**: 
```javascript
// ❌ Wrong
await axios.get('/v3/memories/list?tags=org_main');

// ✅ Correct
await axios.post('/v3/memories/list', {
  tags: ['org_main'],
  limit: 20,
  userId: this.userId
});
```

### Issue: Module Not Found Errors
**Symptom**: `MODULE_NOT_FOUND` when running scripts
**Cause**: Running from wrong directory
**Solution**: Always run from project root
```bash
# ❌ Wrong
cd src && node core/pipe.js

# ✅ Correct
node pipe.js
```

### Issue: Schema Validation Failures
**Symptom**: AIProcessor responses rejected
**Cause**: Missing required properties in schema
**Solution**: Ensure all 60+ properties are extracted
```javascript
// Check which properties are missing
const missingProps = schema.required.filter(prop => !result[prop]);
console.log('Missing required properties:', missingProps);
```

### Issue: Rate Limiting Errors
**Symptom**: 429 errors from Supermemory API
**Cause**: Exceeding 50 requests/minute
**Solution**: Implement RateLimitManager
```javascript
// Temporary workaround
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add 1.2 second delay between requests
await delay(1200);
```

### Issue: Context Assembly Too Slow
**Symptom**: Takes >1 minute to assemble context
**Cause**: Sequential search execution
**Solution**: Use parallel searches
```javascript
// ❌ Slow - Sequential
for (const query of queries) {
  results.push(await search(query));
}

// ✅ Fast - Parallel
const results = await Promise.all(
  queries.map(query => search(query))
);
```

---

## 📋 Configuration Reference

### Environment Variables (.env)
```bash
# Required
SUPERMEMORY_API_KEY=your-api-key
SUPERMEMORY_USER_ID=your-user-id

# Optional
SUPERMEMORY_BASE_URL=https://api.supermemory.com/v3
OPENROUTER_API_KEY=your-openrouter-key
ANTHROPIC_MODEL=claude-3-opus-20240229
LOG_LEVEL=info
RATE_LIMIT_PER_MINUTE=50
```

### Configuration Files
| File | Purpose | Key Settings |
|------|---------|--------------|
| `config/production.json` | Main config | API endpoints, limits, org tags |
| `config/schema.js` | Data schema | 60+ property definitions |
| `.env` | Secrets | API keys, user IDs |

---

## 🎯 Memory Types Reference

### 1. Executive Summary
- **Purpose**: High-level meeting overview
- **Metadata**: strategic_importance, decision_count, follow_up_required
- **Search Tags**: executive_summary, priority level

### 2. Meeting Sections
- **Purpose**: Detailed discussion points
- **Metadata**: section_priority, requirements_evolution, stakeholders
- **Search Tags**: section-{title}, urgency level

### 3. Decisions
- **Purpose**: Track decisions and implementation
- **Metadata**: status, impact_areas, timeline, dependencies
- **Search Tags**: approved-decisions, timeline-impact

### 4. Action Items
- **Purpose**: Task tracking and ownership
- **Metadata**: owner, due_date, priority, dependencies
- **Search Tags**: owner-{name}, has-deadline

### 5. Stakeholder Intelligence
- **Purpose**: Communication profiles and preferences
- **Metadata**: influence_level, engagement_score, preferences
- **Search Tags**: stakeholder-intelligence, role-{type}

### 6. Deliverable Intelligence
- **Purpose**: Requirements and specifications
- **Metadata**: complexity_level, target_audience, deadline
- **Search Tags**: deliverables, deliverable-type-{type}

### 7. Entity Relationships
- **Purpose**: Map connections between entities
- **Metadata**: relationship_type, strength, criticality
- **Search Tags**: relationships, critical-dependency

### 8. Implementation Insights
- **Purpose**: Risks, lessons, success criteria
- **Metadata**: risk_severity, mitigation_priority
- **Search Tags**: implementation-insights, risks

### 9. Cross-Project Context
- **Purpose**: Dependencies across projects
- **Metadata**: impact_level, coordination_requirements
- **Search Tags**: cross-project, high-impact

---

## 🚨 Common Pitfalls

### 1. Incomplete Schema Implementation
**Impact**: Missing critical meeting intelligence
**Prevention**: Use the complete 60+ property schema from TASK_TRACKER.md

### 2. Poor Memory Content Quality
**Impact**: Context assembly returns low confidence
**Prevention**: Use rich markdown templates with all sections

### 3. Missing Container Tags
**Impact**: Cannot filter memories effectively
**Prevention**: Always include org_main + relevant categorization tags

### 4. Synchronous Operations
**Impact**: Slow performance, timeouts
**Prevention**: Use Promise.all() for parallel operations

### 5. No Error Recovery
**Impact**: Single failure crashes entire pipeline
**Prevention**: Wrap operations in try-catch, log errors, continue processing

---

## 📊 Performance Benchmarks

### Target Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Meetings/day | 20 | 5 | 🟡 |
| Memory creation time | <3s | 2s | ✅ |
| Context assembly time | <30s | N/A | 🔴 |
| API success rate | >99% | 98.5% | 🟡 |
| Test coverage | >80% | 40% | 🔴 |

### Optimization Tips
1. **Batch API Calls**: Group memory creation
2. **Cache Searches**: Store recent context queries
3. **Parallel Processing**: Use worker threads for heavy computation
4. **Connection Pooling**: Reuse HTTP connections
5. **Lazy Loading**: Load large schemas only when needed

---

## 🔍 Debugging Tools

### Log Analysis
```bash
# Filter logs by component
grep "MemoryFactory" logs/app.log

# Find errors
grep -i "error" logs/app.log | tail -20

# Track API calls
grep "Supermemory API" logs/app.log | grep -E "(POST|GET)"
```

### Performance Profiling
```javascript
// Add timing to critical sections
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
logger.info(`Operation completed in ${duration}ms`);
```

### Memory Inspection
```javascript
// Check memory object structure
console.log(JSON.stringify(memoryObject, null, 2));

// Validate against schema
const valid = validator.validate(memoryObject);
if (!valid) console.error(validator.errors);
```

---

## 📞 Getting Help

### Documentation
- **Detailed Tracker**: `TASK_TRACKER.md` - Complete implementation details
- **Roadmap**: `roadmap.md` - High-level phases and progress
- **API Docs**: `SUPERMEMORY_TRUTH.md` - API specifications

### Code Examples
- **Pipeline**: `pipe.js` - Main orchestration
- **Tests**: `test/integration/*` - Working examples
- **Debug Scripts**: `test/debug/*` - Troubleshooting tools

### Common Questions
1. **Q: Why 8-15 memories per meeting?**
   A: Balances granularity with manageability for effective search

2. **Q: Why 60+ properties in schema?**
   A: Captures comprehensive intelligence for accurate context assembly

3. **Q: Why <15 minute target?**
   A: Matches typical meeting prep time availability

4. **Q: Why containerTags instead of folders?**
   A: Enables multi-dimensional categorization and filtering