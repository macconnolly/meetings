const enhancedMeetingSchema = {
  "name": "comprehensive_meeting_intelligence",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      // ============= CORE MEETING METADATA =============
      "meeting_title": { 
        "type": "string",
        "minLength": 10,
        "maxLength": 120,
        "description": "Format: [Team/Project] - [Purpose]: [Key Focus]"
      },
      "meeting_date": { 
        "type": "string",
        "pattern": "^\\d{4}-\\d{2}-\\d{2}",
        "description": "ISO date format YYYY-MM-DD"
      },
      "participants": { 
        "type": "string",
        "minLength": 5,
        "description": "Comma-separated list of all meeting participants"
      },
      "meeting_id": { 
        "type": "string",
        "pattern": "^[A-Z]{2,6}-[A-Z]{2,6}-\\d{8}-[A-Za-z]+$",
        "description": "Format: PROJECT-WORKSTREAM-YYYYMMDD-TYPE"
      },
      "meeting_type": { 
        "type": "string",
        "enum": [
          "project_standup",
          "status_update", 
          "decision_making",
          "requirements_gathering",
          "stakeholder_alignment",
          "planning_session",
          "review_session",
          "crisis_management",
          "vendor_discussion",
          "training_session",
          "other"
        ]
      },
      "meeting_duration": { 
        "type": "integer",
        "minimum": 15,
        "maximum": 480,
        "description": "Duration in minutes"
      },
      
      // ============= EXECUTIVE SUMMARY =============
      "executive_summary": { 
        "type": "string",
        "minLength": 200,
        "maxLength": 2000,
        "description": "Dense 1-2 paragraph strategic summary"
      },
      "executive_summary_bullets": { 
        "type": "array",
        "items": { "type": "string", "minLength": 20, "maxLength": 200 },
        "minItems": 3,
        "maxItems": 7,
        "description": "Essential takeaway bullets"
      },
      
      // ============= DETAILED MEETING MINUTES =============
      "detailed_minutes": {
        "type": "object",
        "properties": { 
          "sections": { 
            "type": "array",
            "minItems": 2,
            "maxItems": 8,
            "items": { 
              "type": "object",
              "properties": { 
                "title": { 
                  "type": "string",
                  "minLength": 5,
                  "maxLength": 100
                }, 
                "key_points": { 
                  "type": "array",
                  "items": { "type": "string", "minLength": 30, "maxLength": 500 },
                  "minItems": 2,
                  "maxItems": 8
                },
                "stakeholders_mentioned": { 
                  "type": "array",
                  "items": { "type": "string", "minLength": 2, "maxLength": 100 },
                  "maxItems": 20
                },
                "deliverables_discussed": { 
                  "type": "array",
                  "items": { "type": "string", "minLength": 5, "maxLength": 200 },
                  "maxItems": 15
                },
                "requirements_evolution": { 
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "requirement": { "type": "string", "minLength": 10, "maxLength": 300 },
                      "previous_state": { "type": "string", "maxLength": 200 },
                      "current_state": { "type": "string", "minLength": 10, "maxLength": 200 },
                      "stakeholder_source": { "type": "string", "maxLength": 100 },
                      "impact_assessment": { "type": "string", "maxLength": 300 },
                      "change_reason": { "type": "string", "maxLength": 200 }
                    },
                    "required": ["requirement", "current_state"]
                  },
                  "maxItems": 10
                },
                "section_urgency": {
                  "type": "string",
                  "enum": ["routine", "important", "urgent", "critical"],
                  "description": "Urgency level for this section"
                },
                "section_priority": {
                  "type": "integer",
                  "minimum": 1,
                  "maximum": 5,
                  "description": "Priority rating for this section"
                }
              }, 
              "required": ["title", "key_points"]
            } 
          } 
        },
        "required": ["sections"]
      },
      
      // ============= DECISION TRACKING =============
      "key_decisions": { 
        "type": "array",
        "items": { "type": "string", "minLength": 20, "maxLength": 300 },
        "maxItems": 20
      },
      "decisions_with_context": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "decision_id": {
              "type": "string",
              "pattern": "^DCN-[A-Z]{2,6}-\\d{8}-\\d{3}$",
              "description": "Unique decision ID: DCN-PROJECT-YYYYMMDD-###"
            },
            "decision": { 
              "type": "string",
              "minLength": 20,
              "maxLength": 500
            },
            "rationale": { 
              "type": "string",
              "minLength": 30,
              "maxLength": 1000
            },
            "stakeholders_involved": { 
              "type": "array",
              "items": { "type": "string", "minLength": 2, "maxLength": 100 },
              "minItems": 1,
              "maxItems": 15
            },
            "impact_areas": { 
              "type": "array",
              "items": { 
                "type": "string",
                "enum": [
                  "Timeline", "Budget", "Scope", "Quality", "Resources", 
                  "Risk", "Compliance", "Stakeholder_Satisfaction", 
                  "Technical_Architecture", "Process_Change", "Training",
                  "Data_Migration", "Security", "Performance", "Scalability"
                ]
              },
              "maxItems": 10
            },
            "supersedes_decision": { 
              "type": "string",
              "pattern": "^DCN-[A-Z]{2,6}-\\d{8}-\\d{3}$",
              "description": "Previous decision this replaces"
            },
            "decision_status": { 
              "type": "string",
              "enum": ["proposed", "approved", "rejected", "pending", "implemented", "deferred"]
            },
            "implementation_timeline": {
              "type": "string",
              "enum": ["immediate", "this_week", "next_week", "this_month", "next_month", "this_quarter", "future"]
            },
            "implementation_dependencies": {
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 200 },
              "maxItems": 10
            },
            "decision_confidence": {
              "type": "string",
              "enum": ["low", "medium", "high", "very_high"]
            },
            "reversibility": {
              "type": "string",
              "enum": ["easily_reversible", "moderately_reversible", "difficult_to_reverse", "irreversible"]
            }
          },
          "required": ["decision", "rationale", "stakeholders_involved", "decision_status"]
        },
        "maxItems": 20
      },
      
      // ============= ACTION ITEMS =============
      "action_items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action_id": {
              "type": "string",
              "pattern": "^ACT-[A-Z]{2,6}-\\d{8}-\\d{3}$",
              "description": "Unique action ID: ACT-PROJECT-YYYYMMDD-###"
            },
            "description": { 
              "type": "string",
              "minLength": 15,
              "maxLength": 500
            }, 
            "owner": { 
              "type": "string",
              "minLength": 2,
              "maxLength": 100
            }, 
            "due_date": { 
              "type": "string",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
              "description": "ISO date format YYYY-MM-DD"
            },
            "priority": { 
              "type": "string",
              "enum": ["low", "medium", "high", "critical", "urgent"]
            },
            "estimated_effort": {
              "type": "string",
              "enum": ["15min", "30min", "1hour", "2hours", "half_day", "full_day", "multiple_days", "week_plus"]
            },
            "complexity": {
              "type": "string",
              "enum": ["trivial", "simple", "moderate", "complex", "very_complex"]
            },
            "tags": { 
              "type": "array",
              "items": { "type": "string", "minLength": 2, "maxLength": 50 },
              "maxItems": 10
            },
            "suggested_next_steps": { 
              "type": "string",
              "minLength": 20,
              "maxLength": 800,
              "description": "Proactive tactical guidance for the owner"
            },
            "related_deliverable": { 
              "type": "string",
              "maxLength": 200,
              "description": "Associated deliverable this action contributes to"
            },
            "related_project": { 
              "type": "string",
              "maxLength": 100,
              "description": "Project this action belongs to"
            },
            "status": { 
              "type": "string",
              "enum": ["not_started", "in_progress", "blocked", "completed", "deferred", "cancelled"]
            },
            "blockers": { 
              "type": "string",
              "maxLength": 500,
              "description": "Description of any blockers preventing completion"
            },
            "dependencies": {
              "type": "array",
              "items": { "type": "string", "minLength": 5, "maxLength": 100 },
              "maxItems": 10,
              "description": "Other actions or decisions this depends on"
            },
            "success_criteria": {
              "type": "string",
              "maxLength": 300,
              "description": "How to know when this action is successfully completed"
            }
          },
          "required": ["description", "owner", "priority"]
        },
        "maxItems": 25
      },
      
      // ============= FOLLOW-UP ITEMS =============
      "follow_up_items": { 
        "type": "array",
        "items": { 
          "type": "object",
          "properties": { 
            "follow_up_id": {
              "type": "string",
              "pattern": "^FUP-[A-Z]{2,6}-\\d{8}-\\d{3}$"
            },
            "description": { 
              "type": "string",
              "minLength": 15,
              "maxLength": 400
            }, 
            "context": { 
              "type": "string",
              "minLength": 20,
              "maxLength": 600
            }, 
            "related_topics": { 
              "type": "array",
              "items": { "type": "string", "minLength": 3, "maxLength": 50 },
              "maxItems": 8
            },
            "suggested_timeline": {
              "type": "string",
              "enum": ["immediate", "this_week", "next_week", "this_month", "next_month", "quarterly"]
            },
            "stakeholders_to_involve": {
              "type": "array",
              "items": { "type": "string", "minLength": 2, "maxLength": 100 },
              "maxItems": 10
            }
          }, 
          "required": ["description", "context"]
        },
        "maxItems": 15
      },
      
      // ============= STAKEHOLDER INTELLIGENCE =============
      "stakeholder_intelligence": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "stakeholder": { 
              "type": "string",
              "minLength": 2,
              "maxLength": 100
            },
            "role_in_meeting": { 
              "type": "string",
              "enum": [
                "meeting_leader", "primary_contributor", "decision_maker", 
                "subject_matter_expert", "stakeholder_representative", 
                "observer", "note_taker", "facilitator", "technical_lead"
              ]
            },
            "organizational_role": {
              "type": "string",
              "maxLength": 100,
              "description": "Official job title or organizational position"
            },
            "communication_style": { 
              "type": "string",
              "enum": ["direct", "collaborative", "analytical", "strategic", "detail_oriented", "big_picture", "questioning", "diplomatic"]
            },
            "decision_making_pattern": { 
              "type": "string",
              "maxLength": 300,
              "description": "Observed patterns in how this stakeholder makes decisions"
            },
            "concerns_expressed": { 
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 300 },
              "maxItems": 10
            },
            "questions_asked": { 
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 200 },
              "maxItems": 15
            },
            "format_preferences": { 
              "type": "string",
              "maxLength": 300,
              "description": "Noted preferences for deliverable formats or presentation styles"
            },
            "success_criteria_mentioned": { 
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 200 },
              "maxItems": 8
            },
            "stakeholder_urgency": { 
              "type": "string",
              "enum": ["low", "medium", "high", "critical"]
            },
            "influence_level": {
              "type": "string",
              "enum": ["low", "moderate", "high", "very_high"],
              "description": "Observed influence level in the meeting"
            },
            "engagement_level": {
              "type": "string",
              "enum": ["passive", "moderate", "active", "highly_engaged"]
            },
            "technical_sophistication": {
              "type": "string",
              "enum": ["non_technical", "basic", "intermediate", "advanced", "expert"]
            },
            "communication_preferences": {
              "type": "object",
              "properties": {
                "prefers_visuals": { "type": "boolean" },
                "prefers_data": { "type": "boolean" },
                "prefers_narrative": { "type": "boolean" },
                "prefers_bullet_points": { "type": "boolean" },
                "prefers_executive_summary": { "type": "boolean" }
              }
            }
          },
          "required": ["stakeholder", "role_in_meeting"]
        },
        "maxItems": 20
      },
      
      // ============= DELIVERABLE INTELLIGENCE =============
      "deliverable_intelligence": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "deliverable_id": {
              "type": "string",
              "pattern": "^DEL-[A-Z]{2,6}-\\d{8}-\\d{3}$",
              "description": "Unique deliverable ID: DEL-PROJECT-YYYYMMDD-###"
            },
            "deliverable_name": { 
              "type": "string",
              "minLength": 5,
              "maxLength": 200
            },
            "deliverable_type": { 
              "type": "string",
              "enum": [
                "presentation", "model", "tracker", "analysis", "report", 
                "dashboard", "documentation", "process_guide", "training_material",
                "technical_specification", "project_plan", "risk_assessment",
                "cost_analysis", "timeline", "org_chart", "communication_plan"
              ]
            },
            "target_audience": { 
              "type": "array",
              "items": { "type": "string", "minLength": 3, "maxLength": 100 },
              "minItems": 1,
              "maxItems": 15
            },
            "requirements_specified": { 
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 400 },
              "maxItems": 20
            },
            "format_requirements": { 
              "type": "string",
              "maxLength": 500,
              "description": "Specific format, layout, or presentation requirements"
            },
            "deadline_mentioned": { 
              "type": "string",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$",
              "description": "ISO date format YYYY-MM-DD"
            },
            "approval_process": { 
              "type": "string",
              "maxLength": 400,
              "description": "Required approval steps and stakeholders"
            },
            "success_criteria": { 
              "type": "array",
              "items": { "type": "string", "minLength": 10, "maxLength": 200 },
              "maxItems": 10
            },
            "dependencies": { 
              "type": "array",
              "items": { "type": "string", "minLength": 5, "maxLength": 200 },
              "maxItems": 15
            },
            "similar_deliverables_referenced": { 
              "type": "array",
              "items": { "type": "string", "minLength": 5, "maxLength": 150 },
              "maxItems": 10,
              "description": "Previous deliverables mentioned as examples or templates"
            },
            "estimated_effort": {
              "type": "string",
              "enum": ["few_hours", "1_day", "2_3_days", "1_week", "2_weeks", "1_month", "multiple_months"]
            },
            "complexity_level": {
              "type": "string",
              "enum": ["simple", "moderate", "complex", "very_complex"]
            },
            "data_requirements": {
              "type": "array",
              "items": { "type": "string", "minLength": 5, "maxLength": 150 },
              "maxItems": 15,
              "description": "Data sources and requirements needed"
            },
            "stakeholder_input_needed": {
              "type": "array",
              "items": { "type": "string", "minLength": 3, "maxLength": 100 },
              "maxItems": 10
            }
          },
          "required": ["deliverable_name", "deliverable_type", "target_audience"]
        },
        "maxItems": 15
      },
      
      // ============= ENTITY RELATIONSHIPS =============
      "entity_relationships": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "relationship_id": {
              "type": "string",
              "pattern": "^REL-[A-Z]{2,6}-\\d{8}-\\d{3}$"
            },
            "primary_entity": { 
              "type": "string",
              "minLength": 2,
              "maxLength": 150
            },
            "entity_type": { 
              "type": "string",
              "enum": [
                "person", "stakeholder_group", "project", "system", "deliverable", 
                "requirement", "process", "decision", "vendor", "concept", 
                "department", "technology", "data_source", "application", "integration"
              ]
            },
            "relationship_type": { 
              "type": "string",
              "enum": [
                "owns", "approves", "requires", "depends_on", "influences", 
                "blocks", "enables", "reports_to", "collaborates_with", 
                "manages", "uses", "creates", "modifies", "monitors",
                "integrates_with", "replaces", "enhances", "supports"
              ]
            },
            "related_entity": { 
              "type": "string",
              "minLength": 2,
              "maxLength": 150
            },
            "related_entity_type": {
              "type": "string",
              "enum": [
                "person", "stakeholder_group", "project", "system", "deliverable", 
                "requirement", "process", "decision", "vendor", "concept", 
                "department", "technology", "data_source", "application", "integration"
              ]
            },
            "relationship_context": { 
              "type": "string",
              "minLength": 10,
              "maxLength": 400,
              "description": "Context of this relationship from the meeting"
            },
            "relationship_strength": { 
              "type": "string",
              "enum": ["weak", "moderate", "strong", "critical"]
            },
            "bidirectional": {
              "type": "boolean",
              "description": "Whether this relationship works in both directions"
            },
            "temporal_nature": {
              "type": "string",
              "enum": ["permanent", "temporary", "project_duration", "conditional"],
              "description": "How long this relationship is expected to last"
            }
          },
          "required": ["primary_entity", "entity_type", "relationship_type", "related_entity", "relationship_context"]
        },
        "maxItems": 30
      },
      
      // ============= IMPLEMENTATION INSIGHTS =============
      "implementation_insights": {
        "type": "object",
        "properties": {
          "challenges_identified": { 
            "type": "array",
            "items": { 
              "type": "object",
              "properties": {
                "challenge": { "type": "string", "minLength": 15, "maxLength": 300 },
                "category": { 
                  "type": "string",
                  "enum": ["technical", "organizational", "resource", "timeline", "political", "financial", "regulatory"]
                },
                "severity": { "type": "string", "enum": ["low", "medium", "high", "critical"] },
                "stakeholders_affected": { 
                  "type": "array",
                  "items": { "type": "string", "maxLength": 100 },
                  "maxItems": 10
                }
              },
              "required": ["challenge", "category", "severity"]
            },
            "maxItems": 15
          },
          "risk_areas": { 
            "type": "array",
            "items": { 
              "type": "object",
              "properties": {
                "risk_id": {
                  "type": "string",
                  "pattern": "^RSK-[A-Z]{2,6}-\\d{8}-\\d{3}$"
                },
                "risk_description": { 
                  "type": "string",
                  "minLength": 20,
                  "maxLength": 400
                },
                "risk_category": {
                  "type": "string",
                  "enum": [
                    "technical", "operational", "financial", "strategic", "compliance", 
                    "security", "performance", "timeline", "resource", "stakeholder"
                  ]
                },
                "risk_severity": { 
                  "type": "string",
                  "enum": ["low", "medium", "high", "critical"]
                },
                "risk_probability": {
                  "type": "string",
                  "enum": ["very_low", "low", "medium", "high", "very_high"]
                },
                "impact_areas": {
                  "type": "array",
                  "items": { "type": "string", "maxLength": 100 },
                  "maxItems": 8
                },
                "mitigation_approach": { 
                  "type": "string",
                  "maxLength": 500,
                  "description": "Discussed approaches to mitigate this risk"
                },
                "owner_assigned": {
                  "type": "string",
                  "maxLength": 100,
                  "description": "Person responsible for monitoring/managing this risk"
                },
                "timeline_impact": {
                  "type": "string",
                  "enum": ["none", "minor", "moderate", "significant", "severe"]
                }
              },
              "required": ["risk_description", "risk_severity", "risk_probability"]
            },
            "maxItems": 20
          },
          "success_criteria_discussed": { 
            "type": "array",
            "items": { "type": "string", "minLength": 15, "maxLength": 300 },
            "maxItems": 12
          },
          "dependencies_highlighted": { 
            "type": "array",
            "items": { "type": "string", "minLength": 10, "maxLength": 250 },
            "maxItems": 20
          },
          "lessons_learned": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "lesson": { "type": "string", "minLength": 20, "maxLength": 400 },
                "source": { "type": "string", "maxLength": 100 },
                "applicability": { 
                  "type": "string",
                  "enum": ["this_project", "similar_projects", "organization_wide", "industry_wide"]
                }
              },
              "required": ["lesson"]
            },
            "maxItems": 10
          }
        }
      },
      
      // ============= CROSS-PROJECT CONTEXT =============
      "cross_project_context": {
        "type": "object",
        "properties": {
          "related_initiatives": { 
            "type": "array",
            "items": { "type": "string", "minLength": 5, "maxLength": 150 },
            "maxItems": 15
          },
          "shared_resources": { 
            "type": "array",
            "items": { "type": "string", "minLength": 5, "maxLength": 150 },
            "maxItems": 20
          },
          "impact_on_other_projects": { 
            "type": "array",
            "items": { 
              "type": "object",
              "properties": {
                "project": { "type": "string", "minLength": 3, "maxLength": 100 },
                "impact_description": { "type": "string", "minLength": 15, "maxLength": 400 },
                "impact_type": {
                  "type": "string",
                  "enum": ["positive", "negative", "neutral", "dependency", "risk", "opportunity"]
                },
                "coordination_needed": { "type": "boolean" },
                "stakeholders_to_inform": {
                  "type": "array",
                  "items": { "type": "string", "maxLength": 100 },
                  "maxItems": 10
                }
              },
              "required": ["project", "impact_description", "coordination_needed"]
            },
            "maxItems": 15
          },
          "organizational_implications": {
            "type": "array",
            "items": { "type": "string", "minLength": 15, "maxLength": 300 },
            "maxItems": 10
          }
        }
      },
      
      // ============= ENHANCED METADATA =============
      "intelligence_metadata": { 
        "type": "object", 
        "properties": { 
          "topics": { 
            "type": "array",
            "items": { "type": "string", "minLength": 3, "maxLength": 50 },
            "maxItems": 25
          }, 
          "projects": { 
            "type": "array",
            "items": { "type": "string", "minLength": 2, "maxLength": 50 },
            "maxItems": 10
          }, 
          "departments": { 
            "type": "array",
            "items": { "type": "string", "minLength": 2, "maxLength": 50 },
            "maxItems": 15
          },
          "systems_discussed": { 
            "type": "array",
            "items": { "type": "string", "minLength": 3, "maxLength": 100 },
            "maxItems": 20
          },
          "source_file": { 
            "type": "string",
            "maxLength": 255,
            "description": "Original transcript file location"
          },
          "related_meetings": { 
            "type": "array",
            "items": { "type": "string", "pattern": "^[A-Z]{2,6}-[A-Z]{2,6}-\\d{8}-[A-Za-z]+$" },
            "maxItems": 10
          },
          "process_areas": { 
            "type": "array",
            "items": { 
              "type": "string",
              "enum": ["order_to_cash", "procure_to_pay", "record_to_report", "hire_to_retire", "plan_to_produce", "other"]
            },
            "maxItems": 8
          },
          "meeting_sentiment": { 
            "type": "string",
            "enum": ["very_positive", "positive", "neutral", "mixed", "negative", "urgent", "crisis"]
          },
          "decision_density": {
            "type": "number",
            "description": "Number of decisions per hour"
          },
          "strategic_importance": {
            "type": "string",
            "enum": ["very_high", "high", "medium", "low", "informational"]
          },
          "follow_up_required": { "type": "boolean" },
          "escalation_needed": { "type": "boolean" },
          "cross_project_relevance": { "type": "boolean" },
          "resource_impact": { "type": "boolean" }
        },
        "required": ["topics", "strategic_importance"]
      }
    },
    "required": [
      "meeting_title", 
      "meeting_date", 
      "participants", 
      "meeting_id", 
      "executive_summary", 
      "detailed_minutes", 
      "decisions_with_context", 
      "action_items", 
      "stakeholder_intelligence", 
      "deliverable_intelligence", 
      "intelligence_metadata"
    ]
  }
};

module.exports = enhancedMeetingSchema;
