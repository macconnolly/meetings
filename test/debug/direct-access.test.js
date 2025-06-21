const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const axios = require('axios');
const config = require('../../config/production.json');

async function testDirectMemoryAccess() {
    console.log('=== TESTING DIRECT MEMORY ACCESS BY ID ===\n');
    
    const baseURL = process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3';
    const apiKey = process.env.SUPERMEMORY_API_KEY;
    
    if (!apiKey) {
        console.error('❌ No API key found');
        return;
    }
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    // Test 1: Create a memory and get its ID
    const testMemory = {
        content: "Direct access test - " + new Date().toISOString(),
        userId: config.organization_tag,
        customId: "DIRECT-TEST-" + Date.now(),
        containerTags: [config.organization_tag, "direct-test"],
        metadata: {
            content_type: "direct_test",
            purpose: "Testing direct memory access"
        }
    };
    
    console.log('📝 Creating memory:', testMemory.customId);
    
    try {
        // Create memory
        const createResponse = await axios.post(`${baseURL}/memories`, testMemory, { headers });
        console.log('✅ Memory created:', JSON.stringify(createResponse.data, null, 2));
        
        const memoryId = createResponse.data.id;
        
        // Test 2: Try to access the memory directly by ID
        console.log(`\n🔍 Attempting to fetch memory by ID: ${memoryId}`);
        
        try {
            const getResponse = await axios.get(`${baseURL}/memories/${memoryId}`, { headers });
            console.log('✅ Direct fetch successful:', JSON.stringify(getResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Direct fetch failed:', error.response?.status, error.response?.data || error.message);
        }
        
        // Test 3: Try different list endpoints
        console.log('\n🔍 Testing different list endpoints...');
        
        // Try without any filters
        console.log('\n📋 Testing: GET /memories/list (no params)');
        try {
            const listAllResponse = await axios.get(`${baseURL}/memories/list`, { headers });
            console.log('✅ List all successful:', JSON.stringify(listAllResponse.data, null, 2));
        } catch (error) {
            console.log('❌ List all failed:', error.response?.status, error.response?.data || error.message);
        }
        
        // Try with just limit
        console.log('\n📋 Testing: GET /memories/list?limit=10');
        try {
            const listLimitResponse = await axios.get(`${baseURL}/memories/list?limit=10`, { headers });
            console.log('✅ List with limit successful:', JSON.stringify(listLimitResponse.data, null, 2));
        } catch (error) {
            console.log('❌ List with limit failed:', error.response?.status, error.response?.data || error.message);
        }
        
        // Try the /memories endpoint without /list
        console.log('\n📋 Testing: GET /memories (alternative endpoint)');
        try {
            const memoriesResponse = await axios.get(`${baseURL}/memories`, { headers });
            console.log('✅ /memories endpoint successful:', JSON.stringify(memoriesResponse.data, null, 2));
        } catch (error) {
            console.log('❌ /memories endpoint failed:', error.response?.status, error.response?.data || error.message);
        }
        
        // Test 4: Check API documentation or available endpoints
        console.log('\n📋 Testing: OPTIONS request to see available methods');
        try {
            const optionsResponse = await axios.options(`${baseURL}/memories`, { headers });
            console.log('✅ OPTIONS successful:', optionsResponse.headers);
        } catch (error) {
            console.log('❌ OPTIONS failed:', error.response?.status, error.response?.data || error.message);
        }
        
    } catch (error) {
        console.error('❌ Error during test:', error.response?.status, error.response?.data || error.message);
    }
    
    console.log('\n=== TEST COMPLETED ===');
}

if (require.main === module) {
    testDirectMemoryAccess();
}

module.exports = { testDirectMemoryAccess };
