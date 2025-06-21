// Enhanced Meeting Intelligence System - Neo4j Schema Definition
// This script creates the complete graph schema with constraints, indexes, and validation

// ===================================================================
// CONSTRAINT DEFINITIONS
// ===================================================================

// Meeting Constraints
CREATE CONSTRAINT meeting_id_unique IF NOT EXISTS FOR (m:Meeting) REQUIRE m.meeting_id IS UNIQUE;
CREATE CONSTRAINT meeting_id_not_null IF NOT EXISTS FOR (m:Meeting) REQUIRE m.meeting_id IS NOT NULL;

// Decision Constraints  
CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (d:Decision) REQUIRE d.decision_id IS UNIQUE;
CREATE CONSTRAINT decision_id_not_null IF NOT EXISTS FOR (d:Decision) REQUIRE d.decision_id IS NOT NULL;

// ActionItem Constraints
CREATE CONSTRAINT action_id_unique IF NOT EXISTS FOR (a:ActionItem) REQUIRE a.action_id IS UNIQUE;
CREATE CONSTRAINT action_id_not_null IF NOT EXISTS FOR (a:ActionItem) REQUIRE a.action_id IS NOT NULL;

// Risk Constraints
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS FOR (r:Risk) REQUIRE r.risk_id IS UNIQUE;
CREATE CONSTRAINT risk_id_not_null IF NOT EXISTS FOR (r:Risk) REQUIRE r.risk_id IS NOT NULL;

// Deliverable Constraints
CREATE CONSTRAINT deliverable_id_unique IF NOT EXISTS FOR (d:Deliverable) REQUIRE d.deliverable_id IS UNIQUE;
CREATE CONSTRAINT deliverable_id_not_null IF NOT EXISTS FOR (d:Deliverable) REQUIRE d.deliverable_id IS NOT NULL;

// Stakeholder Constraints
CREATE CONSTRAINT stakeholder_id_unique IF NOT EXISTS FOR (s:Stakeholder) REQUIRE s.stakeholder_id IS UNIQUE;
CREATE CONSTRAINT stakeholder_id_not_null IF NOT EXISTS FOR (s:Stakeholder) REQUIRE s.stakeholder_id IS NOT NULL;

// ===================================================================
// INDEX DEFINITIONS FOR PERFORMANCE
// ===================================================================

// Primary ID Indexes (automatically created with unique constraints)

// Date-based Indexes for Temporal Queries
CREATE INDEX meeting_date_idx IF NOT EXISTS FOR (m:Meeting) ON (m.date);
CREATE INDEX decision_timestamp_idx IF NOT EXISTS FOR (d:Decision) ON (d.timestamp);
CREATE INDEX action_due_date_idx IF NOT EXISTS FOR (a:ActionItem) ON (a.due_date);

// Status Indexes for Filtering
CREATE INDEX decision_status_idx IF NOT EXISTS FOR (d:Decision) ON (d.status);
CREATE INDEX action_status_idx IF NOT EXISTS FOR (a:ActionItem) ON (a.status);

// Type and Category Indexes
CREATE INDEX meeting_type_idx IF NOT EXISTS FOR (m:Meeting) ON (m.type);
CREATE INDEX deliverable_type_idx IF NOT EXISTS FOR (d:Deliverable) ON (d.type);
CREATE INDEX risk_severity_idx IF NOT EXISTS FOR (r:Risk) ON (r.severity);
CREATE INDEX stakeholder_role_idx IF NOT EXISTS FOR (s:Stakeholder) ON (s.role);

// Text Search Indexes
CREATE INDEX meeting_title_text IF NOT EXISTS FOR (m:Meeting) ON (m.title);
CREATE INDEX decision_description_text IF NOT EXISTS FOR (d:Decision) ON (d.description);
CREATE INDEX action_description_text IF NOT EXISTS FOR (a:ActionItem) ON (a.description);
CREATE INDEX risk_description_text IF NOT EXISTS FOR (r:Risk) ON (r.description);
CREATE INDEX deliverable_description_text IF NOT EXISTS FOR (d:Deliverable) ON (d.description);
CREATE INDEX stakeholder_name_text IF NOT EXISTS FOR (s:Stakeholder) ON (s.name);

// Temporal Indexes for Historical Queries
CREATE INDEX entity_created_at_idx IF NOT EXISTS FOR (n) ON (n.created_at);
CREATE INDEX entity_updated_at_idx IF NOT EXISTS FOR (n) ON (n.updated_at);
CREATE INDEX entity_valid_from_idx IF NOT EXISTS FOR (n) ON (n.valid_from);
CREATE INDEX entity_valid_to_idx IF NOT EXISTS FOR (n) ON (n.valid_to);
CREATE INDEX entity_is_current_idx IF NOT EXISTS FOR (n) ON (n.is_current);

// Composite Indexes for Complex Queries
CREATE INDEX meeting_date_type_composite IF NOT EXISTS FOR (m:Meeting) ON (m.date, m.type);
CREATE INDEX action_status_due_date_composite IF NOT EXISTS FOR (a:ActionItem) ON (a.status, a.due_date);
CREATE INDEX decision_status_timestamp_composite IF NOT EXISTS FOR (d:Decision) ON (d.status, d.timestamp);

// ===================================================================
// SAMPLE DATA CREATION FOR TESTING
// ===================================================================

// Create Sample Stakeholders
CREATE (s1:Stakeholder {
    stakeholder_id: 'STK001',
    name: 'John Smith',
    role: 'Project Manager',
    email: 'john.smith@company.com',
    department: 'Engineering',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

CREATE (s2:Stakeholder {
    stakeholder_id: 'STK002', 
    name: 'Sarah Johnson',
    role: 'Technical Lead',
    email: 'sarah.johnson@company.com',
    department: 'Engineering',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

CREATE (s3:Stakeholder {
    stakeholder_id: 'STK003',
    name: 'Mike Chen',
    role: 'Business Analyst',
    email: 'mike.chen@company.com', 
    department: 'Product',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// Create Sample Meeting
CREATE (m1:Meeting {
    meeting_id: 'MTG001',
    title: 'Q4 Product Planning Session',
    date: datetime('2024-12-15T09:00:00'),
    type: 'Planning',
    duration: 120,
    location: 'Conference Room A',
    status: 'Completed',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// Create Sample Decisions
CREATE (d1:Decision {
    decision_id: 'DEC001',
    description: 'Adopt microservices architecture for new product features',
    status: 'Approved',
    timestamp: datetime('2024-12-15T10:30:00'),
    rationale: 'Better scalability and team autonomy',
    impact_level: 'High',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

CREATE (d2:Decision {
    decision_id: 'DEC002',
    description: 'Implement automated testing pipeline',
    status: 'Approved',
    timestamp: datetime('2024-12-15T11:00:00'),
    rationale: 'Reduce deployment risks and improve quality',
    impact_level: 'Medium',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// Create Sample Action Items
CREATE (a1:ActionItem {
    action_id: 'ACT001',
    description: 'Design microservices architecture diagram',
    status: 'In Progress',
    due_date: datetime('2024-12-30T17:00:00'),
    priority: 'High',
    estimated_hours: 16,
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

CREATE (a2:ActionItem {
    action_id: 'ACT002',
    description: 'Set up CI/CD pipeline infrastructure',
    status: 'Not Started',
    due_date: datetime('2025-01-15T17:00:00'),
    priority: 'Medium',
    estimated_hours: 24,
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// Create Sample Risks
CREATE (r1:Risk {
    risk_id: 'RSK001',
    description: 'Microservices complexity may impact initial delivery timeline',
    severity: 'Medium',
    probability: 'Medium',
    impact: 'Schedule delay of 2-4 weeks',
    mitigation_strategy: 'Phased rollout approach with clear milestones',
    status: 'Active',
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// Create Sample Deliverables
CREATE (del1:Deliverable {
    deliverable_id: 'DEL001',
    description: 'Microservices Architecture Documentation',
    type: 'Documentation',
    status: 'In Progress',
    due_date: datetime('2025-01-05T17:00:00'),
    completion_percentage: 25,
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

CREATE (del2:Deliverable {
    deliverable_id: 'DEL002',
    description: 'Automated Testing Framework',
    type: 'Technical Implementation',
    status: 'Planned',
    due_date: datetime('2025-01-20T17:00:00'),
    completion_percentage: 0,
    created_at: datetime(),
    updated_at: datetime(),
    valid_from: datetime(),
    valid_to: null,
    is_current: true
});

// ===================================================================
// RELATIONSHIP CREATION
// ===================================================================

// Meeting Relationships
MATCH (m:Meeting {meeting_id: 'MTG001'})
MATCH (d1:Decision {decision_id: 'DEC001'})
MATCH (d2:Decision {decision_id: 'DEC002'})
MATCH (a1:ActionItem {action_id: 'ACT001'})
MATCH (a2:ActionItem {action_id: 'ACT002'})
MATCH (r1:Risk {risk_id: 'RSK001'})
MATCH (del1:Deliverable {deliverable_id: 'DEL001'})
MATCH (del2:Deliverable {deliverable_id: 'DEL002'})
CREATE (m)-[:HAS_DECISION {created_at: datetime()}]->(d1)
CREATE (m)-[:HAS_DECISION {created_at: datetime()}]->(d2)
CREATE (m)-[:HAS_ACTION_ITEM {created_at: datetime()}]->(a1)
CREATE (m)-[:HAS_ACTION_ITEM {created_at: datetime()}]->(a2)
CREATE (m)-[:HAS_RISK {created_at: datetime()}]->(r1)
CREATE (m)-[:HAS_DELIVERABLE {created_at: datetime()}]->(del1)
CREATE (m)-[:HAS_DELIVERABLE {created_at: datetime()}]->(del2);

// Decision Impact Relationships
MATCH (d1:Decision {decision_id: 'DEC001'})
MATCH (d2:Decision {decision_id: 'DEC002'})
MATCH (del1:Deliverable {deliverable_id: 'DEL001'})
MATCH (del2:Deliverable {deliverable_id: 'DEL002'})
MATCH (s1:Stakeholder {stakeholder_id: 'STK001'})
MATCH (s2:Stakeholder {stakeholder_id: 'STK002'})
CREATE (d1)-[:IMPACTS {impact_type: 'Creates', created_at: datetime()}]->(del1)
CREATE (d2)-[:IMPACTS {impact_type: 'Enables', created_at: datetime()}]->(del2)
CREATE (d1)-[:ASSOCIATED_WITH {involvement_level: 'Decision Maker', created_at: datetime()}]->(s1)
CREATE (d2)-[:ASSOCIATED_WITH {involvement_level: 'Implementer', created_at: datetime()}]->(s2);

// Action Item Assignments
MATCH (a1:ActionItem {action_id: 'ACT001'})
MATCH (a2:ActionItem {action_id: 'ACT002'})
MATCH (s2:Stakeholder {stakeholder_id: 'STK002'})
MATCH (s1:Stakeholder {stakeholder_id: 'STK001'})
CREATE (a1)-[:ASSIGNED_TO {assignment_date: datetime(), workload_percentage: 50}]->(s2)
CREATE (a2)-[:ASSIGNED_TO {assignment_date: datetime(), workload_percentage: 75}]->(s1);

// Risk Mitigation Relationships
MATCH (r1:Risk {risk_id: 'RSK001'})
MATCH (a1:ActionItem {action_id: 'ACT001'})
CREATE (r1)-[:MITIGATED_BY {mitigation_effectiveness: 'High', created_at: datetime()}]->(a1);

// Deliverable Ownership
MATCH (del1:Deliverable {deliverable_id: 'DEL001'})
MATCH (del2:Deliverable {deliverable_id: 'DEL002'})
MATCH (s2:Stakeholder {stakeholder_id: 'STK002'})
MATCH (s1:Stakeholder {stakeholder_id: 'STK001'})
CREATE (del1)-[:OWNED_BY {ownership_type: 'Primary', responsibility_percentage: 100, created_at: datetime()}]->(s2)
CREATE (del2)-[:OWNED_BY {ownership_type: 'Primary', responsibility_percentage: 100, created_at: datetime()}]->(s1);

// ===================================================================
// VALIDATION QUERIES
// ===================================================================

// Verify schema creation
CALL db.constraints();
CALL db.indexes();

// Verify sample data
MATCH (n) RETURN labels(n) as NodeType, count(n) as Count ORDER BY NodeType;

// Verify relationships
MATCH ()-[r]->() RETURN type(r) as RelationshipType, count(r) as Count ORDER BY RelationshipType;

// Test complex query - Meeting with all related entities
MATCH (m:Meeting {meeting_id: 'MTG001'})
OPTIONAL MATCH (m)-[:HAS_DECISION]->(d:Decision)
OPTIONAL MATCH (m)-[:HAS_ACTION_ITEM]->(a:ActionItem)
OPTIONAL MATCH (m)-[:HAS_RISK]->(r:Risk)
OPTIONAL MATCH (m)-[:HAS_DELIVERABLE]->(del:Deliverable)
RETURN m.title, 
       collect(DISTINCT d.description) as Decisions,
       collect(DISTINCT a.description) as ActionItems,
       collect(DISTINCT r.description) as Risks,
       collect(DISTINCT del.description) as Deliverables;
