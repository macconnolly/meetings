const enhancedMeetingSchema = {
  "name": "comprehensive_meeting_intelligence",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
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
                }
              }, 
              "required": ["title", "key_points"]
            } 
          } 
        },
        "required": ["sections"]
      },
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
              "pattern": "^DCN-[A-Z]{2,6}-\\d{8}-\\d{3}$"
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
              "items": { "type": "string" }
            }
          },
          "required": ["decision_id", "decision", "rationale", "stakeholders_involved"]
        }
      },
      "action_items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action_id": {
              "type": "string",
              "pattern": "^ACT-[A-Z]{2,6}-\\d{8}-\\d{3}$"
            },
            "description": { 
              "type": "string",
              "minLength": 15,
              "maxLength": 500
            }, 
            "owner": { 
              "type": "string"
            }, 
            "due_date": { 
              "type": "string",
              "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
            },
            "priority": { 
              "type": "string",
              "enum": ["low", "medium", "high", "critical", "urgent"]
            },
            "status": { 
              "type": "string",
              "enum": ["not_started", "in_progress", "blocked", "completed", "deferred", "cancelled"]
            }
          },
          "required": ["action_id", "description", "owner", "due_date", "priority", "status"]
        }
      },
      "stakeholder_intelligence": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "stakeholder": { 
              "type": "string"
            },
            "role_in_meeting": { 
              "type": "string"
            },
            "concerns_expressed": { 
              "type": "array",
              "items": { "type": "string" }
            }
          },
          "required": ["stakeholder", "role_in_meeting"]
        }
      },
      "intelligence_metadata": {
        "type": "object",
        "properties": {
          "topics": { "type": "array", "items": { "type": "string" } },
          "projects": { "type": "array", "items": { "type": "string" } }
        }
      },
      "client_ready_email": { 
        "type": "string",
        "minLength": 200,
        "maxLength": 2000
      }
    },
    "required": [
      "meeting_title", "meeting_date", "participants", "meeting_id", "meeting_type",
      "executive_summary", "detailed_minutes", "key_decisions", "action_items", 
      "client_ready_email", "stakeholder_intelligence", "decisions_with_context",
      "intelligence_metadata"
    ]
  }
};

module.exports = { enhancedMeetingSchema };
