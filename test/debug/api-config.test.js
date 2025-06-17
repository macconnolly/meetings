const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const axios = require('axios');

async function debugSupermemoryAPI() {
    console.log('=== SUPERMEMORY API DEBUGGING ===\n');
    
    const baseURL = process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai/v3';
    const apiKey = process.env.SUPERMEMORY_API_KEY;
    
    console.log('🌐 Base URL:', baseURL);
    console.log('🔑 API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
    console.log('');
    
    if (!apiKey) {
        console.error('❌ No API key found - cannot proceed');
        return;
    }
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    // Test 1: API Health/Status
    console.log('🏥 Testing API health/status...');
    const healthEndpoints = [
        '/health',
        '/status', 
        '/ping',
        '/',
        '/v3',
        '/api/v3'
    ];
    
    for (const endpoint of healthEndpoints) {
        try {
            const response = await axios.get(`${baseURL}${endpoint}`, { headers, timeout: 5000 });
            console.log(`✅ ${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.response?.status || 'TIMEOUT'} - ${error.response?.data?.error || error.message}`);
        }
    }
    
    // Test 2: Authentication
    console.log('\n🔐 Testing authentication...');
    try {
        const authTest = await axios.get(`${baseURL}/memories/list?limit=1`, { headers });
        console.log('✅ Authentication appears valid');
    } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('❌ Authentication failed:', error.response.data);
        } else {
            console.log('⚠️  Authentication test inconclusive:', error.response?.status, error.response?.data);
        }
    }
    
    // Test 3: Try alternative API versions
    console.log('\n🔄 Testing alternative API versions...');
    const apiVersions = [
        'https://api.supermemory.ai/v1',
        'https://api.supermemory.ai/v2', 
        'https://api.supermemory.ai/v3',
        'https://supermemory.ai/api/v1',
        'https://supermemory.ai/api/v2',
        'https://supermemory.ai/api/v3'
    ];
    
    for (const apiUrl of apiVersions) {
        try {
            const response = await axios.get(`${apiUrl}/memories/list?limit=1`, { headers, timeout: 3000 });
            console.log(`✅ ${apiUrl}: Working! Status ${response.status}`);
            if (response.data) {
                console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`❌ ${apiUrl}: ${error.response?.status || 'TIMEOUT'} - ${error.response?.data?.error || error.message}`);
        }
    }
    
    // Test 4: Check environment variables
    console.log('\n🔧 Environment Variables Check:');
    console.log('SUPERMEMORY_BASE_URL:', process.env.SUPERMEMORY_BASE_URL || 'NOT SET (using default)');
    console.log('SUPERMEMORY_API_KEY length:', process.env.SUPERMEMORY_API_KEY?.length || 0);
    console.log('NODE_TLS_REJECT_UNAUTHORIZED:', process.env.NODE_TLS_REJECT_UNAUTHORIZED);
    
    console.log('\n=== DEBUGGING COMPLETED ===');
}

if (require.main === module) {
    debugSupermemoryAPI();
}

module.exports = { debugSupermemoryAPI };
