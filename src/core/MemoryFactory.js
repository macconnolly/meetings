const { slugify } = require('../utils/helpers');

class MemoryFactory {
    constructor(config = {}) {
        this.userId = config.userId || 'organization_main';
        this.logger = config.logger || console;
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

        memories.push(this._createMeetingSummary(structuredData));

        if (structuredData.decisions_with_context) {
            structuredData.decisions_with_context.forEach(decision => {
                memories.push(this._createDecisionMemory(structuredData, decision));
            });
        }

        if (structuredData.action_items) {
            structuredData.action_items.forEach(item => {
                memories.push(this._createActionItemMemory(structuredData, item));
            });
        }

        if (structuredData.stakeholder_intelligence) {
            structuredData.stakeholder_intelligence.forEach(stakeholder => {
                memories.push(this._createStakeholderMemory(structuredData, stakeholder));
            });
        }

        // Add other memory creation calls here based on the spec

        return memories;
    }

    _createMeetingSummary(data) {
        let content = `# Meeting Summary: ${data.meeting_title}\n\n`;
        content += `**Date:** ${data.meeting_date}\n`;
        content += `**Participants:** ${data.participants}\n\n`;
        content += `## Executive Summary\n${data.executive_summary}\n\n`;

        return {
            content,
            userId: this.userId,
            customId: data.meeting_id,
            containerTags: this._buildTags(data, ['meeting_summary']),
            metadata: {
                content_type: 'meeting_summary',
                meeting_id: data.meeting_id,
                meeting_title: data.meeting_title,
                ...data.metadata
            },
        };
    }

    _createDecisionMemory(meetingData, decision) {
        const content = `**Decision:** ${decision.decision}\n**Rationale:** ${decision.rationale}`;
        
        const decisionMetadata = { ...decision };
        if (Array.isArray(decisionMetadata.stakeholders_involved)) {
            decisionMetadata.stakeholders_involved = decisionMetadata.stakeholders_involved.join(', ');
        }

        return {
            content,
            userId: this.userId,
            customId: decision.decision_id,
            containerTags: this._buildTags(meetingData, ['decision', `decision-status-${decision.decision_status}`]),
            metadata: {
                content_type: 'decision',
                meeting_id: meetingData.meeting_id,
                ...decisionMetadata
            }
        };
    }

    _createActionItemMemory(meetingData, item) {
        const content = `**Action Item:** ${item.description}\n**Owner:** ${item.owner}\n**Due Date:** ${item.due_date}`;
        return {
            content,
            userId: this.userId,
            customId: item.action_id,
            containerTags: this._buildTags(meetingData, ['action_item', `priority-${item.priority}`, `status-${item.status}`]),
            metadata: {
                content_type: 'action_item',
                meeting_id: meetingData.meeting_id,
                ...item
            }
        };
    }

    _createStakeholderMemory(meetingData, stakeholder) {
        const content = `**Stakeholder:** ${stakeholder.stakeholder}\n**Role:** ${stakeholder.role_in_meeting}\n**Key Concerns:**\n${(stakeholder.concerns_expressed || []).join('\n- ')}`;
        
        const stakeholderMetadata = { ...stakeholder };
        if (Array.isArray(stakeholderMetadata.concerns_expressed)) {
            stakeholderMetadata.concerns_expressed = stakeholderMetadata.concerns_expressed.join(', ');
        }

        return {
            content,
            userId: this.userId,
            customId: `${meetingData.meeting_id}-stakeholder-${slugify(stakeholder.stakeholder)}`,
            containerTags: this._buildTags(meetingData, ['stakeholder', `engagement-${stakeholder.engagement_level}`]),
            metadata: {
                content_type: 'stakeholder_profile',
                meeting_id: meetingData.meeting_id,
                ...stakeholderMetadata
            }
        };
    }

    _buildTags(data, additionalTags = []) {
        const tags = ['meetings', ...additionalTags];
        if (data.metadata?.projects) {
            data.metadata.projects.forEach(p => tags.push(slugify(p)));
        }
        if (data.metadata?.topics) {
            data.metadata.topics.forEach(t => tags.push(slugify(t)));
        }
        return [...new Set(tags)];
    }
}

module.exports = { MemoryFactory };
