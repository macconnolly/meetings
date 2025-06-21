class RateLimitManager {
    constructor(config) {
        this.config = config;
        this.requestQueue = [];
        this.isProcessing = false;
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        const { request, resolve, reject } = this.requestQueue.shift();

        try {
            const result = await request();
            resolve(result);
        } catch (error) {
            reject(error);
        }

        setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
        }, this.config.request_interval_ms || 1000);
    }

    add(request) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ request, resolve, reject });
            this.processQueue();
        });
    }
}

module.exports = { RateLimitManager };
