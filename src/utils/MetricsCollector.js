class MetricsCollector {
    constructor() {
        this.metrics = [];
        this.startTime = null;
        this.endTime = null;
    }

    startTimer() {
        this.startTime = Date.now();
    }

    stopTimer() {
        this.endTime = Date.now();
    }

    recordMetric(name, details) {
        this.metrics.push({
            timestamp: Date.now(),
            name,
            details,
        });
    }

    getMetrics() {
        const totalDuration = this.endTime && this.startTime ? this.endTime - this.startTime : null;
        return {
            totalDuration_ms: totalDuration,
            metrics: this.metrics,
        };
    }
}

module.exports = { MetricsCollector };
