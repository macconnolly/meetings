class MemoryTemplates {
  static getTemplates() {
    return {
      executiveSummary: this.executiveSummaryTemplate(),
      detailedMinutes: this.detailedMinutesTemplate(),
      decisions: this.decisionsTemplate(),
      actionItems: this.actionItemsTemplate(),
      stakeholderIntelligence: this.stakeholderIntelligenceTemplate(),
      deliverableIntelligence: this.deliverableIntelligenceTemplate(),
      implementationInsights: this.implementationInsightsTemplate(),
      crossProjectContext: this.crossProjectContextTemplate(),
      requirements: this.requirementsTemplate()
    };
  }

  static executiveSummaryTemplate() {
    return {
      title: data => `Executive Summary - ${data.meeting_title}`,
      content: data => `# Executive Summary: ${data.meeting_title}
**Date:** ${data.meeting_date}  
**Participants:** ${data.participants}  
**Duration:** ${data.meeting_duration} minutes  
**Type:** ${data.meeting_type.replace('_', ' ')}  
**Strategic Importance:** ${data.intelligence_metadata.strategic_importance}  
**Urgency:** ${data.intelligence_metadata.meeting_urgency}  

## Overview
${data.executive_summary}

## Key Takeaways
${data.executive_summary_bullets.map(bullet => `- ${bullet}`).join('\n')}

## Critical Decisions
${(data.decisions_with_context || []).filter(d => d.decision_status === 'approved').length} approved decisions made

## Action Items Generated
${(data.action_items || []).length} action items assigned

## Deliverables Discussed
${(data.deliverable_intelligence || []).length} deliverables identified

${data.intelligence_metadata.follow_up_required ? '**⚠️ Follow-up Required**' : ''}
${data.intelligence_metadata.escalation_needed ? '**🚨 Escalation Needed**' : ''}`,
      tags: data => [
        'executive-summary',
        data.meeting_type,
        `urgency-${data.intelligence_metadata.meeting_urgency}`,
        ...data.departments || []
      ]
    };
  }

  static detailedMinutesTemplate() {
    return {
      title: data => `Detailed Minutes - ${data.meeting_title}`,
      content: data => {
        let content = `# Detailed Meeting Minutes: ${data.meeting_title}\n\n`;
        content += `**Meeting ID:** ${data.meeting_id}\n\n`;
        
        data.detailed_minutes.sections.forEach(section => {
          content += `## ${section.title}\n`;
          content += `**Priority:** ${section.section_priority || 'Normal'} | `;
          content += `**Urgency:** ${section.section_urgency || 'routine'}\n\n`;
          
          content += '### Key Points\n';
          section.key_points.forEach(point => {
            content += `- ${point}\n`;
          });
          
          if (section.requirements_evolution?.length) {
            content += '\n### Requirements Evolution\n';
            section.requirements_evolution.forEach(req => {
              content += `#### ${req.requirement}\n`;
              content += `- **Previous:** ${req.previous_state || 'Not defined'}\n`;
              content += `- **Current:** ${req.current_state}\n`;
              content += `- **Reason:** ${req.change_reason || 'Not specified'}\n`;
              content += `- **Impact:** ${req.impact_assessment || 'TBD'}\n`;
              content += `- **Source:** ${req.stakeholder_source || 'Team'}\n\n`;
            });
          }
          
          if (section.stakeholders_mentioned?.length) {
            content += `\n**Stakeholders:** ${section.stakeholders_mentioned.join(', ')}\n`;
          }
          
          if (section.deliverables_discussed?.length) {
            content += `**Deliverables:** ${section.deliverables_discussed.join(', ')}\n`;
          }
          
          content += '\n---\n\n';
        });
        
        return content;
      },
      tags: data => [
        'detailed-minutes',
        'meeting-notes',
        data.meeting_type,
        ...extractSectionTags(data.detailed_minutes.sections)
      ]
    };
  }

  static decisionsTemplate() {
    return {
      title: data => `Decisions Log - ${data.meeting_title}`,
      content: data => {
        const decisions = data.decisions_with_context || [];
        let content = `# Decision Log: ${data.meeting_title}\n\n`;
        content += `**Total Decisions:** ${decisions.length}\n`;
        content += `**Approved:** ${decisions.filter(d => d.decision_status === 'approved').length}\n\n`;
        
        const groupedDecisions = groupDecisionsByStatus(decisions);
        
        Object.entries(groupedDecisions).forEach(([status, decisions]) => {
          content += `## ${status.toUpperCase()} Decisions\n\n`;
          
          decisions.forEach((decision, index) => {
            content += `### ${index + 1}. ${decision.decision_description}\n`;
            content += `**Status:** ${decision.decision_status}\n`;
            
            if (decision.stakeholders_involved?.length) {
              content += `**Stakeholders:** ${decision.stakeholders_involved.join(', ')}\n`;
            }
            
            if (decision.implementation_timeline) {
              content += `**Timeline:** ${decision.implementation_timeline}\n`;
            }
            
            if (decision.impact_areas?.length) {
              content += `**Impact Areas:** ${decision.impact_areas.join(', ')}\n`;
            }
            
            if (decision.implementation_dependencies?.length) {
              content += `**Dependencies:**\n`;
              decision.implementation_dependencies.forEach(dep => {
                content += `- ${dep}\n`;
              });
            }
            
            if (decision.supersedes_decision) {
              content += `**Supersedes:** ${decision.supersedes_decision}\n`;
            }
            
            content += '\n';
          });
        });
        
        return content;
      },
      tags: data => [
        'decision',
        ...extractDecisionTags(data.decisions_with_context || []),
        `decision-density-${calculateDecisionDensityTag(data)}`
      ]
    };
  }

  static actionItemsTemplate() {
    return {
      title: data => `Action Items - ${data.meeting_title}`,
      content: data => {
        let content = `# Action Items: ${data.meeting_title}\n\n`;
        content += `**Total Actions:** ${(data.action_items || []).length}\n\n`;
        
        // Group by priority
        const priorityGroups = groupActionsByPriority(data.action_items || []);
        
        Object.entries(priorityGroups).forEach(([priority, items]) => {
          content += `## ${priority.toUpperCase()} Priority\n\n`;
          
          items.forEach(item => {
            content += `### ✓ ${item.description}\n`;
            content += `**Owner:** ${item.owner}\n`;
            content += `**Due:** ${item.due_date || 'TBD'}\n`;
            content += `**Status:** ${item.status || 'not_started'}\n`;
            content += `**Complexity:** ${item.complexity || 'medium'}\n`;
            
            if (item.estimated_effort) {
              content += `**Effort:** ${item.estimated_effort}\n`;
            }
            
            if (item.dependencies?.length) {
              content += `**Dependencies:**\n`;
              item.dependencies.forEach(dep => content += `- ${dep}\n`);
            }
            
            if (item.related_deliverable) {
              content += `**Related Deliverable:** ${item.related_deliverable}\n`;
            }
            
            if (item.suggested_next_steps) {
              content += `**Next Steps:** ${item.suggested_next_steps}\n`;
            }
            
            if (item.success_criteria) {
              content += `**Success Criteria:** ${item.success_criteria}\n`;
            }
            
            if (item.blockers?.length) {
              content += `**⚠️ Blockers:**\n`;
              item.blockers.forEach(blocker => content += `- ${blocker}\n`);
            }
            
            if (item.tags?.length) {
              content += `**Tags:** ${item.tags.join(', ')}\n`;
            }
            
            content += '\n---\n\n';
          });
        });
        
        return content;
      },
      tags: data => [
        'action-items',
        ...extractActionTags(data.action_items || []),
        ...extractOwnerTags(data.action_items || [])
      ]
    };
  }

  static stakeholderIntelligenceTemplate() {
    return {
      title: data => `Stakeholder Intelligence - ${data.meeting_title}`,
      content: data => {
        let content = `# Stakeholder Intelligence: ${data.meeting_title}\n\n`;
        content += `**Total Stakeholders:** ${data.stakeholder_intelligence.length}\n\n`;
        
        data.stakeholder_intelligence.forEach(stakeholder => {
          content += `## ${stakeholder.stakeholder}\n`;
          content += `**Role:** ${stakeholder.organizational_role || 'Unknown'} (${stakeholder.role_in_meeting})\n`;
          content += `**Influence:** ${stakeholder.influence_level || 'moderate'}\n`;
          content += `**Engagement:** ${stakeholder.engagement_level || 'moderate'}\n\n`;
          
          content += `### Communication Profile\n`;
          content += `- **Style:** ${stakeholder.communication_style || 'Not assessed'}\n`;
          content += `- **Technical Level:** ${stakeholder.technical_sophistication || 'intermediate'}\n`;
          content += `- **Decision Pattern:** ${stakeholder.decision_making_pattern || 'collaborative'}\n`;
          
          if (stakeholder.communication_preferences) {
            content += `\n### Format Preferences\n`;
            const prefs = stakeholder.communication_preferences;
            if (prefs.prefers_visuals) content += `- ✓ Prefers visual content\n`;
            if (prefs.prefers_data) content += `- ✓ Prefers data-driven content\n`;
            if (prefs.prefers_narrative) content += `- ✓ Prefers narrative format\n`;
            if (prefs.prefers_bullet_points) content += `- ✓ Prefers structured bullets\n`;
            if (prefs.prefers_executive_summary) content += `- ✓ Prefers executive summaries\n`;
          }
          
          if (stakeholder.concerns_expressed?.length) {
            content += `\n### Concerns Expressed\n`;
            stakeholder.concerns_expressed.forEach(concern => {
              content += `- ${concern}\n`;
            });
          }
          
          if (stakeholder.questions_asked?.length) {
            content += `\n### Questions Asked\n`;
            stakeholder.questions_asked.forEach(question => {
              content += `- ${question}\n`;
            });
          }
          
          if (stakeholder.success_criteria_mentioned?.length) {
            content += `\n### Success Criteria Mentioned\n`;
            stakeholder.success_criteria_mentioned.forEach(criteria => {
              content += `- ${criteria}\n`;
            });
          }
          
          content += '\n---\n\n';
        });
        
        return content;
      },
      tags: data => [
        'stakeholder-intelligence',
        ...extractStakeholderTags(data.stakeholder_intelligence),
        ...extractInfluenceTags(data.stakeholder_intelligence)
      ]
    };
  }

  static deliverableIntelligenceTemplate() {
    return {
      title: data => `Deliverable Intelligence - ${data.meeting_title}`,
      content: data => {
        let content = `# Deliverable Intelligence: ${data.meeting_title}\n\n`;
        content += `**Total Deliverables:** ${data.deliverable_intelligence.length}\n\n`;
        
        // Group by complexity
        const complexityGroups = groupDeliverablesByComplexity(data.deliverable_intelligence);
        
        Object.entries(complexityGroups).forEach(([complexity, deliverables]) => {
          content += `## ${complexity.toUpperCase()} Complexity Deliverables\n\n`;
          
          deliverables.forEach(deliverable => {
            content += `### 📄 ${deliverable.deliverable_name}\n`;
            content += `**Type:** ${deliverable.deliverable_type}\n`;
            content += `**Effort:** ${deliverable.estimated_effort || 'TBD'}\n`;
            
            if (deliverable.deadline_mentioned) {
              content += `**Deadline:** ${deliverable.deadline_mentioned}\n`;
            }
            
            if (deliverable.target_audience?.length) {
              content += `**Audience:** ${deliverable.target_audience.join(', ')}\n`;
            }
            
            if (deliverable.requirements_specified?.length) {
              content += `\n**Requirements:**\n`;
              deliverable.requirements_specified.forEach(req => {
                content += `- ${req}\n`;
              });
            }
            
            if (deliverable.format_requirements) {
              content += `\n**Format:** ${deliverable.format_requirements}\n`;
            }
            
            if (deliverable.success_criteria?.length) {
              content += `\n**Success Criteria:**\n`;
              deliverable.success_criteria.forEach(criteria => {
                content += `- ${criteria}\n`;
              });
            }
            
            if (deliverable.dependencies?.length) {
              content += `\n**Dependencies:**\n`;
              deliverable.dependencies.forEach(dep => {
                content += `- ${dep}\n`;
              });
            }
            
            if (deliverable.data_requirements?.length) {
              content += `\n**Data Requirements:**\n`;
              deliverable.data_requirements.forEach(data => {
                content += `- ${data}\n`;
              });
            }
            
            if (deliverable.approval_process) {
              content += `\n**Approval:** ${deliverable.approval_process}\n`;
            }
            
            if (deliverable.similar_deliverables_referenced?.length) {
              content += `\n**Similar Examples:** ${deliverable.similar_deliverables_referenced.join(', ')}\n`;
            }
            
            content += '\n---\n\n';
          });
        });
        
        return content;
      },
      tags: data => [
        'deliverables',
        ...extractDeliverableTypeTags(data.deliverable_intelligence),
        ...extractComplexityTags(data.deliverable_intelligence)
      ]
    };
  }

  static implementationInsightsTemplate() {
    return {
      title: data => `Implementation Insights - ${data.meeting_title}`,
      content: data => {
        let content = `# Implementation Insights: ${data.meeting_title}\n\n`;
        const insights = data.implementation_insights;
        
        if (insights.success_criteria_discussed?.length) {
          content += `## Success Criteria\n`;
          insights.success_criteria_discussed.forEach(criteria => {
            content += `- ${criteria}\n`;
          });
          content += '\n';
        }
        
        if (insights.lessons_learned?.length) {
          content += `## Lessons Learned\n`;
          insights.lessons_learned.forEach(lesson => {
            content += `### ${lesson.lesson}\n`;
            content += `**Context:** ${lesson.context}\n`;
            content += `**Applicable to:** ${lesson.applicable_to}\n\n`;
          });
        }
        
        if (insights.challenges_identified?.length) {
          content += `## Challenges Identified\n`;
          insights.challenges_identified.forEach(challenge => {
            content += `### ⚠️ ${challenge.challenge}\n`;
            content += `**Impact:** ${challenge.impact}\n`;
            if (challenge.proposed_mitigation) {
              content += `**Mitigation:** ${challenge.proposed_mitigation}\n`;
            }
            content += '\n';
          });
        }
        
        if (insights.risk_areas?.length) {
          content += `## Risk Assessment\n\n`;
          
          // Group by severity
          const risksBySeverity = groupRisksBySeverity(insights.risk_areas);
          
          Object.entries(risksBySeverity).forEach(([severity, risks]) => {
            content += `### ${severity.toUpperCase()} Severity Risks\n`;
            
            risks.forEach(risk => {
              content += `- **${risk.risk_description}**\n`;
              content += `  - Category: ${risk.risk_category}\n`;
              content += `  - Probability: ${risk.risk_probability}\n`;
              if (risk.mitigation_strategy) {
                content += `  - Mitigation: ${risk.mitigation_strategy}\n`;
              }
            });
            content += '\n';
          });
        }
        
        if (insights.dependencies_highlighted?.length) {
          content += `## Dependencies\n`;
          insights.dependencies_highlighted.forEach(dep => {
            content += `- ${dep}\n`;
          });
        }
        
        return content;
      },
      tags: data => [
        'implementation-insights',
        'lessons-learned',
        ...extractRiskTags(data.implementation_insights.risk_areas || [])
      ]
    };
  }

  static crossProjectContextTemplate() {
    return {
      title: data => `Cross-Project Context - ${data.meeting_title}`,
      content: data => {
        let content = `# Cross-Project Context: ${data.meeting_title}\n\n`;
        const context = data.cross_project_context;
        
        if (context.project_references?.length) {
          content += `## Related Projects\n`;
          context.project_references.forEach(project => {
            content += `- ${project}\n`;
          });
          content += '\n';
        }
        
        if (context.shared_resources?.length) {
          content += `## Shared Resources\n`;
          context.shared_resources.forEach(resource => {
            content += `- ${resource}\n`;
          });
          content += '\n';
        }
        
        if (context.coordination_requirements?.length) {
          content += `## Coordination Requirements\n`;
          context.coordination_requirements.forEach(req => {
            content += `- ${req}\n`;
          });
          content += '\n';
        }
        
        if (context.dependencies?.length) {
          content += `## Cross-Project Dependencies\n`;
          context.dependencies.forEach(dep => {
            content += `- ${dep}\n`;
          });
        }
        
        return content;
      },
      tags: data => [
        'cross-project',
        ...extractProjectTags(data.cross_project_context.project_references || [])
      ]
    };
  }

  static requirementsTemplate() {
    return {
      title: data => `Requirements Analysis - ${data.meeting_title}`,
      content: data => {
        let content = `# Requirements Analysis: ${data.meeting_title}\n\n`;
        const requirements = data.requirements_analysis?.requirements || [];
        content += `**Total Requirements:** ${requirements.length}\n`;
        content += `**Overall Priority:** ${data.requirements_analysis?.overall_priority || 'N/A'}\n\n`;

        requirements.forEach(req => {
          content += `### [${req.priority.toUpperCase()}] ${req.requirement_id}: ${req.requirement_description}\n`;
          content += `**Status:** ${req.status}\n`;
          content += `**Requestor:** ${req.stakeholder_requestor || 'N/A'}\n`;
          if (req.impacted_areas?.length) {
            content += `**Impacted Areas:** ${req.impacted_areas.join(', ')}\n`;
          }
          if (req.acceptance_criteria) {
            content += `**Acceptance Criteria:** ${req.acceptance_criteria}\n`;
          }
          content += '\n---\n\n';
        });
        return content;
      },
      tags: data => [
        'requirements',
        'requirements-analysis',
        `priority-${data.requirements_analysis?.overall_priority || 'medium'}`,
      ],
      metadata: data => {
        const allImpactedAreas = (data.requirements_analysis?.requirements || [])
          .flatMap(r => r.impacted_areas || []);
        
        return {
          'impacted_areas': [...new Set(allImpactedAreas)].join(', '),
          'total_requirements': (data.requirements_analysis?.requirements || []).length,
          'overall_priority': data.requirements_analysis?.overall_priority || 'medium'
        };
      }
    };
  }
}

// Helper functions for templates
function extractSectionTags(sections) {
  const tags = new Set();
  sections.forEach(section => {
    if (section.section_urgency && section.section_urgency !== 'routine') {
      tags.add(`urgency-${section.section_urgency}`);
    }
  });
  return Array.from(tags);
}

function groupDecisionsByStatus(decisions) {
  return decisions.reduce((groups, decision) => {
    const status = decision.decision_status || 'pending';
    if (!groups[status]) groups[status] = [];
    groups[status].push(decision);
    return groups;
  }, {});
}

function extractDecisionTags(decisions) {
  const tags = new Set();
  decisions.forEach(decision => {
    if (decision.decision_status === 'approved') {
      tags.add('approved-decisions');
    }
    if (decision.impact_areas) {
      decision.impact_areas.forEach(area => {
        tags.add(`impacts-${area.toLowerCase()}`);
      });
    }
  });
  return Array.from(tags);
}

function calculateDecisionDensityTag(data) {
  const density = data.intelligence_metadata.decision_density || 0;
  if (density >= 5) return 'high';
  if (density >= 2) return 'medium';
  return 'low';
}

function groupActionsByPriority(actions) {
  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  const grouped = {};
  
  priorityOrder.forEach(priority => {
    grouped[priority] = actions.filter(action => 
      (action.priority || 'medium') === priority
    );
  });
  
  return grouped;
}

function extractActionTags(actions) {
  const tags = new Set();
  actions.forEach(action => {
    if (action.priority === 'critical') tags.add('critical-actions');
    if (action.status === 'blocked') tags.add('blocked-items');
    if (action.complexity === 'very_high') tags.add('complex-tasks');
  });
  return Array.from(tags);
}

function extractOwnerTags(actions) {
  const owners = new Set();
  actions.forEach(action => {
    if (action.owner) {
      owners.add(`owner-${action.owner.toLowerCase().replace(/\s+/g, '-')}`);
    }
  });
  return Array.from(owners);
}

function extractStakeholderTags(stakeholders) {
  const tags = new Set();
  stakeholders.forEach(s => {
    if (s.influence_level === 'very_high' || s.influence_level === 'high') {
      tags.add('high-influence-stakeholders');
    }
    if (s.role_in_meeting === 'decision_maker') {
      tags.add('decision-makers');
    }
  });
  return Array.from(tags);
}

function extractInfluenceTags(stakeholders) {
  const tags = new Set();
  stakeholders.forEach(s => {
    if (s.communication_style) {
      tags.add(`style-${s.communication_style}`);
    }
  });
  return Array.from(tags);
}

function groupDeliverablesByComplexity(deliverables) {
  const complexityOrder = ['very_high', 'high', 'medium', 'low'];
  const grouped = {};
  
  complexityOrder.forEach(complexity => {
    grouped[complexity] = deliverables.filter(d => 
      (d.complexity_level || 'medium') === complexity
    );
  });
  
  return grouped;
}

function extractDeliverableTypeTags(deliverables) {
  const types = new Set();
  deliverables.forEach(d => {
    types.add(`deliverable-${d.deliverable_type}`);
  });
  return Array.from(types);
}

function extractComplexityTags(deliverables) {
  const tags = new Set();
  deliverables.forEach(d => {
    if (d.complexity_level === 'very_high' || d.complexity_level === 'high') {
      tags.add('complex-deliverables');
    }
  });
  return Array.from(tags);
}

function groupRisksBySeverity(risks) {
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const grouped = {};
  
  severityOrder.forEach(severity => {
    grouped[severity] = risks.filter(r => 
      (r.risk_severity || 'medium') === severity
    );
  });
  
  return grouped;
}

function extractRiskTags(risks) {
  const tags = new Set();
  risks.forEach(risk => {
    if (risk.risk_severity === 'critical' || risk.risk_severity === 'high') {
      tags.add('high-risk');
    }
    tags.add(`risk-${risk.risk_category}`);
  });
  return Array.from(tags);
}

function extractProjectTags(projects) {
  return projects.map(project => 
    `project-${project.toLowerCase().replace(/\s+/g, '-')}`
  );
}

module.exports = MemoryTemplates;
