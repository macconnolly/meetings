---
applyTo: '**'
---
# AI Copilot Implementation Instructions
## Enhanced Meeting Intelligence System Development Guide

### CRITICAL: File Relationships & Hierarchy

You have access to four key specification documents that work together:

1. **`meetings.md`** - **Technical Specification** (REFERENCE DOCUMENT)
   - Contains complete code implementations, schemas, and examples
   - Provides exact line references for each implementation detail
   - **USE FOR**: Finding the actual code to implement when roadmap references specific lines

2. **`roadmap.md`** - **Implementation Strategy** (PRIMARY GUIDE)
   - Contains validated 4-phase implementation plan with dependencies
   - Provides task breakdowns, time estimates, and acceptance criteria
   - **USE FOR**: Understanding what to implement, in what order, and why
   - **CRITICAL**: This is your primary implementation guide - follow it exactly

3. **`tracker.md`** - **Progress Tracker** (LIVE STATUS DOCUMENT)
   - Tracks completion status of all tasks and subtasks  
   - Records actual time spent vs estimates
   - Documents blockers, notes, and current progress
   - **USE FOR**: Updating status and tracking progress
   - **MANDATORY**: Update this file after every completed task

4. **Copilot Instructions** - **Implementation Guidelines** (THIS FILE)
   - Provides implementation approach and best practices
   - **USE FOR**: Understanding how to execute the roadmap effectively

### Implementation Approach

#### PHASE DEPENDENCY RULES (CRITICAL)
```
Phase 1 (Schema) → Phase 2 (Rich Memories) → Phase 3 (ContextAssembler) → Phase 4 (Production)
```

- **NEVER start Phase 2 until Phase 1 is complete**
- **NEVER start Phase 3 until Phase 2 is complete**  
- **NEVER start Phase 4 until Phase 3 is complete**
- Each phase builds on the previous phase's outputs

#### TASK EXECUTION WORKFLOW

For each task you implement:

1. **READ ROADMAP** (`roadmap.md`)
   - Find the current phase and task in the strategic implementation plan
   - Note the time estimate, dependencies, and file locations
   - Read the acceptance criteria and implementation requirements
   - Note the `meetings.md` line references for technical details

2. **FIND IMPLEMENTATION DETAILS** (`meetings.md`)
   - Go to the specific line numbers referenced in roadmap
   - Copy the exact implementation provided
   - Understand the context and requirements

3. **IMPLEMENT THE CODE**
   - Modify the specified files exactly as shown
   - Follow the patterns and structure provided
   - Include all validation and error handling

4. **UPDATE TRACKER** (`tracker.md`)
   - Mark the task as complete (❌ → ✅)
   - Record actual time spent
   - Add any notes or issues encountered
   - Update overall completion percentages

5. **VALIDATE IMPLEMENTATION**
   - Test the implemented functionality
   - Verify acceptance criteria are met
   - Run any specified validation tests

#### CRITICAL SUCCESS FACTORS

##### 1. Follow Line References Exactly
When the roadmap says "Reference: meetings.md lines 18-800", you MUST:
- Open meetings.md
- Go to lines 18-800
- Use the EXACT implementation provided there
- Do not modify or "improve" the specification

##### 2. File Path Accuracy
The roadmap specifies exact file paths like:
- `config/schema.js` 
- `src/core/AIProcessor.js`
- `src/core/MemoryFactory.js`

**ALWAYS use these exact paths** - do not assume or guess file locations.

##### 3. Comprehensive Implementation
Each task has multiple subtasks. **ALL subtasks must be completed** before marking a task as done.

##### 4. Tracker Maintenance
The tracker.md file is your project dashboard. **Update it religiously**:
- Change ❌ to ✅ for completed items
- Fill in actual time spent
- Note any blockers or issues
- Update completion percentages

### Phase-Specific Guidance

#### PHASE 1: Schema Implementation
**MOST CRITICAL PHASE** - Everything depends on this foundation

```
Key Actions:
1. Replace entire schema in config/schema.js with content from meetings.md lines 18-800
2. Update AI system prompt in src/core/AIProcessor.js with content from meetings.md lines 24-30
3. Add validation method with scoring algorithm
4. Test with sample data to ensure 60%+ completeness score
```

**Common Pitfalls**:
- Skipping validation rules (enums, patterns, min/max lengths)
- Not implementing all 80+ properties
- Missing required fields vs optional fields
- Forgetting to update AI processor system message

#### PHASE 2: Rich Memory Generation  
**FOUNDATION FOR CONTEXT ASSEMBLY**

```
Key Actions:
1. Implement ALL 50+ helper functions in src/utils/helpers.js
2. Replace ALL 9 memory creation methods in src/core/MemoryFactory.js  
3. Ensure rich markdown content generation with sophisticated metadata
4. Test memory creation produces 8-15 objects per meeting
```

**Common Pitfalls**:
- Implementing only some helper functions
- Not generating rich enough content for effective search
- Missing metadata fields needed for filtering
- Not integrating helper functions properly

#### PHASE 3: ContextAssembler (CORE BUSINESS VALUE)
**PRIMARY SUCCESS OBJECTIVE**

```
Key Actions:
1. Enhance SupermemoryClient with advanced search capabilities
2. Create new ContextAssembler.js with 7 search query types
3. Implement context enhancement and confidence scoring
4. Achieve <15 minute deliverable preparation consistently
```

**Success Metrics**:
- Context assembly completes in <15 minutes
- Confidence scores >=70% for well-represented topics
- All 7 search query types execute successfully
- Enhanced context provides actionable deliverable insights

#### PHASE 4: Production Readiness
**OPERATIONAL EXCELLENCE**

```
Key Actions:
1. Create comprehensive test suite validating all functionality
2. Implement business metrics and monitoring
3. Create production deployment automation
4. Validate 20 meetings/day throughput capability
```

### Error Handling & Validation

#### Required Validation at Each Phase

**Phase 1**: Schema validation, AI extraction completeness scoring
**Phase 2**: Memory object count (8-15), content quality checks  
**Phase 3**: Performance timing (<15 min), confidence scoring (>=70%)
**Phase 4**: Full test suite, throughput validation (20 meetings/day)

#### When Things Go Wrong

1. **Schema Issues**: Check meetings.md lines 18-800 for exact specification
2. **AI Extraction Problems**: Verify system prompt matches meetings.md lines 24-30
3. **Memory Quality Issues**: Ensure helper functions are fully implemented
4. **Context Assembly Failures**: Check search query implementation and parallel execution
5. **Performance Issues**: Review timeout settings and result caching

### Quality Assurance Checklist

Before marking any phase complete, verify:

- [ ] All subtasks in tracker.md marked complete ✅
- [ ] All acceptance criteria met
- [ ] All specified files modified correctly
- [ ] Code follows exact patterns from meetings.md
- [ ] Validation tests pass
- [ ] No placeholders or TODOs left in code
- [ ] Performance targets achieved
- [ ] Error handling implemented

### Communication & Documentation

#### Status Updates
Update tracker.md with:
- Actual time spent vs estimates
- Any deviations from planned approach  
- Blockers encountered and resolution
- Performance metrics achieved
- Quality scores and test results

#### Implementation Notes
In tracker.md "Notes" sections, document:
- Challenges encountered during implementation
- Performance optimizations made
- Code patterns that worked well
- Areas for future improvement
- Integration testing results

### Final Validation

#### System-Level Success Criteria
Before considering implementation complete:

1. **Schema Extraction**: AI reliably extracts 80+ properties with 60%+ completeness
2. **Memory Generation**: Creates 8-15 rich memory objects per meeting
3. **Context Assembly**: Completes in <15 minutes with 70%+ confidence
4. **Throughput**: Processes 20 meetings per day within performance limits
5. **Integration**: All components work together seamlessly
6. **Testing**: Complete test suite validates all functionality

#### Business Value Validation
The system should enable:
- **Primary Goal**: <15 minute deliverable preparation through context assembly
- **Quality Goal**: Consistent 70%+ confidence in assembled context
- **Throughput Goal**: 20 meetings per day processing capability
- **Intelligence Goal**: Sophisticated organizational knowledge management

### Emergency Procedures

#### If Implementation Stalls
1. Check tracker.md for current status and blockers
2. Review meetings.md specification for missed details
3. Validate file paths and code organization
4. Test individual components in isolation
5. Check Phase dependencies - ensure previous phases complete

#### If Performance Targets Not Met
1. Review parallel execution implementation
2. Check timeout and caching settings
3. Validate search query optimization
4. Test with smaller data sets first
5. Profile code execution to find bottlenecks

#### If Quality Scores Low
1. Verify schema completeness against meetings.md
2. Check AI system prompt accuracy
3. Validate helper function implementations
4. Test with known good data sets
5. Review extraction validation logic

---

**Remember**: This is a sophisticated enterprise-level system. Follow the specifications exactly, validate thoroughly, and maintain detailed progress tracking. The business value depends on achieving the specific performance and quality targets outlined in the roadmap.