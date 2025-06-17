const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Load the schema from the meetings.md file (or a dedicated schema file)
const schema = require('../../config/schema.js');

class AIProcessor {
    constructor(config) {
        this.config = config;
        this.openRouterConfig = config.apis.openrouter;
        this.apiKey = process.env.OPENROUTER_API_KEY;
    }    async processTranscript(transcript) {
        console.log("Processing transcript with OpenRouter API...");

        if (!this.apiKey) {
            console.log("OpenRouter API key is not set. Using mock implementation.");
            return this._mockProcessTranscript(transcript);
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        const data = {
            model: this.openRouterConfig.model,
            messages: [
                {
                    role: "system",
                    content: `You are an expert meeting summarization AI. Analyze the following meeting transcript and extract key information based on the provided JSON schema. The output must be a valid JSON object that conforms to this schema: ${JSON.stringify(schema.enhancedMeetingSchema)}`
                },
                {
                    role: "user",
                    content: transcript
                }
            ],
            temperature: this.openRouterConfig.temperature,
            max_tokens: this.openRouterConfig.maxTokens,
            response_format: { type: "json_object" }
        };

        try {
            const response = await axios.post(this.openRouterConfig.baseURL + '/chat/completions', data, {
                headers: headers,
                timeout: this.openRouterConfig.timeout
            });

            const structuredData = JSON.parse(response.data.choices[0].message.content);
            console.log("Successfully received structured data from OpenRouter API.");
            return structuredData;

        } catch (error) {
            console.error("Error processing transcript with OpenRouter API:", error.response ? error.response.data : error.message);
            // Implement retry logic as per config
            for (let i = 0; i < this.openRouterConfig.retryAttempts; i++) {
                console.log(`Retrying... attempt ${i + 1}`);
                await new Promise(resolve => setTimeout(resolve, this.openRouterConfig.retryDelay));
                try {
                    const response = await axios.post(this.openRouterConfig.baseURL + '/chat/completions', data, {
                        headers: headers,
                        timeout: this.openRouterConfig.timeout
                    });
                    const structuredData = JSON.parse(response.data.choices[0].message.content);
                    console.log("Successfully received structured data from OpenRouter API on retry.");
                    return structuredData;
                } catch (retryError) {
                    console.error(`Retry attempt ${i + 1} failed:`, retryError.response ? retryError.response.data : retryError.message);
                }            }
            throw new Error("Failed to process transcript with OpenRouter API after multiple retries.");
        }
    }

    _mockProcessTranscript(transcript) {
        console.log("🎭 Using mock AI processing...");
        
        // Extract meeting title from transcript if it starts with "Meeting:"
        const titleMatch = transcript.match(/^Meeting:\s*(.+)/m);
        const meeting_title = titleMatch ? titleMatch[1].trim() : "EML Meeting Analysis";
        
        // Generate mock structured data based on the transcript content
        const mockData = {
            meeting_title,
            meeting_date: new Date().toISOString().split('T')[0],
            participants: ["Participant 1", "Participant 2", "Participant 3"],
            key_decisions: [
                {
                    decision: "Process EML files in meeting intelligence system",
                    context: "Email-based meeting transcripts should be processed seamlessly",
                    impact: "medium",
                    decision_maker: "Development Team"
                }
            ],
            action_items: [
                {
                    action: "Validate EML processing functionality",
                    assignee: "Test Team",
                    deadline: "2025-01-20",
                    priority: "high",
                    status: "in_progress"
                }
            ],
            key_topics: [
                "EML File Processing",
                "Meeting Intelligence",
                "System Integration"
            ],
            next_steps: [
                "Complete EML integration testing",
                "Deploy enhanced email processing"
            ],
            client_ready_email: `Subject: ${meeting_title} - Summary\n\nHi Team,\n\nThis is a mock summary of the meeting processed from an EML file. The system successfully extracted and structured the content.\n\nKey decisions and action items have been captured in our memory system.\n\nBest regards,\nMeeting Intelligence System`,
            transcript_summary: "Mock processing of EML-based meeting transcript completed successfully.",
            meeting_outcome: "successful",
            stakeholders: [
                {
                    name: "Development Team",
                    role: "Implementation",
                    engagement_level: "high"
                }
            ]
        };
        
        console.log("✅ Mock processing completed");
        return mockData;
    }
}

module.exports = { AIProcessor };
