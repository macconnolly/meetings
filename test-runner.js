#!/usr/bin/env node

/**
 * Test Runner for Enhanced Meeting Intelligence System
 * 
 * This script provides a unified interface to run various tests in the project.
 * Usage: node test-runner.js [test-type] [options]
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TESTS = {
    // Integration tests
    integration: {
        command: 'node test/integration/pipeline.test.js',
        description: 'Run main pipeline integration test'
    },
    'integration:eml': {
        command: 'node test/integration/eml-processing.test.js',
        description: 'Test EML email file processing integration'
    },
    
    // Debug tests  
    'debug:memory-flow': {
        command: 'node test/debug/memory-flow.test.js',
        description: 'Test end-to-end memory creation and retrieval'
    },
    'debug:container-tags': {
        command: 'node test/debug/container-tags.test.js', 
        description: 'Test containerTags filtering behavior'
    },
    'debug:api-config': {
        command: 'node test/debug/api-config.test.js',
        description: 'Test API configuration and connectivity'
    },
    'debug:direct-access': {
        command: 'node test/debug/direct-access.test.js',
        description: 'Test direct memory access by ID'
    },
    'debug:processing-delay': {
        command: 'node test/debug/processing-delay.test.js',
        description: 'Test memory processing delays'
    },
    
    // Manual tests
    'manual:memory-list': {
        command: 'node test/manual/memory-list.test.js',
        description: 'Manual memory listing test (requires customId argument)',
        requiresArgs: true
    }
};

function showUsage() {
    console.log('🧪 Enhanced Meeting Intelligence System - Test Runner');
    console.log('='.repeat(60));
    console.log('Usage: node test-runner.js [test-type] [args...]\\n');
    
    console.log('Available tests:');
    Object.entries(TESTS).forEach(([key, test]) => {
        const argNote = test.requiresArgs ? ' [args...]' : '';
        console.log(`  ${key}${argNote}`);
        console.log(`    ${test.description}\\n`);
    });
      console.log('Examples:');
    console.log('  node test-runner.js integration');
    console.log('  node test-runner.js integration:eml');
    console.log('  node test-runner.js debug:memory-flow');
    console.log('  node test-runner.js manual:memory-list "DELAY-TEST-1750195737520"');
    console.log('  node test-runner.js all-debug        # Run all debug tests');
    console.log('  node test-runner.js all-integration  # Run all integration tests');
}

function runTest(testName, args = []) {
    const test = TESTS[testName];
    if (!test) {
        console.error(`❌ Unknown test: ${testName}`);
        return false;
    }
    
    try {
        console.log(`🚀 Running: ${testName}`);
        console.log(`📝 ${test.description}`);
        console.log('-'.repeat(40));
        
        const command = test.command + (args.length > 0 ? ' ' + args.join(' ') : '');
        execSync(command, { 
            stdio: 'inherit',
            cwd: __dirname
        });
        
        console.log('-'.repeat(40));
        console.log(`✅ Test completed: ${testName}\\n`);
        return true;
    } catch (error) {
        console.log('-'.repeat(40));
        console.error(`❌ Test failed: ${testName}`);
        console.error(`Error: ${error.message}\\n`);
        return false;
    }
}

function runAllDebugTests() {
    console.log('🔬 Running all debug tests...');
    const debugTests = Object.keys(TESTS).filter(key => key.startsWith('debug:'));
    
    let passed = 0;
    let failed = 0;
    
    for (const testName of debugTests) {
        if (runTest(testName)) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('📊 Debug Test Summary:');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
}

function runAllIntegrationTests() {
    console.log('🔗 Running all integration tests...');
    const integrationTests = Object.keys(TESTS).filter(key => key.startsWith('integration'));
    
    let passed = 0;
    let failed = 0;
    
    for (const testName of integrationTests) {
        if (runTest(testName)) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('📊 Integration Test Summary:');
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showUsage();
        return;
    }
    
    const testName = args[0];
    const testArgs = args.slice(1);
      // Special commands
    if (testName === 'all-debug') {
        runAllDebugTests();
        return;
    }
    
    if (testName === 'all-integration') {
        runAllIntegrationTests();
        return;
    }
    
    if (testName === 'list') {
        showUsage();
        return;
    }
    
    // Run specific test
    if (!runTest(testName, testArgs)) {
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runTest, TESTS };
