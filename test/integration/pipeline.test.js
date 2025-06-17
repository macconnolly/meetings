const assert = require('assert');
const { runPipeline } = require('../../pipe');

describe('Integration Test - Full Standalone Pipeline with Real APIs', () => {

    it('should run the entire pipeline successfully, creating multiple memory objects', async () => {
        // This test executes the full pipeline with real API calls.
        // It requires OPENROUTER_API_KEY and SUPERMEMORY_API_KEY to be in .env

        const result = await runPipeline();

        // Assertions
        assert.strictEqual(result.success, true, 'Pipeline should report success.');
        assert.ok(result.memoryIds, 'An array of memory IDs should be returned.');
        assert.ok(Array.isArray(result.memoryIds), 'memoryIds should be an array.');
        assert.ok(result.memoryIds.length > 1, 'Should create more than one memory object.');

        // Check that IDs look like real Supermemory IDs or our idempotency placeholder
        result.memoryIds.forEach(id => {
            assert.strictEqual(typeof id, 'string', 'Each memory ID should be a string.');
            // The ID can be a new ID, an existing ID that was updated, or a customId for updated objects
            const isValidId = !id.startsWith('mem_');
            assert.ok(isValidId, `ID '${id}' should be a real ID or a customId for updated objects.`);
        });

        // Check metrics
        assert.ok(result.metrics, 'Metrics should be returned.');
        assert.ok(result.metrics.totalDuration_ms > 0, 'Total duration should be greater than 0.');
        
        const metricNames = result.metrics.metrics.map(m => m.name);
        assert.deepStrictEqual(metricNames, [
            'TranscriptRead',
            'AIProcessing',
            'MemoryObjectsCreated',
            'SupermemoryUpload',
            'EmailNotificationSent'
        ], 'All pipeline stages should be recorded in metrics.');

        const memoryCreatedMetric = result.metrics.metrics.find(m => m.name === 'MemoryObjectsCreated');
        assert.ok(memoryCreatedMetric.details.count > 1, 'MemoryObjectsCreated metric should show a count greater than 1.');

    }).timeout(30000); // 30 second timeout for the pipeline to run with real API calls
});
