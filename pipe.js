const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
const { AIProcessor } = require('./src/core/AIProcessor');
const { MemoryFactory } = require('./src/core/MemoryFactory');
const { SupermemoryClient } = require('./src/core/SupermemoryClient');
const { EmailProcessor } = require('./src/core/EmailProcessor');
const { MetricsCollector } = require('./src/utils/MetricsCollector');
const { MemoryTemplates } = require('./src/core/templates/memoryTemplates');
const RateLimitManager = require('./src/utils/RateLimitManager');
const { validateAndSanitize } = require('./src/utils/helpers');
const config = require('./config/production.json');

async function runPipeline(transcriptPath = null) {
    const metricsCollector = new MetricsCollector();
    metricsCollector.startTimer();

    try {
        console.log('Starting meeting intelligence pipeline...');

        // Allow override from parameter or command line argument
        const inputPath = transcriptPath || 
                         process.argv[2] || 
                         path.resolve(__dirname, './test/fixtures/sample-transcript.txt');
        
        console.log(`📄 Processing file: ${inputPath}`);
        
        // Determine file type
        const fileExtension = path.extname(inputPath).toLowerCase();
        const isEmlFile = fileExtension === '.eml';
        
        if (isEmlFile) {
            console.log('📧 Detected EML file format');
        } else {
            console.log('📄 Detected text file format');
        }

        const emailProcessor = new EmailProcessor(config.email_processor);
        const { transcript, error: transcriptError } = await emailProcessor.extractTranscript(inputPath);
        if (transcriptError) {
            throw new Error(transcriptError);
        }
        metricsCollector.recordMetric('TranscriptRead', { 
            success: true, 
            path: inputPath, 
            format: isEmlFile ? 'eml' : 'text',
            length: transcript.length 
        });

        const aiProcessor = new AIProcessor(config);
        const structuredData = await aiProcessor.processTranscript(transcript);
        if (!structuredData) {
             throw new Error('AI processing failed to return structured data.');
        }
        const { validatedData, errors } = validateAndSanitize(structuredData, 'comprehensive_meeting_intelligence');
        if (errors.length > 0) {
            console.warn('Validation warnings:', errors);
            metricsCollector.recordMetric('ValidationWarning', { success: true, count: errors.length, errors });
        }
        metricsCollector.recordMetric('AIProcessing', { success: true, model: config.apis.openrouter.model });

        const memoryFactory = new MemoryFactory(config);
        const memoryObjects = memoryFactory.createMemoryObjects(validatedData);
        metricsCollector.recordMetric('MemoryObjectsCreated', { success: true, count: memoryObjects.length });

        const supermemoryClient = new SupermemoryClient(config);
        const rateLimiter = new RateLimitManager(config.rate_limiting || { burstRate: 10, refillRate: 5 });

        const creationPromises = memoryObjects.map(async (mem) => {
            await rateLimiter.acquireToken();
            return supermemoryClient.createMemory(mem);
        });

        const creationResults = await Promise.all(creationPromises);

        const successfulCreations = creationResults.filter(r => r && (r.id || r.customId)); // Handle both new and updated objects
        if (successfulCreations.length !== memoryObjects.length) {
            const failedCount = memoryObjects.length - successfulCreations.length;
            const sampleFailure = JSON.stringify(creationResults.find(r => !r || (!r.id && !r.customId)), null, 2);
            throw new Error(`Failed to save or update all memories. Success: ${successfulCreations.length}/${memoryObjects.length}. Sample failure: ${sampleFailure}`);
        }
        metricsCollector.recordMetric('SupermemoryUpload', { success: true, memoryIds: successfulCreations.map(r => r.id || r.customId) });

        const emailDetails = {
            to: config.email_processor.default_recipient || 'team@example.com',
            subject: `Meeting Summary: ${validatedData.meeting_title}`,
            body: MemoryTemplates.generateEmailSummary(validatedData),
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
    const inputFile = process.argv[2];
    if (inputFile) {
        console.log(`🚀 Running pipeline with custom file: ${inputFile}`);
    } else {
        console.log('🚀 Running pipeline with default sample transcript');
    }
    runPipeline(inputFile);
} else {
    module.exports = { runPipeline };
}