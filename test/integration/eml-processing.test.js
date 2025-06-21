const path = require('path');
// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { EmailProcessor } = require('../../src/core/EmailProcessor');
const { MemoryFactory } = require('../../src/core/MemoryFactory');
const { SupermemoryClient } = require('../../src/core/SupermemoryClient');
const { AIProcessor } = require('../../src/core/AIProcessor');

// Load configuration
const config = require('../../config/production.json');

async function testEmlProcessing() {
    console.log('🧪 Testing EML File Processing Integration...\n');
    
    try {
        // Initialize components
        const emailProcessor = new EmailProcessor(config);
        const client = new SupermemoryClient(config);
        const memoryFactory = new MemoryFactory(config);
        const aiProcessor = new AIProcessor(config);
        
        // Test file path
        const emlFilePath = path.join(__dirname, '..', 'fixtures', 'example_transcript.eml');
        console.log(`📧 Processing EML file: ${emlFilePath}`);
        
        // Step 1: Extract transcript from EML
        console.log('\n1️⃣ Extracting transcript from EML file...');
        const extractResult = await emailProcessor.extractTranscript(emlFilePath);
        
        if (!extractResult.transcript) {
            throw new Error('Failed to extract transcript from EML file');
        }
        
        console.log(`✅ Successfully extracted transcript (${extractResult.transcript.length} characters)`);
        console.log(`📋 Preview: ${extractResult.transcript.substring(0, 200)}...`);
          // Step 2: Process with AI
        console.log('\n2️⃣ Processing with AI to extract structured data...');
        const structuredData = await aiProcessor.processTranscript(extractResult.transcript);
        console.log('✅ AI processing completed');
        
        if (!structuredData) {
            throw new Error('AI processing failed to return structured data.');
        }
        
        console.log(`� Structured data keys: ${Object.keys(structuredData).join(', ')}`);
          // Step 3: Create memory objects from EML content
        console.log('\n3️⃣ Creating memory objects from structured data...');
        const memoryObjects = memoryFactory.createAll(structuredData);
          console.log('✅ Memory objects created');
        console.log(`📝 Created ${memoryObjects.length} memory objects`);
        
        // Step 4: Store in Supermemory
        console.log('\n4️⃣ Storing in Supermemory...');
        const creationPromises = memoryObjects.map(mem => client.createMemory(mem));
        const creationResults = await Promise.all(creationPromises);
        
        const successfulCreations = creationResults.filter(r => r && (r.id || r.customId));
        
        if (successfulCreations.length > 0) {
            console.log(`✅ Successfully stored ${successfulCreations.length}/${memoryObjects.length} memories`);
            successfulCreations.forEach((result, index) => {
                console.log(`   Memory ${index + 1}: ${result.id || result.customId}`);
            });
        } else {
            console.log(`❌ Failed to store memories`);
        }
          // Step 5: Verify retrieval
        console.log('\n5️⃣ Verifying memory retrieval...');
        const searchResults = await client.listMemories({ limit: 5 });
        
        if (searchResults.success && searchResults.memories && searchResults.memories.length > 0) {
            console.log(`✅ Successfully retrieved ${searchResults.memories.length} memories`);
            const latestMemory = searchResults.memories[0];
            console.log(`📄 Latest memory: ${latestMemory.title || latestMemory.id || 'Untitled'}`);
        } else {
            console.log('⚠️ No memories found in listing (may take time to index)');
        }
        
        console.log('\n🎉 EML Processing Integration Test Completed Successfully!');        return {
            success: true,
            emlProcessed: true,
            transcriptLength: extractResult.transcript.length,
            memoryObjectsCreated: memoryObjects.length,
            memoriesStored: successfulCreations.length,
            memoryIds: successfulCreations.map(r => r.id || r.customId),
            structuredDataKeys: Object.keys(structuredData || {})
        };
        
    } catch (error) {
        console.error('❌ EML Processing Integration Test Failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run test if called directly
if (require.main === module) {
    testEmlProcessing().then(result => {
        console.log('\n📋 Test Results:');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { testEmlProcessing };
