const path = require('path');
const fs = require('fs');

// Set up paths relative to the script location (now in test/debug/)
const rootDir = path.join(__dirname, '..', '..');
const srcDir = path.join(rootDir, 'src');
const configDir = path.join(rootDir, 'config');

// Load environment variables
require('dotenv').config({ path: path.join(rootDir, '.env') });

// Import our modules
const { SupermemoryClient } = require(path.join(srcDir, 'core', 'SupermemoryClient.js'));

// Load configuration
const configPath = path.join(configDir, 'production.json');
let config = {};
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log('✅ Configuration loaded successfully');
    }
} catch (error) {
    console.error('❌ Error loading configuration:', error.message);
}

async function testContainerTagsFiltering() {
    console.log('\n🔬 Testing ContainerTags Filtering Variations');
    console.log('='.repeat(60));
    
    const supermemoryClient = new SupermemoryClient(config);
    
    // Test cases for containerTags format
    const testCases = [
        {
            name: "Array format - single tag",
            filter: { containerTags: ["organization_main"] }
        },
        {
            name: "Array format - multiple tags", 
            filter: { containerTags: ["organization_main", "delay-test"] }
        },
        {
            name: "String format - single tag",
            filter: { containerTags: "organization_main" }
        },
        {
            name: "String format - comma separated",
            filter: { containerTags: "organization_main,delay-test" }
        },
        {
            name: "Alternative field name - tags",
            filter: { tags: ["organization_main"] }
        },
        {
            name: "Alternative field name - container_tags",
            filter: { container_tags: ["organization_main"] }
        },
        {
            name: "Combination - customId + containerTags array",
            filter: { 
                customId: "DELAY-TEST-1750195737520",
                containerTags: ["organization_main"] 
            }
        },
        {
            name: "Combination - customId + containerTags string",
            filter: { 
                customId: "DELAY-TEST-1750195737520",
                containerTags: "organization_main" 
            }
        },
        {
            name: "Exact tag match test",
            filter: { containerTags: ["delay-test"] }
        },
        {
            name: "No filters (baseline)",
            filter: {}
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n🧪 Test ${i + 1}: ${testCase.name}`);
        console.log('Filter:', JSON.stringify(testCase.filter, null, 2));
        
        try {
            // Bypass our client's filtering to test raw API calls
            const axios = require('axios');
            const headers = {
                'Authorization': `Bearer ${process.env.SUPERMEMORY_API_KEY}`,
                'Content-Type': 'application/json'
            };
            
            const response = await axios.post(`${supermemoryClient.baseURL}/memories/list`, testCase.filter, {
                headers: headers,
                timeout: 30000
            });
            
            const results = response.data.memories || [];
            console.log(`✅ Found ${results.length} results`);
            
            if (results.length > 0) {
                // Show sample result
                const sample = results[0];
                console.log('Sample result:', {
                    id: sample.id,
                    customId: sample.customId,
                    status: sample.status,
                    containerTags: sample.containerTags || 'N/A'
                });
                
                // Check if our target memory is in the results
                const targetMemory = results.find(m => m.customId === 'DELAY-TEST-1750195737520');
                if (targetMemory) {
                    console.log('🎯 TARGET MEMORY FOUND!');
                    console.log('Target memory details:', {
                        id: targetMemory.id,
                        customId: targetMemory.customId,
                        status: targetMemory.status,
                        containerTags: targetMemory.containerTags
                    });
                }
            } else {
                console.log('❌ No results found');
            }
            
        } catch (error) {
            console.log('❌ Error:', error.response ? 
                JSON.stringify(error.response.data, null, 2) : 
                error.message);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🏁 ContainerTags filtering test completed');
    console.log('='.repeat(60));
}

// Run the test
if (require.main === module) {
    testContainerTagsFiltering()
        .then(() => {
            console.log('\n✅ Test completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Unexpected error:', error.message);
            process.exit(1);
        });
}

module.exports = { testContainerTagsFiltering };
