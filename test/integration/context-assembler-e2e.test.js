const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ContextAssembler = require('../../src/core/ContextAssembler');
const { SupermemoryClient } = require('../../src/core/SupermemoryClient');

// This is an end-to-end test and requires a running Supermemory instance
// and valid API credentials in the .env file.
describe('ContextAssembler End-to-End Test', function() {
    this.timeout(30000); // Increase timeout for real network requests
    let contextAssembler;

    before(() => {
        // Ensure required environment variables are set
        assert(process.env.SUPERMEMORY_API_KEY, 'SUPERMEMORY_API_KEY is required in .env');
        assert(process.env.SUPERMEMORY_BASE_URL, 'SUPERMEMORY_BASE_URL is required in .env');

        const supermemoryClient = new SupermemoryClient();
        contextAssembler = new ContextAssembler(supermemoryClient);
    });

    it('should assemble deliverable context using real data', async () => {
        const deliverableRequest = {
            name: 'Strategic Initiative - BRV Day One Readiness and UAT Coordination: Key IT-for-IT Processes',
            type: 'report',
            audience: 'BRV Readiness Workshop Participants',
            topic: 'BRV Readiness Workshop Operating Model Validation, by function, follow-ups required, contacts, current info, Day 1 and Spin Op Models, slide callouts, outreach drafts for BU Embedded (Site Support), Non-Standard Business Apps, Customer & Commercial Apps (CCEX), Enterprise Architecture, Supply Chain (ISC), and key questions. Full deliverables requested.'
        };

        const contextPackage = await contextAssembler.assembleDeliverableContext(deliverableRequest);

        console.log('Assembled Context Package:', JSON.stringify(contextPackage, null, 2));

        assert.ok(contextPackage, 'Should return a context package');
        assert.ok(contextPackage.metadata, 'Package should have metadata');
        assert.ok(contextPackage.confidence, 'Package should have a confidence score');
        // Structure checks
        assert.ok(contextPackage.rawContext, 'Should have a rawContext object');
        assert.ok(contextPackage.summary, 'Should have a summary');
        assert.ok(contextPackage.stakeholderInsights, 'Should have stakeholderInsights');
        assert.ok(contextPackage.formatGuidance, 'Should have formatGuidance');
        assert.ok(contextPackage.requirements, 'Should have requirements');
        assert.ok(contextPackage.successPatterns, 'Should have successPatterns');
        assert.ok(contextPackage.risks, 'Should have risks');
        assert.ok(contextPackage.dependencies, 'Should have dependencies');
        assert.ok(contextPackage.timeline, 'Should have timeline');
        // Validate metadata
        assert.strictEqual(contextPackage.metadata.deliverableRequest.name, deliverableRequest.name);
        assert.ok(contextPackage.metadata.processingTime > 0, 'Processing time should be greater than 0');
    });
});
