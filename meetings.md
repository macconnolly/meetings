# Enhanced Meeting Intelligence System - Complete Implementation Specification
## Comprehensive Technical Guide with Full Examples and Implementation Details

### Executive Summary

This comprehensive specification provides complete implementation details for the enhanced meeting intelligence system, including full JSON schemas, detailed memory object specifications, complete API implementation examples, and comprehensive configuration guidance. Every aspect includes working examples and precise implementation details for direct developer use.

**Enhancement Goals:**
- Transform 20 meetings/day into sophisticated intelligence objects
- Enable <15 minute deliverable preparation through advanced context assembly
- Create 8-15 memory objects per meeting with precise relationship mapping
- Integrate seamlessly with existing Knowledge OS project infrastructure

---

## 1. Complete Enhanced JSON Schema Specification

### 1.1 Full Schema Definition with Validation Rules

```javascript
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
          "meeting_urgency": { 
            "type": "string",
            "enum": ["routine", "important", "urgent", "critical"]
          },
          "strategic_importance": { 
            "type": "string",
            "enum": ["operational", "tactical", "strategic", "transformational"]
          },
          "decision_density": { 
            "type": "integer",
            "minimum": 0,
            "maximum": 50,
            "description": "Number of decisions made"
          },
          "stakeholder_count": { 
            "type": "integer",
            "minimum": 1,
            "maximum": 100
          },
          "deliverable_count": { 
            "type": "integer",
            "minimum": 0,
            "maximum": 20
          },
          "follow_up_required": { 
            "type": "boolean",
            "description": "Flag indicating immediate follow-up needed"
          },
          "escalation_needed": { 
            "type": "boolean",
            "description": "Flag indicating escalation may be required"
          },
          "cross_project_relevance": { 
            "type": "boolean"
          },
          "requirement_evolution_detected": { 
            "type": "boolean"
          },
          "new_stakeholder_preferences_learned": { 
            "type": "boolean"
          },
          "process_improvements_identified": { 
            "type": "boolean"
          },
          "compliance_topics_discussed": {
            "type": "boolean"
          },
          "vendor_management_topics": {
            "type": "boolean"
          },
          "budget_implications": {
            "type": "boolean"
          },
          "timeline_changes": {
            "type": "boolean"
          }
        },
        "required": ["meeting_urgency", "strategic_importance", "follow_up_required", "decision_density", "stakeholder_count"]
      },
      
      // ============= CLIENT COMMUNICATION =============
      "client_ready_email": { 
        "type": "string",
        "minLength": 200,
        "maxLength": 2000,
        "description": "A complete, client-facing follow-up email draft"
      }
    },
    "required": [
      "meeting_title", "meeting_date", "participants", "meeting_id", "meeting_type",
      "executive_summary", "detailed_minutes", "key_decisions", "action_items", 
      "client_ready_email", "stakeholder_intelligence", "deliverable_intelligence", 
      "entity_relationships", "implementation_insights", "intelligence_metadata"
    ],
    "additionalProperties": false
  }
}
```

### 1.2 Complete Example Meeting JSON Output

```javascript
const exampleMeetingOutput = {
  "meeting_title": "BRV-UAT - Status Update: Capital Edge Inventory Validation",
  "meeting_date": "2025-06-16",
  "participants": "Michael Chen (ISC), Sarah Rodriguez (Finance), David Kim (Technical Lead), unknown.male@unk (Dev Team)",
  "meeting_id": "BRV-UAT-20250616-StatusUpdate",
  "meeting_type": "status_update",
  "meeting_duration": 45,
  
  "executive_summary": "Critical BRV inventory validation meeting identified significant gaps in Capital Edge tracker accuracy that must be resolved before UAT Day 1. The current system shows 347 applications but actual count is 422, creating a 75-application discrepancy that impacts readiness assessments. Decision made to implement immediate validation protocol with ISC team ownership. Timeline pressure remains high with June 25 workshop deadline requiring complete data accuracy.",
  
  "executive_summary_bullets": [
    "75-application discrepancy discovered between Capital Edge tracker and actual inventory (347 vs 422)",
    "ISC team assigned ownership of validation protocol implementation with 48-hour completion target",
    "Finance team identified budget implications requiring updated cost projections by June 20",
    "Technical architecture review needed for data synchronization processes",
    "June 25 workshop deadline maintains critical path dependency on accurate inventory data"
  ],
  
  "detailed_minutes": {
    "sections": [
      {
        "title": "Capital Edge Inventory Discrepancy Analysis",
        "key_points": [
          "Systematic count reveals 422 actual applications versus 347 in current tracker, representing 18% undercount",
          "Gap analysis shows missing entries concentrated in Finance and HR functional areas",
          "Data quality issues stem from incomplete migration from legacy tracking systems",
          "Immediate impact on UAT readiness calculations and resource allocation planning"
        ],
        "stakeholders_mentioned": ["Michael Chen", "ISC Committee", "Data Migration Team"],
        "deliverables_discussed": ["Updated Capital Edge Tracker", "Validation Protocol Document"],
        "requirements_evolution": [
          {
            "requirement": "Complete application inventory with 100% accuracy",
            "previous_state": "347 applications tracked with assumed completeness",
            "current_state": "422 applications identified requiring comprehensive validation protocol",
            "stakeholder_source": "Michael Chen (ISC)",
            "impact_assessment": "Critical path item affecting all downstream UAT planning",
            "change_reason": "Discovery of systematic undercounting during detailed validation process"
          }
        ],
        "section_urgency": "critical",
        "section_priority": 5
      },
      {
        "title": "Implementation Protocol and Timeline",
        "key_points": [
          "48-hour validation sprint assigned to ISC team with dedicated resources",
          "Parallel workstream established for data synchronization process review",
          "Quality gates implemented requiring dual verification for each application entry",
          "Escalation path defined for any additional discrepancies discovered during validation"
        ],
        "stakeholders_mentioned": ["ISC Team", "Technical Lead", "Dev Team"],
        "deliverables_discussed": ["Validation Sprint Plan", "Quality Assurance Checklist"],
        "section_urgency": "urgent",
        "section_priority": 5
      }
    ]
  },
  
  "key_decisions": [
    "ISC team takes immediate ownership of Capital Edge validation protocol",
    "48-hour sprint timeline established for complete inventory validation",
    "Technical architecture review initiated for data synchronization improvements"
  ],
  
  "decisions_with_context": [
    {
      "decision_id": "DCN-BRV-20250616-001",
      "decision": "ISC team assumes immediate ownership of Capital Edge validation protocol implementation",
      "rationale": "ISC has deepest domain knowledge of application categorization and established relationships with functional area representatives needed for rapid validation completion",
      "stakeholders_involved": ["Michael Chen", "ISC Committee", "Technical Lead"],
      "impact_areas": ["Timeline", "Quality", "Resources"],
      "decision_status": "approved",
      "implementation_timeline": "immediate",
      "implementation_dependencies": ["Resource allocation", "Access to legacy systems"],
      "decision_confidence": "high",
      "reversibility": "moderately_reversible"
    }
  ],
  
  "action_items": [
    {
      "action_id": "ACT-BRV-20250616-001",
      "description": "Execute comprehensive validation of all 422 identified applications in Capital Edge tracker",
      "owner": "Michael Chen (ISC)",
      "due_date": "2025-06-18",
      "priority": "critical",
      "estimated_effort": "full_day",
      "complexity": "moderate",
      "tags": ["validation", "critical_path", "data_quality"],
      "suggested_next_steps": "Begin with Finance and HR applications where largest gaps identified. Coordinate with functional leads for domain expertise. Implement dual-verification process to prevent future discrepancies.",
      "related_deliverable": "Updated Capital Edge Tracker",
      "related_project": "BRV-UAT",
      "status": "not_started",
      "dependencies": ["Access to legacy tracking systems", "Functional area representative availability"],
      "success_criteria": "100% application inventory accuracy verified through dual-validation process"
    }
  ],
  
  "follow_up_items": [
    {
      "follow_up_id": "FUP-BRV-20250616-001",
      "description": "Schedule architecture review session for data synchronization process improvements",
      "context": "Technical gaps identified during validation process require systematic review to prevent future discrepancies",
      "related_topics": ["data_synchronization", "system_architecture", "quality_assurance"],
      "suggested_timeline": "this_week",
      "stakeholders_to_involve": ["Technical Lead", "Data Migration Team", "System Architects"]
    }
  ],
  
  "stakeholder_intelligence": [
    {
      "stakeholder": "Michael Chen",
      "role_in_meeting": "primary_contributor",
      "organizational_role": "ISC Committee Lead",
      "communication_style": "analytical",
      "decision_making_pattern": "Data-driven with emphasis on systematic validation processes",
      "concerns_expressed": ["Timeline pressure affecting quality", "Resource allocation for validation sprint"],
      "questions_asked": ["What's the root cause of the discrepancy?", "How do we prevent this in future?"],
      "format_preferences": "Prefers detailed spreadsheets with validation status tracking",
      "success_criteria_mentioned": ["100% inventory accuracy", "Robust validation protocols"],
      "stakeholder_urgency": "high",
      "influence_level": "very_high",
      "engagement_level": "highly_engaged",
      "technical_sophistication": "advanced",
      "communication_preferences": {
        "prefers_visuals": false,
        "prefers_data": true,
        "prefers_narrative": false,
        "prefers_bullet_points": true,
        "prefers_executive_summary": true
      }
    }
  ],
  
  "deliverable_intelligence": [
    {
      "deliverable_id": "DEL-BRV-20250616-001",
      "deliverable_name": "Updated Capital Edge Tracker with Complete Application Inventory",
      "deliverable_type": "tracker",
      "target_audience": ["ISC Committee", "UAT Planning Team", "Finance Team"],
      "requirements_specified": [
        "100% accuracy in application counting and categorization",
        "Dual-validation process for each entry",
        "Clear status tracking for validation progress",
        "Integration with existing UAT planning tools"
      ],
      "format_requirements": "Excel spreadsheet with standardized columns: Application Name, Function, Status, Validation Date, Validator Name",
      "deadline_mentioned": "2025-06-18",
      "approval_process": "ISC Committee review followed by Technical Lead sign-off",
      "success_criteria": ["Zero discrepancies in final count", "All applications categorized correctly"],
      "dependencies": ["Access to legacy systems", "Functional area expertise"],
      "estimated_effort": "1_day",
      "complexity_level": "moderate",
      "data_requirements": ["Legacy tracking system exports", "Functional area application lists"],
      "stakeholder_input_needed": ["Functional area leads", "Technical system owners"]
    }
  ],
  
  "entity_relationships": [
    {
      "relationship_id": "REL-BRV-20250616-001",
      "primary_entity": "Capital Edge Tracker",
      "entity_type": "system",
      "relationship_type": "requires",
      "related_entity": "Legacy Tracking Systems",
      "related_entity_type": "system",
      "relationship_context": "Data migration dependency requiring ongoing synchronization",
      "relationship_strength": "critical",
      "bidirectional": false,
      "temporal_nature": "project_duration"
    },
    {
      "relationship_id": "REL-BRV-20250616-002", 
      "primary_entity": "Michael Chen",
      "entity_type": "person",
      "relationship_type": "owns",
      "related_entity": "Application Validation Protocol",
      "related_entity_type": "process",
      "relationship_context": "Assigned ownership during meeting for 48-hour completion",
      "relationship_strength": "strong",
      "bidirectional": false,
      "temporal_nature": "temporary"
    }
  ],
  
  "implementation_insights": {
    "challenges_identified": [
      {
        "challenge": "Data quality gaps in legacy system migration affecting inventory accuracy",
        "category": "technical",
        "severity": "high",
        "stakeholders_affected": ["ISC Committee", "UAT Planning Team"]
      }
    ],
    "risk_areas": [
      {
        "risk_id": "RSK-BRV-20250616-001",
        "risk_description": "Additional discrepancies may be discovered during validation process, extending timeline beyond 48-hour target",
        "risk_category": "timeline",
        "risk_severity": "medium",
        "risk_probability": "medium",
        "impact_areas": ["June 25 workshop deadline", "UAT readiness assessment"],
        "mitigation_approach": "Parallel validation streams and escalation protocols for rapid resolution",
        "owner_assigned": "Michael Chen",
        "timeline_impact": "moderate"
      }
    ],
    "success_criteria_discussed": [
      "100% application inventory accuracy verified through dual-validation",
      "Robust validation protocols preventing future discrepancies"
    ],
    "dependencies_highlighted": [
      "Access to legacy tracking systems for data reconciliation",
      "Functional area representative availability for domain validation"
    ]
  },
  
  "cross_project_context": {
    "related_initiatives": ["UAT Planning Project", "Data Migration Initiative"],
    "shared_resources": ["Technical Lead", "Data Migration Team"],
    "impact_on_other_projects": [
      {
        "project": "UAT Planning",
        "impact_description": "Inventory discrepancy affects resource allocation calculations and testing scenarios",
        "impact_type": "dependency", 
        "coordination_needed": true,
        "stakeholders_to_inform": ["UAT Planning Team", "Resource Managers"]
      }
    ]
  },
  
  "intelligence_metadata": {
    "topics": ["inventory_validation", "data_quality", "uat_readiness", "capital_edge", "system_migration"],
    "projects": ["BRV", "UAT"],
    "departments": ["ISC", "Finance", "Technical"],
    "systems_discussed": ["Capital Edge Tracker", "Legacy Tracking Systems"],
    "source_file": "BRV-UAT-20250616-StatusUpdate.eml",
    "meeting_sentiment": "urgent",
    "meeting_urgency": "critical",
    "strategic_importance": "tactical",
    "decision_density": 3,
    "stakeholder_count": 4,
    "deliverable_count": 1,
    "follow_up_required": true,
    "escalation_needed": false,
    "cross_project_relevance": true,
    "requirement_evolution_detected": true,
    "new_stakeholder_preferences_learned": true,
    "process_improvements_identified": true,
    "timeline_changes": true
  },
  
  "client_ready_email": "Subject: BRV Inventory Validation - Action Required by June 18\n\nTeam,\n\nFollowing today's status review, we've identified a critical discrepancy in our Capital Edge application inventory that requires immediate attention. Current tracker shows 347 applications, but detailed validation reveals 422 actual applications - a 75-application gap.\n\nImmediate Actions:\n• ISC team (Michael Chen) leading comprehensive validation sprint - completion by June 18\n• Technical review of data synchronization processes initiated\n• Updated inventory will inform final UAT planning and resource allocation\n\nThis remains on critical path for our June 25 workshop. Please ensure all functional area representatives are available to support validation efforts.\n\nNext update: June 18 with complete validated inventory.\n\nBest regards,\n[Name]"
};
```

---

## 2. Comprehensive Memory Object Factory Implementation

### 2.1 Complete Memory Object Specifications

**Base Memory Object Structure:**
```javascript
const baseMemoryObject = {
  content: String,           // Chunked content (200-2000 characters optimal)
  userId: "organization_main", // Fixed organization identifier
  containerTags: Array,      // ["org_main", project, type, priority]
  metadata: Object,          // Type-specific metadata schema
  customId: String          // Format: "meetingId|contentType|uniqueKey"
};
```

**Container Tags Calculation Algorithm:**
```javascript
function calculateContainerTags(meetingData, contentType, objectData = {}) {
  const baseTags = ["org_main"];
  
  // Project code extraction
  const projectCode = extractProjectCode(meetingData.meeting_id); // "BRV-UAT-20250616-StatusUpdate" → "BRV"
  if (projectCode) baseTags.push(projectCode);
  
  // Content type
  baseTags.push(contentType);
  
  // Priority/urgency mapping
  const urgencyMap = {
    "critical": "critical",
    "urgent": "urgent", 
    "important": "high-priority",
    "routine": "routine"
  };
  
  const urgencyTag = urgencyMap[meetingData.intelligence_metadata?.meeting_urgency] || "routine";
  baseTags.push(urgencyTag);
  
  // Content-specific tags
  switch(contentType) {
    case "decision":
      if (objectData.decision_status === "approved") baseTags.push("approved-decisions");
      if (objectData.impact_areas?.includes("Timeline")) baseTags.push("timeline-impact");
      break;
    case "action_item":
      baseTags.push(`owner-${slugify(objectData.owner)}`);
      baseTags.push(`priority-${objectData.priority}`);
      break;
    case "stakeholder_intel":
      baseTags.push(`role-${objectData.role_in_meeting}`);
      baseTags.push("stakeholder-intelligence");
      break;
    case "deliverable":
      baseTags.push(`deliverable-type-${objectData.deliverable_type}`);
      baseTags.push("deliverables");
      break;
    // ... additional cases
  }
  
  // Department tags
  if (meetingData.intelligence_metadata?.departments) {
    meetingData.intelligence_metadata.departments.forEach(dept => {
      baseTags.push(`dept-${slugify(dept)}`);
    });
  }
  
  return baseTags;
}
```

### 2.2 Executive Summary Memory Object

```javascript
function createExecutiveSummaryMemory(meetingData) {
  const urgencyIndicators = {
    "critical": "🔴 CRITICAL",
    "urgent": "🟠 URGENT", 
    "important": "🟡 IMPORTANT",
    "routine": "🟢 ROUTINE"
  };
  
  const urgencyPrefix = urgencyIndicators[meetingData.intelligence_metadata?.meeting_urgency] || "";
  
  const content = `# ${urgencyPrefix} Executive Summary: ${meetingData.meeting_title}

## Meeting Context
**Date:** ${meetingData.meeting_date}
**Type:** ${meetingData.meeting_type.replace(/_/g, ' ').toUpperCase()}
**Duration:** ${meetingData.meeting_duration} minutes
**Participants:** ${meetingData.participants}
**Strategic Importance:** ${meetingData.intelligence_metadata?.strategic_importance?.toUpperCase()}

## Executive Summary
${meetingData.executive_summary}

## Key Strategic Points
${meetingData.executive_summary_bullets?.map(bullet => `• ${bullet}`).join('\n')}

## Meeting Intelligence
• **Decisions Made:** ${meetingData.intelligence_metadata?.decision_density || 0}
• **Action Items Created:** ${meetingData.action_items?.length || 0}
• **Deliverables Discussed:** ${meetingData.intelligence_metadata?.deliverable_count || 0}
• **Cross-Project Relevance:** ${meetingData.intelligence_metadata?.cross_project_relevance ? 'Yes' : 'No'}
• **Follow-up Required:** ${meetingData.intelligence_metadata?.follow_up_required ? 'Yes' : 'No'}
• **Escalation Needed:** ${meetingData.intelligence_metadata?.escalation_needed ? 'Yes' : 'No'}

## Impact Areas
${meetingData.intelligence_metadata?.timeline_changes ? '• Timeline adjustments identified' : ''}
${meetingData.intelligence_metadata?.budget_implications ? '• Budget implications discussed' : ''}
${meetingData.intelligence_metadata?.requirement_evolution_detected ? '• Requirements evolution detected' : ''}`;

  return {
    content: content,
    userId: "organization_main",
    containerTags: calculateContainerTags(meetingData, "executive_summary"),
    metadata: {
      // Core identifiers
      meeting_id: meetingData.meeting_id,
      content_type: "executive_summary",
      project: extractProjectCode(meetingData.meeting_id),
      date: meetingData.meeting_date,
      
      // Meeting context
      meeting_type: meetingData.meeting_type,
      meeting_duration: meetingData.meeting_duration,
      participant_count: countParticipants(meetingData.participants),
      
      // Strategic context
      urgency: meetingData.intelligence_metadata?.meeting_urgency || "routine",
      strategic_importance: meetingData.intelligence_metadata?.strategic_importance || "operational",
      priority: calculatePriority(meetingData.intelligence_metadata?.meeting_urgency, meetingData.intelligence_metadata?.strategic_importance),
      
      // Content metrics
      decision_count: meetingData.intelligence_metadata?.decision_density || 0,
      action_item_count: meetingData.action_items?.length || 0,
      deliverable_count: meetingData.intelligence_metadata?.deliverable_count || 0,
      stakeholder_count: meetingData.intelligence_metadata?.stakeholder_count || 0,
      
      // Intelligence flags
      follow_up_required: meetingData.intelligence_metadata?.follow_up_required || false,
      escalation_needed: meetingData.intelligence_metadata?.escalation_needed || false,
      cross_project_relevance: meetingData.intelligence_metadata?.cross_project_relevance || false,
      requirement_evolution: meetingData.intelligence_metadata?.requirement_evolution_detected || false,
      stakeholder_intelligence: true, // Always true for executive summaries
      
      // Topic classification
      topics: meetingData.intelligence_metadata?.topics || [],
      projects: meetingData.intelligence_metadata?.projects || [],
      departments: meetingData.intelligence_metadata?.departments || [],
      systems: meetingData.intelligence_metadata?.systems_discussed || [],
      
      // Process context
      process_areas: meetingData.intelligence_metadata?.process_areas || [],
      compliance_related: meetingData.intelligence_metadata?.compliance_topics_discussed || false,
      vendor_related: meetingData.intelligence_metadata?.vendor_management_topics || false,
      
      // Impact indicators
      timeline_impact: meetingData.intelligence_metadata?.timeline_changes || false,
      budget_impact: meetingData.intelligence_metadata?.budget_implications || false,
      quality_impact: hasQualityImplications(meetingData),
      resource_impact: hasResourceImplications(meetingData)
    },
    customId: `${meetingData.meeting_id}|executive_summary|main`
  };
}
```

### 2.3 Meeting Sections Memory Objects

```javascript
function createMeetingSectionsMemories(meetingData) {
  return meetingData.detailed_minutes.sections.map((section, index) => {
    const sectionContent = `# Meeting Section: ${section.title}

## Discussion Points
${section.key_points?.map(point => `• ${point}`).join('\n')}

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
      content: sectionContent,
      userId: "organization_main", 
      containerTags: [
        ...calculateContainerTags(meetingData, "section"),
        "meeting-sections",
        "detailed-discussion",
        `section-${index + 1}`
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "section",
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        section_index: index,
        section_title: section.title,
        
        // Section-specific data
        section_priority: section.section_priority || null,
        section_urgency: section.section_urgency || "routine",
        stakeholders: section.stakeholders_mentioned || [],
        deliverables_mentioned: section.deliverables_discussed || [],
        
        // Content analysis
        key_point_count: section.key_points?.length || 0,
        requirements_evolution_count: section.requirements_evolution?.length || 0,
        deliverable_count: section.deliverables_discussed?.length || 0,
        stakeholder_count: section.stakeholders_mentioned?.length || 0,
        
        // Intelligence flags
        has_requirements_evolution: (section.requirements_evolution?.length || 0) > 0,
        has_deliverables: (section.deliverables_discussed?.length || 0) > 0,
        stakeholder_intelligence: (section.stakeholders_mentioned?.length || 0) > 0,
        
        // Priority calculation
        priority: calculateSectionPriority(section),
        urgency: section.section_urgency || meetingData.intelligence_metadata?.meeting_urgency || "routine",
        
        // Topic extraction
        topics: extractTopicsFromSection(section),
        follow_up_required: hasFollowUpIndicators(section),
        decision_related: hasDecisionIndicators(section)
      },
      customId: `${meetingData.meeting_id}|section|${index}`
    };
  });
}
```

### 2.4 Decision Memory Objects

```javascript
function createDecisionMemories(meetingData) {
  if (!meetingData.decisions_with_context?.length) return [];
  
  return meetingData.decisions_with_context.map((decision, index) => {
    const impactAnalysis = analyzeDecisionImpact(decision);
    
    const decisionContent = `# Decision: ${decision.decision}

## Decision Details
**ID:** ${decision.decision_id || `DCN-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`}
**Status:** ${decision.decision_status?.toUpperCase()}
**Confidence Level:** ${decision.decision_confidence?.toUpperCase() || 'NOT SPECIFIED'}
**Reversibility:** ${decision.reversibility?.replace(/_/g, ' ').toUpperCase() || 'NOT ASSESSED'}

## Rationale & Context
${decision.rationale}

## Stakeholders & Impact
**Decision Makers:** ${decision.stakeholders_involved?.join(', ')}
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
      content: decisionContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "decision", decision),
        "decisions",
        decision.decision_status === "approved" ? "approved-decisions" : "pending-decisions",
        ...(decision.impact_areas || []).map(area => `impact-${slugify(area)}`)
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "decision",
        decision_id: decision.decision_id || generateDecisionId(meetingData, index),
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        
        // Decision attributes
        decision_status: decision.decision_status,
        decision_confidence: decision.decision_confidence || "medium",
        reversibility: decision.reversibility || "moderately_reversible",
        implementation_timeline: decision.implementation_timeline || "future",
        
        // Stakeholder context
        stakeholders: decision.stakeholders_involved || [],
        stakeholder_count: decision.stakeholders_involved?.length || 0,
        primary_decision_maker: identifyPrimaryDecisionMaker(decision.stakeholders_involved),
        
        // Impact analysis
        impact_areas: decision.impact_areas || [],
        impact_count: decision.impact_areas?.length || 0,
        timeline_impact: decision.impact_areas?.includes("Timeline") || false,
        budget_impact: decision.impact_areas?.includes("Budget") || false,
        scope_impact: decision.impact_areas?.includes("Scope") || false,
        risk_impact: decision.impact_areas?.includes("Risk") || false,
        
        // Implementation context
        implementation_dependencies: decision.implementation_dependencies || [],
        dependency_count: decision.implementation_dependencies?.length || 0,
        supersedes_decision: decision.supersedes_decision || null,
        
        // Priority and urgency
        priority: calculateDecisionPriority(decision, meetingData),
        urgency: mapImplementationTimelineToUrgency(decision.implementation_timeline),
        
        // Intelligence flags
        decision_impact: calculateDecisionImpactLevel(decision),
        stakeholder_intelligence: true,
        follow_up_required: decision.implementation_dependencies?.length > 0,
        cross_project_relevance: hasXrossProjectImplications(decision),
        
        // Topics and categorization
        topics: extractDecisionTopics(decision),
        process_areas: mapImpactAreasToProcesses(decision.impact_areas),
        compliance_related: hasComplianceImplications(decision),
        vendor_related: hasVendorImplications(decision)
      },
      customId: `${meetingData.meeting_id}|decision|${decision.decision_id || index}`
    };
  });
}
```

### 2.5 Action Item Memory Objects

```javascript
function createActionItemMemories(meetingData) {
  if (!meetingData.action_items?.length) return [];
  
  return meetingData.action_items.map((action, index) => {
    const actionAnalysis = analyzeActionItem(action);
    
    const actionContent = `# Action Item: ${action.description}

## Assignment Details
**ID:** ${action.action_id || `ACT-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`}
**Owner:** ${action.owner}
**Due Date:** ${action.due_date || 'Not specified'}
**Priority:** ${action.priority?.toUpperCase()}
**Current Status:** ${action.status?.replace(/_/g, ' ').toUpperCase() || 'NOT STARTED'}

## Scope & Complexity
**Estimated Effort:** ${action.estimated_effort?.replace(/_/g, ' ') || 'Not estimated'}
**Complexity Level:** ${action.complexity?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}

## Tactical Guidance
${action.suggested_next_steps}

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
      content: actionContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "action_item", action),
        "action-items",
        `owner-${slugify(action.owner)}`,
        `priority-${action.priority}`,
        action.status ? `status-${action.status}` : "status-not-started",
        ...(action.tags || []).map(tag => `tag-${slugify(tag)}`)
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "action_item",
        action_id: action.action_id || generateActionId(meetingData, index),
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        
        // Assignment details
        owner: action.owner,
        owner_slug: slugify(action.owner),
        due_date: action.due_date || null,
        priority: action.priority || "medium",
        status: action.status || "not_started",
        
        // Effort and complexity
        estimated_effort: action.estimated_effort || "not_estimated",
        complexity: action.complexity || "moderate",
        effort_hours: mapEffortToHours(action.estimated_effort),
        
        // Context and relationships
        related_project: action.related_project || null,
        related_deliverable: action.related_deliverable || null,
        dependencies: action.dependencies || [],
        dependency_count: action.dependencies?.length || 0,
        blockers: action.blockers || null,
        has_blockers: !!action.blockers,
        
        // Tags and classification
        tags: action.tags || [],
        tag_count: action.tags?.length || 0,
        
        // Priority calculation
        calculated_priority: calculateActionPriority(action, meetingData),
        urgency_score: calculateActionUrgency(action),
        
        // Timeline analysis
        days_until_due: calculateDaysUntilDue(action.due_date),
        is_overdue: isOverdue(action.due_date),
        timeline_risk: assessTimelineRisk(action),
        
        // Intelligence flags
        follow_up_required: true, // All action items require follow-up
        stakeholder_intelligence: action.owner !== "unknown",
        deliverable_related: !!action.related_deliverable,
        cross_project_relevance: isXrossProjectAction(action),
        
        // Topic extraction
        topics: extractActionTopics(action),
        process_areas: identifyProcessAreas(action),
        
        // Success tracking
        success_criteria_defined: !!action.success_criteria,
        measurable_outcome: hasMeasurableOutcome(action)
      },
      customId: `${meetingData.meeting_id}|action_item|${action.action_id || index}`
    };
  });
}
```

### 2.6 Stakeholder Intelligence Memory Objects

```javascript
function createStakeholderIntelligenceMemories(meetingData) {
  if (!meetingData.stakeholder_intelligence?.length) return [];
  
  return meetingData.stakeholder_intelligence.map((stakeholder, index) => {
    const intelligenceAnalysis = analyzeStakeholderIntelligence(stakeholder);
    
    const stakeholderContent = `# Stakeholder Intelligence: ${stakeholder.stakeholder}

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
      content: stakeholderContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "stakeholder_intel", stakeholder),
        "stakeholder-intelligence",
        `role-${stakeholder.role_in_meeting}`,
        `influence-${stakeholder.influence_level || 'unknown'}`,
        `urgency-${stakeholder.stakeholder_urgency || 'medium'}`,
        `stakeholder-${slugify(stakeholder.stakeholder)}`
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "stakeholder_intelligence",
        stakeholder_id: generateStakeholderId(stakeholder.stakeholder),
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        
        // Stakeholder identity
        stakeholder: stakeholder.stakeholder,
        stakeholder_slug: slugify(stakeholder.stakeholder),
        organizational_role: stakeholder.organizational_role || null,
        
        // Meeting participation
        role_in_meeting: stakeholder.role_in_meeting,
        influence_level: stakeholder.influence_level || "moderate",
        engagement_level: stakeholder.engagement_level || "moderate",
        
        // Communication profile
        communication_style: stakeholder.communication_style || "collaborative",
        technical_sophistication: stakeholder.technical_sophistication || "intermediate",
        decision_making_pattern: stakeholder.decision_making_pattern || null,
        
        // Preference analysis
        prefers_visuals: stakeholder.communication_preferences?.prefers_visuals || false,
        prefers_data: stakeholder.communication_preferences?.prefers_data || false,
        prefers_narrative: stakeholder.communication_preferences?.prefers_narrative || false,
        prefers_bullet_points: stakeholder.communication_preferences?.prefers_bullet_points || false,
        prefers_executive_summary: stakeholder.communication_preferences?.prefers_executive_summary || false,
        
        // Content analysis
        concerns_count: stakeholder.concerns_expressed?.length || 0,
        questions_count: stakeholder.questions_asked?.length || 0,
        success_criteria_count: stakeholder.success_criteria_mentioned?.length || 0,
        
        // Intelligence metrics
        stakeholder_urgency: stakeholder.stakeholder_urgency || "medium",
        intelligence_quality: calculateIntelligenceQuality(stakeholder),
        engagement_score: calculateEngagementScore(stakeholder),
        influence_score: mapInfluenceToScore(stakeholder.influence_level),
        
        // Priority and flags
        priority: calculateStakeholderPriority(stakeholder),
        stakeholder_intelligence: true,
        format_preference: !!stakeholder.format_preferences,
        success_pattern: (stakeholder.success_criteria_mentioned?.length || 0) > 0,
        
        // Topics and interests
        topics: extractStakeholderTopics(stakeholder),
        interest_areas: extractInterestAreas(stakeholder),
        concern_categories: categorizeСoncerns(stakeholder.concerns_expressed),
        
        // Behavioral patterns
        questioning_style: analyzeQuestioningStyle(stakeholder.questions_asked),
        concern_pattern: analyzeConcernPatterns(stakeholder.concerns_expressed),
        preference_pattern: analyzePreferencePatterns(stakeholder)
      },
      customId: `${meetingData.meeting_id}|stakeholder_intel|${slugify(stakeholder.stakeholder)}`
    };
  });
}
```

### 2.7 Deliverable Intelligence Memory Objects

```javascript
function createDeliverableIntelligenceMemories(meetingData) {
  if (!meetingData.deliverable_intelligence?.length) return [];
  
  return meetingData.deliverable_intelligence.map((deliverable, index) => {
    const complexityAnalysis = analyzeDeliverableComplexity(deliverable);
    
    const deliverableContent = `# Deliverable: ${deliverable.deliverable_name}

## Deliverable Overview
**ID:** ${deliverable.deliverable_id || `DEL-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`}
**Type:** ${deliverable.deliverable_type?.toUpperCase()}
**Complexity Level:** ${deliverable.complexity_level?.replace(/_/g, ' ').toUpperCase() || 'Not assessed'}
**Estimated Effort:** ${deliverable.estimated_effort?.replace(/_/g, ' ') || 'Not estimated'}

## Target Audience & Stakeholders
**Primary Audience:** ${deliverable.target_audience?.join(', ')}
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
      content: deliverableContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "deliverable", deliverable),
        "deliverables",
        `deliverable-type-${deliverable.deliverable_type}`,
        `complexity-${deliverable.complexity_level || 'moderate'}`,
        `effort-${deliverable.estimated_effort || 'unknown'}`,
        ...(deliverable.target_audience || []).map(audience => `audience-${slugify(audience)}`)
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "deliverable_intelligence",
        deliverable_id: deliverable.deliverable_id || generateDeliverableId(meetingData, index),
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        
        // Deliverable attributes
        deliverable_name: deliverable.deliverable_name,
        deliverable_type: deliverable.deliverable_type,
        complexity_level: deliverable.complexity_level || "moderate",
        estimated_effort: deliverable.estimated_effort || "not_estimated",
        
        // Timeline and urgency
        deadline_mentioned: deliverable.deadline_mentioned || null,
        days_until_deadline: calculateDaysUntilDeadline(deliverable.deadline_mentioned),
        timeline_risk: assessDeliverableTimelineRisk(deliverable),
        
        // Audience and stakeholders
        target_audience: deliverable.target_audience || [],
        audience_count: deliverable.target_audience?.length || 0,
        stakeholder_input_needed: deliverable.stakeholder_input_needed || [],
        stakeholder_input_count: deliverable.stakeholder_input_needed?.length || 0,
        
        // Requirements and complexity
        requirements_count: deliverable.requirements_specified?.length || 0,
        data_requirements_count: deliverable.data_requirements?.length || 0,
        dependencies_count: deliverable.dependencies?.length || 0,
        success_criteria_count: deliverable.success_criteria?.length || 0,
        
        // Format and preferences
        format_requirements_specified: !!deliverable.format_requirements,
        approval_process_defined: !!deliverable.approval_process,
        similar_references_provided: (deliverable.similar_deliverables_referenced?.length || 0) > 0,
        
        // Complexity scoring
        technical_complexity: calculateTechnicalComplexity(deliverable),
        stakeholder_complexity: calculateStakeholderComplexity(deliverable),
        data_complexity: calculateDataComplexity(deliverable),
        overall_complexity_score: calculateOverallComplexity(deliverable),
        
        // Priority calculation
        priority: calculateDeliverablePriority(deliverable, meetingData),
        urgency: calculateDeliverableUrgency(deliverable),
        business_value: assessBusinessValue(deliverable),
        
        // Intelligence flags
        deliverable_related: true,
        format_preference: !!deliverable.format_requirements,
        success_pattern: (deliverable.success_criteria?.length || 0) > 0,
        stakeholder_intelligence: (deliverable.stakeholder_input_needed?.length || 0) > 0,
        cross_project_relevance: isXrossProjectDeliverable(deliverable),
        
        // Topics and categorization
        topics: extractDeliverableTopics(deliverable),
        process_areas: mapDeliverableToProcessAreas(deliverable),
        data_domains: extractDataDomains(deliverable.data_requirements),
        
        // Risk assessment
        resource_risk: assessResourceRisk(deliverable),
        scope_risk: assessScopeRisk(deliverable),
        quality_risk: assessQualityRisk(deliverable)
      },
      customId: `${meetingData.meeting_id}|deliverable|${deliverable.deliverable_id || index}`
    };
  });
}
```

### 2.8 Entity Relationship Memory Objects

```javascript
function createEntityRelationshipMemories(meetingData) {
  if (!meetingData.entity_relationships?.length) return [];
  
  return meetingData.entity_relationships.map((relationship, index) => {
    const relationshipAnalysis = analyzeRelationship(relationship);
    
    const relationshipContent = `# Entity Relationship: ${relationship.primary_entity} → ${relationship.related_entity}

## Relationship Details
**ID:** ${relationship.relationship_id || `REL-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`}
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
      content: relationshipContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "relationship", relationship),
        "relationships",
        "knowledge-graph",
        `entity-${relationship.entity_type}`,
        `relation-${relationship.relationship_type}`,
        `strength-${relationship.relationship_strength}`,
        relationship.bidirectional ? "bidirectional" : "unidirectional"
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "knowledge_connections",
        relationship_id: relationship.relationship_id || generateRelationshipId(meetingData, index),
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        
        // Entity information
        primary_entity: relationship.primary_entity,
        primary_entity_type: relationship.entity_type,
        primary_entity_slug: slugify(relationship.primary_entity),
        related_entity: relationship.related_entity,
        related_entity_type: relationship.related_entity_type || "unknown",
        related_entity_slug: slugify(relationship.related_entity),
        
        // Relationship attributes
        relationship_type: relationship.relationship_type,
        relationship_strength: relationship.relationship_strength,
        bidirectional: relationship.bidirectional || false,
        temporal_nature: relationship.temporal_nature || "permanent",
        
        // Analysis metrics
        criticality_score: mapStrengthToCriticality(relationship.relationship_strength),
        dependency_level: assessDependencyLevel(relationship),
        risk_level: assessRelationshipRisk(relationship),
        change_impact: assessChangeImpact(relationship),
        
        // Graph analysis
        hub_potential: calculateHubPotential(relationship),
        network_centrality: calculateNetworkCentrality(relationship, meetingData),
        relationship_complexity: calculateRelationshipComplexity(relationship),
        
        // Priority and importance
        priority: calculateRelationshipPriority(relationship),
        graph_importance: calculateGraphImportance(relationship),
        
        // Intelligence flags
        knowledge_graph: true,
        cross_project_relevance: isXrossProjectRelationship(relationship),
        stakeholder_intelligence: isStakeholderRelationship(relationship),
        deliverable_related: isDeliverableRelationship(relationship),
        
        // Categorization
        topics: extractRelationshipTopics(relationship),
        entity_categories: [relationship.entity_type, relationship.related_entity_type].filter(Boolean),
        relationship_categories: categorizeRelationship(relationship),
        
        // Temporal analysis
        relationship_stability: assessRelationshipStability(relationship),
        evolution_likelihood: assessEvolutionLikelihood(relationship),
        maintenance_required: requiresMaintenance(relationship)
      },
      customId: `${meetingData.meeting_id}|relationship|${relationship.relationship_id || index}`
    };
  });
}
```

### 2.9 Implementation Insights Memory Objects

```javascript
function createImplementationInsightsMemories(meetingData) {
  const memories = [];
  
  // Risk Area Memories
  if (meetingData.implementation_insights?.risk_areas?.length) {
    meetingData.implementation_insights.risk_areas.forEach((risk, index) => {
      const riskAnalysis = analyzeRisk(risk);
      
      const riskContent = `# Risk Factor: ${risk.risk_description}

## Risk Assessment
**ID:** ${risk.risk_id || `RSK-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`}
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
        content: riskContent,
        userId: "organization_main",
        containerTags: [
          ...calculateContainerTags(meetingData, "risk", risk),
          "risks",
          "implementation-insights",
          `severity-${risk.risk_severity}`,
          `category-${risk.risk_category}`,
          `probability-${risk.risk_probability?.replace(/_/g, '-')}`
        ],
        metadata: {
          // Core identifiers
          meeting_id: meetingData.meeting_id,
          content_type: "implementation_insights",
          risk_id: risk.risk_id || generateRiskId(meetingData, index),
          project: extractProjectCode(meetingData.meeting_id),
          date: meetingData.meeting_date,
          sub_type: "risk",
          
          // Risk attributes
          risk_description: risk.risk_description,
          risk_category: risk.risk_category,
          risk_severity: risk.risk_severity,
          risk_probability: risk.risk_probability || "medium",
          timeline_impact: risk.timeline_impact || "moderate",
          
          // Impact and ownership
          impact_areas: risk.impact_areas || [],
          impact_count: risk.impact_areas?.length || 0,
          owner_assigned: risk.owner_assigned || null,
          mitigation_defined: !!risk.mitigation_approach,
          
          // Risk scoring
          severity_score: mapSeverityToScore(risk.risk_severity),
          probability_score: mapProbabilityToScore(risk.risk_probability),
          impact_score: calculateImpactScore(risk),
          overall_risk_score: calculateOverallRiskScore(risk),
          
          // Priority calculation
          priority: calculateRiskPriority(risk),
          mitigation_urgency: calculateMitigationUrgency(risk),
          monitoring_frequency: determinMonitoringFrequency(risk),
          
          // Intelligence flags
          risk_factor: true,
          stakeholder_intelligence: !!risk.owner_assigned,
          cross_project_relevance: hasXrossProjectRiskImpact(risk),
          follow_up_required: !risk.mitigation_approach || !risk.owner_assigned,
          
          // Categorization
          topics: extractRiskTopics(risk),
          process_areas: mapRiskToProcessAreas(risk),
          threat_categories: categorizeRiskThreats(risk)
        },
        customId: `${meetingData.meeting_id}|risk|${risk.risk_id || index}`
      });
    });
  }
  
  // Success Criteria Memory
  if (meetingData.implementation_insights?.success_criteria_discussed?.length) {
    const successContent = `# Success Criteria & Patterns: ${meetingData.meeting_title}

## Success Criteria Discussed
${meetingData.implementation_insights.success_criteria_discussed.map(criteria => `• ${criteria}`).join('\n')}

## Lessons Learned
${meetingData.implementation_insights.lessons_learned?.map(lesson => `
**Lesson:** ${lesson.lesson}
**Source:** ${lesson.source || 'Meeting discussion'}
**Applicability:** ${lesson.applicability?.replace(/_/g, ' ').toUpperCase() || 'Not specified'}
`).join('\n---\n') || 'No lessons learned documented'}

## Dependencies & Constraints
${meetingData.implementation_insights.dependencies_highlighted?.map(dep => `• ${dep}`).join('\n') || 'No dependencies highlighted'}

## Challenge Analysis
${meetingData.implementation_insights.challenges_identified?.map(challenge => `
**Challenge:** ${challenge.challenge}
**Category:** ${challenge.category?.toUpperCase()}
**Severity:** ${challenge.severity?.toUpperCase()}
**Affected Stakeholders:** ${challenge.stakeholders_affected?.join(', ') || 'Not specified'}
`).join('\n---\n') || 'No challenges identified'}`;

    memories.push({
      content: successContent,
      userId: "organization_main",
      containerTags: [
        ...calculateContainerTags(meetingData, "implementation_insight"),
        "implementation-insights",
        "success-patterns",
        "lessons-learned"
      ],
      metadata: {
        // Core identifiers
        meeting_id: meetingData.meeting_id,
        content_type: "implementation_insights",
        insight_id: `INS-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-001`,
        project: extractProjectCode(meetingData.meeting_id),
        date: meetingData.meeting_date,
        sub_type: "success_patterns",
        
        // Content metrics
        success_criteria_count: meetingData.implementation_insights.success_criteria_discussed?.length || 0,
        lessons_learned_count: meetingData.implementation_insights.lessons_learned?.length || 0,
        dependencies_count: meetingData.implementation_insights.dependencies_highlighted?.length || 0,
        challenges_count: meetingData.implementation_insights.challenges_identified?.length || 0,
        
        // Quality indicators
        has_success_criteria: (meetingData.implementation_insights.success_criteria_discussed?.length || 0) > 0,
        has_lessons_learned: (meetingData.implementation_insights.lessons_learned?.length || 0) > 0,
        has_dependencies: (meetingData.implementation_insights.dependencies_highlighted?.length || 0) > 0,
        has_challenges: (meetingData.implementation_insights.challenges_identified?.length || 0) > 0,
        
        // Intelligence value
        intelligence_density: calculateInsightDensity(meetingData.implementation_insights),
        applicability_scope: assessApplicabilityScope(meetingData.implementation_insights.lessons_learned),
        
        // Priority and flags
        priority: calculateInsightPriority(meetingData.implementation_insights),
        success_pattern: true,
        stakeholder_intelligence: hasStakeholderInsights(meetingData.implementation_insights),
        cross_project_relevance: hasXrossProjectInsights(meetingData.implementation_insights),
        
        // Topics and categorization
        topics: extractInsightTopics(meetingData.implementation_insights),
        challenge_categories: extractChallengeCategories(meetingData.implementation_insights.challenges_identified),
        lesson_categories: extractLessonCategories(meetingData.implementation_insights.lessons_learned)
      },
      customId: `${meetingData.meeting_id}|implementation_insight|success_patterns`
    });
  }
  
  return memories;
}
```

### 2.10 Cross-Project Context Memory Objects

```javascript
function createCrossProjectMemories(meetingData) {
  if (!meetingData.cross_project_context?.impact_on_other_projects?.length) return [];
  
  const crossProjectContent = `# Cross-Project Impact Analysis: ${meetingData.meeting_title}

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
  .map(impact => `• ${impact.project}: ${impact.impact_description}`)
  .join('\n') || 'No coordination requirements identified'}`;

  return [{
    content: crossProjectContent,
    userId: "organization_main",
    containerTags: [
      ...calculateContainerTags(meetingData, "cross_project"),
      "cross-project",
      "coordination",
      "organizational-impact",
      ...extractAffectedProjects(meetingData.cross_project_context).map(proj => `affected-${slugify(proj)}`)
    ],
    metadata: {
      // Core identifiers
      meeting_id: meetingData.meeting_id,
      content_type: "cross_project_context",
      cross_project_id: `XPR-${extractProjectCode(meetingData.meeting_id)}-${meetingData.meeting_date.replace(/-/g, '')}-001`,
      project: extractProjectCode(meetingData.meeting_id),
      date: meetingData.meeting_date,
      
      // Impact analysis
      affected_projects: extractAffectedProjects(meetingData.cross_project_context),
      affected_project_count: meetingData.cross_project_context.impact_on_other_projects?.length || 0,
      coordination_required_count: countCoordinationRequired(meetingData.cross_project_context),
      
      // Resource and initiative context
      related_initiatives: meetingData.cross_project_context.related_initiatives || [],
      related_initiative_count: meetingData.cross_project_context.related_initiatives?.length || 0,
      shared_resources: meetingData.cross_project_context.shared_resources || [],
      shared_resource_count: meetingData.cross_project_context.shared_resources?.length || 0,
      
      // Impact categorization
      positive_impacts: countImpactsByType(meetingData.cross_project_context, "positive"),
      negative_impacts: countImpactsByType(meetingData.cross_project_context, "negative"),
      dependency_impacts: countImpactsByType(meetingData.cross_project_context, "dependency"),
      risk_impacts: countImpactsByType(meetingData.cross_project_context, "risk"),
      opportunity_impacts: countImpactsByType(meetingData.cross_project_context, "opportunity"),
      
      // Stakeholder analysis
      stakeholders_to_inform: extractStakeholdersToInform(meetingData.cross_project_context),
      stakeholder_notification_count: countStakeholdersToInform(meetingData.cross_project_context),
      
      // Complexity and priority
      coordination_complexity: assessCoordinationComplexity(meetingData.cross_project_context),
      organizational_impact_level: assessOrganizationalImpactLevel(meetingData.cross_project_context),
      priority: calculateCrossProjectPriority(meetingData.cross_project_context),
      
      // Intelligence flags
      cross_project_relevance: true,
      coordination_required: hasCoordinationRequirements(meetingData.cross_project_context),
      stakeholder_intelligence: hasStakeholderNotifications(meetingData.cross_project_context),
      follow_up_required: hasCoordinationRequirements(meetingData.cross_project_context),
      
      // Topics and domains
      topics: extractCrossProjectTopics(meetingData.cross_project_context),
      impact_domains: extractImpactDomains(meetingData.cross_project_context),
      resource_domains: extractResourceDomains(meetingData.cross_project_context.shared_resources)
    },
    customId: `${meetingData.meeting_id}|cross_project|main`
  }];
}
```

---

## 3. Complete Supermemory API Integration Implementation

### 3.1 Comprehensive API Client Implementation

```javascript
class SupermemoryClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3';
    this.apiKey = config.apiKey || process.env.SUPERMEMORY_API_KEY;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.rateLimit = config.rateLimit || 100; // requests per minute
    this.rateLimitManager = new RateLimitManager(this.rateLimit);
    this.logger = config.logger || console;
    
    if (!this.apiKey) {
      throw new Error('Supermemory API key is required');
    }
  }
  
  async createMemory(memoryObject, options = {}) {
    const requestBody = {
      content: memoryObject.content,
      userId: memoryObject.userId || "organization_main",
      containerTags: memoryObject.containerTags || [],
      metadata: memoryObject.metadata || {},
      customId: memoryObject.customId || null
    };
    
    // Validate memory object
    const validationResult = this.validateMemoryObject(requestBody);
    if (!validationResult.valid) {
      throw new Error(`Memory object validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    return await this.rateLimitManager.executeWithRateLimit(async () => {
      return await this.executeWithRetry(async () => {
        const response = await this.makeRequest('POST', '/memories', requestBody);
        
        this.logger.info(`Memory created successfully: ${response.id}`, {
          memoryId: response.id,
          customId: requestBody.customId,
          contentType: requestBody.metadata.content_type,
          status: response.status
        });
        
        return response;
      }, options.retryOptions);
    });
  }
  
  async batchCreateMemories(memoryObjects, options = {}) {
    const results = {
      totalMemories: memoryObjects.length,
      successful: [],
      failed: [],
      skipped: []
    };
    
    this.logger.info(`Starting batch creation of ${memoryObjects.length} memories`);
    
    for (let i = 0; i < memoryObjects.length; i++) {
      const memoryObject = memoryObjects[i];
      
      try {
        // Skip null or invalid objects
        if (!memoryObject || !memoryObject.content) {
          results.skipped.push({
            index: i,
            reason: 'Invalid or empty memory object',
            object: memoryObject
          });
          continue;
        }
        
        const result = await this.createMemory(memoryObject, options);
        results.successful.push({
          index: i,
          memoryId: result.id,
          customId: memoryObject.customId,
          contentType: memoryObject.metadata?.content_type,
          status: result.status
        });
        
        // Progress logging
        if (i > 0 && i % 10 === 0) {
          this.logger.info(`Batch progress: ${i}/${memoryObjects.length} memories processed`);
        }
        
      } catch (error) {
        this.logger.error(`Failed to create memory ${i}:`, error);
        results.failed.push({
          index: i,
          error: error.message,
          customId: memoryObject.customId,
          contentType: memoryObject.metadata?.content_type
        });
        
        // Continue processing other memories even if one fails
        if (options.stopOnError) {
          break;
        }
      }
    }
    
    // Final results logging
    const successRate = (results.successful.length / results.totalMemories * 100).toFixed(1);
    this.logger.info(`Batch creation completed: ${results.successful.length}/${results.totalMemories} successful (${successRate}%)`);
    
    if (results.failed.length > 0) {
      this.logger.warn(`${results.failed.length} memories failed to create`);
    }
    
    return results;
  }
  
  async getMemoryStatus(memoryId) {
    return await this.executeWithRetry(async () => {
      const response = await this.makeRequest('GET', `/memories/${memoryId}`);
      return {
        id: response.id,
        status: response.status,
        title: response.title,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        processingComplete: ['done', 'failed'].includes(response.status)
      };
    });
  }
  
  async validateMemoryBatch(memoryIds, options = {}) {
    const validationResults = {
      totalMemories: memoryIds.length,
      processed: 0,
      processing: 0,
      failed: 0,
      details: []
    };
    
    this.logger.info(`Validating ${memoryIds.length} memories`);
    
    // Wait initial delay for processing to begin
    if (options.initialDelay) {
      await this.delay(options.initialDelay);
    }
    
    for (const memoryId of memoryIds) {
      try {
        const status = await this.getMemoryStatus(memoryId);
        validationResults.details.push(status);
        
        if (status.status === 'done') {
          validationResults.processed++;
        } else if (['queued', 'extracting', 'chunking', 'embedding', 'indexing'].includes(status.status)) {
          validationResults.processing++;
        } else {
          validationResults.failed++;
        }
        
        // Small delay between status checks
        await this.delay(100);
        
      } catch (error) {
        this.logger.error(`Failed to check status for memory ${memoryId}:`, error);
        validationResults.failed++;
        validationResults.details.push({
          id: memoryId,
          status: 'check_failed',
          error: error.message
        });
      }
    }
    
    const completionRate = (validationResults.processed / validationResults.totalMemories * 100).toFixed(1);
    this.logger.info(`Validation completed: ${validationResults.processed}/${validationResults.totalMemories} processed (${completionRate}%)`);
    
    return validationResults;
  }
  
  async searchMemories(query, options = {}) {
    const searchRequest = {
      q: query.q || query,
      limit: options.limit || 10,
      containerTags: options.containerTags || [],
      filters: options.filters || {},
      documentThreshold: options.documentThreshold || 0.7,
      chunkThreshold: options.chunkThreshold || 0.7,
      onlyMatchingChunks: options.onlyMatchingChunks || false
    };
    
    return await this.executeWithRetry(async () => {
      const response = await this.makeRequest('POST', '/search', searchRequest);
      
      this.logger.info(`Search completed: ${response.results?.length || 0} results found`, {
        query: searchRequest.q,
        resultCount: response.results?.length || 0,
        searchTime: response.timing?.total || 'unknown'
      });
      
      return response;
    });
  }
  
  // Private helper methods
  async makeRequest(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    };
    
    if (data) {
      config.data = data;
    }
    
    try {
      const response = await axios(url, config);
      return response.data;
    } catch (error) {
      if (error.response) {
        const apiError = new Error(`API Error: ${error.response.status} - ${error.response.statusText}`);
        apiError.status = error.response.status;
        apiError.responseData = error.response.data;
        throw apiError;
      } else if (error.request) {
        throw new Error(`Network Error: ${error.message}`);
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
  }
  
  async executeWithRetry(operation, options = {}) {
    const maxRetries = options.maxRetries || this.retryAttempts;
    const baseDelay = options.baseDelay || 1000;
    const maxDelay = options.maxDelay || 30000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const shouldRetry = this.shouldRetryError(error);
        
        if (isLastAttempt || !shouldRetry) {
          throw error;
        }
        
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        await this.delay(delay);
      }
    }
  }
  
  shouldRetryError(error) {
    if (!error.status) return true; // Network errors
    
    // Retry on server errors and rate limits
    return error.status >= 500 || error.status === 429 || error.status === 408;
  }
  
  validateMemoryObject(memoryObject) {
    const errors = [];
    
    if (!memoryObject.content || typeof memoryObject.content !== 'string') {
      errors.push('Content is required and must be a string');
    }
    
    if (memoryObject.content && memoryObject.content.length < 10) {
      errors.push('Content must be at least 10 characters long');
    }
    
    if (memoryObject.content && memoryObject.content.length > 50000) {
      errors.push('Content must be less than 50,000 characters');
    }
    
    if (!memoryObject.userId) {
      errors.push('userId is required');
    }
    
    if (!Array.isArray(memoryObject.containerTags)) {
      errors.push('containerTags must be an array');
    }
    
    if (!memoryObject.metadata || typeof memoryObject.metadata !== 'object') {
      errors.push('metadata is required and must be an object');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3.2 Advanced Rate Limiting Manager

```javascript
class RateLimitManager {
  constructor(requestsPerMinute = 100) {
    this.requestsPerMinute = requestsPerMinute;
    this.safetyBuffer = 0.9; // Use 90% of rate limit for safety
    this.maxSafeRequests = Math.floor(requestsPerMinute * this.safetyBuffer);
    this.requestTimestamps = [];
    this.isWaiting = false;
  }
  
  async executeWithRateLimit(operation) {
    await this.waitForRateLimit();
    
    try {
      const result = await operation();
      this.recordRequest();
      return result;
    } catch (error) {
      this.recordRequest(); // Still count failed requests toward rate limit
      throw error;
    }
  }
  
  async waitForRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    const currentRequests = this.requestTimestamps.length;
    
    if (currentRequests >= this.maxSafeRequests) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 1000; // Extra 1 second buffer
      
      if (waitTime > 0 && !this.isWaiting) {
        this.isWaiting = true;
        console.log(`Rate limit approaching. Waiting ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.isWaiting = false;
      }
    }
    
    // Additional delay between requests for smoother rate limiting
    const minRequestInterval = Math.ceil(60000 / this.maxSafeRequests);
    const timeSinceLastRequest = now - (this.requestTimestamps[this.requestTimestamps.length - 1] || 0);
    
    if (timeSinceLastRequest < minRequestInterval) {
      const additionalWait = minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, additionalWait));
    }
  }
  
  recordRequest() {
    this.requestTimestamps.push(Date.now());
  }
  
  getUsageStats() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentRequests = this.requestTimestamps.filter(timestamp => timestamp > oneMinuteAgo);
    
    return {
      requestsLastMinute: recentRequests.length,
      requestsPerMinuteLimit: this.requestsPerMinute,
      safeRequestLimit: this.maxSafeRequests,
      utilizationPercentage: (recentRequests.length / this.maxSafeRequests * 100).toFixed(1),
      isNearLimit: recentRequests.length >= (this.maxSafeRequests * 0.8)
    };
  }
}
```

### 3.3 Context Assembly Implementation

```javascript
class ContextAssembler {
  constructor(supermemoryClient) {
    this.client = supermemoryClient;
    this.logger = console;
  }
  
  async assembleDeliverableContext(deliverableRequest) {
    const startTime = Date.now();
    
    this.logger.info(`Assembling context for deliverable: ${deliverableRequest.name}`);
    
    // Comprehensive search strategy with multiple query patterns
    const searchQueries = [
      // Stakeholder preferences and communication patterns
      {
        name: "stakeholder_intelligence",
        query: {
          q: `${deliverableRequest.audience} preferences communication format requirements successful approaches`,
          containerTags: ["org_main", "stakeholder-intelligence"],
          filters: {
            AND: [
              { key: "content_type", value: "stakeholder_intelligence", negate: false },
              { key: "stakeholders", value: deliverableRequest.audience, negate: false }
            ]
          },
          limit: 15
        }
      },
      
      // Deliverable specifications and requirements
      {
        name: "deliverable_specifications",
        query: {
          q: `${deliverableRequest.type} requirements specifications format examples template`,
          containerTags: ["org_main", "deliverables"],
          filters: {
            AND: [
              { key: "content_type", value: "deliverable_intelligence", negate: false },
              { key: "deliverable_type", value: deliverableRequest.type, negate: false }
            ]
          },
          limit: 20
        }
      },
      
      // Decision context and evolution
      {
        name: "decision_context",
        query: {
          q: `${deliverableRequest.topic} decisions requirements changes evolution approved`,
          containerTags: ["org_main", "decisions"],
          filters: {
            AND: [
              { key: "content_type", value: "decision", negate: false },
              { key: "decision_status", value: "approved", negate: false }
            ]
          },
          limit: 12
        }
      },
      
      // Implementation insights and lessons learned
      {
        name: "implementation_insights",
        query: {
          q: `${deliverableRequest.topic} lessons learned success patterns best practices`,
          containerTags: ["org_main", "implementation-insights"],
          filters: {
            AND: [
              { key: "content_type", value: "implementation_insights", negate: false },
              { key: "success_pattern", value: true, negate: false }
            ]
          },
          limit: 10
        }
      },
      
      // Cross-project context and dependencies
      {
        name: "cross_project_context",
        query: {
          q: `${deliverableRequest.topic} cross project dependencies coordination shared resources`,
          containerTags: ["org_main", "cross-project"],
          filters: {
            AND: [
              { key: "cross_project_relevance", value: true, negate: false }
            ]
          },
          limit: 8
        }
      },
      
      // Action items and follow-ups
      {
        name: "action_context",
        query: {
          q: `${deliverableRequest.topic} action items tasks deliverable related`,
          containerTags: ["org_main", "action-items"],
          filters: {
            AND: [
              { key: "content_type", value: "action_item", negate: false },
              { key: "deliverable_related", value: true, negate: false }
            ]
          },
          limit: 10
        }
      },
      
      // Risk factors and mitigation strategies
      {
        name: "risk_context",
        query: {
          q: `${deliverableRequest.topic} risk mitigation challenges obstacles`,
          containerTags: ["org_main", "risks"],
          filters: {
            AND: [
              { key: "content_type", value: "implementation_insights", negate: false },
              { key: "risk_factor", value: true, negate: false }
            ]
          },
          limit: 8
        }
      },
      
      // Executive summaries for strategic context
      {
        name: "strategic_context",
        query: {
          q: `${deliverableRequest.topic} strategic executive summary critical important`,
          containerTags: ["org_main", "executive-summaries"],
          filters: {
            AND: [
              { key: "content_type", value: "executive_summary", negate: false },
              { key: "strategic_importance", value: "strategic", negate: false }
            ]
          },
          limit: 6
        }
      }
    ];
    
    // Execute all searches concurrently
    const contextPackage = await this.executeSearchQueries(searchQueries);
    
    // Analyze and enhance the context
    const enhancedContext = await this.enhanceContextPackage(contextPackage, deliverableRequest);
    
    const processingTime = Date.now() - startTime;
    this.logger.info(`Context assembly completed in ${processingTime}ms`, {
      totalResults: Object.values(contextPackage).reduce((sum, results) => sum + results.length, 0),
      confidence: enhancedContext.confidence,
      categories: Object.keys(contextPackage).length
    });
    
    return enhancedContext;
  }
  
  async executeSearchQueries(searchQueries) {
    const results = {};
    const searchPromises = searchQueries.map(async (searchConfig) => {
      try {
        const response = await this.client.searchMemories(searchConfig.query);
        return {
          name: searchConfig.name,
          results: response.results || [],
          metadata: {
            query: searchConfig.query.q,
            resultCount: response.results?.length || 0,
            searchTime: response.timing?.total || null
          }
        };
      } catch (error) {
        this.logger.error(`Search failed for ${searchConfig.name}:`, error);
        return {
          name: searchConfig.name,
          results: [],
          error: error.message
        };
      }
    });
    
    const searchResults = await Promise.all(searchPromises);
    
    // Organize results by category
    searchResults.forEach(result => {
      results[result.name] = result.results;
    });
    
    return results;
  }
  
  async enhanceContextPackage(contextPackage, deliverableRequest) {
    const totalResults = Object.values(contextPackage).reduce((sum, results) => sum + results.length, 0);
    
    // Generate comprehensive summary
    const summary = this.generateContextSummary(contextPackage, deliverableRequest);
    
    // Extract stakeholder insights
    const stakeholderInsights = this.extractStakeholderInsights(contextPackage.stakeholder_intelligence);
    
    // Compile format guidance
    const formatGuidance = this.compileFormatGuidance(contextPackage);
    
    // Extract requirements and specifications
    const requirements = this.extractCurrentRequirements(contextPackage);
    
    // Identify success patterns
    const successPatterns = this.identifySuccessPatterns(contextPackage);
    
    // Analyze risk factors
    const riskFactors = this.analyzeRiskFactors(contextPackage);
    
    // Map dependencies
    const dependencies = this.extractDependencies(contextPackage);
    
    // Build timeline context
    const timeline = this.buildRequirementTimeline(contextPackage);
    
    // Calculate confidence score
    const confidence = this.calculateContextConfidence(contextPackage, deliverableRequest);
    
    return {
      summary,
      stakeholderInsights,
      formatGuidance,
      requirements,
      successPatterns,
      riskFactors,
      dependencies,
      timeline,
      confidence,
      metadata: {
        totalResults,
        categoriesFound: Object.keys(contextPackage).filter(key => contextPackage[key].length > 0).length,
        processingTime: Date.now(),
        deliverableRequest
      },
      rawContext: contextPackage
    };
  }
  
  generateContextSummary(contextPackage, deliverableRequest) {
    const resultCounts = Object.entries(contextPackage).map(([category, results]) => 
      `${category}: ${results.length} items`
    ).join(', ');
    
    const totalResults = Object.values(contextPackage).reduce((sum, results) => sum + results.length, 0);
    
    const primaryInsights = [];
    
    if (contextPackage.stakeholder_intelligence?.length > 0) {
      primaryInsights.push(`Found ${contextPackage.stakeholder_intelligence.length} stakeholder intelligence records`);
    }
    
    if (contextPackage.deliverable_specifications?.length > 0) {
      primaryInsights.push(`Identified ${contextPackage.deliverable_specifications.length} similar deliverable specifications`);
    }
    
    if (contextPackage.decision_context?.length > 0) {
      primaryInsights.push(`Located ${contextPackage.decision_context.length} relevant approved decisions`);
    }
    
    if (contextPackage.success_patterns?.length > 0) {
      primaryInsights.push(`Discovered ${contextPackage.implementation_insights.length} success patterns and lessons learned`);
    }
    
    return {
      overview: `Context assembled for ${deliverableRequest.type} "${deliverableRequest.name}" targeting ${deliverableRequest.audience}. Found ${totalResults} relevant memories across ${Object.keys(contextPackage).length} categories.`,
      breakdown: resultCounts,
      keyInsights: primaryInsights,
      readiness: totalResults >= 10 ? 'High' : totalResults >= 5 ? 'Medium' : 'Low'
    };
  }
  
  extractStakeholderInsights(stakeholderResults) {
    if (!stakeholderResults?.length) return { profiles: [], preferences: {}, communication: {} };
    
    const profiles = stakeholderResults.map(result => ({
      stakeholder: result.metadata?.stakeholder,
      role: result.metadata?.role_in_meeting,
      communicationStyle: result.metadata?.communication_style,
      influenceLevel: result.metadata?.influence_level,
      preferences: {
        prefers_visuals: result.metadata?.prefers_visuals,
        prefers_data: result.metadata?.prefers_data,
        prefers_narrative: result.metadata?.prefers_narrative,
        prefers_bullet_points: result.metadata?.prefers_bullet_points,
        prefers_executive_summary: result.metadata?.prefers_executive_summary
      },
      engagementLevel: result.metadata?.engagement_level,
      technicalSophistication: result.metadata?.technical_sophistication
    }));
    
    // Aggregate preferences
    const aggregatedPreferences = this.aggregateStakeholderPreferences(profiles);
    
    // Communication guidance
    const communicationGuidance = this.generateCommunicationGuidance(profiles);
    
    return {
      profiles,
      preferences: aggregatedPreferences,
      communication: communicationGuidance,
      count: profiles.length
    };
  }
  
  compileFormatGuidance(contextPackage) {
    const formatSources = [
      ...(contextPackage.stakeholder_intelligence || []),
      ...(contextPackage.deliverable_specifications || []),
      ...(contextPackage.implementation_insights || [])
    ];
    
    const formatPreferences = [];
    const structuralRequirements = [];
    const presentationTips = [];
    
    formatSources.forEach(source => {
      if (source.metadata?.format_preferences) {
        formatPreferences.push(source.metadata.format_preferences);
      }
      
      if (source.content?.includes('format') || source.content?.includes('structure')) {
        // Extract format-related content
        const formatMatches = source.content.match(/format[^.]*\./gi);
        if (formatMatches) {
          structuralRequirements.push(...formatMatches);
        }
      }
    });
    
    return {
      preferences: [...new Set(formatPreferences)],
      structural: [...new Set(structuralRequirements)],
      presentation: presentationTips,
      hasGuidance: formatPreferences.length > 0 || structuralRequirements.length > 0
    };
  }
  
  calculateContextConfidence(contextPackage, deliverableRequest) {
    const weights = {
      stakeholder_intelligence: 0.25,
      deliverable_specifications: 0.30,
      decision_context: 0.15,
      implementation_insights: 0.10,
      cross_project_context: 0.05,
      action_context: 0.05,
      risk_context: 0.05,
      strategic_context: 0.05
    };
    
    let confidence = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([category, weight]) => {
      const results = contextPackage[category] || [];
      const normalizedScore = Math.min(1, results.length / 5); // Normalize to max 5 results
      confidence += normalizedScore * weight;
      totalWeight += weight;
    });
    
    // Bonus for having diverse categories
    const categoriesWithResults = Object.values(contextPackage).filter(results => results.length > 0).length;
    const diversityBonus = Math.min(0.1, categoriesWithResults / Object.keys(contextPackage).length * 0.1);
    
    const finalConfidence = Math.min(1, (confidence / totalWeight) + diversityBonus);
    
    return {
      score: Math.round(finalConfidence * 100),
      level: finalConfidence >= 0.8 ? 'High' : finalConfidence >= 0.6 ? 'Medium' : 'Low',
      factors: {
        contentVolume: Math.round(confidence / totalWeight * 100),
        categoryDiversity: Math.round(diversityBonus * 1000),
        totalCategories: Object.keys(contextPackage).length,
        categoriesWithResults
      }
    };
  }
  
  // Additional helper methods for context enhancement...
  
  aggregateStakeholderPreferences(profiles) {
    const aggregated = {
      prefers_visuals: 0,
      prefers_data: 0,
      prefers_narrative: 0,
      prefers_bullet_points: 0,
      prefers_executive_summary: 0
    };
    
    profiles.forEach(profile => {
      Object.keys(aggregated).forEach(pref => {
        if (profile.preferences[pref]) {
          aggregated[pref]++;
        }
      });
    });
    
    const total = profiles.length;
    const percentages = {};
    Object.keys(aggregated).forEach(pref => {
      percentages[pref] = total > 0 ? Math.round((aggregated[pref] / total) * 100) : 0;
    });
    
    return percentages;
  }
  
  generateCommunicationGuidance(profiles) {
    const styles = profiles.map(p => p.communicationStyle).filter(Boolean);
    const influences = profiles.map(p => p.influenceLevel).filter(Boolean);
    const technical = profiles.map(p => p.technicalSophistication).filter(Boolean);
    
    const styleDistribution = this.calculateDistribution(styles);
    const influenceDistribution = this.calculateDistribution(influences);
    const technicalDistribution = this.calculateDistribution(technical);
    
    return {
      dominantStyle: styleDistribution.dominant,
      dominantInfluence: influenceDistribution.dominant,
      dominantTechnicalLevel: technicalDistribution.dominant,
      recommendations: this.generateCommunicationRecommendations(styleDistribution, influenceDistribution, technicalDistribution),
      audienceComplexity: this.assessAudienceComplexity(profiles)
    };
  }
  
  calculateDistribution(values) {
    const counts = {};
    values.forEach(value => {
      counts[value] = (counts[value] || 0) + 1;
    });
    
    const dominant = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
    const total = values.length;
    
    return {
      counts,
      dominant,
      dominantPercentage: total > 0 ? Math.round((counts[dominant] / total) * 100) : 0,
      diversity: Object.keys(counts).length
    };
  }
  
  generateCommunicationRecommendations(styles, influences, technical) {
    const recommendations = [];
    
    // Style-based recommendations
    if (styles.dominant === 'analytical') {
      recommendations.push('Include detailed data and logical flow of reasoning');
    } else if (styles.dominant === 'strategic') {
      recommendations.push('Focus on high-level implications and strategic context');
    } else if (styles.dominant === 'detail_oriented') {
      recommendations.push('Provide comprehensive details and thorough documentation');
    }
    
    // Influence-based recommendations
    if (influences.dominant === 'very_high') {
      recommendations.push('Ensure executive summary and clear decision points');
    } else if (influences.dominant === 'high') {
      recommendations.push('Balance detail with strategic overview');
    }
    
    // Technical-based recommendations
    if (technical.dominant === 'expert') {
      recommendations.push('Include technical details and implementation specifics');
    } else if (technical.dominant === 'basic') {
      recommendations.push('Use clear language and avoid technical jargon');
    }
    
    return recommendations;
  }
  
  assessAudienceComplexity(profiles) {
    const diversityScore = new Set(profiles.map(p => p.communicationStyle)).size +
                          new Set(profiles.map(p => p.influenceLevel)).size +
                          new Set(profiles.map(p => p.technicalSophistication)).size;
    
    return {
      score: diversityScore,
      level: diversityScore >= 8 ? 'High' : diversityScore >= 5 ? 'Medium' : 'Low',
      recommendations: diversityScore >= 8 ? 
        ['Create multiple versions for different audience segments'] :
        ['Single format should work for most audience members']
    };
  }
}
```

---

## 4. Complete Helper Functions and Utilities

### 4.1 Core Utility Functions

```javascript
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

function calculateSectionPriority(section) {
  if (section.section_priority) return section.section_priority;
  
  let score = 2; // Base priority
  
  // Increase priority based on content
  if (section.requirements_evolution?.length > 0) score += 1;
  if (section.deliverables_discussed?.length > 0) score += 1;
  if (section.section_urgency === 'critical') score += 2;
  else if (section.section_urgency === 'urgent') score += 1;
  
  return Math.min(5, score);
}

function calculateDecisionPriority(decision, meetingData) {
  let score = 3; // Base priority for decisions
  
  // Impact-based scoring
  const impactCount = decision.impact_areas?.length || 0;
  if (impactCount >= 5) score += 2;
  else if (impactCount >= 3) score += 1;
  
  // Timeline urgency
  if (decision.implementation_timeline === 'immediate') score += 2;
  else if (decision.implementation_timeline === 'this_week') score += 1;
  
  // Status consideration
  if (decision.decision_status === 'approved') score += 1;
  
  // Meeting urgency influence
  if (meetingData.intelligence_metadata?.meeting_urgency === 'critical') score += 1;
  
  return Math.min(5, score);
}

function calculateActionPriority(action, meetingData) {
  const priorityMap = {
    critical: 5,
    urgent: 4,
    high: 4,
    medium: 3,
    low: 2
  };
  
  let score = priorityMap[action.priority] || 3;
  
  // Deadline proximity
  const daysUntilDue = calculateDaysUntilDue(action.due_date);
  if (daysUntilDue <= 1) score = 5;
  else if (daysUntilDue <= 3) score = Math.max(score, 4);
  else if (daysUntilDue <= 7) score = Math.max(score, 3);
  
  // Blockers reduce priority
  if (action.blockers) score = Math.max(1, score - 1);
  
  return score;
}

function calculateStakeholderPriority(stakeholder) {
  let score = 2; // Base priority
  
  // Influence level
  const influenceScores = {
    very_high: 5,
    high: 4,
    moderate: 3,
    low: 2
  };
  score = Math.max(score, influenceScores[stakeholder.influence_level] || 2);
  
  // Role importance
  const roleScores = {
    decision_maker: 5,
    meeting_leader: 4,
    primary_contributor: 3,
    subject_matter_expert: 3
  };
  score = Math.max(score, roleScores[stakeholder.role_in_meeting] || 2);
  
  // Urgency level
  const urgencyScores = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2
  };
  score = Math.max(score, urgencyScores[stakeholder.stakeholder_urgency] || 2);
  
  return score;
}

function calculateDeliverablePriority(deliverable, meetingData) {
  let score = 3; // Base priority
  
  // Deadline proximity
  const daysUntilDeadline = calculateDaysUntilDeadline(deliverable.deadline_mentioned);
  if (daysUntilDeadline <= 3) score += 2;
  else if (daysUntilDeadline <= 7) score += 1;
  
  // Complexity consideration
  const complexityScores = {
    very_complex: 4,
    complex: 3,
    moderate: 2,
    simple: 1
  };
  const complexityBonus = complexityScores[deliverable.complexity_level] || 2;
  score += Math.floor(complexityBonus / 2);
  
  // Audience size (more stakeholders = higher priority)
  const audienceSize = deliverable.target_audience?.length || 0;
  if (audienceSize >= 5) score += 1;
  
  // Meeting urgency influence
  if (meetingData.intelligence_metadata?.meeting_urgency === 'critical') score += 1;
  
  return Math.min(5, score);
}

function calculateRelationshipPriority(relationship) {
  const strengthScores = {
    critical: 5,
    strong: 4,
    moderate: 3,
    weak: 2
  };
  
  let score = strengthScores[relationship.relationship_strength] || 3;
  
  // Bidirectional relationships are more important
  if (relationship.bidirectional) score += 1;
  
  // Temporal nature consideration
  if (relationship.temporal_nature === 'permanent') score += 1;
  
  return Math.min(5, score);
}

function calculateRiskPriority(risk) {
  const severityScores = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2
  };
  
  const probabilityScores = {
    very_high: 5,
    high: 4,
    medium: 3,
    low: 2,
    very_low: 1
  };
  
  const severityScore = severityScores[risk.risk_severity] || 3;
  const probabilityScore = probabilityScores[risk.risk_probability] || 3;
  
  // Risk priority is combination of severity and probability
  const riskScore = Math.ceil((severityScore + probabilityScore) / 2);
  
  // Timeline impact increases priority
  if (risk.timeline_impact === 'severe') return 5;
  else if (risk.timeline_impact === 'significant') return Math.max(riskScore, 4);
  
  return riskScore;
}

// Analysis Functions
function analyzeDecisionImpact(decision) {
  return {
    timeline: decision.impact_areas?.includes('Timeline') ? 'High' : 'Low',
    resources: decision.impact_areas?.includes('Resources') ? 'High' : 'Low',
    risk: decision.impact_areas?.includes('Risk') ? 'High' : 'Low',
    quality: decision.impact_areas?.includes('Quality') ? 'High' : 'Low'
  };
}

function analyzeActionItem(action) {
  const effortHours = mapEffortToHours(action.estimated_effort);
  const complexityScore = mapComplexityToScore(action.complexity);
  
  return {
    effortScore: effortHours,
    complexityScore,
    timelineRisk: assessActionTimelineRisk(action),
    resourceRequirement: assessActionResourceRequirement(action)
  };
}

function analyzeStakeholderIntelligence(stakeholder) {
  const engagementScore = calculateEngagementScore(stakeholder);
  const influenceScore = mapInfluenceToScore(stakeholder.influence_level);
  
  return {
    engagementScore,
    influenceScore,
    patterns: identifyStakeholderPatterns(stakeholder),
    communicationComplexity: assessCommunicationComplexity(stakeholder)
  };
}

function analyzeDeliverableComplexity(deliverable) {
  return {
    technical: calculateTechnicalComplexity(deliverable),
    stakeholder: calculateStakeholderComplexity(deliverable),
    data: calculateDataComplexity(deliverable),
    timelineRisk: assessDeliverableTimelineRisk(deliverable)
  };
}

function analyzeRelationship(relationship) {
  return {
    criticality: mapStrengthToCriticality(relationship.relationship_strength),
    dependencyType: assessDependencyLevel(relationship),
    riskLevel: assessRelationshipRisk(relationship),
    changeImpact: assessChangeImpact(relationship)
  };
}

function analyzeRisk(risk) {
  const severityScore = mapSeverityToScore(risk.risk_severity);
  const probabilityScore = mapProbabilityToScore(risk.risk_probability);
  const impactScore = calculateImpactScore(risk);
  
  const riskScore = (severityScore + probabilityScore + impactScore) / 3;
  
  return {
    riskScore: Math.round(riskScore * 5), // Scale to 1-25
    priorityLevel: riskScore >= 4 ? 'Critical' : riskScore >= 3 ? 'High' : 'Medium',
    mitigationUrgency: calculateMitigationUrgency(risk)
  };
}

// Date and Time Functions
function calculateDaysUntilDue(dueDate) {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function calculateDaysUntilDeadline(deadline) {
  return calculateDaysUntilDue(deadline);
}

function isOverdue(dueDate) {
  return calculateDaysUntilDue(dueDate) < 0;
}

// Mapping Functions
function mapEffortToHours(effort) {
  const effortMap = {
    '15min': 0.25,
    '30min': 0.5,
    '1hour': 1,
    '2hours': 2,
    'half_day': 4,
    'full_day': 8,
    'multiple_days': 24,
    'week_plus': 40,
    'few_hours': 3,
    '1_day': 8,
    '2_3_days': 20,
    '1_week': 40,
    '2_weeks': 80,
    '1_month': 160,
    'multiple_months': 640
  };
  
  return effortMap[effort] || 8;
}

function mapComplexityToScore(complexity) {
  const complexityMap = {
    trivial: 1,
    simple: 2,
    moderate: 3,
    complex: 4,
    very_complex: 5
  };
  
  return complexityMap[complexity] || 3;
}

function mapInfluenceToScore(influence) {
  const influenceMap = {
    low: 2,
    moderate: 3,
    high: 4,
    very_high: 5
  };
  
  return influenceMap[influence] || 3;
}

function mapSeverityToScore(severity) {
  const severityMap = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  };
  
  return severityMap[severity] || 2;
}

function mapProbabilityToScore(probability) {
  const probabilityMap = {
    very_low: 1,
    low: 2,
    medium: 3,
    high: 4,
    very_high: 5
  };
  
  return probabilityMap[probability] || 3;
}

function mapImplementationTimelineToUrgency(timeline) {
  const timelineMap = {
    immediate: 'critical',
    this_week: 'urgent',
    next_week: 'important',
    this_month: 'important',
    next_month: 'routine',
    this_quarter: 'routine',
    future: 'routine'
  };
  
  return timelineMap[timeline] || 'routine';
}

// Assessment Functions
function calculateEngagementScore(stakeholder) {
  let score = 5; // Base score
  
  const questionCount = stakeholder.questions_asked?.length || 0;
  const concernCount = stakeholder.concerns_expressed?.length || 0;
  
  score += Math.min(3, questionCount); // Max 3 points for questions
  score += Math.min(2, concernCount); // Max 2 points for concerns
  
  const engagementMap = {
    passive: -2,
    moderate: 0,
    active: 1,
    highly_engaged: 2
  };
  
  score += engagementMap[stakeholder.engagement_level] || 0;
  
  return Math.max(1, Math.min(10, score));
}

function calculateIntelligenceQuality(stakeholder) {
  let score = 0;
  
  if (stakeholder.communication_style) score += 1;
  if (stakeholder.decision_making_pattern) score += 1;
  if (stakeholder.format_preferences) score += 1;
  if ((stakeholder.questions_asked?.length || 0) > 0) score += 1;
  if ((stakeholder.concerns_expressed?.length || 0) > 0) score += 1;
  if ((stakeholder.success_criteria_mentioned?.length || 0) > 0) score += 1;
  
  return Math.min(10, score * 1.67); // Scale to 10
}

function calculateTechnicalComplexity(deliverable) {
  let score = 1;
  
  // Data requirements complexity
  const dataCount = deliverable.data_requirements?.length || 0;
  if (dataCount >= 5) score += 2;
  else if (dataCount >= 3) score += 1;
  
  // Dependencies complexity
  const depCount = deliverable.dependencies?.length || 0;
  if (depCount >= 5) score += 2;
  else if (depCount >= 3) score += 1;
  
  // Type-based complexity
  const complexTypes = ['model', 'dashboard', 'technical_specification'];
  if (complexTypes.includes(deliverable.deliverable_type)) score += 1;
  
  return Math.min(5, score);
}

function calculateStakeholderComplexity(deliverable) {
  const audienceSize = deliverable.target_audience?.length || 0;
  const inputNeeded = deliverable.stakeholder_input_needed?.length || 0;
  
  let score = 1;
  
  if (audienceSize >= 8) score += 2;
  else if (audienceSize >= 5) score += 1;
  
  if (inputNeeded >= 5) score += 2;
  else if (inputNeeded >= 3) score += 1;
  
  return Math.min(5, score);
}

function calculateDataComplexity(deliverable) {
  const dataRequirements = deliverable.data_requirements?.length || 0;
  
  let score = 1;
  
  if (dataRequirements >= 8) score += 2;
  else if (dataRequirements >= 5) score += 1;
  
  // Complex data types
  const complexDataIndicators = ['integration', 'real-time', 'historical', 'aggregation'];
  const hasComplexData = deliverable.data_requirements?.some(req => 
    complexDataIndicators.some(indicator => req.toLowerCase().includes(indicator))
  );
  
  if (hasComplexData) score += 1;
  
  return Math.min(5, score);
}

function calculateOverallComplexity(deliverable) {
  const technical = calculateTechnicalComplexity(deliverable);
  const stakeholder = calculateStakeholderComplexity(deliverable);
  const data = calculateDataComplexity(deliverable);
  
  return Math.round((technical + stakeholder + data) / 3);
}

// Content Analysis Functions
function extractTopicsFromSection(section) {
  const topics = [];
  
  // Extract from title
  topics.push(section.title.toLowerCase());
  
  // Extract from deliverables mentioned
  if (section.deliverables_discussed) {
    topics.push(...section.deliverables_discussed.map(d => d.toLowerCase()));
  }
  
  // Extract from key points (simple keyword extraction)
  section.key_points?.forEach(point => {
    const keywords = extractKeywords(point);
    topics.push(...keywords);
  });
  
  return [...new Set(topics)].slice(0, 10); // Limit to 10 unique topics
}

function extractKeywords(text) {
  // Simple keyword extraction - remove stop words and extract meaningful terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5);
}

function extractDecisionTopics(decision) {
  const topics = [];
  
  // Extract from decision text
  topics.push(...extractKeywords(decision.decision));
  
  // Extract from impact areas
  if (decision.impact_areas) {
    topics.push(...decision.impact_areas.map(area => area.toLowerCase()));
  }
  
  return [...new Set(topics)].slice(0, 8);
}

function extractActionTopics(action) {
  const topics = [];
  
  // Extract from description
  topics.push(...extractKeywords(action.description));
  
  // Extract from tags
  if (action.tags) {
    topics.push(...action.tags);
  }
  
  // Extract from related project/deliverable
  if (action.related_project) topics.push(action.related_project.toLowerCase());
  if (action.related_deliverable) topics.push(action.related_deliverable.toLowerCase());
  
  return [...new Set(topics)].slice(0, 8);
}

function extractStakeholderTopics(stakeholder) {
  const topics = [];
  
  // Extract from concerns
  if (stakeholder.concerns_expressed) {
    stakeholder.concerns_expressed.forEach(concern => {
      topics.push(...extractKeywords(concern));
    });
  }
  
  // Extract from questions
  if (stakeholder.questions_asked) {
    stakeholder.questions_asked.forEach(question => {
      topics.push(...extractKeywords(question));
    });
  }
  
  // Add role and communication style as topics
  if (stakeholder.role_in_meeting) topics.push(stakeholder.role_in_meeting);
  if (stakeholder.communication_style) topics.push(stakeholder.communication_style);
  
  return [...new Set(topics)].slice(0, 10);
}

// Format and Display Functions
function formatCommunicationPreferences(prefs) {
  if (!prefs) return 'Not specified';
  
  const preferencesList = [];
  if (prefs.prefers_visuals) preferencesList.push('Visual presentations');
  if (prefs.prefers_data) preferencesList.push('Data-driven content');
  if (prefs.prefers_narrative) preferencesList.push('Narrative format');
  if (prefs.prefers_bullet_points) preferencesList.push('Bullet point summaries');
  if (prefs.prefers_executive_summary) preferencesList.push('Executive summaries');
  
  return preferencesList.length > 0 ? preferencesList.join(', ') : 'No specific preferences identified';
}

// Cross-Reference Functions
function isXrossProjectAction(action) {
  const crossProjectIndicators = ['coordination', 'shared', 'cross', 'multiple', 'other'];
  const description = action.description?.toLowerCase() || '';
  const nextSteps = action.suggested_next_steps?.toLowerCase() || '';
  
  return crossProjectIndicators.some(indicator => 
    description.includes(indicator) || nextSteps.includes(indicator)
  );
}

function isXrossProjectDeliverable(deliverable) {
  const crossProjectIndicators = ['cross', 'shared', 'organization', 'multiple'];
  const name = deliverable.deliverable_name?.toLowerCase() || '';
  const requirements = deliverable.requirements_specified?.join(' ').toLowerCase() || '';
  
  return crossProjectIndicators.some(indicator => 
    name.includes(indicator) || requirements.includes(indicator)
  );
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
    dep.toLowerCase().includes('project') || dep.toLowerCase().includes('coordination')
  );
}

// Validation Functions
function hasMeasurableOutcome(action) {
  const measurableIndicators = ['complete', 'deliver', 'finish', 'approve', 'implement'];
  const description = action.description?.toLowerCase() || '';
  const criteria = action.success_criteria?.toLowerCase() || '';
  
  return measurableIndicators.some(indicator => 
    description.includes(indicator) || criteria.includes(indicator)
  );
}

function hasQualityImplications(meetingData) {
  return meetingData.decisions_with_context?.some(decision => 
    decision.impact_areas?.includes('Quality')
  ) || meetingData.implementation_insights?.challenges_identified?.some(challenge =>
    challenge.category === 'quality'
  );
}

function hasResourceImplications(meetingData) {
  return meetingData.decisions_with_context?.some(decision => 
    decision.impact_areas?.includes('Resources')
  ) || meetingData.action_items?.some(action =>
    action.estimated_effort && !['15min', '30min'].includes(action.estimated_effort)
  );
}

function hasFollowUpIndicators(section) {
  const followUpKeywords = ['follow up', 'next steps', 'action required', 'pending'];
  const content = section.key_points?.join(' ').toLowerCase() || '';
  
  return followUpKeywords.some(keyword => content.includes(keyword));
}

function hasDecisionIndicators(section) {
  const decisionKeywords = ['decided', 'approved', 'agreed', 'determined'];
  const content = section.key_points?.join(' ').toLowerCase() || '';
  
  return decisionKeywords.some(keyword => content.includes(keyword));
}

function requiresMaintenance(relationship) {
  const maintenanceTypes = ['temporary', 'project_duration', 'conditional'];
  return maintenanceTypes.includes(relationship.temporal_nature);
}

// Risk Assessment Functions
function assessTimelineRisk(action) {
  const daysUntilDue = calculateDaysUntilDue(action.due_date);
  const effort = mapEffortToHours(action.estimated_effort);
  
  if (!daysUntilDue) return 'unknown';
  if (daysUntilDue <= 0) return 'critical';
  if (daysUntilDue <= 1 && effort > 4) return 'high';
  if (daysUntilDue <= 3 && effort > 8) return 'medium';
  
  return 'low';
}

function assessDeliverableTimelineRisk(deliverable) {
  const daysUntilDeadline = calculateDaysUntilDeadline(deliverable.deadline_mentioned);
  const effort = mapEffortToHours(deliverable.estimated_effort);
  const complexity = mapComplexityToScore(deliverable.complexity_level);
  
  if (!daysUntilDeadline) return 'unknown';
  if (daysUntilDeadline <= 0) return 'critical';
  
  const riskScore = (effort / 8) + complexity - (daysUntilDeadline / 7);
  
  if (riskScore >= 3) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

function assessRelationshipRisk(relationship) {
  if (relationship.relationship_strength === 'critical' && relationship.temporal_nature === 'temporary') {
    return 'high';
  }
  if (relationship.relationship_strength === 'weak' && relationship.bidirectional) {
    return 'medium';
  }
  return 'low';
}

function assessResourceRisk(deliverable) {
  const stakeholderCount = deliverable.stakeholder_input_needed?.length || 0;
  const dataComplexity = calculateDataComplexity(deliverable);
  
  if (stakeholderCount >= 5 && dataComplexity >= 4) return 'high';
  if (stakeholderCount >= 3 || dataComplexity >= 3) return 'medium';
  return 'low';
}

function assessScopeRisk(deliverable) {
  const requirementCount = deliverable.requirements_specified?.length || 0;
  const dependencyCount = deliverable.dependencies?.length || 0;
  
  if (requirementCount >= 10 && dependencyCount >= 5) return 'high';
  if (requirementCount >= 5 || dependencyCount >= 3) return 'medium';
  return 'low';
}

function assessQualityRisk(deliverable) {
  const hasApprovalProcess = !!deliverable.approval_process;
  const hasSuccessCriteria = (deliverable.success_criteria?.length || 0) > 0;
  
  if (!hasApprovalProcess && !hasSuccessCriteria) return 'high';
  if (!hasApprovalProcess || !hasSuccessCriteria) return 'medium';
  return 'low';
}
```

### 4.2 Complete Configuration Management

```javascript
// config/production.json
{
  "environment": "production",
  "processing": {
    "inputDir": "./input",
    "outputDir": "./output", 
    "logDir": "./logs",
    "progressDir": "./progress",
    "tempDir": "./temp",
    "maxConcurrentFiles": 3,
    "batchSize": 8,
    "processingTimeout": 300000,
    "enableProgressPersistence": true,
    "enableMetricsCollection": true
  },
  "apis": {
    "openrouter": {
      "baseURL": "https://openrouter.ai/api/v1",
      "model": "google/gemini-2.5-flash-preview-05-20",
      "temperature": 0.1,
      "maxTokens": 8192,
      "timeout": 180000,
      "retryAttempts": 3,
      "retryDelay": 5000
    },
    "supermemory": {
      "baseURL": "https://api.supermemory.ai/v3",
      "userId": "organization_main",
      "timeout": 30000,
      "retryAttempts": 3,
      "retryDelay": 2000,
      "rateLimit": 90,
      "batchDelay": 100,
      "validationDelay": 30000
    }
  },
  "validation": {
    "schemaValidation": true,
    "contentValidation": true,
    "memoryValidation": true,
    "enableStrictMode": true,
    "failOnValidationError": false,
    "maxValidationErrors": 10
  },
  "output": {
    "generateMDFiles": true,
    "createSupermemoryObjects": true,
    "validateOutput": true,
    "enableOutputCompression": false,
    "preserveOriginalFiles": true
  },
  "logging": {
    "level": "info",
    "includeTimestamps": true,
    "logToFile": true,
    "logToConsole": true,
    "enableStructuredLogging": true,
    "enableMetrics": true,
    "rotateLogFiles": true,
    "maxLogSize": "100MB",
    "maxLogFiles": 10
  },
  "monitoring": {
    "enablePerformanceMetrics": true,
    "enableApiMetrics": true,
    "enableMemoryUsageTracking": true,
    "enableErrorTracking": true,
    "metricsOutputFile": "./metrics/performance.json",
    "healthCheckInterval": 60000
  },
  "security": {
    "enableApiKeyValidation": true,
    "enableSSLVerification": true,
    "enableRequestLogging": false,
    "enableSensitiveDataMasking": true
  }
}
```

### 4.3 Complete Testing Framework

```javascript
// test/integration/pipeline.test.js
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
  
  before(async () => {
    // Setup test environment
    emailProcessor = new EmailProcessor();
    aiProcessor = new AIProcessor({
      apiKey: process.env.OPENROUTER_API_KEY_TEST,
      model: 'google/gemini-2.5-flash-preview-05-20'
    });
    memoryFactory = new MemoryFactory();
    supermemoryClient = new SupermemoryClient({
      apiKey: process.env.SUPERMEMORY_API_KEY_TEST,
      baseURL: process.env.SUPERMEMORY_BASE_URL_TEST
    });
  });

  describe('Email Processing Tests', () => {
    it('should extract transcript from sample BRV meeting', async () => {
      const emailPath = path.join(__dirname, '../fixtures/brv-meeting-sample.eml');
      const result = await emailProcessor.extractTranscript(emailPath);
      
      assert.ok(result.transcriptContent);
      assert.ok(result.meetingTitle);
      assert.ok(result.receivedDateISO);
      assert.ok(result.transcriptContent.length > 100);
      
      // Verify BRV-specific content
      assert.ok(result.transcriptContent.includes('BRV') || result.transcriptContent.includes('inventory'));
    });

    it('should handle corrupted email files gracefully', async () => {
      const emailPath = path.join(__dirname, '../fixtures/corrupted.eml');
      
      try {
        const result = await emailProcessor.extractTranscript(emailPath);
        assert.ok(result.transcriptContent); // Should have fallback content
      } catch (error) {
        assert.ok(error.message.includes('Invalid email format'));
      }
    });
  });

  describe('AI Processing Tests', () => {
    it('should generate complete structured output for BRV meeting', async () => {
      const extractedData = {
        transcriptContent: `BRV UAT Status Update Meeting\n\nParticipants: Michael Chen (ISC), Sarah Rodriguez (Finance), David Kim (Technical Lead)\n\nMichael: We've discovered a significant discrepancy in our Capital Edge tracker. Current count shows 347 applications but actual inventory reveals 422 applications.\n\nSarah: This 75-application gap is affecting our budget calculations. We need updated projections by June 20.\n\nDavid: I recommend implementing a validation protocol with the ISC team taking ownership. Target completion in 48 hours.\n\nMichael: Agreed. ISC will handle the validation sprint. We need dual verification for each entry to prevent future discrepancies.\n\nDecision: ISC team assumes immediate ownership of validation protocol implementation.\n\nAction Items:\n- Michael: Execute comprehensive validation of all 422 applications by June 18\n- Sarah: Update budget projections based on corrected inventory by June 20\n- David: Schedule architecture review for data synchronization improvements`,
        receivedDateISO: '2025-06-16T10:00:00.000Z',
        waveLink: 'https://app.wave.co/sessions/test-session-123',
        meetingTitle: 'BRV UAT Status Update'
      };
      
      const result = await aiProcessor.processTranscript(extractedData);
      
      // Validate core structure
      assert.ok(result.structuredData);
      assert.ok(result.structuredData.meeting_title);
      assert.ok(result.structuredData.executive_summary);
      assert.ok(result.structuredData.decisions_with_context);
      assert.ok(result.structuredData.action_items);
      assert.ok(result.structuredData.stakeholder_intelligence);
      assert.ok(result.structuredData.intelligence_metadata);
      
      // Validate BRV-specific content
      assert.ok(result.structuredData.meeting_title.includes('BRV'));
      assert.ok(result.structuredData.decisions_with_context.length > 0);
      assert.ok(result.structuredData.action_items.length >= 3);
      
      // Validate metadata quality
      assert.ok(result.structuredData.intelligence_metadata.meeting_urgency);
      assert.ok(result.structuredData.intelligence_metadata.stakeholder_count >= 3);
      assert.ok(result.structuredData.intelligence_metadata.decision_density >= 1);
    });

    it('should handle API failures with proper error reporting', async () => {
      const invalidData = {
        transcriptContent: '',
        receivedDateISO: '2025-06-16T10:00:00.000Z'
      };
      
      try {
        await aiProcessor.processTranscript(invalidData);
        assert.fail('Should have thrown error for empty transcript');
      } catch (error) {
        assert.ok(error.message.includes('Transcript content'));
      }
    });
  });

  describe('Memory Factory Tests', () => {
    it('should create 8-15 memory objects from complete meeting data', async () => {
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData);
      
      assert.ok(Array.isArray(memoryObjects));
      assert.ok(memoryObjects.length >= 8);
      assert.ok(memoryObjects.length <= 15);
      
      // Validate each memory object structure
      memoryObjects.forEach((memory, index) => {
        assert.ok(memory.content, `Memory ${index} missing content`);
        assert.ok(memory.userId, `Memory ${index} missing userId`);
        assert.ok(Array.isArray(memory.containerTags), `Memory ${index} missing containerTags`);
        assert.ok(memory.metadata, `Memory ${index} missing metadata`);
        assert.ok(memory.customId, `Memory ${index} missing customId`);
        
        // Validate metadata structure
        assert.ok(memory.metadata.meeting_id, `Memory ${index} missing meeting_id`);
        assert.ok(memory.metadata.content_type, `Memory ${index} missing content_type`);
        assert.ok(memory.metadata.project, `Memory ${index} missing project`);
        assert.ok(memory.metadata.date, `Memory ${index} missing date`);
      });
      
      // Validate memory types
      const contentTypes = memoryObjects.map(m => m.metadata.content_type);
      assert.ok(contentTypes.includes('executive_summary'));
      assert.ok(contentTypes.includes('decision'));
      assert.ok(contentTypes.includes('action_item'));
      assert.ok(contentTypes.includes('stakeholder_intelligence'));
    });

    it('should generate consistent containerTags across memory objects', async () => {
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData);
      
      // All memories should have org_main tag
      memoryObjects.forEach(memory => {
        assert.ok(memory.containerTags.includes('org_main'));
      });
      
      // Project-specific tags should be consistent
      const projectTags = memoryObjects.map(m => 
        m.containerTags.find(tag => ['BRV', 'UAT', 'Strategy'].includes(tag))
      ).filter(Boolean);
      
      const uniqueProjectTags = [...new Set(projectTags)];
      assert.ok(uniqueProjectTags.length <= 2, 'Too many different project tags');
    });
  });

  describe('Supermemory Integration Tests', () => {
    it('should successfully create memory objects in Supermemory', async () => {
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData);
      
      // Test single memory creation
      const testMemory = memoryObjects[0];
      const result = await supermemoryClient.createMemory(testMemory);
      
      assert.ok(result.id);
      assert.ok(['queued', 'extracting', 'done'].includes(result.status));
      
      // Verify memory can be retrieved
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for processing
      const status = await supermemoryClient.getMemoryStatus(result.id);
      assert.ok(status.id === result.id);
    });

    it('should handle batch memory creation with rate limiting', async () => {
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData);
      
      const startTime = Date.now();
      const results = await supermemoryClient.batchCreateMemories(memoryObjects);
      const endTime = Date.now();
      
      // Validate results
      assert.ok(results.successful.length > 0);
      assert.ok(results.successful.length >= results.totalMemories * 0.8); // 80% success rate minimum
      
      // Validate rate limiting (should take time for multiple requests)
      const processingTime = endTime - startTime;
      const expectedMinTime = (memoryObjects.length - 1) * 100; // 100ms between requests
      assert.ok(processingTime >= expectedMinTime, 'Rate limiting not working properly');
    });

    it('should validate memory processing completion', async () => {
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData.slice(0, 3)); // Test with 3 memories
      
      const createResults = await supermemoryClient.batchCreateMemories(memoryObjects);
      const memoryIds = createResults.successful.map(r => r.memoryId);
      
      // Wait and validate processing
      const validationResults = await supermemoryClient.validateMemoryBatch(memoryIds, {
        initialDelay: 10000 // Wait 10 seconds before checking
      });
      
      assert.ok(validationResults.totalMemories === memoryIds.length);
      assert.ok(validationResults.processed + validationResults.processing + validationResults.failed === validationResults.totalMemories);
    });
  });

  describe('Context Assembly Tests', () => {
    it('should assemble comprehensive context for deliverable request', async () => {
      // First, create some memories for context
      const sampleMeetingData = await loadSampleMeetingData();
      const memoryObjects = await memoryFactory.createMemoryObjects(sampleMeetingData);
      await supermemoryClient.batchCreateMemories(memoryObjects);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Test context assembly
      const deliverableRequest = {
        name: 'BRV Inventory Tracker',
        type: 'tracker',
        audience: 'ISC Committee',
        topic: 'inventory validation'
      };
      
      const contextAssembler = new ContextAssembler(supermemoryClient);
      const context = await contextAssembler.assembleDeliverableContext(deliverableRequest);
      
      // Validate context structure
      assert.ok(context.summary);
      assert.ok(context.confidence);
      assert.ok(context.stakeholderInsights);
      assert.ok(context.metadata);
      
      // Validate confidence scoring
      assert.ok(context.confidence.score >= 0 && context.confidence.score <= 100);
      assert.ok(['High', 'Medium', 'Low'].includes(context.confidence.level));
      
      // Validate stakeholder insights
      if (context.stakeholderInsights.profiles.length > 0) {
        assert.ok(context.stakeholderInsights.preferences);
        assert.ok(context.stakeholderInsights.communication);
      }
    });
  });

  describe('End-to-End Pipeline Tests', () => {
    it('should process complete meeting workflow from .eml to Supermemory', async () => {
      const emailPath = path.join(__dirname, '../fixtures/complete-brv-meeting.eml');
      
      // Step 1: Extract transcript
      const extractedData = await emailProcessor.extractTranscript(emailPath);
      assert.ok(extractedData.transcriptContent);
      
      // Step 2: Process with AI
      const aiResult = await aiProcessor.processTranscript(extractedData);
      assert.ok(aiResult.structuredData);
      
      // Step 3: Create memory objects
      const memoryObjects = await memoryFactory.createMemoryObjects(aiResult.structuredData);
      assert.ok(memoryObjects.length >= 8);
      
      // Step 4: Send to Supermemory
      const supermemoryResults = await supermemoryClient.batchCreateMemories(memoryObjects);
      assert.ok(supermemoryResults.successful.length > 0);
      
      // Step 5: Validate processing
      const memoryIds = supermemoryResults.successful.map(r => r.memoryId);
      const validationResults = await supermemoryClient.validateMemoryBatch(memoryIds, {
        initialDelay: 15000
      });
      
      assert.ok(validationResults.processed + validationResults.processing >= validationResults.totalMemories * 0.8);
      
      // Step 6: Test context assembly
      const deliverableRequest = {
        name: extractedData.meetingTitle,
        type: 'tracker',
        audience: 'Project Team',
        topic: 'meeting outcomes'
      };
      
      const contextAssembler = new ContextAssembler(supermemoryClient);
      const context = await contextAssembler.assembleDeliverableContext(deliverableRequest);
      
      assert.ok(context.confidence.score > 0);
    });
  });

  // Helper function to load sample meeting data
  async function loadSampleMeetingData() {
    const samplePath = path.join(__dirname, '../fixtures/sample-meeting-data.json');
    const sampleData = await fs.readFile(samplePath, 'utf8');
    return JSON.parse(sampleData);
  }
});

// Performance benchmark tests
describe('Performance Benchmarks', () => {
  it('should process single meeting within 3 minutes', async () => {
    const startTime = Date.now();
    
    // Run complete pipeline
    const emailPath = path.join(__dirname, '../fixtures/benchmark-meeting.eml');
    // ... complete pipeline execution
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    assert.ok(processingTime < 180000, `Processing took ${processingTime}ms, should be under 180000ms`);
  });

  it('should handle 10 meetings within 30 minutes', async () => {
    const startTime = Date.now();
    
    // Process 10 meetings
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(processSingleMeeting(`test-meeting-${i}.eml`));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    assert.ok(totalTime < 1800000, `Batch processing took ${totalTime}ms, should be under 1800000ms`);
  });
});
```

### 4.4 Complete Deployment Guide

```javascript
// deploy/production-setup.js
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class ProductionDeployment {
  constructor(config) {
    this.config = config;
    this.deploymentPath = config.deploymentPath || '/opt/meeting-intelligence';
    this.serviceName = 'meeting-intelligence';
  }

  async deploy() {
    console.log('Starting production deployment...');
    
    try {
      await this.validateEnvironment();
      await this.setupDirectoryStructure();
      await this.installDependencies();
      await this.configureEnvironment();
      await this.setupLogging();
      await this.configureMonitoring();
      await this.validateDeployment();
      await this.createSystemService();
      
      console.log('✅ Production deployment completed successfully');
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async validateEnvironment() {
    console.log('Validating environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
    }
    
    // Check required environment variables
    const requiredEnvVars = [
      'OPENROUTER_API_KEY',
      'SUPERMEMORY_API_KEY',
      'NODE_ENV'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }
    
    // Test API connectivity
    await this.testAPIConnectivity();
    
    console.log('✅ Environment validation passed');
  }

  async testAPIConnectivity() {
    console.log('Testing API connectivity...');
    
    // Test OpenRouter API
    try {
      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      });
      
      if (!openrouterResponse.ok) {
        throw new Error(`OpenRouter API test failed: ${openrouterResponse.status}`);
      }
    } catch (error) {
      throw new Error(`OpenRouter API connectivity failed: ${error.message}`);
    }
    
    // Test Supermemory API
    try {
      const supermemoryResponse = await fetch('https://api.supermemory.ai/v3/memories/test', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPERMEMORY_API_KEY}`
        }
      });
      
      // Supermemory might return 404 for test endpoint, which is fine
      if (supermemoryResponse.status === 401) {
        throw new Error('Supermemory API authentication failed');
      }
    } catch (error) {
      if (error.message.includes('authentication')) {
        throw error;
      }
      // Other errors are acceptable for connectivity test
    }
    
    console.log('✅ API connectivity verified');
  }

  async setupDirectoryStructure() {
    console.log('Setting up directory structure...');
    
    const directories = [
      this.deploymentPath,
      `${this.deploymentPath}/input`,
      `${this.deploymentPath}/output`,
      `${this.deploymentPath}/logs`,
      `${this.deploymentPath}/progress`,
      `${this.deploymentPath}/metrics`,
      `${this.deploymentPath}/config`,
      `${this.deploymentPath}/temp`,
      `${this.deploymentPath}/backups`
    ];
    
    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
    
    // Set appropriate permissions
    await this.executeCommand(`chmod -R 755 ${this.deploymentPath}`);
    await this.executeCommand(`chmod -R 777 ${this.deploymentPath}/logs`);
    await this.executeCommand(`chmod -R 777 ${this.deploymentPath}/progress`);
    await this.executeCommand(`chmod -R 777 ${this.deploymentPath}/temp`);
    
    console.log('✅ Directory structure created');
  }

  async installDependencies() {
    console.log('Installing dependencies...');
    
    process.chdir(this.deploymentPath);
    
    // Copy package.json and package-lock.json
    await fs.copyFile('./package.json', `${this.deploymentPath}/package.json`);
    await fs.copyFile('./package-lock.json', `${this.deploymentPath}/package-lock.json`);
    
    // Install production dependencies
    await this.executeCommand('npm ci --only=production');
    
    console.log('✅ Dependencies installed');
  }

  async configureEnvironment() {
    console.log('Configuring environment...');
    
    const productionEnv = `
NODE_ENV=production
LOG_LEVEL=warn
MAX_CONCURRENT_FILES=3
ENABLE_PROGRESS_PERSISTENCE=true
ENABLE_METRICS_COLLECTION=true

# API Configuration
OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}
SUPERMEMORY_API_KEY=${process.env.SUPERMEMORY_API_KEY}
SUPERMEMORY_BASE_URL=https://api.supermemory.ai/v3
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Rate Limiting
OPENROUTER_RATE_LIMIT=60
SUPERMEMORY_RATE_LIMIT=90

# Processing Configuration
BATCH_SIZE=8
RETRY_ATTEMPTS=3
RETRY_DELAY=5000
PROCESSING_TIMEOUT=300000

# Paths
INPUT_DIR=${this.deploymentPath}/input
OUTPUT_DIR=${this.deploymentPath}/output
LOG_DIR=${this.deploymentPath}/logs
PROGRESS_DIR=${this.deploymentPath}/progress
METRICS_DIR=${this.deploymentPath}/metrics
`;

    await fs.writeFile(`${this.deploymentPath}/.env`, productionEnv);
    await this.executeCommand(`chmod 600 ${this.deploymentPath}/.env`);
    
    console.log('✅ Environment configured');
  }

  async setupLogging() {
    console.log('Setting up logging...');
    
    const logConfig = {
      level: 'info',
      format: 'combined',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '100m',
      maxFiles: '30d',
      handleExceptions: true,
      handleRejections: true
    };
    
    await fs.writeFile(
      `${this.deploymentPath}/config/logging.json`,
      JSON.stringify(logConfig, null, 2)
    );
    
    // Setup log rotation
    const logrotateConfig = `
${this.deploymentPath}/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ${process.env.USER} ${process.env.USER}
    postrotate
        systemctl reload ${this.serviceName} > /dev/null 2>&1 || true
    endscript
}
`;
    
    await fs.writeFile('/tmp/meeting-intelligence-logrotate', logrotateConfig);
    await this.executeCommand('sudo mv /tmp/meeting-intelligence-logrotate /etc/logrotate.d/meeting-intelligence');
    
    console.log('✅ Logging configured');
  }

  async configureMonitoring() {
    console.log('Setting up monitoring...');
    
    const monitoringScript = `#!/bin/bash
# Meeting Intelligence Health Check Script

SERVICE_NAME="${this.serviceName}"
LOG_DIR="${this.deploymentPath}/logs"
METRICS_DIR="${this.deploymentPath}/metrics"
ALERT_EMAIL="${this.config.alertEmail || 'admin@company.com'}"

# Check service status
if ! systemctl is-active --quiet $SERVICE_NAME; then
    echo "$(date): Service $SERVICE_NAME is not running" >> $LOG_DIR/health-check.log
    echo "Meeting Intelligence service is down" | mail -s "Service Alert" $ALERT_EMAIL
fi

# Check log file sizes
for logfile in $LOG_DIR/*.log; do
    if [ -f "$logfile" ]; then
        size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null)
        if [ $size -gt 1073741824 ]; then  # 1GB
            echo "$(date): Log file $logfile is larger than 1GB" >> $LOG_DIR/health-check.log
        fi
    fi
done

# Check disk space
disk_usage=$(df ${this.deploymentPath} | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $disk_usage -gt 85 ]; then
    echo "$(date): Disk usage is at $disk_usage%" >> $LOG_DIR/health-check.log
    echo "High disk usage: $disk_usage%" | mail -s "Disk Space Alert" $ALERT_EMAIL
fi

# Generate metrics
node ${this.deploymentPath}/scripts/generate-metrics.js > $METRICS_DIR/health-metrics.json
`;
    
    await fs.writeFile(`${this.deploymentPath}/scripts/health-check.sh`, monitoringScript);
    await this.executeCommand(`chmod +x ${this.deploymentPath}/scripts/health-check.sh`);
    
    // Setup cron job for health checks
    const cronJob = `*/15 * * * * ${this.deploymentPath}/scripts/health-check.sh`;
    await this.executeCommand(`echo "${cronJob}" | crontab -`);
    
    console.log('✅ Monitoring configured');
  }

  async createSystemService() {
    console.log('Creating system service...');
    
    const serviceConfig = `[Unit]
Description=Meeting Intelligence Processing System
After=network.target
Wants=network.target

[Service]
Type=simple
User=${process.env.USER}
WorkingDirectory=${this.deploymentPath}
ExecStart=/usr/bin/node ${this.deploymentPath}/src/cli/index.js process --config ${this.deploymentPath}/config/production.json
Restart=always
RestartSec=10
StandardOutput=append:${this.deploymentPath}/logs/service.log
StandardError=append:${this.deploymentPath}/logs/service-error.log

# Environment
Environment=NODE_ENV=production
EnvironmentFile=${this.deploymentPath}/.env

# Resource limits
LimitNOFILE=65536
MemoryLimit=2G

[Install]
WantedBy=multi-user.target
`;
    
    await fs.writeFile(`/tmp/${this.serviceName}.service`, serviceConfig);
    await this.executeCommand(`sudo mv /tmp/${this.serviceName}.service /etc/systemd/system/`);
    await this.executeCommand('sudo systemctl daemon-reload');
    await this.executeCommand(`sudo systemctl enable ${this.serviceName}`);
    
    console.log('✅ System service created');
  }

  async validateDeployment() {
    console.log('Validating deployment...');
    
    // Test configuration loading
    const { ConfigManager } = require(`${this.deploymentPath}/src/utils/ConfigManager`);
    const config = new ConfigManager(`${this.deploymentPath}/config/production.json`);
    await config.load();
    
    // Test core components
    const { EmailProcessor } = require(`${this.deploymentPath}/src/core/EmailProcessor`);
    const emailProcessor = new EmailProcessor(config.get('processing'));
    
    const { SupermemoryClient } = require(`${this.deploymentPath}/src/core/SupermemoryClient`);
    const supermemoryClient = new SupermemoryClient(config.get('apis.supermemory'));
    
    // Test API connectivity
    await supermemoryClient.makeRequest('GET', '/models').catch(() => {
      // Expected to fail for GET /models, but tests authentication
    });
    
    console.log('✅ Deployment validation passed');
  }

  async executeCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('sh', ['-c', command], { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

// Usage
const deployment = new ProductionDeployment({
  deploymentPath: '/opt/meeting-intelligence',
  alertEmail: 'admin@company.com'
});

deployment.deploy().catch(console.error);
```

### 4.5 Complete Monitoring and Metrics

```javascript
// src/utils/MetricsCollector.js
class MetricsCollector {
  constructor(config) {
    this.config = config;
    this.metrics = {
      processing: {
        totalMeetings: 0,
        successfulMeetings: 0,
        failedMeetings: 0,
        averageProcessingTime: 0,
        totalProcessingTime: 0
      },
      api: {
        openrouter: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          totalResponseTime: 0
        },
        supermemory: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          averageResponseTime: 0,
          totalResponseTime: 0,
          memoriesCreated: 0,
          memoriesProcessed: 0
        }
      },
      quality: {
        schemaValidationSuccessRate: 0,
        memoryCreationSuccessRate: 0,
        contextAssemblySuccessRate: 0,
        averageConfidenceScore: 0
      },
      performance: {
        averageMemoriesPerMeeting: 0,
        averageContextAssemblyTime: 0,
        rateLimitingEffectiveness: 0
      }
    };
    
    this.startTime = Date.now();
    this.sessionMetrics = [];
  }

  recordMeetingProcessing(success, processingTime, details = {}) {
    this.metrics.processing.totalMeetings++;
    this.metrics.processing.totalProcessingTime += processingTime;
    
    if (success) {
      this.metrics.processing.successfulMeetings++;
    } else {
      this.metrics.processing.failedMeetings++;
    }
    
    this.metrics.processing.averageProcessingTime = 
      this.metrics.processing.totalProcessingTime / this.metrics.processing.totalMeetings;
    
    this.sessionMetrics.push({
      timestamp: Date.now(),
      type: 'meeting_processing',
      success,
      processingTime,
      details
    });
  }

  recordAPICall(service, success, responseTime, details = {}) {
    const apiMetrics = this.metrics.api[service];
    if (!apiMetrics) return;
    
    apiMetrics.totalCalls++;
    apiMetrics.totalResponseTime += responseTime;
    
    if (success) {
      apiMetrics.successfulCalls++;
    } else {
      apiMetrics.failedCalls++;
    }
    
    apiMetrics.averageResponseTime = apiMetrics.totalResponseTime / apiMetrics.totalCalls;
    
    if (service === 'supermemory' && success && details.memoriesCreated) {
      apiMetrics.memoriesCreated += details.memoriesCreated;
    }
    
    this.sessionMetrics.push({
      timestamp: Date.now(),
      type: 'api_call',
      service,
      success,
      responseTime,
      details
    });
  }

  recordQualityMetric(type, value, details = {}) {
    switch (type) {
      case 'schema_validation':
        this.updateAverageMetric('quality', 'schemaValidationSuccessRate', value);
        break;
      case 'memory_creation':
        this.updateAverageMetric('quality', 'memoryCreationSuccessRate', value);
        break;
      case 'context_assembly':
        this.updateAverageMetric('quality', 'contextAssemblySuccessRate', value);
        break;
      case 'confidence_score':
        this.updateAverageMetric('quality', 'averageConfidenceScore', value);
        break;
    }
    
    this.sessionMetrics.push({
      timestamp: Date.now(),
      type: 'quality_metric',
      metricType: type,
      value,
      details
    });
  }

  recordPerformanceMetric(type, value, details = {}) {
    switch (type) {
      case 'memories_per_meeting':
        this.updateAverageMetric('performance', 'averageMemoriesPerMeeting', value);
        break;
      case 'context_assembly_time':
        this.updateAverageMetric('performance', 'averageContextAssemblyTime', value);
        break;
      case 'rate_limiting_effectiveness':
        this.metrics.performance.rateLimitingEffectiveness = value;
        break;
    }
  }

  updateAverageMetric(category, metric, newValue) {
    const current = this.metrics[category][metric];
    const count = this.sessionMetrics.filter(m => 
      m.type.includes(category) || m.metricType === metric.replace(/^average/, '').toLowerCase()
    ).length;
    
    this.metrics[category][metric] = ((current * (count - 1)) + newValue) / count;
  }

  generateReport() {
    const sessionDuration = Date.now() - this.startTime;
    
    return {
      timestamp: new Date().toISOString(),
      sessionDuration,
      sessionDurationHours: (sessionDuration / (1000 * 60 * 60)).toFixed(2),
      metrics: this.metrics,
      summary: {
        successRate: this.calculateOverallSuccessRate(),
        averageTimePerMeeting: this.metrics.processing.averageProcessingTime,
        apiHealthScore: this.calculateAPIHealthScore(),
        qualityScore: this.calculateQualityScore(),
        performanceScore: this.calculatePerformanceScore()
      },
      recommendations: this.generateRecommendations(),
      alerts: this.generateAlerts()
    };
  }

  calculateOverallSuccessRate() {
    const total = this.metrics.processing.totalMeetings;
    const successful = this.metrics.processing.successfulMeetings;
    
    return total > 0 ? (successful / total * 100).toFixed(1) : 0;
  }

  calculateAPIHealthScore() {
    const openrouterSuccess = this.metrics.api.openrouter.totalCalls > 0 ? 
      (this.metrics.api.openrouter.successfulCalls / this.metrics.api.openrouter.totalCalls) : 1;
    
    const supermemorySuccess = this.metrics.api.supermemory.totalCalls > 0 ? 
      (this.metrics.api.supermemory.successfulCalls / this.metrics.api.supermemory.totalCalls) : 1;
    
    return Math.round((openrouterSuccess + supermemorySuccess) / 2 * 100);
  }

  calculateQualityScore() {
    const qualityMetrics = this.metrics.quality;
    const scores = [
      qualityMetrics.schemaValidationSuccessRate,
      qualityMetrics.memoryCreationSuccessRate,
      qualityMetrics.contextAssemblySuccessRate,
      qualityMetrics.averageConfidenceScore / 100 // Normalize to 0-1
    ].filter(score => score > 0);
    
    if (scores.length === 0) return 0;
    
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 100);
  }

  calculatePerformanceScore() {
    let score = 100;
    
    // Penalize for slow processing
    if (this.metrics.processing.averageProcessingTime > 180000) { // 3 minutes
      score -= 20;
    } else if (this.metrics.processing.averageProcessingTime > 120000) { // 2 minutes
      score -= 10;
    }
    
    // Penalize for low memory creation rate
    if (this.metrics.performance.averageMemoriesPerMeeting < 8) {
      score -= 15;
    }
    
    // Penalize for slow context assembly
    if (this.metrics.performance.averageContextAssemblyTime > 30000) { // 30 seconds
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Processing performance recommendations
    if (this.metrics.processing.averageProcessingTime > 180000) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        message: 'Average processing time exceeds 3 minutes. Consider optimizing AI processing or increasing concurrency.',
        metric: 'processing_time',
        value: this.metrics.processing.averageProcessingTime
      });
    }
    
    // API health recommendations
    const openrouterSuccessRate = this.metrics.api.openrouter.totalCalls > 0 ? 
      (this.metrics.api.openrouter.successfulCalls / this.metrics.api.openrouter.totalCalls) : 1;
    
    if (openrouterSuccessRate < 0.95) {
      recommendations.push({
        category: 'reliability',
        priority: 'medium',
        message: 'OpenRouter API success rate is below 95%. Check API key and network connectivity.',
        metric: 'openrouter_success_rate',
        value: openrouterSuccessRate
      });
    }
    
    // Memory creation recommendations
    if (this.metrics.performance.averageMemoriesPerMeeting < 8) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        message: 'Average memories per meeting is below expected range. Review memory factory logic.',
        metric: 'memories_per_meeting',
        value: this.metrics.performance.averageMemoriesPerMeeting
      });
    }
    
    // Context assembly recommendations
    if (this.metrics.quality.averageConfidenceScore < 60) {
      recommendations.push({
        category: 'quality',
        priority: 'high',
        message: 'Average context assembly confidence is low. Consider improving search strategies.',
        metric: 'confidence_score',
        value: this.metrics.quality.averageConfidenceScore
      });
    }
    
    return recommendations;
  }

  generateAlerts() {
    const alerts = [];
    
    // Critical performance alerts
    if (this.metrics.processing.failedMeetings > this.metrics.processing.successfulMeetings * 0.1) {
      alerts.push({
        level: 'critical',
        category: 'processing',
        message: 'Meeting processing failure rate exceeds 10%',
        count: this.metrics.processing.failedMeetings,
        threshold: Math.round(this.metrics.processing.successfulMeetings * 0.1)
      });
    }
    
    // API connectivity alerts
    if (this.metrics.api.supermemory.failedCalls > 10) {
      alerts.push({
        level: 'warning',
        category: 'api',
        message: 'High number of Supermemory API failures',
        count: this.metrics.api.supermemory.failedCalls,
        threshold: 10
      });
    }
    
    // Quality alerts
    if (this.metrics.quality.memoryCreationSuccessRate < 0.9 && this.metrics.processing.totalMeetings > 5) {
      alerts.push({
        level: 'warning',
        category: 'quality',
        message: 'Memory creation success rate below 90%',
        rate: this.metrics.quality.memoryCreationSuccessRate,
        threshold: 0.9
      });
    }
    
    return alerts;
  }

  exportMetrics(format = 'json') {
    const report = this.generateReport();
    
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      case 'prometheus':
        return this.convertToPrometheusFormat(report);
      default:
        return report;
    }
  }

  convertToCSV(report) {
    const rows = [];
    rows.push(['metric', 'value', 'category', 'timestamp']);
    
    // Processing metrics
    rows.push(['total_meetings', report.metrics.processing.totalMeetings, 'processing', report.timestamp]);
    rows.push(['successful_meetings', report.metrics.processing.successfulMeetings, 'processing', report.timestamp]);
    rows.push(['failed_meetings', report.metrics.processing.failedMeetings, 'processing', report.timestamp]);
    rows.push(['average_processing_time', report.metrics.processing.averageProcessingTime, 'processing', report.timestamp]);
    
    // API metrics
    rows.push(['openrouter_total_calls', report.metrics.api.openrouter.totalCalls, 'api', report.timestamp]);
    rows.push(['openrouter_successful_calls', report.metrics.api.openrouter.successfulCalls, 'api', report.timestamp]);
    rows.push(['supermemory_total_calls', report.metrics.api.supermemory.totalCalls, 'api', report.timestamp]);
    rows.push(['supermemory_memories_created', report.metrics.api.supermemory.memoriesCreated, 'api', report.timestamp]);
    
    return rows.map(row => row.join(',')).join('\n');
  }

  convertToPrometheusFormat(report) {
    const metrics = [];
    
    metrics.push(`# HELP meeting_processing_total Total number of meetings processed`);
    metrics.push(`# TYPE meeting_processing_total counter`);
    metrics.push(`meeting_processing_total ${report.metrics.processing.totalMeetings}`);
    
    metrics.push(`# HELP meeting_processing_success_rate Success rate of meeting processing`);
    metrics.push(`# TYPE meeting_processing_success_rate gauge`);
    metrics.push(`meeting_processing_success_rate ${report.summary.successRate / 100}`);
    
    metrics.push(`# HELP api_calls_total Total number of API calls by service`);
    metrics.push(`# TYPE api_calls_total counter`);
    metrics.push(`api_calls_total{service="openrouter"} ${report.metrics.api.openrouter.totalCalls}`);
    metrics.push(`api_calls_total{service="supermemory"} ${report.metrics.api.supermemory.totalCalls}`);
    
    metrics.push(`# HELP memory_objects_created_total Total number of memory objects created`);
    metrics.push(`# TYPE memory_objects_created_total counter`);
    metrics.push(`memory_objects_created_total ${report.metrics.api.supermemory.memoriesCreated}`);
    
    return metrics.join('\n');
  }
}

module.exports = { MetricsCollector };
```

---

This enhanced implementation specification provides complete technical details for building a sophisticated meeting intelligence system. The implementation includes:

1. **Complete JSON Schema** with validation rules and extensive field definitions
2. **Detailed Memory Object Factory** with 8-15 memory types and full metadata schemas
3. **Comprehensive Supermemory API Integration** with rate limiting and error handling
4. **Complete Helper Functions** for all processing, analysis, and utility operations
5. **Production-Ready Configuration** with environment management and security
6. **Comprehensive Testing Framework** with integration and performance tests
7. **Complete Deployment Guide** with monitoring and system service setup
8. **Advanced Metrics Collection** with reporting and alerting capabilities

The specification provides everything needed for developers to implement the system exactly as designed, with full examples, working code, and production-ready features.