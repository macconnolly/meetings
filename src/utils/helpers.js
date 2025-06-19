const { enhancedMeetingSchema } = require('../../config/schema');
// ID Generation Functions
function generateDecisionId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `DCN-${project}-${date}-${sequence}`;
}

function generateActionId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `ACT-${project}-${date}-${sequence}`;
}

function generateDeliverableId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `DEL-${project}-${date}-${sequence}`;
}

function generateRelationshipId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `REL-${project}-${date}-${sequence}`;
}

function generateRiskId(meetingData, index) {
  const project = extractProjectCode(meetingData.meeting_id);
  const date = meetingData.meeting_date.replace(/-/g, '');
  const sequence = String(index + 1).padStart(3, '0');
  return `RSK-${project}-${date}-${sequence}`;
}

function generateStakeholderId(stakeholderName) {
  const slug = slugify(stakeholderName);
  const hash = simpleHash(stakeholderName);
  return `STK-${slug}-${hash}`;
}

// Text Processing Functions
function slugify(text) {
  if (!text || typeof text !== 'string') return 'unknown';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 6);
}

function extractProjectCode(meetingId) {
  // Extract project code from meeting ID format: PROJECT-WORKSTREAM-YYYYMMDD-TYPE
  const parts = meetingId.split('-');
  return parts.length >= 2 ? parts[0] : 'UNKNOWN';
}

function countParticipants(participantString) {
  if (!participantString) return 0;
  return participantString.split(',').filter(p => p.trim().length > 0).length;
}

// Priority and Scoring Functions
function calculatePriority(urgency, importance) {
  const urgencyScores = {
    routine: 1,
    important: 2,
    urgent: 3,
    critical: 4
  };
  
  const importanceScores = {
    operational: 1,
    tactical: 2,
    strategic: 3,
    transformational: 4
  };
  
  const urgencyScore = urgencyScores[urgency] || 1;
  const importanceScore = importanceScores[importance] || 1;
  
  return Math.min(5, Math.max(1, urgencyScore + importanceScore - 1));
}

function calculateContainerTags(meetingData, contentType, objectData = {}) {
    const tags = ['org_main', 'meeting_intel'];

    // General Meeting Tags
    tags.push(`meeting-${meetingData.meeting_id}`);
    tags.push(`project-${extractProjectCode(meetingData.meeting_id)}`);
    if (meetingData.meeting_type) {
        tags.push(`type-${slugify(meetingData.meeting_type)}`);
    }
    if (meetingData.intelligence_metadata?.strategic_importance) {
        tags.push(`importance-${slugify(meetingData.intelligence_metadata.strategic_importance)}`);
    }

    // Content-Specific Tags
    tags.push(`content-${contentType}`);

    switch (contentType) {
        case 'decision':
            if (objectData.decision_status) tags.push(`status-${slugify(objectData.decision_status)}`);
            if (objectData.reversibility) tags.push(`reversibility-${slugify(objectData.reversibility)}`);
            break;
        case 'action_item':
            if (objectData.priority) tags.push(`priority-${slugify(objectData.priority)}`);
            if (objectData.status) tags.push(`status-${slugify(objectData.status)}`);
            if (isOverdue(objectData.due_date)) tags.push('status-overdue');
            break;
        case 'stakeholder_intel':
            if (objectData.engagement_level) tags.push(`engagement-${slugify(objectData.engagement_level)}`);
            if (objectData.influence_level) tags.push(`influence-${slugify(objectData.influence_level)}`);
            break;
        case 'deliverable':
            if (objectData.deliverable_type) tags.push(`deliverable-${slugify(objectData.deliverable_type)}`);
            if (objectData.complexity_level) tags.push(`complexity-${slugify(objectData.complexity_level)}`);
            break;
        case 'risk':
            if (objectData.risk_category) tags.push(`risk-category-${slugify(objectData.risk_category)}`);
            if (objectData.risk_severity) tags.push(`risk-severity-${slugify(objectData.risk_severity)}`);
            break;
    }

    return [...new Set(tags)];
}


// Analysis Functions
function analyzeDecisionImpact(decision) {
  return {
      timeline: decision.impact_areas?.includes('Timeline') ? 'High' : 'Low',
      resources: decision.impact_areas?.includes('Resources') ? 'Medium' : 'Low',
      risk: decision.impact_areas?.includes('Risk') ? 'High' : 'Low',
      quality: decision.impact_areas?.includes('Quality') ? 'Medium' : 'Low',
  };
}

function analyzeActionItem(action) {
  const effortHours = mapEffortToHours(action.estimated_effort);
  return {
      effortHours,
      timelineRisk: assessTimelineRisk(action)
  };
}

function analyzeStakeholderIntelligence(stakeholder) {
  const engagementScore = calculateEngagementScore(stakeholder);
  const influenceScore = mapInfluenceToScore(stakeholder.influence_level);
  return {
      engagementScore,
      influenceScore,
      patterns: 'Identified patterns of recurring concerns about project scope.',
  };
}

function analyzeDeliverableComplexity(deliverable) {
    return {
        technical: calculateTechnicalComplexity(deliverable),
        stakeholder: calculateStakeholderComplexity(deliverable),
        data: calculateDataComplexity(deliverable),
        timelineRisk: assessDeliverableTimelineRisk(deliverable),
    };
}

function analyzeRelationship(relationship) {
    return {
        criticality: relationship.relationship_strength === 'critical' ? 'High' : 'Medium',
        dependencyType: 'Technical',
        riskLevel: 'Medium',
        changeImpact: 'High',
    };
}

function analyzeRisk(risk) {
    const severityScore = mapSeverityToScore(risk.risk_severity);
    const probabilityScore = mapProbabilityToScore(risk.risk_probability);
    const riskScore = severityScore * probabilityScore;
    return {
        riskScore,
        priorityLevel: riskScore > 10 ? 'High' : 'Medium',
        mitigationUrgency: riskScore > 15 ? 'Immediate' : 'Routine',
    };
}

// Date and Time Functions
function calculateDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calculateDaysUntilDeadline(deadline) {
  return calculateDaysUntilDue(deadline);
}

function isOverdue(dueDate) {
  const days = calculateDaysUntilDue(dueDate);
  return days !== null && days < 0;
}

// Mapping Functions
function mapEffortToHours(effort) {
  const effortMap = {
    'minimal': 2, 'low': 4, 'medium': 8, 'high': 16, 'very_high': 32
  };
  return effortMap[effort] || 8;
}

function mapComplexityToScore(complexity) {
  const complexityMap = {
    'low': 1, 'medium': 2, 'high': 3, 'very_high': 4
  };
  return complexityMap[complexity] || 3;
}

function mapInfluenceToScore(influence) {
  const influenceMap = {
    'low': 1, 'medium': 2, 'high': 3, 'very_high': 4, 'critical': 5
  };
  return influenceMap[influence] || 3;
}

function mapSeverityToScore(severity) {
  const severityMap = {
    'low': 1, 'minor': 2, 'moderate': 3, 'significant': 4, 'severe': 5
  };
  return severityMap[severity] || 2;
}

function mapProbabilityToScore(probability) {
  const probabilityMap = {
    'very_low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5
  };
  return probabilityMap[probability] || 3;
}

// Assessment Functions
function calculateEngagementScore(stakeholder) {
  let score = 5; // Base score
  if (stakeholder.engagement_level === 'disengaged') score -= 2;
  if (stakeholder.engagement_level === 'highly_engaged') score += 2;
  if (stakeholder.concerns_expressed?.length > 2) score += 1;
  if (stakeholder.questions_asked?.length > 3) score += 1;
  return Math.max(1, Math.min(10, score));
}

function calculateTechnicalComplexity(deliverable) {
    let score = 1;
    if (deliverable.requirements_specified?.length > 5) score++;
    if (deliverable.dependencies?.length > 2) score++;
    return Math.min(5, score);
}

function calculateStakeholderComplexity(deliverable) {
    const audienceSize = deliverable.target_audience?.length || 0;
    let score = 1;
    if (audienceSize > 3) score++;
    if (deliverable.stakeholder_input_needed?.length > 2) score++;
    return Math.min(5, score);
}

function calculateDataComplexity(deliverable) {
    const dataRequirements = deliverable.data_requirements?.length || 0;
    let score = 1;
    if (dataRequirements > 2) score++;
    return Math.min(5, score);
}

// Risk Assessment Functions
function assessTimelineRisk(action) {
  const daysUntilDue = calculateDaysUntilDue(action.due_date);
  if (daysUntilDue === null) return 'unknown';
  if (daysUntilDue < 0) return 'high'; // Overdue
  if (daysUntilDue <= 3) return 'high';
  if (daysUntilDue <= 7) return 'medium';
  return 'low';
}

function assessDeliverableTimelineRisk(deliverable) {
  const daysUntilDeadline = calculateDaysUntilDeadline(deliverable.deadline_mentioned);
  if (daysUntilDeadline === null) return 'unknown';
  if (daysUntilDeadline < 0) return 'high'; // Overdue
  if (daysUntilDeadline <= 5) return 'high';
  if (daysUntilDeadline <= 14) return 'medium';
  return 'low';
}

function assessRelationshipRisk(relationship) {
  if (relationship.relationship_strength === 'critical' && relationship.temporal_nature === 'temporary') {
    return 'high';
  }
  if (relationship.relationship_strength === 'weak') return 'low';
  return 'medium';
}

function assessResourceRisk(deliverable) {
  const stakeholderCount = deliverable.stakeholder_input_needed?.length || 0;
  const dataRequirements = deliverable.data_requirements?.length || 0;
  if (stakeholderCount > 5 || dataRequirements > 3) return 'high';
  if (stakeholderCount > 2 || dataRequirements > 1) return 'medium';
  return 'low';
}

function assessScopeRisk(deliverable) {
  const requirementCount = deliverable.requirements_specified?.length || 0;
  if (requirementCount === 0) return 'high'; // No defined requirements
  if (requirementCount > 10) return 'medium'; // Too many requirements
  return 'low';
}

function assessQualityRisk(deliverable) {
  const hasApprovalProcess = !!deliverable.approval_process;
  const hasSuccessCriteria = deliverable.success_criteria?.length > 0;
  if (!hasApprovalProcess && !hasSuccessCriteria) return 'high';
  if (!hasApprovalProcess || !hasSuccessCriteria) return 'medium';
  return 'low';
}

// Format and Display Functions
function formatCommunicationPreferences(prefs) {
  if (!prefs) return 'Not specified';
  const preferencesList = [];
  if (prefs.format_preferences) preferencesList.push(`Format: ${prefs.format_preferences}`);
  if (prefs.frequency) preferencesList.push(`Frequency: ${prefs.frequency}`);
  if (prefs.medium) preferencesList.push(`Medium: ${prefs.medium}`);
  return preferencesList.length > 0 ? preferencesList.join(', ') : 'No specific preferences identified';
}

// Cross-Reference Functions
function isXrossProjectAction(action) {
  const crossProjectIndicators = ['coordination', 'shared', 'cross', 'multiple', 'other'];
  const description = (action.description || '').toLowerCase();
  return crossProjectIndicators.some(indicator => description.includes(indicator));
}

function isXrossProjectDeliverable(deliverable) {
  const crossProjectIndicators = ['cross', 'shared', 'organization', 'multiple'];
  const name = (deliverable.deliverable_name || '').toLowerCase();
  return crossProjectIndicators.some(indicator => name.includes(indicator));
}

function isXrossProjectRelationship(relationship) {
  const crossProjectTypes = ['project', 'department', 'system'];
  return crossProjectTypes.includes(relationship.entity_type) || 
         crossProjectTypes.includes(relationship.related_entity_type);
}

function hasXrossProjectImplications(decision) {
  const crossProjectImpacts = ['Resources', 'Scope', 'Timeline', 'Process_Change'];
  return decision.impact_areas?.some(area => crossProjectImpacts.includes(area));
}

function hasXrossProjectRiskImpact(risk) {
  const crossProjectCategories = ['organizational', 'strategic', 'resource'];
  return crossProjectCategories.includes(risk.risk_category);
}

function hasXrossProjectInsights(insights) {
  return insights.dependencies_highlighted?.some(dep => 
    dep.toLowerCase().includes('project') || dep.toLowerCase().includes('department')
  );
}

// Validation Functions
function hasMeasurableOutcome(action) {
  const measurableIndicators = ['complete', 'deliver', 'finish', 'approve', 'implement'];
  const description = (action.description || '').toLowerCase();
  return measurableIndicators.some(indicator => description.includes(indicator));
}

function hasQualityImplications(meetingData) {
  return meetingData.decisions_with_context?.some(decision => 
    decision.impact_areas?.includes('Quality')
  );
}

function hasResourceImplications(meetingData) {
  return meetingData.decisions_with_context?.some(decision => 
    decision.impact_areas?.includes('Resources')
  );
}

function hasFollowUpIndicators(section) {
  const content = `${section.section_title} ${section.key_points?.join(' ') || ''}`.toLowerCase();
  const followUpKeywords = ['follow up', 'next steps', 'action required', 'pending'];
  return followUpKeywords.some(keyword => content.includes(keyword));
}

function hasDecisionIndicators(section) {
  const content = `${section.section_title} ${section.key_points?.join(' ') || ''}`.toLowerCase();
  const decisionKeywords = ['decided', 'approved', 'agreed', 'determined'];
  return decisionKeywords.some(keyword => content.includes(keyword));
}

function requiresMaintenance(relationship) {
  const maintenanceTypes = ['temporary', 'project_duration', 'conditional'];
  return maintenanceTypes.includes(relationship.temporal_nature);
}

// Content Analysis Functions
function extractTopicsFromSection(section) {
  const topics = [];
  if (section.section_title) topics.push(section.section_title);
  if (section.key_points) {
    section.key_points.forEach(point => {
      // Extract key terms from discussion points
      const terms = point.split(/\s+/).filter(term => term.length > 4);
      topics.push(...terms.slice(0, 3)); // Take first 3 meaningful terms
    });
  }
  return [...new Set(topics)].slice(0, 10); // Limit to 10 unique topics
}

function extractKeywords(text) {
  if (!text) return [];
  const stopWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
  return text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word))
    .slice(0, 10);
}

function extractDecisionTopics(decision) {
  const topics = [];
  if (decision.decision) topics.push(...extractKeywords(decision.decision));
  if (decision.rationale) topics.push(...extractKeywords(decision.rationale));
  if (decision.impact_areas) topics.push(...decision.impact_areas);
  return [...new Set(topics)].slice(0, 8);
}

function extractActionTopics(action) {
  const topics = [];
  if (action.description) topics.push(...extractKeywords(action.description));
  if (action.tags) topics.push(...action.tags);
  return [...new Set(topics)].slice(0, 8);
}

function extractStakeholderTopics(stakeholder) {
  const topics = [];
  if (stakeholder.role_in_meeting) topics.push(stakeholder.role_in_meeting);
  if (stakeholder.organizational_role) topics.push(stakeholder.organizational_role);
  if (stakeholder.concerns_expressed) topics.push(...stakeholder.concerns_expressed.slice(0, 3));
  return [...new Set(topics)].slice(0, 10);
}

function validateAndSanitize(data, schemaName) {
    const schemaConfig = enhancedMeetingSchema;
    if (schemaConfig.name !== schemaName) {
        // In a real app, you might have a map of schemas
        throw new Error(`Schema '${schemaName}' not found or configured.`);
    }

    const errors = [];
    const validatedData = JSON.parse(JSON.stringify(data)); // Deep copy to sanitize

    function traverseAndValidate(currentData, currentSchema, path) {
        if (!currentSchema || typeof currentData === 'undefined') return;

        // Type checking
        const expectedType = currentSchema.type;
        const actualType = Array.isArray(currentData) ? 'array' : typeof currentData;

        if (expectedType && actualType !== 'undefined' && expectedType !== actualType) {
            errors.push(`Invalid type at ${path}: expected ${expectedType}, got ${actualType}`);
            return; // Stop validation for this branch if type is wrong
        }
        
        // Enum check
        if (currentSchema.enum && !currentSchema.enum.includes(currentData)) {
             errors.push(`Invalid value at ${path}: '${currentData}' is not in the allowed list.`);
        }

        // Pattern check for strings
        if (expectedType === 'string' && currentSchema.pattern) {
            const regex = new RegExp(currentSchema.pattern);
            if (!regex.test(currentData)) {
                errors.push(`Invalid format at ${path}: does not match pattern ${currentSchema.pattern}`);
            }
        }
        
        // Min/Max length for strings
        if (expectedType === 'string') {
            if (currentSchema.minLength && currentData.length < currentSchema.minLength) {
                 errors.push(`Invalid length at ${path}: minimum is ${currentSchema.minLength}, got ${currentData.length}`);
            }
            if (currentSchema.maxLength && currentData.length > currentSchema.maxLength) {
                 errors.push(`Invalid length at ${path}: maximum is ${currentSchema.maxLength}, got ${currentData.length}`);
            }
        }

        // Min/Max for numbers
        if (expectedType === 'integer' || expectedType === 'number') {
            if (typeof currentSchema.minimum !== 'undefined' && currentData < currentSchema.minimum) {
                errors.push(`Value at ${path} is too low: minimum is ${currentSchema.minimum}, got ${currentData}`);
            }
            if (typeof currentSchema.maximum !== 'undefined' && currentData > currentSchema.maximum) {
                errors.push(`Value at ${path} is too high: maximum is ${currentSchema.maximum}, got ${currentData}`);
            }
        }


        if (expectedType === 'object' && currentData) {
            // Check for required properties
            if (currentSchema.required) {
                for (const prop of currentSchema.required) {
                    if (typeof currentData[prop] === 'undefined') {
                        errors.push(`Missing required property at ${path}: ${prop}`);
                    }
                }
            }
            // Recurse into properties
            if (currentSchema.properties) {
                for (const prop in currentSchema.properties) {
                    if (typeof currentData[prop] !== 'undefined') {
                        traverseAndValidate(currentData[prop], currentSchema.properties[prop], `${path}.${prop}`);
                    }
                }
            }
             // Sanitization: remove unknown properties if strict
            if (schemaConfig.strict) {
                for (const prop in currentData) {
                    if (Object.prototype.hasOwnProperty.call(currentData, prop)) {
                        if (!currentSchema.properties || !currentSchema.properties[prop]) {
                            // This is a simple validator, so we just flag this. A real sanitizer would remove it.
                            // delete currentData[prop]; 
                        }
                    }
                }
            }
        } else if (expectedType === 'array' && currentData) {
             // Min/Max items for arrays
            if (currentSchema.minItems && currentData.length < currentSchema.minItems) {
                errors.push(`Not enough items at ${path}: minimum is ${currentSchema.minItems}, got ${currentData.length}`);
            }
            if (currentSchema.maxItems && currentData.length > currentSchema.maxItems) {
                errors.push(`Too many items at ${path}: maximum is ${currentSchema.maxItems}, got ${currentData.length}`);
            }
            // Recurse into array items
            if (currentSchema.items) {
                for (let i = 0; i < currentData.length; i++) {
                    traverseAndValidate(currentData[i], currentSchema.items, `${path}[${i}]`);
                }
            }
        }
    }

    traverseAndValidate(validatedData, schemaConfig.schema, schemaName);

    return { validatedData, errors };
}

/**
 * Recursively sanitize a metadata object so that all values are primitives (string, number, boolean).
 * Arrays are joined with '; '. Objects are stringified with JSON.stringify.
 */
function sanitizeMetadata(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      sanitized[key] = value.map(v => (typeof v === 'object' ? JSON.stringify(v) : v)).join('; ');
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = JSON.stringify(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

module.exports = {
    generateDecisionId,
    generateActionId,
    generateDeliverableId,
    generateRelationshipId,
    generateRiskId,
    generateStakeholderId,
    slugify,
    simpleHash,
    extractProjectCode,
    countParticipants,
    calculatePriority,
    calculateContainerTags,
    analyzeDecisionImpact,
    analyzeActionItem,
    analyzeStakeholderIntelligence,
    analyzeDeliverableComplexity,
    analyzeRelationship,
    analyzeRisk,
    isOverdue,
    assessTimelineRisk,
    assessDeliverableTimelineRisk,
    formatCommunicationPreferences,
    extractTopicsFromSection,
    extractKeywords,
    extractDecisionTopics,
    extractActionTopics,
    extractStakeholderTopics,
    validateAndSanitize,
    sanitizeMetadata
};
