const axios = require('axios');

class SupermemoryClient {
    constructor(config = {}) {
        const supermemoryConfig = config.apis?.supermemory || {};
        this.baseURL = supermemoryConfig.baseURL || process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3';
        this.apiKey = process.env.SUPERMEMORY_API_KEY;
        this.timeout = supermemoryConfig.timeout || 30000;
        this.retryAttempts = supermemoryConfig.retryAttempts || 3;
        this.retryDelay = supermemoryConfig.retryDelay || 1000;
        this.organizationTag = supermemoryConfig.organization_tag || 'organization_main';
        this.logger = config.logger || console;
        
        if (!this.apiKey) {
            console.warn('Supermemory API key is not set. Using mock implementation.');
        }
    }

    async createMemory(memoryObject) {
        console.log("🚀 Creating memory with Supermemory API...");
        console.log("📝 Memory object being sent:", JSON.stringify(memoryObject, null, 2));
        console.log("🌐 API Endpoint:", `${this.baseURL}/memories`);
        console.log("🏷️  Organization Tag:", this.organizationTag);        if (!this.apiKey) {
            console.log("🎭 Using mock memory creation (no API key)");
            return {
                id: `mock-memory-${Date.now()}`,
                customId: `MOCK-${Date.now()}`,
                success: true,
                mock: true
            };
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        console.log("📋 Request headers:", JSON.stringify({...headers, Authorization: 'Bearer [HIDDEN]'}, null, 2));

        try {
            console.log("⏳ Sending POST request to Supermemory API...");
            const response = await axios.post(`${this.baseURL}/memories`, memoryObject, {
                headers: headers,
                timeout: this.timeout
            });

            console.log("✅ Successfully created memory with Supermemory API!");
            console.log("📊 Response status:", response.status);
            console.log("📄 Response data:", JSON.stringify(response.data, null, 2));
            return response.data;

        } catch (error) {
            const errorData = error.response ? error.response.data : null;
            const errorMessage = errorData ? JSON.stringify(error.response.data, null, 2) : error.message;

            if (errorMessage && errorMessage.includes("customId already exists")) {
                this.logger.warn(`Memory with customId '${memoryObject.customId}' already exists. Attempting to find and update.`);
                try {
                    const existingMemoryId = await this._findMemoryByCustomId(memoryObject.customId);
                    if (existingMemoryId) {
                        this.logger.log(`Found existing memory with ID: ${existingMemoryId}. Proceeding with update.`);
                        // Exclude customId from the update payload, as it should not be changed.
                        const updatePayload = { ...memoryObject };
                        delete updatePayload.customId;
                        return await this._updateMemory(existingMemoryId, updatePayload);
                    } else {
                        throw new Error(`Could not find existing memory with customId '${memoryObject.customId}' despite API error.`);
                    }
                } catch (updateError) {
                    this.logger.error(`Failed to update memory with customId '${memoryObject.customId}':`, updateError.message);
                    throw updateError; // Re-throw the update error
                }
            }

            console.error("Error creating memory with Supermemory API:", errorMessage);
            // Retry logic remains for other types of errors (e.g., network issues)
            for (let i = 0; i < this.retryAttempts; i++) {
                console.log(`Retrying... attempt ${i + 1}`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                try {
                    const response = await axios.post(`${this.baseURL}/memories`, memoryObject, {
                        headers: headers,
                        timeout: this.timeout
                    });
                    console.log("Successfully created memory with Supermemory API on retry.");
                    return response.data;
                } catch (retryError) {
                    console.error(`Retry attempt ${i + 1} failed:`, retryError.response ? JSON.stringify(retryError.response.data, null, 2) : retryError.message);
                }
            }
            throw new Error("Failed to create memory with Supermemory API after multiple retries.");
        }    }    async listMemories(filters = {}) {
        console.log("🔍 Listing memories with filters:", JSON.stringify(filters));
        console.log("🌐 API Endpoint:", `${this.baseURL}/memories/list`);
        
        if (!this.apiKey) {
            console.log("🎭 Using mock memory listing (no API key)");
            return {
                success: true,
                memories: [{
                    id: `mock-memory-${Date.now()}`,
                    title: "Mock Memory from EML Processing",
                    content: "This is a mock memory created during testing",
                    mock: true
                }],
                mock: true
            };
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };        // Construct request body from filters (POST request, not GET with query params)
        const requestBody = {};
        
        if (filters.customId) {
            requestBody.customId = filters.customId;
        }
        
        if (filters.containerTags) {
            // The API expects 'tags' as the field name, not 'containerTags'
            requestBody.tags = Array.isArray(filters.containerTags) 
                ? filters.containerTags 
                : [filters.containerTags];
        }
        
        if (filters.limit) {
            requestBody.limit = filters.limit;
        }

        console.log("📋 Request body:", JSON.stringify(requestBody, null, 2));
        console.log("🔗 Full URL:", `${this.baseURL}/memories/list`);

        try {
            console.log("⏳ Sending POST request to list memories...");
            const response = await axios.post(`${this.baseURL}/memories/list`, requestBody, {
                headers: headers,
                timeout: this.timeout
            });            console.log("✅ Successfully listed memories!");
            console.log("📊 Response status:", response.status);
            console.log("📄 Raw response data:", JSON.stringify(response.data, null, 2));
            console.log(`📈 Found ${response.data.memories ? response.data.memories.length : 0} results.`);
            
            return response.data.memories || [];

        } catch (error) {
            const errorData = error.response ? error.response.data : null;
            if (errorData && errorData.error === "Memory not found") {
                this.logger.log("List endpoint returned 'Memory not found', returning empty array.");
                return []; // Return empty array if no memory is found, which is not an error
            }
            this.logger.error(`Error listing memories:`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            throw new Error(`API error while listing memories.`);
        }
    }

    async _findMemoryByCustomId(customId) {
        this.logger.log(`Finding memory by customId using list endpoint: ${customId}`);
        
        const searchRetryAttempts = 6; // Increased from 5
        const searchRetryDelay = 10000; // Increased to 10 seconds

        for (let i = 0; i < searchRetryAttempts; i++) {
            this.logger.log(`List attempt ${i + 1} for customId: ${customId}`);
            const results = await this.listMemories({
                customId: customId,
                containerTags: [this.organizationTag],
                limit: 1
            });

            if (results && results.length > 0) {
                const foundMemory = results[0];
                this.logger.log(`Found memory with ID: ${foundMemory.id}`);
                return foundMemory.id; // Return the memory's main ID
            }

            this.logger.warn(`No memory found on attempt ${i + 1} for customId: ${customId}. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, searchRetryDelay));
        }

        this.logger.error(`Could not find memory with customId '${customId}' after ${searchRetryAttempts} attempts.`);
        return null; // Return null if not found after all retries
    }

    async _updateMemory(documentId, memoryObject) {
        this.logger.log(`Updating memory with internal ID: ${documentId}`);
        if (!this.apiKey) {
            throw new Error("Supermemory API key is not set.");
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            // Assumption: The API supports PATCH for partial updates.
            const response = await axios.patch(`${this.baseURL}/memories/${documentId}`, memoryObject, {
                headers: headers,
                timeout: this.timeout
            });
            this.logger.log(`Successfully updated memory with ID: ${documentId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating memory with ID '${documentId}':`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            throw new Error(`API error while updating memory: ${documentId}`);
        }
    }
}

module.exports = { SupermemoryClient };
