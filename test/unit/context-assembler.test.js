const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ContextAssembler = require('../../src/core/ContextAssembler');
const { SupermemoryClient } = require('../../src/core/SupermemoryClient');
const config = require('../../config/production.json');

describe('ContextAssembler Unit Tests', function() {
    this.timeout(20000);
    let contextAssembler;
    let mockSupermemoryClient;

    before(() => {
        // Mock the SupermemoryClient to avoid actual API calls
        mockSupermemoryClient = {
            searchMemories: async (query) => {
                console.log(`Mock search called with query:`, JSON.stringify(query, null, 2));
                // Return mock data based on the query's containerTags
                if (query.containerTags.includes('stakeholder-intelligence')) {
                    return { results: [{ id: 'stakeholder1', content: 'Mock stakeholder data', metadata: { stakeholder: 'John Doe' } }] };
                }
                if (query.containerTags.includes('deliverables')) {
                    return { results: [{ id: 'deliverable1', content: 'Mock deliverable spec', metadata: { deliverable_type: 'report' } }] };
                }
                return { results: [] };
            }
        };

        contextAssembler = new ContextAssembler(mockSupermemoryClient);
    });

    describe('buildSearchQueries', () => {
        it('should build all 7 search queries correctly', () => {
            const deliverableRequest = {
                name: 'Q3 Financial Report',
                type: 'report',
                audience: 'Executive Team',
                topic: 'Financial Performance'
            };

            const queries = contextAssembler.buildSearchQueries(deliverableRequest);
            assert.strictEqual(queries.length, 7, 'Should create 7 distinct search queries');

            const names = queries.map(q => q.name);
            const expectedNames = [
                'stakeholder_intelligence',
                'deliverable_specifications',
                'decision_context',
                'implementation_insights',
                'cross_project_context',
                'action_context',
                'risk_context'
            ];

            expectedNames.forEach(name => {
                assert(names.includes(name), `Query for '${name}' should be present`);
            });
        });

        it('should tailor queries to the deliverable request', () => {
            const deliverableRequest = {
                name: 'Project Phoenix Launch Plan',
                type: 'plan',
                audience: 'Marketing Team',
                topic: 'Project Phoenix'
            };

            const queries = contextAssembler.buildSearchQueries(deliverableRequest);

            // Test stakeholder query
            const stakeholderQuery = queries.find(q => q.name === 'stakeholder_intelligence').query;
            assert(stakeholderQuery.q.includes('Marketing Team'), 'Stakeholder query should include the audience');

            // Test deliverable query
            const deliverableQuery = queries.find(q => q.name === 'deliverable_specifications').query;
            assert(deliverableQuery.q.includes('plan'), 'Deliverable query should include the type');
            assert.strictEqual(deliverableQuery.filters.deliverable_type, 'plan', 'Deliverable query filter should be set to the type');

            // Test topic-based queries
            const decisionQuery = queries.find(q => q.name === 'decision_context').query;
            assert(decisionQuery.q.includes('Project Phoenix'), 'Decision query should include the topic');
        });
    });

    describe('executeSearchQueries', () => {
        it('should execute searches in parallel and return organized results', async () => {
            const searchQueries = [
                { name: 'stakeholder_intelligence', query: { q: 'test', containerTags: ['stakeholder-intelligence'] } },
                { name: 'deliverable_specifications', query: { q: 'test', containerTags: ['deliverables'] } },
                { name: 'non_existent_category', query: { q: 'test', containerTags: ['non-existent'] } }
            ];

            const results = await contextAssembler.executeSearchQueries(searchQueries);

            assert.ok(results.stakeholder_intelligence, 'Should have results for stakeholder_intelligence');
            assert.strictEqual(results.stakeholder_intelligence.length, 1, 'Should have one stakeholder result');
            assert.strictEqual(results.stakeholder_intelligence[0].id, 'stakeholder1');

            assert.ok(results.deliverable_specifications, 'Should have results for deliverable_specifications');
            assert.strictEqual(results.deliverable_specifications.length, 1, 'Should have one deliverable result');
            assert.strictEqual(results.deliverable_specifications[0].id, 'deliverable1');

            assert.ok(results.non_existent_category, 'Should have a key for the category even with no results');
            assert.strictEqual(results.non_existent_category.length, 0, 'Should have zero results for a non-matching category');
        });
    });

    describe('calculateContextConfidence', () => {
        it('should calculate a high confidence score when all data is present', () => {
            const searchResults = {
                stakeholder_intelligence: new Array(5).fill({}),
                deliverable_specifications: new Array(5).fill({}),
                decision_context: new Array(5).fill({}),
                implementation_insights: new Array(5).fill({}),
                cross_project_context: new Array(5).fill({}),
                action_context: new Array(5).fill({}),
                risk_context: new Array(5).fill({})
            };

            const confidence = contextAssembler.calculateContextConfidence(searchResults, {});
            assert(confidence.score > 80, `Expected score > 80, but got ${confidence.score}`);
            assert.strictEqual(confidence.level, 'Very High', 'Confidence level should be Very High');
            assert.strictEqual(confidence.missingCritical.length, 0, 'Should be no missing critical context');
        });

        it('should calculate a low confidence score and identify gaps when data is missing', () => {
            const searchResults = {
                decision_context: new Array(1).fill({}),
                risk_context: new Array(2).fill({})
            };

            const confidence = contextAssembler.calculateContextConfidence(searchResults, {});
            assert(confidence.score < 45, `Expected score < 45, but got ${confidence.score}`);
            assert.strictEqual(confidence.level, 'Very Low', 'Confidence level should be Very Low');
            assert(confidence.missingCritical.includes('No stakeholder intelligence available'), 'Should identify missing stakeholder intelligence');
            assert(confidence.missingCritical.includes('No deliverable specifications found'), 'Should identify missing deliverable specifications');
        });
    });

    describe('end-to-end assembleDeliverableContext', () => {
        it('should run the full context assembly process and return an enhanced package', async () => {
            const deliverableRequest = {
                name: 'Q3 Financial Report',
                type: 'report',
                audience: 'Executive Team',
                topic: 'Financial Performance'
            };

            const contextPackage = await contextAssembler.assembleDeliverableContext(deliverableRequest);

            // Check metadata
            assert.ok(contextPackage.metadata, 'Metadata should be present');
            assert(contextPackage.metadata.processingTime >= 0, 'Processing time should be recorded');
            assert.strictEqual(contextPackage.metadata.totalResults, 2, 'Should have a total of 2 results from the mock client');

            // Check confidence
            assert.ok(contextPackage.confidence, 'Confidence score should be present');
            assert(contextPackage.confidence.score > 0, 'Confidence score should be greater than 0');

            // Check enhanced content
            assert.ok(contextPackage.stakeholderInsights, 'Stakeholder insights should be generated');
            assert.strictEqual(contextPackage.stakeholderInsights.count, 1, 'Should have one stakeholder profile');
            assert.strictEqual(contextPackage.stakeholderInsights.profiles[0].stakeholder, 'John Doe');

            assert.ok(contextPackage.requirements, 'Requirements section should be present');
        });
    });
});
