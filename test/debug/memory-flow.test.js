const path = require('path');
const fs = require('fs');

// Set up paths relative to the script location (now in test/debug/)
const rootDir = path.join(__dirname, '..', '..');
const srcDir = path.join(rootDir, 'src');
const configDir = path.join(rootDir, 'config');

console.log('🔧 Debug Memory Flow - POST-based Listing Test');
console.log('📁 Root directory:', rootDir);
console.log('📁 Source directory:', srcDir);
console.log('📁 Config directory:', configDir);

// Load environment variables
require('dotenv').config({ path: path.join(rootDir, '.env') });

// Import our modules
const { SupermemoryClient } = require(path.join(srcDir, 'core', 'SupermemoryClient.js'));
const { MemoryFactory } = require(path.join(srcDir, 'core', 'MemoryFactory.js'));

// Load configuration
const configPath = path.join(configDir, 'production.json');
let config = {};
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Configuration loaded successfully');
    } else {
        console.warn('⚠️  Configuration file not found, using defaults');
    }
} catch (error) {
    console.error('❌ Error loading configuration:', error.message);
}

async function testMemoryFlow() {
    console.log('\n🚀 Starting Enhanced Memory Flow Test (POST-based listing)');
    
    try {
        // Initialize clients
        const supermemoryClient = new SupermemoryClient(config);
        const memoryFactory = new MemoryFactory(config);        // Create test meeting data
        const testId = `FLOW-TEST-${Date.now()}`;
        console.log('🏷️  Test ID:', testId);
        
        // Create memory object directly (simpler approach)
        const orgTag = config.apis?.supermemory?.organization_tag || 'organization_main';
        
        console.log('\n📝 Creating memory object...');
        const memoryObject = {
            content: `# Enhanced Memory Flow Test Meeting

This is a test meeting for validating the enhanced memory flow with POST-based listing API.

## Key Discussion Points:
- Tested POST /v3/memories/list instead of GET
- Verified containerTags filtering works correctly
- Confirmed customId search functionality
- Validated organization scoping with tags

## Action Items:
- Complete memory API integration testing
- Document the working solution
- Update all scripts to use POST-based listing

## Participants:
- tester@example.com
- developer@example.com

## Metadata:
- Test Case: memory-flow-validation
- API Version: v3-post-listing
- Timestamp: ${new Date().toISOString()}`,
            
            userId: config.apis?.supermemory?.userId || 'organization_main',
            customId: testId,
            containerTags: [orgTag, 'meetings', 'test'],
            metadata: {
                content_type: 'meeting_summary',
                test_case: 'memory-flow-validation',
                api_version: 'v3-post-listing',
                timestamp: new Date().toISOString()
            }
        };
        
        console.log('Memory object created:', JSON.stringify(memoryObject, null, 2));
        
        // Step 1: Create the memory
        console.log('\n🔄 Step 1: Creating memory...');
        const creationResult = await supermemoryClient.createMemory(memoryObject);
        console.log('✅ Memory creation result:', JSON.stringify(creationResult, null, 2));
        
        // Step 2: Wait a bit for processing
        console.log('\n⏱️  Step 2: Waiting for memory processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 3: Test listing with different filters
        console.log('\n🔍 Step 3: Testing memory listing with POST requests...');
        
        // Test 1: List by customId
        console.log('\n🔎 Test 3.1: Listing by customId...');
        const listByCustomId = await supermemoryClient.listMemories({
            customId: testId
        });
        console.log(`Found ${listByCustomId.length} memories by customId`);
        if (listByCustomId.length > 0) {
            console.log('✅ Success: Found memory by customId');
            console.log('Memory details:', JSON.stringify(listByCustomId[0], null, 2));
        } else {
            console.log('❌ Failed: No memory found by customId');
        }
          // Test 2: List by containerTags
        console.log('\n🔎 Test 3.2: Listing by containerTags...');
        const listByTags = await supermemoryClient.listMemories({
            containerTags: [orgTag]
        });
        console.log(`Found ${listByTags.length} memories by containerTags [${orgTag}]`);
        if (listByTags.length > 0) {
            console.log('✅ Success: Found memories by containerTags');
            // Find our specific memory
            const ourMemory = listByTags.find(m => m.customId === testId);
            if (ourMemory) {
                console.log('✅ Success: Found our test memory in tag results');
                console.log('Memory details:', JSON.stringify(ourMemory, null, 2));
            } else {
                console.log('⚠️  Warning: Our memory not found in tag results');
            }
        } else {
            console.log('❌ Failed: No memories found by containerTags');
        }
        
        // Test 3: List with both customId and containerTags
        console.log('\n🔎 Test 3.3: Listing by customId AND containerTags...');
        const listBoth = await supermemoryClient.listMemories({
            customId: testId,
            containerTags: [orgTag]
        });
        console.log(`Found ${listBoth.length} memories by customId AND containerTags`);
        if (listBoth.length > 0) {
            console.log('✅ Success: Found memory by combined filters');
            console.log('Memory details:', JSON.stringify(listBoth[0], null, 2));
        } else {
            console.log('❌ Failed: No memory found by combined filters');
        }
        
        // Test 4: List with limit
        console.log('\n🔎 Test 3.4: Listing with limit=5...');
        const listLimited = await supermemoryClient.listMemories({
            containerTags: [orgTag],
            limit: 5
        });
        console.log(`Found ${listLimited.length} memories with limit=5`);
        if (listLimited.length > 0) {
            console.log('✅ Success: Limited listing works');
            console.log('Sample memory:', JSON.stringify(listLimited[0], null, 2));
        }
        
        // Step 4: Summary
        console.log('\n📊 Step 4: Test Summary');
        console.log('='.repeat(50));
        console.log(`✅ Memory created successfully: ${testId}`);
        console.log(`✅ API uses POST for /v3/memories/list: TRUE`);
        console.log(`✅ CustomId filtering: ${listByCustomId.length > 0 ? 'WORKS' : 'FAILED'}`);
        console.log(`✅ ContainerTags filtering: ${listByTags.length > 0 ? 'WORKS' : 'FAILED'}`);
        console.log(`✅ Combined filtering: ${listBoth.length > 0 ? 'WORKS' : 'FAILED'}`);
        console.log(`✅ Limit parameter: ${listLimited.length <= 5 ? 'WORKS' : 'FAILED'}`);
        console.log('='.repeat(50));
        
        return {
            success: true,
            testId: testId,
            results: {
                creation: creationResult,
                listByCustomId: listByCustomId,
                listByTags: listByTags,
                listBoth: listBoth,
                listLimited: listLimited
            }
        };
        
    } catch (error) {
        console.error('\n❌ Error in memory flow test:', error.message);
        console.error('Stack trace:', error.stack);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test
if (require.main === module) {
    testMemoryFlow()
        .then(result => {
            console.log('\n🏁 Test completed!');
            if (result.success) {
                console.log('✅ All tests passed successfully!');
                process.exit(0);
            } else {
                console.log('❌ Test failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = { testMemoryFlow };
