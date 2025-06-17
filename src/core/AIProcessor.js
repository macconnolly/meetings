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
    }

    async processTranscript(transcript) {
        console.log("Processing transcript with OpenRouter API...");

        if (!this.apiKey) {
            throw new Error("OpenRouter API key is not set in environment variables (OPENROUTER_API_KEY)");
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
                }
            }
            throw new Error("Failed to process transcript with OpenRouter API after multiple retries.");
        }
    }
}

module.exports = { AIProcessor };
