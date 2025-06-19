const assert = require('assert');
const helpers = require('../../src/utils/helpers');

describe('Helper Functions Unit Tests', () => {
  describe('ID Generation', () => {
    const meetingData = { meeting_id: 'PRJ-WS-20250618-REG', meeting_date: '2025-06-18' };
    it('should generate correct Decision ID', () => {
      const id = helpers.generateDecisionId(meetingData, 0);
      assert.strictEqual(id, 'DCN-PRJ-20250618-001');
    });
    it('should generate correct Action ID', () => {
      const id = helpers.generateActionId(meetingData, 1);
      assert.strictEqual(id, 'ACT-PRJ-20250618-002');
    });
    it('should generate correct Deliverable ID', () => {
      const id = helpers.generateDeliverableId(meetingData, 2);
      assert.strictEqual(id, 'DEL-PRJ-20250618-003');
    });
    it('should generate correct Relationship ID', () => {
      const id = helpers.generateRelationshipId(meetingData, 3);
      assert.strictEqual(id, 'REL-PRJ-20250618-004');
    });
    it('should generate correct Risk ID', () => {
      const id = helpers.generateRiskId(meetingData, 4);
      assert.strictEqual(id, 'RSK-PRJ-20250618-005');
    });
    it('should generate correct Stakeholder ID', () => {
      const id = helpers.generateStakeholderId('Jane Doe');
      assert.ok(id.startsWith('STK-jane-doe-'));
    });
  });

  describe('Priority/Scoring Functions', () => {
    it('should calculate correct priority', () => {
      assert.strictEqual(helpers.calculatePriority('urgent', 'strategic'), 5);
      assert.strictEqual(helpers.calculatePriority('routine', 'operational'), 1);
    });
  });

  describe('sanitizeMetadata', () => {
    it('should flatten arrays and stringify objects', () => {
      const input = {
        a: [1, 2, 3],
        b: { x: 1 },
        c: 'test',
        d: true
      };
      const result = helpers.sanitizeMetadata(input);
      assert.strictEqual(result.a, '1; 2; 3');
      assert.strictEqual(result.b, JSON.stringify({ x: 1 }));
      assert.strictEqual(result.c, 'test');
      assert.strictEqual(result.d, true);
    });
  });

  describe('calculateContainerTags', () => {
    it('should generate tags for action_item', () => {
      const meetingData = { meeting_id: 'PRJ-WS-20250618-REG', meeting_type: 'status_update', intelligence_metadata: { strategic_importance: 'high' } };
      const objectData = { priority: 'urgent', status: 'open', due_date: '2025-06-19' };
      const tags = helpers.calculateContainerTags(meetingData, 'action_item', objectData);
      assert(tags.includes('priority-urgent'));
      assert(tags.includes('status-open'));
      assert(tags.includes('status-overdue') === false); // Not overdue
    });
  });
});
