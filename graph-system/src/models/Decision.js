const BaseModel = require('./BaseModel');
const { validateRelationship } = require('../utils/validation');

class Decision extends BaseModel {
  constructor() {
    super('Decision');
  }

  // ===================================================================
  // DECISION-SPECIFIC CRUD OPERATIONS
  // ===================================================================

  async create(data) {
    return super.create(data, 'decision');
  }

  async findById(decisionId) {
    return super.findById(decisionId, 'decision_id');
  }

  async update(decisionId, data) {
    return super.update(decisionId, data, 'decision_id', 'decision');
  }

  async delete(decisionId, softDelete = true) {
    return super.delete(decisionId, 'decision_id', softDelete);
  }

  // ===================================================================
  // DECISION-SPECIFIC RELATIONSHIP OPERATIONS
  // ===================================================================

  async associateWithStakeholder(decisionId, stakeholderId, properties = {}) {
    const validatedProps = validateRelationship('ASSOCIATED_WITH', properties);
    return super.createRelationship(
      decisionId, stakeholderId, 'ASSOCIATED_WITH', validatedProps,
      'decision_id', 'stakeholder_id', 'Decision', 'Stakeholder'
    );
  }

  async impactDeliverable(decisionId, deliverableId, properties = {}) {
    const validatedProps = validateRelationship('IMPACTS', properties);
    return super.createRelationship(
      decisionId, deliverableId, 'IMPACTS', validatedProps,
      'decision_id', 'deliverable_id', 'Decision', 'Deliverable'
    );
  }

  // ===================================================================
  // DECISION-SPECIFIC QUERY OPERATIONS
  // ===================================================================

  async getDecisionDetails(decisionId) {
    try {
      const cypher = `
        MATCH (d:Decision {decision_id: $decisionId})
        WHERE d.is_current = true
        OPTIONAL MATCH (d)-[assoc:ASSOCIATED_WITH]->(s:Stakeholder)
        WHERE s.is_current = true
        OPTIONAL MATCH (d)-[imp:IMPACTS]->(del:Deliverable)
        WHERE del.is_current = true
        OPTIONAL MATCH (m:Meeting)-[:HAS_DECISION]->(d)
        WHERE m.is_current = true
        RETURN d,
               collect(DISTINCT {stakeholder: s, relationship: assoc}) as stakeholders,
               collect(DISTINCT {deliverable: del, relationship: imp}) as impactedDeliverables,
               collect(DISTINCT m) as meetings
      `;

      const result = await this.db.executeReadQuery(cypher, { decisionId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        decision: record.get('d').properties,
        stakeholders: record.get('stakeholders').map(item => ({
          stakeholder: item.stakeholder?.properties,
          relationship: item.relationship?.properties
        })).filter(item => item.stakeholder),
        impactedDeliverables: record.get('impactedDeliverables').map(item => ({
          deliverable: item.deliverable?.properties,
          relationship: item.relationship?.properties
        })).filter(item => item.deliverable),
        meetings: record.get('meetings').map(m => m.properties)
      };
    } catch (error) {
      throw new Error(`Get decision details failed: ${error.message}`);
    }
  }

  async getDecisionsByStatus(status, options = {}) {
    try {
      const filters = { is_current: true, status };
      return super.findAll(filters, options);
    } catch (error) {
      throw new Error(`Get decisions by status failed: ${error.message}`);
    }
  }

  async getDecisionsByImpactLevel(impactLevel, options = {}) {
    try {
      const filters = { is_current: true, impact_level: impactLevel };
      return super.findAll(filters, options);
    } catch (error) {
      throw new Error(`Get decisions by impact level failed: ${error.message}`);
    }
  }

  async getDecisionsByDateRange(startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 20, status = null, impactLevel = null } = options;
      
      let filters = { is_current: true };
      if (status) filters.status = status;
      if (impactLevel) filters.impact_level = impactLevel;

      const { whereClause, parameters } = this.buildWhereClause(filters);
      const dateFilter = `AND d.timestamp >= $startDate AND d.timestamp <= $endDate`;
      
      const cypher = `
        MATCH (d:Decision)
        ${whereClause} ${dateFilter}
        RETURN d
        ORDER BY d.timestamp DESC
        ${this.buildPaginationClause(page, limit)}
      `;

      const queryParams = { ...parameters, startDate, endDate };
      const result = await this.db.executeReadQuery(cypher, queryParams);

      return result.records.map(record => record.get('d').properties);
    } catch (error) {
      throw new Error(`Get decisions by date range failed: ${error.message}`);
    }
  }

  // ===================================================================
  // DECISION ANALYTICS
  // ===================================================================

  async getDecisionMetrics(timeframe = 'month') {
    try {
      let dateFilter = '';
      const now = new Date();
      
      switch (timeframe) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = `AND d.timestamp >= '${weekAgo.toISOString()}'`;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          dateFilter = `AND d.timestamp >= '${monthAgo.toISOString()}'`;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          dateFilter = `AND d.timestamp >= '${quarterAgo.toISOString()}'`;
          break;
      }

      const cypher = `
        MATCH (d:Decision)
        WHERE d.is_current = true ${dateFilter}
        OPTIONAL MATCH (d)-[:IMPACTS]->(del:Deliverable)
        WHERE del.is_current = true
        OPTIONAL MATCH (d)-[:ASSOCIATED_WITH]->(s:Stakeholder)
        WHERE s.is_current = true
        RETURN 
          count(DISTINCT d) as totalDecisions,
          count(DISTINCT del) as impactedDeliverables,
          count(DISTINCT s) as involvedStakeholders,
          collect(DISTINCT d.status) as statuses,
          collect(DISTINCT d.impact_level) as impactLevels,
          avg(duration.between(d.timestamp, d.implementation_date).days) as avgImplementationDays
      `;

      const result = await this.db.executeReadQuery(cypher);
      
      if (result.records.length === 0) {
        return {
          totalDecisions: 0,
          impactedDeliverables: 0,
          involvedStakeholders: 0,
          statuses: [],
          impactLevels: [],
          avgImplementationDays: null
        };
      }

      const record = result.records[0];
      return {
        totalDecisions: record.get('totalDecisions').toNumber(),
        impactedDeliverables: record.get('impactedDeliverables').toNumber(),
        involvedStakeholders: record.get('involvedStakeholders').toNumber(),
        statuses: record.get('statuses'),
        impactLevels: record.get('impactLevels'),
        avgImplementationDays: record.get('avgImplementationDays'),
        timeframe
      };
    } catch (error) {
      throw new Error(`Get decision metrics failed: ${error.message}`);
    }
  }

  async getDecisionImpactAnalysis(decisionId) {
    try {
      const cypher = `
        MATCH (d:Decision {decision_id: $decisionId})
        WHERE d.is_current = true
        
        // Direct deliverable impacts
        OPTIONAL MATCH (d)-[imp:IMPACTS]->(del:Deliverable)
        WHERE del.is_current = true
        
        // Stakeholder associations
        OPTIONAL MATCH (d)-[assoc:ASSOCIATED_WITH]->(s:Stakeholder)
        WHERE s.is_current = true
        
        // Indirect impacts through deliverables
        OPTIONAL MATCH (del)-[:OWNED_BY]->(owner:Stakeholder)
        WHERE owner.is_current = true
        
        // Action items that might be created due to this decision
        OPTIONAL MATCH (m:Meeting)-[:HAS_DECISION]->(d)
        OPTIONAL MATCH (m)-[:HAS_ACTION_ITEM]->(a:ActionItem)
        WHERE m.is_current = true AND a.is_current = true
        
        RETURN d,
               collect(DISTINCT {deliverable: del, impact: imp}) as directImpacts,
               collect(DISTINCT {stakeholder: s, association: assoc}) as stakeholderInvolvement,
               collect(DISTINCT owner) as indirectStakeholders,
               collect(DISTINCT a) as relatedActionItems
      `;

      const result = await this.db.executeReadQuery(cypher, { decisionId });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      const decision = record.get('d').properties;
      
      // Calculate impact score
      const directImpacts = record.get('directImpacts').filter(item => item.deliverable);
      const stakeholderInvolvement = record.get('stakeholderInvolvement').filter(item => item.stakeholder);
      const indirectStakeholders = record.get('indirectStakeholders');
      const relatedActionItems = record.get('relatedActionItems');

      const impactScore = this.calculateImpactScore({
        directImpacts: directImpacts.length,
        stakeholders: stakeholderInvolvement.length + indirectStakeholders.length,
        actionItems: relatedActionItems.length,
        impactLevel: decision.impact_level
      });

      return {
        decision,
        impactScore,
        analysis: {
          directImpacts: directImpacts.map(item => ({
            deliverable: item.deliverable.properties,
            impactType: item.impact?.properties?.impact_type,
            impactMagnitude: item.impact?.properties?.impact_magnitude
          })),
          stakeholderInvolvement: stakeholderInvolvement.map(item => ({
            stakeholder: item.stakeholder.properties,
            involvementLevel: item.association?.properties?.involvement_level,
            influenceScore: item.association?.properties?.influence_score
          })),
          indirectStakeholders: indirectStakeholders.map(s => s.properties),
          relatedActionItems: relatedActionItems.map(a => a.properties)
        }
      };
    } catch (error) {
      throw new Error(`Get decision impact analysis failed: ${error.message}`);
    }
  }

  calculateImpactScore({ directImpacts, stakeholders, actionItems, impactLevel }) {
    let score = 0;
    
    // Base score from impact level
    const impactLevelScores = { 'Low': 20, 'Medium': 40, 'High': 70, 'Critical': 100 };
    score = impactLevelScores[impactLevel] || 0;
    
    // Adjust based on network effects
    score += Math.min(directImpacts * 10, 30); // Max 30 points for deliverable impacts
    score += Math.min(stakeholders * 5, 20);   // Max 20 points for stakeholder involvement
    score += Math.min(actionItems * 3, 15);    // Max 15 points for action items
    
    return Math.min(score, 100);
  }

  async getDecisionDependencyGraph(decisionId, depth = 2) {
    try {
      const cypher = `
        MATCH (d:Decision {decision_id: $decisionId})
        WHERE d.is_current = true
        CALL apoc.path.expand(d, "IMPACTS>|ASSOCIATED_WITH>", "Decision|Deliverable|Stakeholder", 1, $depth)
        YIELD path
        RETURN path
      `;

      const result = await this.db.executeReadQuery(cypher, { decisionId, depth });

      // Process paths to build dependency graph
      const nodes = new Map();
      const relationships = [];

      result.records.forEach(record => {
        const path = record.get('path');
        const pathNodes = path.segments.reduce((acc, segment) => {
          acc.push(segment.start, segment.end);
          return acc;
        }, []);

        pathNodes.forEach(node => {
          const id = node.properties[Object.keys(node.properties).find(key => key.endsWith('_id'))];
          if (!nodes.has(id)) {
            nodes.set(id, {
              id,
              labels: node.labels,
              properties: node.properties
            });
          }
        });

        path.segments.forEach(segment => {
          relationships.push({
            from: segment.start.properties[Object.keys(segment.start.properties).find(key => key.endsWith('_id'))],
            to: segment.end.properties[Object.keys(segment.end.properties).find(key => key.endsWith('_id'))],
            type: segment.relationship.type,
            properties: segment.relationship.properties
          });
        });
      });

      return {
        nodes: Array.from(nodes.values()),
        relationships,
        centerNode: decisionId,
        depth
      };
    } catch (error) {
      throw new Error(`Get decision dependency graph failed: ${error.message}`);
    }
  }
}

module.exports = Decision;
