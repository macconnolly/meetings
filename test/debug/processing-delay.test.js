const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { SupermemoryClient } = require('../../src/core/SupermemoryClient');
const config = require('../../config/production.json');

async function testMemoryProcessingDelay() {
    console.log('=== TESTING MEMORY PROCESSING DELAY ===\n');
    
    const client = new SupermemoryClient(config);
    
    // Create a simple test memory object
    const testMemory = {
        content: "Test memory for processing delay - Created at " + new Date().toISOString(),
        userId: config.organization_tag,
        customId: "DELAY-TEST-" + Date.now(),
        containerTags: [config.organization_tag, "delay-test"],
        metadata: {
            content_type: "delay_test",
            test_timestamp: new Date().toISOString(),
            purpose: "Testing processing delay"
        }
    };
    
    console.log('📝 Creating memory with customId:', testMemory.customId);
    
    try {
        // Create the memory
        const createResult = await client.createMemory(testMemory);
        console.log('\n✅ Memory created successfully!');
        console.log('📊 Create result:', JSON.stringify(createResult, null, 2));
        
        // Poll for the memory to become available
        console.log('\n🔄 Polling for memory availability...');
        const maxAttempts = 20; // Poll for up to 2 minutes (6 second intervals)
        let attempt = 0;
        let found = false;
        
        while (attempt < maxAttempts && !found) {
            attempt++;
            console.log(`\n⏳ Attempt ${attempt}/${maxAttempts} - Waiting 6 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            try {
                const searchResult = await client.listMemories({
                    containerTags: [config.organization_tag],
                    customId: testMemory.customId,
                    limit: 1
                });
                
                if (searchResult && searchResult.length > 0) {
                    found = true;
                    console.log('\n🎉 SUCCESS! Memory found after', attempt * 6, 'seconds');
                    console.log('📄 Found memory:', JSON.stringify(searchResult[0], null, 2));
                } else {
                    console.log(`❌ Attempt ${attempt}: Memory still not found`);
                }
            } catch (error) {
                console.log(`❌ Attempt ${attempt}: Search error:`, error.message);
            }
        }
        
        if (!found) {
            console.log('\n❌ Memory was never found after', maxAttempts * 6, 'seconds');
            
            // Try one more search without customId to see if it's there but searchable differently
            console.log('\n🔍 Final attempt: Searching all memories with organization tag...');
            try {
                const allMemories = await client.listMemories({
                    containerTags: [config.organization_tag],
                    limit: 50
                });
                
                console.log(`📊 Found ${allMemories.length} total memories with organization tag`);
                if (allMemories.length > 0) {
                    console.log('📄 Sample memories:');
                    allMemories.slice(0, 3).forEach((memory, index) => {
                        console.log(`${index + 1}. ID: ${memory.id}, customId: ${memory.customId}`);
                    });
                    
                    // Check if our memory is in the list but not searchable by customId
                    const ourMemory = allMemories.find(m => m.customId === testMemory.customId);
                    if (ourMemory) {
                        console.log('\n🔍 FOUND IT! Our memory exists but was not searchable by customId:');
                        console.log(JSON.stringify(ourMemory, null, 2));
                    }
                }
            } catch (error) {
                console.log('❌ Error searching all memories:', error.message);
            }
        }
        
    } catch (error) {
        console.error('\n❌ ERROR during test:');
        console.error(error.message);
        if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
    
    console.log('\n=== TEST COMPLETED ===');
}

if (require.main === module) {
    testMemoryProcessingDelay();
}

module.exports = { testMemoryProcessingDelay };
