class RateLimitManager {
    constructor(config) {
        this.tokens = config.burstRate;
        this.burstRate = config.burstRate;
        this.refillRate = config.refillRate; // tokens per second
        this.lastRefill = Date.now();
        setInterval(() => this.refillTokens(), 1000);
    }

    refillTokens() {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000; // seconds
        this.lastRefill = now;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.burstRate, this.tokens + tokensToAdd);
    }

    async acquireToken() {
        if (this.tokens >= 1) {
            this.tokens -= 1;
            return true;
        }
        // Not enough tokens, wait for refill
        await new Promise(resolve => setTimeout(resolve, 1000 / this.refillRate));
        return this.acquireToken(); // Retry after waiting
    }
}

module.exports = RateLimitManager;
