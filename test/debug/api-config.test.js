const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = require('../../config/production.json');
const { AIProcessor } = require('../../src/core/AIProcessor');

console.log('--- OpenRouter API Configuration Test ---');

try {
    console.log('Checking for OPENROUTER_API_KEY in environment...');
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (apiKey) {
        console.log('✔️ OPENROUTER_API_KEY found.');
    } else {
        console.error('❌ OPENROUTER_API_KEY is missing from environment variables.');
        process.exit(1);
    }

    assert.ok(apiKey, 'OpenRouter API key should be set in .env');
    
    const aiProcessor = new AIProcessor(config);
    
    console.log('Checking AIProcessor instance configuration...');
    assert.strictEqual(aiProcessor.apiKey, apiKey, 'AIProcessor apiKey should match the one from process.env');
    console.log('✔️ AIProcessor apiKey is correctly configured.');
    
    console.log('Checking OpenRouter config within AIProcessor...');
    assert.deepStrictEqual(aiProcessor.openRouterConfig, config.apis.openrouter, 'AIProcessor openRouterConfig should match production config');
    console.log('✔️ AIProcessor openRouterConfig is correctly loaded.');

    console.log('\n✅ OpenRouter API Configuration Test Passed!\n');

} catch (error) {
    console.error('\n❌ OpenRouter API Configuration Test Failed:');
    console.error(error);
    process.exit(1);
}
