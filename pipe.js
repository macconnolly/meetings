require('dotenv').config();
const path = require('path');
const { AIProcessor } = require('./src/core/AIProcessor');
const { MemoryFactory } = require('./src/core/MemoryFactory');
const { SupermemoryClient } = require('./src/core/SupermemoryClient');
const { EmailProcessor } = require('./src/core/EmailProcessor');
const { MetricsCollector } = require('./src/utils/MetricsCollector');
const config = require('./config/production.json');

async function runPipeline() {
    const metricsCollector = new MetricsCollector();
    metricsCollector.startTimer();

    try {
        console.log('Starting meeting intelligence pipeline...');

        const transcriptPath = path.resolve(__dirname, 'test/fixtures/sample-transcript.txt');
        const emailProcessor = new EmailProcessor(config.email_processor);
        const { transcript, error: transcriptError } = await emailProcessor.extractTranscript(transcriptPath);
        if (transcriptError) {
            throw new Error(transcriptError);
        }
        metricsCollector.recordMetric('TranscriptRead', { success: true, path: transcriptPath });

        const aiProcessor = new AIProcessor(config);
        const structuredData = await aiProcessor.processTranscript(transcript);
        if (!structuredData) {
             throw new Error('AI processing failed to return structured data.');
        }
        metricsCollector.recordMetric('AIProcessing', { success: true, model: config.apis.openrouter.model });

        const memoryFactory = new MemoryFactory(config);
        const memoryObjects = memoryFactory.createAll(structuredData);
        metricsCollector.recordMetric('MemoryObjectsCreated', { success: true, count: memoryObjects.length });

        const supermemoryClient = new SupermemoryClient(config);
        const creationPromises = memoryObjects.map(mem => supermemoryClient.createMemory(mem));
        const creationResults = await Promise.all(creationPromises);

        const successfulCreations = creationResults.filter(r => r && (r.id || r.customId)); // Handle both new and updated objects
        if (successfulCreations.length !== memoryObjects.length) {
            const failedCount = memoryObjects.length - successfulCreations.length;
            const sampleFailure = JSON.stringify(creationResults.find(r => !r || (!r.id && !r.customId)), null, 2);
            throw new Error(`Failed to save or update all memories. Success: ${successfulCreations.length}/${memoryObjects.length}. Sample failure: ${sampleFailure}`);
        }
        metricsCollector.recordMetric('SupermemoryUpload', { success: true, memoryIds: successfulCreations.map(r => r.id || r.customId) });

        const emailDetails = {
            to: 'team@example.com',
            subject: structuredData.meeting_title || 'Meeting Summary & Next Steps',
            body: structuredData.client_ready_email,
        };
        const emailResponse = await emailProcessor.sendEmail(emailDetails);
        metricsCollector.recordMetric('EmailNotificationSent', { success: emailResponse.success });

        metricsCollector.stopTimer();
        const allMetrics = metricsCollector.getMetrics();
        console.log('Pipeline completed successfully.');
        console.log('Metrics:', JSON.stringify(allMetrics, null, 2));
        console.log('Memory IDs:', successfulCreations.map(r => r.id));

        return {
            success: true,
            memoryIds: successfulCreations.map(r => r.id || r.customId),
            metrics: allMetrics
        };

    } catch (error) {
        metricsCollector.stopTimer();
        metricsCollector.recordMetric('PipelineError', { success: false, error: error.message });
        const allMetrics = metricsCollector.getMetrics();
        console.error('Pipeline failed:', error);
        console.log('Metrics:', JSON.stringify(allMetrics, null, 2));

        return {
            success: false,
            error: error.message,
            metrics: allMetrics
        };
    }
}

// If this script is executed directly, run the pipeline.
// If it's imported, export the function for testing.
if (require.main === module) {
    runPipeline();
} else {
    module.exports = { runPipeline };
}