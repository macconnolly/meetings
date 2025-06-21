const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { EmailProcessor } = require('../../src/core/EmailProcessor');
const { AIProcessor } = require('../../src/core/AIProcessor');
const { MemoryFactory } = require('../../src/core/MemoryFactory');
const { SupermemoryClient } = require('../../src/core/SupermemoryClient');

describe('Complete Pipeline Integration Tests', () => {
  let emailProcessor;
  let aiProcessor;
  let memoryFactory;
  let supermemoryClient;
  let comprehensiveMeetingData;

  before(async () => {
    // Load test configuration
    const config = {
      apis: {
        openrouter: {
          apiKey: process.env.OPENROUTER_API_KEY,
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'deepseek/deepseek-chat'
        },
        supermemory: {
          apiKey: process.env.SUPERMEMORY_API_KEY,
          baseUrl: 'https://api.supermemory.ai/v3',
          userId: 'organization_main',
          organization_tag: 'org_main'
        }
      },
      logger: {
        info: () => {},
        error: () => {},
        warn: () => {}
      }
    };

    emailProcessor = new EmailProcessor(config);
    aiProcessor = new AIProcessor(config);
    memoryFactory = new MemoryFactory(config);
    supermemoryClient = new SupermemoryClient(config);

    // Load comprehensive test data
    const dataPath = path.join(__dirname, '../fixtures/comprehensive-meeting-data.json');
    const dataContent = await fs.readFile(dataPath, 'utf8');
    comprehensiveMeetingData = JSON.parse(dataContent);
  });

  describe('Memory Factory Comprehensive Tests', () => {
    let memories;

    before(() => {
      memories = memoryFactory.createAll(comprehensiveMeetingData);
    });

    it('should create the expected number of memory objects', () => {
      // Expected: 1 executive summary + 2 sections + 3 decisions + 3 actions + 2 stakeholders + 2 deliverables + 3 relationships + 4 implementation insights (3 risks + 1 general) + 1 cross-project = 21 total
      const expectedCounts = {
        executive_summary: 1,
        section: 2,
        decision: 3,
        action_item: 3,
        stakeholder_intel: 2,
        deliverable_intel: 2,
        entity_relationship: 3,
        risk: 3,
        implementation_insight: 1,
        cross_project_summary: 1
      };

      const actualCounts = {};
      memories.forEach(memory => {
        const type = memory.metadata.content_type;
        actualCounts[type] = (actualCounts[type] || 0) + 1;
      });

      console.log('Expected memory counts:', expectedCounts);
      console.log('Actual memory counts:', actualCounts);

      Object.keys(expectedCounts).forEach(type => {
        assert.strictEqual(
          actualCounts[type] || 0,
          expectedCounts[type],
          `Expected ${expectedCounts[type]} ${type} memories, got ${actualCounts[type] || 0}`
        );
      });

      const totalExpected = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0);
      assert.strictEqual(memories.length, totalExpected, `Expected ${totalExpected} total memories, got ${memories.length}`);
    });

    it('should generate proper customId format for all memories', () => {
      const customIdPattern = /^[^|]+\|[^|]+\|[^|]+$/;
      memories.forEach(memory => {
        assert.match(
          memory.customId,
          customIdPattern,
          `Memory customId "${memory.customId}" does not match required format "meetingId|contentType|uniqueKey"`
        );
        
        const parts = memory.customId.split('|');
        assert.strictEqual(parts[0], comprehensiveMeetingData.meeting_id, 'First part should be meeting_id');
      });
    });

    it('should include proper container tags for all memories', () => {
      memories.forEach(memory => {
        assert.ok(Array.isArray(memory.containerTags), 'containerTags should be an array');
        assert.ok(memory.containerTags.length > 0, 'containerTags should not be empty');
        assert.ok(memory.containerTags.includes('org_main'), 'Should include org_main tag');
        assert.ok(memory.containerTags.includes('meeting_intel'), 'Should include meeting_intel tag');
      });
    });

    it('should generate rich markdown content for executive summary', () => {
      const execSummary = memories.find(m => m.metadata.content_type === 'executive_summary');
      assert.ok(execSummary, 'Executive summary memory should exist');
      
      const content = execSummary.content;
      assert.ok(content.includes('# Executive Summary:'), 'Should have executive summary header');
      assert.ok(content.includes('## Meeting Context'), 'Should include meeting context section');
      assert.ok(content.includes('## Executive Summary'), 'Should include executive summary section');
      assert.ok(content.includes('## Key Strategic Points'), 'Should include strategic points section');
      assert.ok(content.includes('## Meeting Intelligence'), 'Should include meeting intelligence section');
      assert.ok(content.includes('## Impact Areas'), 'Should include impact areas section');
      assert.ok(content.includes('**Date:**'), 'Should include formatted date');
      assert.ok(content.includes('**Participants:**'), 'Should include participants');
      assert.ok(content.includes('**Strategic Importance:**'), 'Should include strategic importance');
    });

    it('should generate rich markdown content for decisions', () => {
      const decisions = memories.filter(m => m.metadata.content_type === 'decision');
      assert.strictEqual(decisions.length, 3, 'Should have 3 decision memories');
      
      decisions.forEach(decision => {
        const content = decision.content;
        assert.ok(content.includes('# Decision:'), 'Should have decision header');
        assert.ok(content.includes('## Decision Details'), 'Should include decision details section');
        assert.ok(content.includes('## Rationale & Context'), 'Should include rationale section');
        assert.ok(content.includes('## Stakeholders & Impact'), 'Should include stakeholders section');
        assert.ok(content.includes('## Implementation'), 'Should include implementation section');
        assert.ok(content.includes('## Impact Assessment'), 'Should include impact assessment section');
        assert.ok(content.includes('**ID:**'), 'Should include decision ID');
        assert.ok(content.includes('**Status:**'), 'Should include decision status');
        assert.ok(content.includes('**Timeline Impact:**'), 'Should include timeline impact');
        assert.ok(content.includes('**Resource Impact:**'), 'Should include resource impact');
      });
    });

    it('should generate rich markdown content for action items', () => {
      const actions = memories.filter(m => m.metadata.content_type === 'action_item');
      assert.strictEqual(actions.length, 3, 'Should have 3 action item memories');
      
      actions.forEach(action => {
        const content = action.content;
        assert.ok(content.includes('# Action Item:'), 'Should have action item header');
        assert.ok(content.includes('## Assignment Details'), 'Should include assignment details section');
        assert.ok(content.includes('## Scope & Complexity'), 'Should include scope section');
        assert.ok(content.includes('## Tactical Guidance'), 'Should include tactical guidance section');
        assert.ok(content.includes('## Context & Dependencies'), 'Should include context section');
        assert.ok(content.includes('## Success Criteria'), 'Should include success criteria section');
        assert.ok(content.includes('**Owner:**'), 'Should include owner');
        assert.ok(content.includes('**Priority:**'), 'Should include priority');
        assert.ok(content.includes('**Due Date:**'), 'Should include due date');
      });
    });

    it('should generate rich markdown content for stakeholder intelligence', () => {
      const stakeholders = memories.filter(m => m.metadata.content_type === 'stakeholder_intel');
      assert.strictEqual(stakeholders.length, 2, 'Should have 2 stakeholder intelligence memories');
      
      stakeholders.forEach(stakeholder => {
        const content = stakeholder.content;
        assert.ok(content.includes('# Stakeholder Intelligence:'), 'Should have stakeholder header');
        assert.ok(content.includes('## Role & Position'), 'Should include role section');
        assert.ok(content.includes('## Communication Profile'), 'Should include communication section');
        assert.ok(content.includes('## Expressed Concerns'), 'Should include concerns section');
        assert.ok(content.includes('## Questions & Interests'), 'Should include questions section');
        assert.ok(content.includes('## Intelligence Summary'), 'Should include intelligence summary');
        assert.ok(content.includes('**Engagement Score:**'), 'Should include engagement score');
        assert.ok(content.includes('**Influence Score:**'), 'Should include influence score');
      });
    });

    it('should generate rich markdown content for deliverable intelligence', () => {
      const deliverables = memories.filter(m => m.metadata.content_type === 'deliverable_intel');
      assert.strictEqual(deliverables.length, 2, 'Should have 2 deliverable intelligence memories');
      
      deliverables.forEach(deliverable => {
        const content = deliverable.content;
        assert.ok(content.includes('# Deliverable Intelligence:'), 'Should have deliverable header');
        assert.ok(content.includes('## Deliverable Overview'), 'Should include overview section');
        assert.ok(content.includes('## Target Audience & Stakeholders'), 'Should include audience section');
        assert.ok(content.includes('## Requirements & Specifications'), 'Should include requirements section');
        assert.ok(content.includes('## Success Criteria & Validation'), 'Should include success criteria section');
        assert.ok(content.includes('## Complexity Analysis'), 'Should include complexity analysis');
        assert.ok(content.includes('**Technical Complexity:**'), 'Should include technical complexity score');
        assert.ok(content.includes('**Stakeholder Complexity:**'), 'Should include stakeholder complexity score');
      });
    });

    it('should generate proper metadata for all memories', () => {
      memories.forEach(memory => {
        assert.ok(memory.metadata, 'Memory should have metadata');
        assert.ok(memory.metadata.content_type, 'Should have content_type in metadata');
        assert.strictEqual(memory.metadata.meeting_id, comprehensiveMeetingData.meeting_id, 'Should have correct meeting_id in metadata');
        assert.ok(memory.userId, 'Should have userId');
        assert.strictEqual(memory.userId, 'organization_main', 'Should have correct userId');
      });
    });

    it('should handle missing optional data gracefully', () => {
      // Test with minimal data
      const minimalData = {
        meeting_id: 'TEST-MINIMAL-20250617-001',
        meeting_title: 'Test Minimal Meeting',
        meeting_date: '2025-06-17',
        meeting_type: 'test',
        participants: 'Test User',
        executive_summary: 'Test summary'
      };

      const minimalMemories = memoryFactory.createAll(minimalData);
      assert.ok(minimalMemories.length >= 1, 'Should create at least executive summary memory');
      
      const execSummary = minimalMemories.find(m => m.metadata.content_type === 'executive_summary');
      assert.ok(execSummary, 'Should create executive summary even with minimal data');
      assert.ok(execSummary.content.includes('Test summary'), 'Should include the provided summary');
    });
  });

  describe('Container Tags Validation', () => {
    let memories;

    before(() => {
      memories = memoryFactory.createAll(comprehensiveMeetingData);
    });

    it('should generate content-specific tags for decisions', () => {
      const decisions = memories.filter(m => m.metadata.content_type === 'decision');
      
      decisions.forEach(decision => {
        assert.ok(decision.containerTags.includes('content-decision'), 'Should include content-decision tag');
        
        // Check for status-specific tags
        const metadata = decision.metadata;
        if (metadata.decision_status) {
          const statusTag = `status-${metadata.decision_status.replace(/_/g, '-')}`;
          assert.ok(decision.containerTags.includes(statusTag), `Should include status tag: ${statusTag}`);
        }
      });
    });

    it('should generate content-specific tags for action items', () => {
      const actions = memories.filter(m => m.metadata.content_type === 'action_item');
      
      actions.forEach(action => {
        assert.ok(action.containerTags.includes('content-action_item'), 'Should include content-action_item tag');
        
        // Check for priority-specific tags
        const metadata = action.metadata;
        if (metadata.priority) {
          const priorityTag = `priority-${metadata.priority}`;
          assert.ok(action.containerTags.includes(priorityTag), `Should include priority tag: ${priorityTag}`);
        }
      });
    });

    it('should generate project-specific tags', () => {
      memories.forEach(memory => {
        const projectTag = `project-BRV`;
        assert.ok(memory.containerTags.includes(projectTag), 'Should include project tag extracted from meeting ID');
      });
    });
  });

  // Performance benchmark tests
  describe('Performance Benchmarks', () => {
    it('should process comprehensive meeting data within reasonable time', async () => {
      const startTime = Date.now();
      const memories = memoryFactory.createAll(comprehensiveMeetingData);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      console.log(`Memory factory processing time: ${processingTime}ms`);
      
      assert.ok(processingTime < 5000, `Processing should complete within 5 seconds, took ${processingTime}ms`);
      assert.ok(memories.length > 0, 'Should produce memory objects');
    });

    it('should handle large datasets efficiently', () => {
      // Create a larger dataset by duplicating sections
      const largeData = JSON.parse(JSON.stringify(comprehensiveMeetingData));
      
      // Duplicate sections to create a larger dataset
      const originalSections = largeData.detailed_minutes.sections;
      for (let i = 0; i < 10; i++) {
        largeData.detailed_minutes.sections.push(...originalSections.map(section => ({
          ...section,
          section_title: `${section.section_title} - Iteration ${i + 1}`
        })));
      }

      const startTime = Date.now();
      const memories = memoryFactory.createAll(largeData);
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      console.log(`Large dataset processing time: ${processingTime}ms for ${memories.length} memories`);
      
      assert.ok(processingTime < 10000, `Large dataset processing should complete within 10 seconds, took ${processingTime}ms`);
    });
  });
});
