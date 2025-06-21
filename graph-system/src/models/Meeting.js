const BaseModel = require('./BaseModel');
const { validateRelationship } = require('../utils/validation');

class Meeting extends BaseModel {
  constructor() {
    super('Meeting');
  }

  // ===================================================================
  // MEETING-SPECIFIC CRUD OPERATIONS
  // ===================================================================

  async create(data) {
    return super.create(data, 'meeting');
  }

  async findById(meetingId) {
    return super.findById(meetingId, 'meeting_id');
  }

  async update(meetingId, data) {
    return super.update(meetingId, data, 'meeting_id', 'meeting');
  }

  async delete(meetingId, softDelete = true) {
    return super.delete(meetingId, 'meeting_id', softDelete);
  }

  // ===================================================================
  // MEETING-SPECIFIC RELATIONSHIP OPERATIONS
  // ===================================================================

  async addDecision(meetingId, decisionId, properties = {}) {
    const validatedProps = validateRelationship('HAS_DECISION', properties);
    return super.createRelationship(
      meetingId, decisionId, 'HAS_DECISION', validatedProps,
      'meeting_id', 'decision_id', 'Meeting', 'Decision'
    );
  }

  async addActionItem(meetingId, actionId, properties = {}) {
    const validatedProps = validateRelationship('HAS_ACTION_ITEM', properties);
    return super.createRelationship(
      meetingId, actionId, 'HAS_ACTION_ITEM', validatedProps,
      'meeting_id', 'action_id', 'Meeting', 'ActionItem'
    );
  }

  async addRisk(meetingId, riskId, properties = {}) {
    const validatedProps = validateRelationship('HAS_RISK', properties);
    return super.createRelationship(
      meetingId, riskId, 'HAS_RISK', validatedProps,
      'meeting_id', 'risk_id', 'Meeting', 'Risk'
    );
  }

  async addDeliverable(meetingId, deliverableId, properties = {}) {
    const validatedProps = validateRelationship('HAS_DELIVERABLE', properties);
    return super.createRelationship(
      meetingId, deliverableId, 'HAS_DELIVERABLE', validatedProps,
      'meeting_id', 'deliverable_id', 'Meeting', 'Deliverable'
    );
  }

  // ===================================================================
  // MEETING-SPECIFIC QUERY OPERATIONS
  // ===================================================================

  async getMeetingDetails(meetingId) {
    try {
      const cypher = `
        MATCH (m:Meeting {meeting_id: $meetingId})
        WHERE m.is_current = true
        OPTIONAL MATCH (m)-[:HAS_DECISION]->(d:Decision)
        WHERE d.is_current = true
        OPTIONAL MATCH (m)-[:HAS_ACTION_ITEM]->(a:ActionItem)
        WHERE a.is_current = true
        OPTIONAL MATCH (m)-[:HAS_RISK]->(r:Risk)
        WHERE r.is_current = true
        OPTIONAL MATCH (m)-[:HAS_DELIVERABLE]->(del:Deliverable)
        WHERE del.is_current = true
        RETURN m,
               collect(DISTINCT d) as decisions,
               collect(DISTINCT a) as actionItems,
               collect(DISTINCT r) as risks,
               collect(DISTINCT del) as deliverables
      `;

      const result = await this.db.executeReadQuery(cypher, { meetingId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        meeting: record.get('m').properties,
        decisions: record.get('decisions').map(d => d.properties),
        actionItems: record.get('actionItems').map(a => a.properties),
        risks: record.get('risks').map(r => r.properties),
        deliverables: record.get('deliverables').map(d => d.properties)
      };
    } catch (error) {
      throw new Error(`Get meeting details failed: ${error.message}`);
    }
  }

  async getMeetingsByDateRange(startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 20, type = null, status = null } = options;
      
      let filters = {
        is_current: true
      };

      if (type) filters.type = type;
      if (status) filters.status = status;

      const { whereClause, parameters } = this.buildWhereClause(filters);
      const dateFilter = `AND m.date >= $startDate AND m.date <= $endDate`;
      
      const cypher = `
        MATCH (m:Meeting)
        ${whereClause} ${dateFilter}
        RETURN m
        ORDER BY m.date DESC
        ${this.buildPaginationClause(page, limit)}
      `;

      const countCypher = `
        MATCH (m:Meeting)
        ${whereClause} ${dateFilter}
        RETURN count(m) as total
      `;

      const queryParams = { ...parameters, startDate, endDate };

      const [result, countResult] = await Promise.all([
        this.db.executeReadQuery(cypher, queryParams),
        this.db.executeReadQuery(countCypher, queryParams)
      ]);

      return {
        data: result.records.map(record => record.get('m').properties),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.records[0].get('total').toNumber()
        }
      };
    } catch (error) {
      throw new Error(`Get meetings by date range failed: ${error.message}`);
    }
  }

  async getMeetingsByStakeholder(stakeholderId) {
    try {
      const cypher = `
        MATCH (s:Stakeholder {stakeholder_id: $stakeholderId})
        WHERE s.is_current = true
        MATCH (m:Meeting)-[:HAS_DECISION]->(d:Decision)-[:ASSOCIATED_WITH]->(s)
        OR (m:Meeting)-[:HAS_ACTION_ITEM]->(a:ActionItem)-[:ASSIGNED_TO]->(s)
        OR (m:Meeting)-[:HAS_DELIVERABLE]->(del:Deliverable)-[:OWNED_BY]->(s)
        WHERE m.is_current = true
        RETURN DISTINCT m
        ORDER BY m.date DESC
      `;

      const result = await this.db.executeReadQuery(cypher, { stakeholderId });

      return result.records.map(record => record.get('m').properties);
    } catch (error) {
      throw new Error(`Get meetings by stakeholder failed: ${error.message}`);
    }
  }

  async getUpcomingMeetings(days = 7) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const cypher = `
        MATCH (m:Meeting)
        WHERE m.is_current = true 
        AND m.status IN ['Scheduled', 'In Progress']
        AND m.date >= $today AND m.date <= $futureDate
        RETURN m
        ORDER BY m.date ASC
      `;

      const result = await this.db.executeReadQuery(cypher, {
        today: today.toISOString(),
        futureDate: futureDate.toISOString()
      });

      return result.records.map(record => record.get('m').properties);
    } catch (error) {
      throw new Error(`Get upcoming meetings failed: ${error.message}`);
    }
  }

  // ===================================================================
  // MEETING ANALYTICS
  // ===================================================================

  async getMeetingMetrics(timeframe = 'month') {
    try {
      let dateFilter = '';
      const now = new Date();
      
      switch (timeframe) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `AND m.date >= '${weekAgo.toISOString()}'`;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `AND m.date >= '${monthAgo.toISOString()}'`;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFilter = `AND m.date >= '${quarterAgo.toISOString()}'`;
          break;
      }

      const cypher = `
        MATCH (m:Meeting)
        WHERE m.is_current = true ${dateFilter}
        OPTIONAL MATCH (m)-[:HAS_DECISION]->(d:Decision)
        WHERE d.is_current = true
        OPTIONAL MATCH (m)-[:HAS_ACTION_ITEM]->(a:ActionItem)
        WHERE a.is_current = true
        OPTIONAL MATCH (m)-[:HAS_RISK]->(r:Risk)
        WHERE r.is_current = true
        RETURN 
          count(DISTINCT m) as totalMeetings,
          count(DISTINCT d) as totalDecisions,
          count(DISTINCT a) as totalActionItems,
          count(DISTINCT r) as totalRisks,
          avg(m.duration) as avgDuration,
          collect(DISTINCT m.type) as meetingTypes,
          collect(DISTINCT m.status) as meetingStatuses
      `;

      const result = await this.db.executeReadQuery(cypher);
      
      if (result.records.length === 0) {
        return {
          totalMeetings: 0,
          totalDecisions: 0,
          totalActionItems: 0,
          totalRisks: 0,
          avgDuration: 0,
          meetingTypes: [],
          meetingStatuses: []
        };
      }

      const record = result.records[0];
      return {
        totalMeetings: record.get('totalMeetings').toNumber(),
        totalDecisions: record.get('totalDecisions').toNumber(),
        totalActionItems: record.get('totalActionItems').toNumber(),
        totalRisks: record.get('totalRisks').toNumber(),
        avgDuration: record.get('avgDuration'),
        meetingTypes: record.get('meetingTypes'),
        meetingStatuses: record.get('meetingStatuses'),
        timeframe
      };
    } catch (error) {
      throw new Error(`Get meeting metrics failed: ${error.message}`);
    }
  }

  async getMeetingEffectivenessScore(meetingId) {
    try {
      const cypher = `
        MATCH (m:Meeting {meeting_id: $meetingId})
        WHERE m.is_current = true
        OPTIONAL MATCH (m)-[:HAS_DECISION]->(d:Decision)
        WHERE d.is_current = true
        OPTIONAL MATCH (m)-[:HAS_ACTION_ITEM]->(a:ActionItem)
        WHERE a.is_current = true AND a.status IN ['Completed', 'In Progress']
        OPTIONAL MATCH (m)-[:HAS_DELIVERABLE]->(del:Deliverable)
        WHERE del.is_current = true
        RETURN 
          m,
          count(DISTINCT d) as decisionsCount,
          count(DISTINCT a) as activeActionItemsCount,
          count(DISTINCT del) as deliverablesCount
      `;

      const result = await this.db.executeReadQuery(cypher, { meetingId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const meeting = record.get('m').properties;
      const decisionsCount = record.get('decisionsCount').toNumber();
      const activeActionItemsCount = record.get('activeActionItemsCount').toNumber();
      const deliverablesCount = record.get('deliverablesCount').toNumber();

      // Calculate effectiveness score (0-100)
      let score = 0;
      if (decisionsCount > 0) score += 30;
      if (activeActionItemsCount > 0) score += 40;
      if (deliverablesCount > 0) score += 20;
      if (meeting.duration && meeting.duration <= 90) score += 10; // Bonus for concise meetings

      return {
        meetingId,
        effectivenessScore: Math.min(score, 100),
        decisionsCount,
        activeActionItemsCount,
        deliverablesCount,
        duration: meeting.duration,
        recommendations: this.generateEffectivenessRecommendations(score, {
          decisionsCount,
          activeActionItemsCount,
          deliverablesCount,
          duration: meeting.duration
        })
      };
    } catch (error) {
      throw new Error(`Get meeting effectiveness score failed: ${error.message}`);
    }
  }

  generateEffectivenessRecommendations(score, metrics) {
    const recommendations = [];

    if (metrics.decisionsCount === 0) {
      recommendations.push('Consider documenting key decisions made during the meeting');
    }
    if (metrics.activeActionItemsCount === 0) {
      recommendations.push('Assign specific action items with clear owners and due dates');
    }
    if (metrics.deliverablesCount === 0) {
      recommendations.push('Define concrete deliverables or outcomes from the meeting');
    }
    if (metrics.duration > 120) {
      recommendations.push('Consider breaking long meetings into focused sessions');
    }
    if (score >= 80) {
      recommendations.push('Excellent meeting effectiveness! Continue current practices');
    }

    return recommendations;
  }
}

module.exports = Meeting;
