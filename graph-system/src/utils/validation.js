const Joi = require('joi');

// ===================================================================
// BASE VALIDATION SCHEMAS
// ===================================================================

const baseEntitySchema = {
  created_at: Joi.date().iso().optional(),
  updated_at: Joi.date().iso().optional(),
  valid_from: Joi.date().iso().optional(),
  valid_to: Joi.date().iso().allow(null).optional(),
  is_current: Joi.boolean().default(true)
};

// ===================================================================
// MEETING VALIDATION SCHEMA
// ===================================================================

const meetingSchema = Joi.object({
  meeting_id: Joi.string().required().pattern(/^MTG[0-9]{3,6}$/),
  title: Joi.string().required().min(3).max(200),
  date: Joi.date().iso().required(),
  type: Joi.string().required().valid(
    'Planning', 'Review', 'Standup', 'Retrospective', 
    'Strategy', 'Decision', 'Status', 'Emergency'
  ),
  duration: Joi.number().integer().min(15).max(480), // 15 minutes to 8 hours
  location: Joi.string().max(100).optional(),
  status: Joi.string().valid('Scheduled', 'In Progress', 'Completed', 'Cancelled').default('Scheduled'),
  description: Joi.string().max(1000).optional(),
  agenda: Joi.string().max(2000).optional(),
  participants_count: Joi.number().integer().min(1).optional(),
  ...baseEntitySchema
});

// ===================================================================
// DECISION VALIDATION SCHEMA
// ===================================================================

const decisionSchema = Joi.object({
  decision_id: Joi.string().required().pattern(/^DEC[0-9]{3,6}$/),
  description: Joi.string().required().min(10).max(500),
  status: Joi.string().required().valid(
    'Proposed', 'Under Review', 'Approved', 'Rejected', 
    'Deferred', 'Implemented', 'Cancelled'
  ),
  timestamp: Joi.date().iso().required(),
  rationale: Joi.string().max(1000).optional(),
  impact_level: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
  decision_maker: Joi.string().max(100).optional(),
  implementation_date: Joi.date().iso().optional(),
  review_date: Joi.date().iso().optional(),
  ...baseEntitySchema
});

// ===================================================================
// ACTION ITEM VALIDATION SCHEMA  
// ===================================================================

const actionItemSchema = Joi.object({
  action_id: Joi.string().required().pattern(/^ACT[0-9]{3,6}$/),
  description: Joi.string().required().min(5).max(300),
  status: Joi.string().required().valid(
    'Not Started', 'In Progress', 'Blocked', 'Under Review', 
    'Completed', 'Cancelled', 'Deferred'
  ),
  due_date: Joi.date().iso().required(),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').required(),
  estimated_hours: Joi.number().positive().max(200).optional(),
  actual_hours: Joi.number().positive().optional(),
  completion_percentage: Joi.number().min(0).max(100).default(0),
  category: Joi.string().max(50).optional(),
  tags: Joi.array().items(Joi.string().max(30)).optional(),
  ...baseEntitySchema
});

// ===================================================================
// RISK VALIDATION SCHEMA
// ===================================================================

const riskSchema = Joi.object({
  risk_id: Joi.string().required().pattern(/^RSK[0-9]{3,6}$/),
  description: Joi.string().required().min(10).max(500),
  severity: Joi.string().required().valid('Low', 'Medium', 'High', 'Critical'),
  probability: Joi.string().required().valid('Low', 'Medium', 'High'),
  impact: Joi.string().max(300).optional(),
  mitigation_strategy: Joi.string().max(500).optional(),
  status: Joi.string().valid('Identified', 'Active', 'Mitigated', 'Occurred', 'Closed').default('Identified'),
  category: Joi.string().max(50).optional(),
  owner: Joi.string().max(100).optional(),
  identified_date: Joi.date().iso().optional(),
  target_resolution_date: Joi.date().iso().optional(),
  ...baseEntitySchema
});

// ===================================================================
// DELIVERABLE VALIDATION SCHEMA
// ===================================================================

const deliverableSchema = Joi.object({
  deliverable_id: Joi.string().required().pattern(/^DEL[0-9]{3,6}$/),
  description: Joi.string().required().min(5).max(300),
  type: Joi.string().required().valid(
    'Documentation', 'Technical Implementation', 'Process', 
    'Report', 'Presentation', 'Training', 'System', 'Other'
  ),
  status: Joi.string().required().valid(
    'Planned', 'In Progress', 'Under Review', 'Completed', 
    'Delivered', 'Accepted', 'Rejected', 'Cancelled'
  ),
  due_date: Joi.date().iso().required(),
  completion_percentage: Joi.number().min(0).max(100).default(0),
  quality_score: Joi.number().min(0).max(100).optional(),
  estimated_effort: Joi.number().positive().optional(),
  actual_effort: Joi.number().positive().optional(),
  business_value: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
  dependencies: Joi.array().items(Joi.string()).optional(),
  ...baseEntitySchema
});

// ===================================================================
// STAKEHOLDER VALIDATION SCHEMA
// ===================================================================

const stakeholderSchema = Joi.object({
  stakeholder_id: Joi.string().required().pattern(/^STK[0-9]{3,6}$/),
  name: Joi.string().required().min(2).max(100),
  role: Joi.string().required().max(100),
  email: Joi.string().email().required(),
  department: Joi.string().max(100).optional(),
  seniority_level: Joi.string().valid(
    'Junior', 'Mid-Level', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'
  ).optional(),
  expertise_areas: Joi.array().items(Joi.string().max(50)).optional(),
  contact_preference: Joi.string().valid('Email', 'Phone', 'Slack', 'Teams').optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  timezone: Joi.string().optional(),
  active: Joi.boolean().default(true),
  ...baseEntitySchema
});

// ===================================================================
// RELATIONSHIP VALIDATION SCHEMAS
// ===================================================================

const relationshipSchemas = {
  HAS_DECISION: Joi.object({
    created_at: Joi.date().iso().default(() => new Date()),
    confidence_score: Joi.number().min(0).max(1).optional()
  }),

  HAS_ACTION_ITEM: Joi.object({
    created_at: Joi.date().iso().default(() => new Date()),
    derived_from_decision: Joi.boolean().default(false)
  }),

  HAS_RISK: Joi.object({
    created_at: Joi.date().iso().default(() => new Date()),
    risk_level: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional()
  }),

  HAS_DELIVERABLE: Joi.object({
    created_at: Joi.date().iso().default(() => new Date()),
    criticality: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional()
  }),

  IMPACTS: Joi.object({
    impact_type: Joi.string().required().valid(
      'Creates', 'Modifies', 'Enables', 'Blocks', 'Delays', 'Accelerates'
    ),
    impact_magnitude: Joi.string().valid('Minor', 'Moderate', 'Major', 'Severe').optional(),
    created_at: Joi.date().iso().default(() => new Date())
  }),

  ASSOCIATED_WITH: Joi.object({
    involvement_level: Joi.string().required().valid(
      'Decision Maker', 'Contributor', 'Reviewer', 'Informed', 'Observer'
    ),
    influence_score: Joi.number().min(0).max(1).optional(),
    created_at: Joi.date().iso().default(() => new Date())
  }),

  ASSIGNED_TO: Joi.object({
    assignment_date: Joi.date().iso().default(() => new Date()),
    workload_percentage: Joi.number().min(0).max(100).required(),
    assignment_type: Joi.string().valid('Primary', 'Secondary', 'Reviewer', 'Approver').default('Primary')
  }),

  MITIGATED_BY: Joi.object({
    mitigation_effectiveness: Joi.string().required().valid('Low', 'Medium', 'High'),
    implementation_status: Joi.string().valid('Planned', 'Active', 'Completed').default('Planned'),
    created_at: Joi.date().iso().default(() => new Date())
  }),

  OWNED_BY: Joi.object({
    ownership_type: Joi.string().required().valid('Primary', 'Secondary', 'Shared'),
    responsibility_percentage: Joi.number().min(0).max(100).required(),
    accountability_level: Joi.string().valid('Full', 'Partial', 'Advisory').default('Full'),
    created_at: Joi.date().iso().default(() => new Date())
  })
};

// ===================================================================
// QUERY VALIDATION SCHEMAS
// ===================================================================

const querySchemas = {
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().max(50).optional(),
    sort_order: Joi.string().valid('asc', 'desc').default('asc')
  }),

  // Date range filtering
  dateRange: Joi.object({
    start_date: Joi.date().iso().optional(),
    end_date: Joi.date().iso().optional()
  }),

  // Text search
  textSearch: Joi.object({
    query: Joi.string().min(1).max(200).required(),
    fields: Joi.array().items(Joi.string()).optional(),
    fuzzy: Joi.boolean().default(false)
  }),

  // Entity filtering
  entityFilter: Joi.object({
    status: Joi.array().items(Joi.string()).optional(),
    type: Joi.array().items(Joi.string()).optional(),
    priority: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  // Temporal queries
  temporalQuery: Joi.object({
    timestamp: Joi.date().iso().required(),
    entity_type: Joi.string().optional(),
    entity_id: Joi.string().optional()
  })
};

// ===================================================================
// VALIDATION FUNCTIONS
// ===================================================================

const validateEntity = (entityType, data) => {
  const schemas = {
    meeting: meetingSchema,
    decision: decisionSchema,
    actionItem: actionItemSchema,
    risk: riskSchema,
    deliverable: deliverableSchema,
    stakeholder: stakeholderSchema
  };

  const schema = schemas[entityType];
  if (!schema) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }

  const { error, value } = schema.validate(data, { 
    abortEarly: false,
    stripUnknown: true,
    dateFormat: 'iso'
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    throw new Error(`Validation failed for ${entityType}: ${JSON.stringify(details)}`);
  }

  return value;
};

const validateRelationship = (relationshipType, data) => {
  const schema = relationshipSchemas[relationshipType];
  if (!schema) {
    throw new Error(`Unknown relationship type: ${relationshipType}`);
  }

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw new Error(`Validation failed for relationship ${relationshipType}: ${error.message}`);
  }

  return value;
};

const validateQuery = (queryType, data) => {
  const schema = querySchemas[queryType];
  if (!schema) {
    throw new Error(`Unknown query type: ${queryType}`);
  }

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw new Error(`Query validation failed for ${queryType}: ${error.message}`);
  }

  return value;
};

module.exports = {
  schemas: {
    meeting: meetingSchema,
    decision: decisionSchema,
    actionItem: actionItemSchema,
    risk: riskSchema,
    deliverable: deliverableSchema,
    stakeholder: stakeholderSchema,
    relationships: relationshipSchemas,
    queries: querySchemas
  },
  validateEntity,
  validateRelationship,
  validateQuery
};
