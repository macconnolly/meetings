const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { SupermemoryClient } = require(path.resolve(__dirname, '../../src/core/SupermemoryClient'));
const config = require(path.resolve(__dirname, '../../config/production.json'));

const customId = process.argv[2];

if (!customId) {
    console.error("Error: Please provide a customId as a command-line argument.");
    console.log("Usage: node test/manual/memory-list.test.js <customId>");
    console.log("Example: node manual-test-list.js DELAY-TEST-1750195737520");
    process.exit(1);
}

const listMemories = async () => {
  try {
    const client = new SupermemoryClient(config);
    const orgTag = config.apis?.supermemory?.organization_tag || 'organization_main';
    
    console.log('🔍 Manual Memory Listing Test (POST-based API)');
    console.log('='.repeat(60));
    console.log(`📋 Organization tag: ${orgTag}`);
    console.log(`🏷️  Searching for customId: ${customId}`);
    console.log('');
    
    // First, try to list all memories with our organization tag
    console.log('📝 Step 1: Listing all memories with organization tag...');
    const allResult = await client.listMemories({
        containerTags: [orgTag],
        limit: 50
    });

    console.log(`Found ${allResult.length} total memories with organization tag`);
    if (allResult.length > 0) {
        console.log('Sample memory structures:');
        allResult.slice(0, 3).forEach((memory, index) => {
            console.log(`Memory ${index + 1}:`, {
                id: memory.id,
                customId: memory.customId || 'N/A',
                title: memory.title || 'N/A',
                containerTags: memory.containerTags || []
            });
        });
    }
    console.log('');

    // Now search specifically for the provided customId
    console.log('📝 Step 2: Searching specifically for the provided customId...');
    const specificResult = await client.listMemories({
        containerTags: [orgTag],
        customId: customId,
    });
    
    if (specificResult.length > 0) {
        console.log('✅ SUCCESS: Found memory with specified customId!');
        console.log('Memory details:');
        console.log(JSON.stringify(specificResult[0], null, 2));
    } else {
        console.log('❌ FAILED: No memory found with specified customId');
        
        // Let's also try searching without containerTags to see if it's a tagging issue
        console.log('🔍 Step 3: Searching without containerTags filter...');
        const noTagsResult = await client.listMemories({
            customId: customId,
        });
        
        if (noTagsResult.length > 0) {
            console.log('⚠️  WARNING: Memory found WITHOUT containerTags filter!');
            console.log('This suggests a containerTags filtering issue.');
            console.log('Memory details:');
            console.log(JSON.stringify(noTagsResult[0], null, 2));
        } else {
            console.log('❌ Memory not found even without containerTags filter');
        }
    }
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🏁 Manual listing test completed');

  } catch (error) {
    console.error('❌ Error listing memories:', error.message);
    console.error('Stack trace:', error.stack);
  }
};

listMemories();
