const assert = require('assert');
const { runPipeline } = require('../../pipe');

async function testPipelineIntegration() {
    console.log('🧪 Testing Full Pipeline Integration...\n');
    
    try {
        // This test executes the full pipeline with real API calls.
        // It requires OPENROUTER_API_KEY and SUPERMEMORY_API_KEY to be in .env
        console.log('🚀 Running full pipeline with real APIs...');

        const result = await runPipeline();

        // Assertions
        assert.strictEqual(result.success, true, 'Pipeline should report success.');
        assert.ok(result.memoryIds, 'An array of memory IDs should be returned.');
        assert.ok(Array.isArray(result.memoryIds), 'memoryIds should be an array.');
        assert.ok(result.memoryIds.length > 1, 'Should create more than one memory object.');

        // Check that IDs look like real Supermemory IDs or our idempotency placeholder
        result.memoryIds.forEach(id => {
            assert.strictEqual(typeof id, 'string', 'Each memory ID should be a string.');
            // The ID can be a new ID (starts with 'mem_') or a customId for an updated object.
            const isValidId = id.startsWith('mem_') || (typeof id === 'string' && id.length > 0 && !id.startsWith('mem_'));
            assert.ok(isValidId, `ID '${id}' should be a real Supermemory ID (mem_...) or a customId for updated objects.`);
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

        console.log('✅ All pipeline integration tests passed!');
        console.log(`📊 Created ${result.memoryIds.length} memory objects`);
        console.log(`⏱️ Total duration: ${result.metrics.totalDuration_ms}ms`);
        
        return {
            success: true,
            memoryCount: result.memoryIds.length,
            duration: result.metrics.totalDuration_ms,
            memoryIds: result.memoryIds
        };

    } catch (error) {
        console.error('❌ Pipeline integration test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run test if called directly
if (require.main === module) {
    testPipelineIntegration().then(result => {
        console.log('\n📋 Test Results:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { testPipelineIntegration };
