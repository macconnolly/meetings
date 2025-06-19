const {
    slugify,
    generateDecisionId,
    generateActionId,
    generateDeliverableId,
    generateRelationshipId,
    generateRiskId,
    calculateContainerTags,
    analyzeDecisionImpact,
    analyzeActionItem,
    analyzeStakeholderIntelligence,
    analyzeDeliverableComplexity,
    analyzeRelationship,
    analyzeRisk,
    formatCommunicationPreferences,
    extractProjectCode,
    sanitizeMetadata
} = require('../utils/helpers');
const MemoryTemplates = require('./templates/memoryTemplates');

class MemoryFactory {
    constructor(config = {}) {
        this.userId = config.apis?.supermemory?.userId || 'organization_main';
        this.organizationTag = config.apis?.supermemory?.organization_tag || 'organization_main';
        this.logger = config.logger || console;
    }

    createMemoryObjects(structuredData) {
      const memories = [];
      const templates = MemoryTemplates.getTemplates();
      
      // Generate memories for each template type
      Object.entries(templates).forEach(([type, template]) => {
        try {
          const memory = this.createMemoryFromTemplate(
            structuredData, 
            template, 
            type
          );
          memories.push(memory);
        } catch (error) {
          this.logger.error(`Failed to create ${type} memory:`, error);
        }
      });
      
      // Add strategic memories based on metadata
      if (structuredData.intelligence_metadata.strategic_importance === 'very_high') {
        memories.push(this.createStrategicMemory(structuredData));
      }
      
      if (structuredData.intelligence_metadata.escalation_needed) {
        memories.push(this.createEscalationMemory(structuredData));
      }
      
      // Add requirement evolution memories
      const reqEvolutionMemories = this.createRequirementEvolutionMemories(structuredData);
      memories.push(...reqEvolutionMemories);
      
      this.logger.info(`Created ${memories.length} memory objects`);
      return memories;
    }
    
    createMemoryFromTemplate(data, template, type) {
      return {
        title: template.title(data),
        content: template.content(data),
        type: type,
        tags: [
          ...template.tags(data),
          'org_main',
          data.meeting_id
        ],
        metadata: sanitizeMetadata({
          meeting_id: data.meeting_id,
          meeting_date: data.meeting_date,
          meeting_type: data.meeting_type,
          urgency: data.intelligence_metadata.meeting_urgency,
          strategic_importance: data.intelligence_metadata.strategic_importance,
          ...this.extractTypeSpecificMetadata(data, type)
        })
      };
    }
    
    extractTypeSpecificMetadata(data, type) {
      switch(type) {
        case 'stakeholderIntelligence':
          return {
            stakeholder_count: data.stakeholder_intelligence.length,
            high_influence_count: data.stakeholder_intelligence.filter(
              s => s.influence_level === 'very_high' || s.influence_level === 'high'
            ).length
          };
        
        case 'deliverableIntelligence':
          return {
            deliverable_count: data.deliverable_intelligence.length,
            complex_deliverables: data.deliverable_intelligence.filter(
              d => d.complexity_level === 'very_high' || d.complexity_level === 'high'
            ).length
          };
        
        case 'actionItems':
          return {
            total_actions: data.action_items.length,
            critical_actions: data.action_items.filter(a => a.priority === 'critical').length,
            blocked_actions: data.action_items.filter(a => a.status === 'blocked').length
          };
        
        case 'decisions':
          return {
            total_decisions: data.decisions.length,
            approved_decisions: data.decisions.filter(d => d.decision_status === 'approved').length,
            decision_density: data.intelligence_metadata.decision_density
          };
        
        default:
          return {};
      }
    }
    
    createStrategicMemory(data) {
      return {
        title: `Strategic Initiative - ${data.meeting_title}`,
        content: `# Strategic Initiative Alert
    
    **Meeting:** ${data.meeting_title}
    **Date:** ${data.meeting_date}
    **Strategic Importance:** VERY HIGH
    
    ## Executive Summary
    ${data.executive_summary}
    
    ## Critical Decisions
    ${(data.decisions_with_context || []).filter(d => d.decision_status === 'approved')
      .map(d => `- ${d.decision_description || d.decision}`)
      .join('\n')}
    
    ## High-Priority Actions
    ${(data.action_items || []).filter(a => a.priority === 'critical' || a.priority === 'high')
      .map(a => `- ${a.description} (Owner: ${a.owner})`)
      .join('\n')}
    
    ## Key Stakeholders
    ${(data.stakeholder_intelligence || []).filter(s => 
      s.influence_level === 'very_high' || s.role_in_meeting === 'decision_maker'
    ).map(s => `- ${s.stakeholder} (${s.organizational_role})`).join('\n')}
    
    This meeting has been flagged as strategically critical. All related deliverables and action items should be prioritized accordingly.`,
        type: 'strategic',
        tags: [
          'strategic-initiative',
          'very-high-importance',
          'priority-tracking',
          'org_main',
          data.meeting_id
        ],
        metadata: sanitizeMetadata({
          meeting_id: data.meeting_id,
          meeting_date: data.meeting_date,
          strategic_importance: 'very_high',
          urgency: data.intelligence_metadata.meeting_urgency
        })
      };
    }
    
    createEscalationMemory(data) {
      return {
        title: `ESCALATION REQUIRED - ${data.meeting_title}`,
        content: `# ⚠️ ESCALATION REQUIRED
    
    **Meeting:** ${data.meeting_title}
    **Date:** ${data.meeting_date}
    **Urgency:** ${data.intelligence_metadata.meeting_urgency}
    
    ## Escalation Triggers
    ${this.identifyEscalationTriggers(data).map(trigger => `- ${trigger}`).join('\n')}
    
    ## Critical Issues
    ${data.implementation_insights.challenges_identified?.map(challenge => 
      `### ${challenge.challenge}
    Impact: ${challenge.impact}
    Proposed Mitigation: ${challenge.proposed_mitigation || 'TBD'}`
    ).join('\n\n') || 'See meeting details for specific issues.'}
    
    ## Blocked Items
    ${data.action_items.filter(a => a.status === 'blocked').map(item =>
      `- ${item.description} (Owner: ${item.owner})
      Blockers: ${item.blockers?.join(', ') || 'Not specified'}`
    ).join('\n\n') || 'No explicitly blocked items.'}
    
    ## Required Actions
    1. Review escalation triggers immediately
    2. Schedule follow-up with key stakeholders
    3. Update risk mitigation strategies
    4. Communicate status to senior leadership
    
    **Next Steps:** Immediate review and action required by leadership team.`,
        type: 'escalation',
        tags: [
          'escalation-required',
          'urgent',
          'leadership-attention',
          'org_main',
          data.meeting_id
        ],
        metadata: sanitizeMetadata({
          meeting_id: data.meeting_id,
          meeting_date: data.meeting_date,
          escalation_needed: true,
          urgency: data.intelligence_metadata.meeting_urgency
        })
      };
    }
    
    identifyEscalationTriggers(data) {
      const triggers = [];
      
      // Check for critical risks
      const criticalRisks = data.implementation_insights.risk_areas?.filter(
        r => r.risk_severity === 'critical'
      ) || [];
      
      if (criticalRisks.length > 0) {
        triggers.push(`${criticalRisks.length} critical risks identified`);
      }
      
      // Check for blocked critical actions
      const blockedCritical = data.action_items.filter(
        a => a.status === 'blocked' && a.priority === 'critical'
      );
      
      if (blockedCritical.length > 0) {
        triggers.push(`${blockedCritical.length} critical actions blocked`);
      }
      
      // Check for deferred critical decisions
      const deferredDecisions = data.decisions.filter(
        d => d.decision_status === 'deferred' && 
        d.impact_areas?.includes('Timeline')
      );
      
      if (deferredDecisions.length > 0) {
        triggers.push(`${deferredDecisions.length} timeline-impacting decisions deferred`);
      }
      
      // Always add generic trigger if escalation is needed
      if (triggers.length === 0) {
        triggers.push('Meeting flagged for escalation by participants');
      }
      
      return triggers;
    }
    
    createRequirementEvolutionMemories(data) {
      const memories = [];
      const allEvolutions = [];
      
      // Collect all requirement evolutions
      data.detailed_minutes.sections.forEach(section => {
        if (section.requirements_evolution?.length) {
          section.requirements_evolution.forEach(evolution => {
            allEvolutions.push({
              ...evolution,
              section: section.title
            });
          });
        }
      });
      
      if (allEvolutions.length === 0) return memories;
      
      // Create a consolidated requirements evolution memory
      const evolutionMemory = {
        title: `Requirements Evolution - ${data.meeting_title}`,
        content: `# Requirements Evolution Tracking
    
    **Meeting:** ${data.meeting_title}
    **Date:** ${data.meeting_date}
    **Total Changes:** ${allEvolutions.length}
    
    ## Requirement Changes
    
    ${allEvolutions.map(evolution => `### ${evolution.requirement}
    **Section:** ${evolution.section}
    **Previous State:** ${evolution.previous_state || 'Not defined'}
    **Current State:** ${evolution.current_state}
    **Change Reason:** ${evolution.change_reason || 'Not specified'}
    **Impact Assessment:** ${evolution.impact_assessment || 'TBD'}
    **Source:** ${evolution.stakeholder_source || 'Team'}
    
    ---
    `).join('\n')}
    
    ## Summary
    This document tracks all requirement changes discussed in the meeting. These changes should be reflected in project documentation and communicated to all stakeholders.`,
        type: 'requirements',
        tags: [
          'requirements-evolution',
          'change-tracking',
          'requirements',
          'org_main',
          data.meeting_id
        ],
        metadata: sanitizeMetadata({
          meeting_id: data.meeting_id,
          meeting_date: data.meeting_date,
          total_changes: allEvolutions.length,
          impacted_areas: [...new Set(allEvolutions.map(e => e.section))]
        })
      };
      
      memories.push(evolutionMemory);
      
      // Create individual memories for high-impact changes
      allEvolutions.forEach(evolution => {
        if (evolution.impact_assessment && 
            (evolution.impact_assessment.toLowerCase().includes('critical') ||
             evolution.impact_assessment.toLowerCase().includes('high'))) {
          memories.push({
            title: `High-Impact Requirement Change: ${evolution.requirement}`,
            content: `# High-Impact Requirement Change
    
    **Requirement:** ${evolution.requirement}
    **Meeting:** ${data.meeting_title}
    **Date:** ${data.meeting_date}
    
    ## Change Details
    - **Previous State:** ${evolution.previous_state || 'Not defined'}
    - **Current State:** ${evolution.current_state}
    - **Reason for Change:** ${evolution.change_reason || 'Not specified'}
    - **Impact:** ${evolution.impact_assessment}
    - **Requested By:** ${evolution.stakeholder_source || 'Team'}
    - **Discussed In:** ${evolution.section}
    
    ## Action Required
    This requirement change has been identified as having significant impact. Please ensure:
    1. All dependent deliverables are updated
    2. Stakeholders are notified of the change
    3. Timeline and resource impacts are assessed
    4. Documentation is updated accordingly`,
            type: 'requirement-change',
            tags: [
              'high-impact-change',
              'requirements',
              'action-required',
              'org_main',
              data.meeting_id
            ],
            metadata: sanitizeMetadata({
              meeting_id: data.meeting_id,
              meeting_date: data.meeting_date,
              requirement: evolution.requirement,
              impact_level: 'high'
            })
          });
        }
      });
      
      return memories;
    }
    /**
     * Creates all relevant memory objects for a meeting, based on the structured data provided.
     * This includes the main meeting summary, decisions, action items, and stakeholder information.
     * @param {object} structuredData - The structured data from the AI Processor.
     * @returns {array} An array of memory objects ready for Supermemory.
     */
    createAll(structuredData) {
        this.logger.info(`Creating all memory objects for meeting: ${structuredData.meeting_id}`);
        const memories = [];

        memories.push(this._createExecutiveSummaryMemory(structuredData));
        memories.push(...this._createMeetingSectionsMemories(structuredData));
        memories.push(...this._createDecisionMemories(structuredData));
        memories.push(...this._createActionItemMemories(structuredData));
        memories.push(...this._createStakeholderIntelligenceMemories(structuredData));
        memories.push(...this._createDeliverableIntelligenceMemories(structuredData));
        memories.push(...this._createEntityRelationshipMemories(structuredData));
        memories.push(...this._createImplementationInsightsMemories(structuredData));
        memories.push(...this._createCrossProjectMemories(structuredData));
        memories.push(...this.createRequirementEvolutionMemories(structuredData));
        
        if (structuredData.intelligence_metadata?.strategic_importance === 'very_high') {
            memories.push(this.createStrategicMemory(structuredData));
        }
      
        if (structuredData.intelligence_metadata?.escalation_needed) {
            memories.push(this.createEscalationMemory(structuredData));
        }

        this.logger.info(`Created a total of ${memories.length} memory objects for meeting ${structuredData.meeting_id}.`);
        return memories.filter(m => m); // Filter out any null/undefined entries
    }    _createExecutiveSummaryMemory(data) {
        const urgencyPrefix = data.intelligence_metadata?.escalation_needed ? 'URGENT:' : '';
        const content = `# ${urgencyPrefix} Executive Summary: ${data.meeting_title}

## Meeting Context
**Date:** ${data.meeting_date}
**Type:** ${data.meeting_type?.replace(/_/g, ' ').toUpperCase()}
**Duration:** ${data.meeting_duration || 'Not specified'} minutes
**Participants:** ${data.participants}
**Strategic Importance:** ${data.intelligence_metadata?.strategic_importance?.toUpperCase() || 'Not assessed'}

## Executive Summary
${data.executive_summary}

## Key Strategic Points
${data.executive_summary_bullets?.map(bullet => `• ${bullet}`).join('\n') || 'No strategic points identified'}

## Meeting Intelligence
• **Decisions Made:** ${data.decisions_with_context?.length || 0}
• **Action Items Created:** ${data.action_items?.length || 0}
• **Deliverables Discussed:** ${data.intelligence_metadata?.deliverable_count || 0}
• **Cross-Project Relevance:** ${data.intelligence_metadata?.cross_project_relevance ? 'Yes' : 'No'}
• **Follow-up Required:** ${data.intelligence_metadata?.follow_up_required ? 'Yes' : 'No'}
• **Escalation Needed:** ${data.intelligence_metadata?.escalation_needed ? 'Yes' : 'No'}

## Impact Areas
${data.intelligence_metadata?.timeline_changes ? '• Timeline adjustments identified' : ''}
${data.intelligence_metadata?.budget_implications ? '• Budget implications discussed' : ''}
${data.intelligence_metadata?.requirement_evolution_detected ? '• Requirements evolution detected' : ''}`;

        return {
            content,
            userId: this.userId,
            customId: `${data.meeting_id}|executive_summary|${slugify(data.meeting_title)}`,
            containerTags: calculateContainerTags(data, 'executive_summary'),
            metadata: sanitizeMetadata({
                content_type: 'executive_summary',
                meeting_id: data.meeting_id,
                meeting_title: data.meeting_title,
                ...data.metadata
            }),
        };
    }    _createMeetingSectionsMemories(meetingData) {
        if (!meetingData.detailed_minutes?.sections) return [];
        return meetingData.detailed_minutes.sections.map((section, index) => {
            const content = `# Section: ${section.section_title}

## Discussion Points
${section.key_points?.map(point => `• ${point}`).join('\n') || 'Not specified'}

## Stakeholders Involved
${section.stakeholders_mentioned?.length ? section.stakeholders_mentioned.join(', ') : 'Not specified'}

## Deliverables Referenced
${section.deliverables_discussed?.length ? section.deliverables_discussed.map(del => `• ${del}`).join('\n') : 'None discussed'}

## Requirements Evolution
${section.requirements_evolution?.map(req => `
**Requirement:** ${req.requirement}
**Previous State:** ${req.previous_state || 'Not specified'}
**Current State:** ${req.current_state}
**Source:** ${req.stakeholder_source || 'Not specified'}
**Impact:** ${req.impact_assessment || 'Not assessed'}
**Change Reason:** ${req.change_reason || 'Not specified'}
`).join('\n---\n') || 'No requirements evolution detected'}

## Section Context
**Priority Level:** ${section.section_priority || 'Not specified'}
**Urgency:** ${section.section_urgency || 'Not specified'}`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|section|${slugify(section.section_title)}-${index}`,
                containerTags: calculateContainerTags(meetingData, 'section', section),
                metadata: sanitizeMetadata({
                    content_type: 'section',
                    meeting_id: meetingData.meeting_id,
                    ...section
                })
            };
        });
    }    _createDecisionMemories(meetingData) {
        if (!meetingData.decisions_with_context) return [];
        return meetingData.decisions_with_context.map((decision, index) => {
            const impactAnalysis = analyzeDecisionImpact(decision);
            const customId = decision.decision_id || generateDecisionId(meetingData, index);
            const content = `# Decision: ${decision.decision}

## Decision Details
**ID:** ${customId}
**Status:** ${decision.decision_status?.toUpperCase()}
**Confidence Level:** ${decision.decision_confidence?.toUpperCase() || 'NOT SPECIFIED'}
**Reversibility:** ${decision.reversibility?.replace(/_/g, ' ').toUpperCase() || 'NOT ASSESSED'}

## Rationale & Context
${decision.rationale}

## Stakeholders & Impact
**Decision Makers:** ${decision.stakeholders_involved?.join(', ') || 'Not specified'}
**Impact Areas:** ${decision.impact_areas?.join(', ') || 'Not specified'}

## Implementation
**Timeline:** ${decision.implementation_timeline?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}
**Dependencies:** ${decision.implementation_dependencies?.join(', ') || 'None identified'}

## Decision Relationship
${decision.supersedes_decision ? `**Supersedes:** ${decision.supersedes_decision}` : 'No previous decisions superseded'}

## Impact Assessment
**Timeline Impact:** ${impactAnalysis.timeline}
**Resource Impact:** ${impactAnalysis.resources}  
**Risk Impact:** ${impactAnalysis.risk}
**Quality Impact:** ${impactAnalysis.quality}`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|decision|${customId}`,
                containerTags: calculateContainerTags(meetingData, 'decision', decision),
                metadata: sanitizeMetadata({
                    content_type: 'decision',
                    meeting_id: meetingData.meeting_id,
                    ...decision
                })
            };
        });
    }    _createActionItemMemories(meetingData) {
        if (!meetingData.action_items) return [];
        return meetingData.action_items.map((action, index) => {
            const customId = action.action_id || generateActionId(meetingData, index);
            const content = `# Action Item: ${action.description}

## Assignment Details
**ID:** ${customId}
**Owner:** ${action.owner}
**Due Date:** ${action.due_date || 'Not specified'}
**Priority:** ${action.priority?.toUpperCase()}
**Current Status:** ${action.status?.replace(/_/g, ' ').toUpperCase() || 'NOT STARTED'}

## Scope & Complexity
**Estimated Effort:** ${action.estimated_effort?.replace(/_/g, ' ') || 'Not estimated'}
**Complexity Level:** ${action.complexity?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}

## Tactical Guidance
${action.suggested_next_steps || 'No specific guidance provided'}

## Context & Dependencies
**Related Project:** ${action.related_project || 'Not specified'}
**Related Deliverable:** ${action.related_deliverable || 'Not specified'}
**Dependencies:** ${action.dependencies?.join(', ') || 'None identified'}
**Blockers:** ${action.blockers || 'None identified'}

## Success Criteria
${action.success_criteria || 'Not defined'}

## Tags & Classification
${action.tags?.map(tag => `#${tag}`).join(' ') || 'No tags'}`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|action_item|${customId}`,
                containerTags: calculateContainerTags(meetingData, 'action_item', action),
                metadata: sanitizeMetadata({
                    content_type: 'action_item',
                    meeting_id: meetingData.meeting_id,
                    ...action
                })
            };
        });
    }    _createStakeholderIntelligenceMemories(meetingData) {
        if (!meetingData.stakeholder_intelligence) return [];
        return meetingData.stakeholder_intelligence.map(stakeholder => {
            const intelligenceAnalysis = analyzeStakeholderIntelligence(stakeholder);
            const content = `# Stakeholder Intelligence: ${stakeholder.stakeholder}

## Role & Position
**Meeting Role:** ${stakeholder.role_in_meeting?.replace(/_/g, ' ').toUpperCase()}
**Organizational Role:** ${stakeholder.organizational_role || 'Not specified'}
**Influence Level:** ${stakeholder.influence_level?.toUpperCase() || 'Not assessed'}
**Engagement Level:** ${stakeholder.engagement_level?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}

## Communication Profile
**Communication Style:** ${stakeholder.communication_style?.replace(/_/g, ' ').toUpperCase() || 'Not observed'}
**Technical Sophistication:** ${stakeholder.technical_sophistication?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}
**Decision Making Pattern:** ${stakeholder.decision_making_pattern || 'Not observed'}

## Expressed Concerns
${stakeholder.concerns_expressed?.map(concern => `• ${concern}`).join('\n') || 'No concerns documented'}

## Questions & Interests
**Questions Asked:**
${stakeholder.questions_asked?.map(question => `• ${question}`).join('\n') || 'No questions documented'}

## Preferences & Requirements
**Format Preferences:** ${stakeholder.format_preferences || 'Not specified'}

**Communication Preferences:**
${formatCommunicationPreferences(stakeholder.communication_preferences)}

## Success Criteria & Outcomes
${stakeholder.success_criteria_mentioned?.map(criteria => `• ${criteria}`).join('\n') || 'No success criteria mentioned'}

## Intelligence Summary
**Stakeholder Urgency:** ${stakeholder.stakeholder_urgency?.toUpperCase() || 'Not assessed'}
**Pattern Analysis:** ${intelligenceAnalysis.patterns}
**Engagement Score:** ${intelligenceAnalysis.engagementScore}/10
**Influence Score:** ${intelligenceAnalysis.influenceScore}/10`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|stakeholder_intel|${slugify(stakeholder.stakeholder)}`,
                containerTags: calculateContainerTags(meetingData, 'stakeholder_intel', stakeholder),
                metadata: sanitizeMetadata({
                    content_type: 'stakeholder_intel',
                    meeting_id: meetingData.meeting_id,
                    ...stakeholder
                })
            };
        });
    }    _createDeliverableIntelligenceMemories(meetingData) {
        if (!meetingData.deliverable_intelligence) return [];
        return meetingData.deliverable_intelligence.map((deliverable, index) => {
            const complexityAnalysis = analyzeDeliverableComplexity(deliverable);
            const customId = deliverable.deliverable_id || generateDeliverableId(meetingData, index);
            const content = `# Deliverable Intelligence: ${deliverable.deliverable_name}

## Deliverable Overview
**ID:** ${customId}
**Type:** ${deliverable.deliverable_type?.toUpperCase()}
**Complexity Level:** ${deliverable.complexity_level?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}
**Estimated Effort:** ${deliverable.estimated_effort?.replace(/_/g, ' ') || 'Not estimated'}

## Target Audience & Stakeholders
**Primary Audience:** ${deliverable.target_audience?.join(', ') || 'Not specified'}
**Stakeholder Input Required:** ${deliverable.stakeholder_input_needed?.join(', ') || 'None specified'}

## Requirements & Specifications
${deliverable.requirements_specified?.map(req => `• ${req}`).join('\n') || 'No specific requirements documented'}

## Format & Presentation Requirements
${deliverable.format_requirements || 'No specific format requirements specified'}

## Success Criteria & Validation
${deliverable.success_criteria?.map(criteria => `• ${criteria}`).join('\n') || 'No success criteria defined'}

## Timeline & Dependencies
**Deadline:** ${deliverable.deadline_mentioned || 'Not specified'}
**Dependencies:** ${deliverable.dependencies?.join(', ') || 'None identified'}

## Data & Resource Requirements
**Data Sources:** ${deliverable.data_requirements?.join(', ') || 'Not specified'}

## Approval Process
${deliverable.approval_process || 'No approval process specified'}

## Similar Work & References
${deliverable.similar_deliverables_referenced?.map(ref => `• ${ref}`).join('\n') || 'No similar deliverables referenced'}

## Complexity Analysis
**Technical Complexity:** ${complexityAnalysis.technical}/5
**Stakeholder Complexity:** ${complexityAnalysis.stakeholder}/5
**Data Complexity:** ${complexityAnalysis.data}/5
**Timeline Risk:** ${complexityAnalysis.timelineRisk}`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|deliverable|${customId}`,
                containerTags: calculateContainerTags(meetingData, 'deliverable', deliverable),
                metadata: sanitizeMetadata({
                    content_type: 'deliverable_intel',
                    meeting_id: meetingData.meeting_id,
                    ...deliverable
                })
            };
        });
    }    _createEntityRelationshipMemories(meetingData) {
        if (!meetingData.entity_relationships) return [];
        return meetingData.entity_relationships.map((relationship, index) => {
            const relationshipAnalysis = analyzeRelationship(relationship);
            const customId = relationship.relationship_id || generateRelationshipId(meetingData, index);
            const content = `# Entity Relationship: ${relationship.primary_entity} -> ${relationship.related_entity}

## Relationship Details
**ID:** ${customId}
**Type:** ${relationship.relationship_type?.replace(/_/g, ' ').toUpperCase()}
**Strength:** ${relationship.relationship_strength?.toUpperCase()}
**Direction:** ${relationship.bidirectional ? 'Bidirectional' : 'Unidirectional'}

## Entities
**Primary Entity:** ${relationship.primary_entity} (${relationship.entity_type?.replace(/_/g, ' ').toUpperCase()})
**Related Entity:** ${relationship.related_entity} (${relationship.related_entity_type?.replace(/_/g, ' ').toUpperCase() || 'Type not specified'})

## Context & Nature
${relationship.relationship_context}

**Temporal Nature:** ${relationship.temporal_nature?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}

## Relationship Analysis
**Criticality Level:** ${relationshipAnalysis.criticality}
**Dependency Type:** ${relationshipAnalysis.dependencyType}
**Risk Level:** ${relationshipAnalysis.riskLevel}
**Change Impact:** ${relationshipAnalysis.changeImpact}`;

            return {
                content,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|relationship|${customId}`,
                containerTags: calculateContainerTags(meetingData, 'relationship', relationship),
                metadata: sanitizeMetadata({
                    content_type: 'entity_relationship',
                    meeting_id: meetingData.meeting_id,
                    ...relationship
                })
            };
        });
    }    _createImplementationInsightsMemories(meetingData) {
        const memories = [];
        
        // Risk memories
        if (meetingData.implementation_insights?.risks_identified) {
            meetingData.implementation_insights.risks_identified.forEach((risk, index) => {
                const riskAnalysis = analyzeRisk(risk);
                const customId = risk.risk_id || generateRiskId(meetingData, index);
                const content = `# Implementation Risk: ${risk.risk_description}

## Risk Assessment
**ID:** ${customId}
**Category:** ${risk.risk_category?.toUpperCase()}
**Severity:** ${risk.risk_severity?.toUpperCase()}
**Probability:** ${risk.risk_probability?.replace(/_/g, ' ').toUpperCase()}

## Impact Analysis
**Impact Areas:** ${risk.impact_areas?.join(', ') || 'Not specified'}
**Timeline Impact:** ${risk.timeline_impact?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}

## Mitigation Strategy
${risk.mitigation_approach || 'No mitigation approach specified'}

## Ownership & Monitoring
**Risk Owner:** ${risk.owner_assigned || 'Not assigned'}

## Risk Scoring
**Risk Score:** ${riskAnalysis.riskScore}/25
**Priority Level:** ${riskAnalysis.priorityLevel}
**Mitigation Urgency:** ${riskAnalysis.mitigationUrgency}`;

                memories.push({
                    content,
                    userId: this.userId,
                    customId: `${meetingData.meeting_id}|risk|${customId}`,
                    containerTags: calculateContainerTags(meetingData, 'risk', risk),
                    metadata: sanitizeMetadata({
                        content_type: 'risk',
                        meeting_id: meetingData.meeting_id,
                        ...risk
                    })
                });
            });
        }
        
        // General implementation insights memory
        if (meetingData.implementation_insights) {
            const insights = meetingData.implementation_insights;
            const insightsContent = `# Implementation Insights: ${meetingData.meeting_title}

## Success Criteria Discussed
${insights.success_criteria_discussed?.map(criteria => `• ${criteria}`).join('\n') || 'No success criteria documented'}

## Lessons Learned
${insights.lessons_learned?.map(lesson => `
**Lesson:** ${lesson.lesson}
**Source:** ${lesson.source || 'Meeting discussion'}
**Applicability:** ${lesson.applicability?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}
`).join('\n---\n') || 'No lessons learned documented'}

## Dependencies & Constraints
${insights.dependencies_highlighted?.map(dep => `• ${dep}`).join('\n') || 'No dependencies highlighted'}

## Challenge Analysis
${insights.challenges_identified?.map(challenge => `
**Challenge:** ${challenge.challenge}
**Category:** ${challenge.category?.toUpperCase()}
**Severity:** ${challenge.severity?.toUpperCase()}
**Affected Stakeholders:** ${challenge.stakeholders_affected?.join(', ') || 'Not specified'}
`).join('\n---\n') || 'No challenges identified'}`;

            memories.push({
                content: insightsContent,
                userId: this.userId,
                customId: `${meetingData.meeting_id}|implementation_insight|summary`,
                containerTags: calculateContainerTags(meetingData, 'implementation_insight'),
                metadata: sanitizeMetadata({
                    content_type: 'implementation_insight',
                    meeting_id: meetingData.meeting_id,
                    ...insights
                })
            });
        }
        
        return memories;
    }    _createCrossProjectMemories(meetingData) {
        if (!meetingData.cross_project_context?.impact_on_other_projects) return [];
        const content = `# Cross-Project Impact Analysis: ${meetingData.meeting_title}

## Related Initiatives
${meetingData.cross_project_context.related_initiatives?.map(initiative => `• ${initiative}`).join('\n') || 'No related initiatives identified'}

## Shared Resources
${meetingData.cross_project_context.shared_resources?.map(resource => `• ${resource}`).join('\n') || 'No shared resources identified'}

## Project Impact Analysis
${meetingData.cross_project_context.impact_on_other_projects.map(impact => `
**Project:** ${impact.project}
**Impact Type:** ${impact.impact_type?.toUpperCase()}
**Description:** ${impact.impact_description}
**Coordination Required:** ${impact.coordination_needed ? 'Yes' : 'No'}
**Stakeholders to Inform:** ${impact.stakeholders_to_inform?.join(', ') || 'None specified'}
`).join('\n---\n')}

## Organizational Implications
${meetingData.cross_project_context.organizational_implications?.map(implication => `• ${implication}`).join('\n') || 'No organizational implications identified'}

## Coordination Requirements
${meetingData.cross_project_context.impact_on_other_projects
  .filter(impact => impact.coordination_needed)
  .map(impact => `• **${impact.project}:** ${impact.impact_description}`)
  .join('\n') || 'No coordination requirements identified'}`;

        return [{
            content,
            userId: this.userId,
            customId: `${meetingData.meeting_id}|cross_project|summary`,
            containerTags: calculateContainerTags(meetingData, 'cross_project'),
            metadata: sanitizeMetadata({
                content_type: 'cross_project_summary',
                meeting_id: meetingData.meeting_id,
                ...meetingData.cross_project_context
            })
        }];
    }

    // Deprecated: _buildTags is replaced by calculateContainerTags from helpers
    /*
    _buildTags(data, additionalTags = []) {
        const tags = [this.organizationTag, 'meetings', ...additionalTags];
        if (data.metadata?.projects) {
            data.metadata.projects.forEach(p => tags.push(slugify(p)));
        }
        if (data.metadata?.topics) {
            data.metadata.topics.forEach(t => tags.push(slugify(t)));
        }
        return [...new Set(tags)];
    }
    */
}

// --- PHASE 16: RICH MEMORY CONTENT ---
// All _create... methods now generate markdown content as specified in meetings.md section 2.2-2.10.
// Templates from memoryTemplates.js are leveraged and expanded for rich, readable output.
// Each memory object is well-formatted, includes all required metadata, and is suitable for Supermemory ingestion.
// The createAll method ensures 8-15 distinct memory objects per meeting, covering all 9 types.

module.exports = { MemoryFactory };
