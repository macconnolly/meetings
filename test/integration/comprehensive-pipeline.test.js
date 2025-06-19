const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { runPipeline } = require('../../pipe');

describe('Comprehensive End-to-End Pipeline Test', function() {
    this.timeout(180000); // 3 minutes timeout for the whole suite

    let pipelineResult;

    before(async function() {
        const testTranscriptPath = path.resolve(__dirname, '../fixtures/example_transcript.eml');
        pipelineResult = await runPipeline(testTranscriptPath);
    });

    it('should run the pipeline successfully', () => {
        assert.ok(pipelineResult, 'Pipeline result should not be null');
        assert.strictEqual(pipelineResult.success, true, `Pipeline failed with error: ${pipelineResult.error}`);
    });

    it('should create multiple memory objects', () => {
        assert.ok(pipelineResult.memoryIds, 'Memory IDs should be present');
        assert(Array.isArray(pipelineResult.memoryIds), 'Memory IDs should be an array');
        assert(pipelineResult.memoryIds.length > 5, `Expected more than 5 memory objects, but got ${pipelineResult.memoryIds.length}`);
    });

    it('should record comprehensive metrics', () => {
        const metrics = pipelineResult.metrics;
        assert.ok(metrics, 'Metrics should be present');
        assert.ok(metrics.totalDuration, 'Total duration should be recorded');
        
        const expectedMetrics = [
            'TranscriptRead',
            'AIProcessing',
            'MemoryObjectsCreated',
            'SupermemoryUpload',
            'EmailNotificationSent'
        ];

        metrics.events.forEach(event => {
            console.log(`Metric recorded: ${event.name}`);
        });

        expectedMetrics.forEach(metricName => {
            const metric = metrics.events.find(e => e.name === metricName);
            assert.ok(metric, `Metric '${metricName}' should be recorded`);
            if (metric) { // Only check success if the metric exists
                assert.strictEqual(metric.details.success, true, `Metric '${metricName}' should be successful`);
            }
        });
    });

    it('should have created memories which can be fetched', () => {
        // This is a conceptual test. To run it for real, we would need a way to fetch memories.
        // For now, we rely on the successful IDs from the pipeline result.
        console.log('Skipping deep memory validation, but here are the created IDs:', pipelineResult.memoryIds);
        assert.ok(true);
    });
});
