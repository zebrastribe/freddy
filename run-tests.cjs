#!/usr/bin/env node

/**
 * Canonical QA runner for the Trace platform.
 * Usage: node run-tests.cjs [unit|e2e|smoke|qa]
 */

const { execSync } = require('child_process');
// Get test type from command line arguments
const testType = (process.argv[2] || 'qa').toLowerCase();

console.log('🧪 Trace Platform - QA Runner');
console.log('='.repeat(50));
console.log(`Running: ${testType} tests`);
console.log('='.repeat(50));

try {
    let command;
    
    switch (testType) {
        case 'unit':
            command = 'npm run test:unit';
            break;
        case 'e2e':
            command = 'npm run test:e2e';
            break;
        case 'smoke':
            command = 'npm run test:e2e:smoke';
            break;
        case 'qa':
            command = 'npm run test:qa';
            break;
        default:
            console.log('❌ Unknown test type. Available options:');
            console.log('  unit   - Run Jest unit tests');
            console.log('  e2e    - Run full Playwright suite');
            console.log('  smoke  - Run Playwright smoke suite');
            console.log('  qa     - Run unit + smoke (default)');
            process.exit(1);
    }
    
    console.log(`\n🚀 Executing: ${command}`);
    console.log('─'.repeat(50));
    
    // Execute the test command
    execSync(command, { 
        stdio: 'inherit',
        cwd: __dirname 
    });
    
    console.log('\n✅ Tests completed successfully!');
    process.exit(0);
    
} catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
}
