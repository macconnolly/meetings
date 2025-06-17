const axios = require('axios');

class SupermemoryClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3';
        this.apiKey = config.apiKey || process.env.SUPERMEMORY_API_KEY;
        this.timeout = config.timeout || 30000;
        this.retryAttempts = config.retryAttempts || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.logger = config.logger || console;
        
        if (!this.apiKey) {
            console.warn('Supermemory API key is not set. Using mock implementation.');
        }
    }

    async createMemory(memoryObject) {
        console.log("Creating memory with Supermemory API...");
        console.log("Memory object being sent:", JSON.stringify(memoryObject, null, 2));

        if (!this.apiKey) {
            throw new Error("Supermemory API key is not set in environment variables (SUPERMEMORY_API_KEY)");
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.post(`${this.baseURL}/memories`, memoryObject, {
                headers: headers,
                timeout: this.timeout
            });

            console.log("Successfully created memory with Supermemory API.");
            return response.data;

        } catch (error) {
            const errorData = error.response ? error.response.data : null;
            const errorMessage = errorData ? JSON.stringify(error.response.data, null, 2) : error.message;

            if (errorMessage && errorMessage.includes("customId already exists")) {
                this.logger.warn(`Memory with customId '${memoryObject.customId}' already exists. Attempting to find and update.`);
                try {
                    const existingMemory = await this._findMemoryByCustomId(memoryObject.customId);
                    if (existingMemory && existingMemory.id) {
                        this.logger.log(`Found existing memory with ID: ${existingMemory.id}. Proceeding with update.`);
                        return await this._updateMemory(existingMemory.id, memoryObject);
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
        }
    }

    async _findMemoryByCustomId(customId) {
        this.logger.log(`Searching for memory with customId: ${customId}`);
        if (!this.apiKey) {
            throw new Error("Supermemory API key is not set.");
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            // Assumption: The API supports filtering memories by customId via a query parameter.
            const response = await axios.get(`${this.baseURL}/memories?customId=${customId}`, {
                headers: headers,
                timeout: this.timeout
            });

            // Assuming the API returns an array of memories, even if it's just one.
            if (response.data && response.data.length > 0) {
                this.logger.log(`Found memory with customId: ${customId}`);
                return response.data[0]; // Return the first match
            } else {
                this.logger.warn(`No memory found with customId: ${customId}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`Error finding memory with customId '${customId}':`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            // If the search endpoint itself is not found, we have a problem with the API assumption.
            if (error.response && error.response.status === 404) {
                 this.logger.error(`The search endpoint GET /memories?customId=... returned 404. The API may not support this search method.`);
            }
            throw new Error(`API error while finding memory: ${customId}`);
        }
    }

    async _updateMemory(memoryId, memoryObject) {
        this.logger.log(`Updating memory with internal ID: ${memoryId}`);
        if (!this.apiKey) {
            throw new Error("Supermemory API key is not set.");
        }

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        try {
            const response = await axios.put(`${this.baseURL}/memories/${memoryId}`, memoryObject, {
                headers: headers,
                timeout: this.timeout
            });
            this.logger.log(`Successfully updated memory with ID: ${memoryId}`);
            return response.data;
        } catch (error) {
            this.logger.error(`Error updating memory with ID '${memoryId}':`, error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
            throw new Error(`API error while updating memory: ${memoryId}`);
        }
    }
}

module.exports = { SupermemoryClient };
