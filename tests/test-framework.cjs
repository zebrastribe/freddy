/**
 * Freddy Pet Tracker - Test Framework
 * 
 * A comprehensive test framework designed for cursor.sh execution.
 * Provides structured output for easy parsing and integration.
 */

// Test result structure
class TestResult {
    constructor(name, success, message, details = null, duration = 0) {
        this.name = name;
        this.success = success;
        this.message = message;
        this.details = details;
        this.duration = duration;
        this.timestamp = new Date().toISOString();
    }
}

// Test suite class
class TestSuite {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.results = [];
        this.startTime = null;
        this.endTime = null;
    }

    addTest(test) {
        this.tests.push(test);
    }

    async run() {
        this.startTime = new Date();
        console.log(`\n🧪 Running test suite: ${this.name}`);
        console.log(`📊 Total tests: ${this.tests.length}`);
        console.log('─'.repeat(50));

        for (const test of this.tests) {
            const testStart = new Date();
            try {
                await test.fn();
                const duration = new Date() - testStart;
                const result = new TestResult(test.name, true, 'Test passed', null, duration);
                this.results.push(result);
                console.log(`✅ ${test.name} (${duration}ms)`);
            } catch (error) {
                const duration = new Date() - testStart;
                const result = new TestResult(test.name, false, error.message, error.stack, duration);
                this.results.push(result);
                console.log(`❌ ${test.name} (${duration}ms) - ${error.message}`);
            }
        }

        this.endTime = new Date();
        this.printSummary();
        return this.results;
    }

    printSummary() {
        const totalDuration = this.endTime - this.startTime;
        const passed = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const total = this.results.length;

        console.log('\n📊 Test Suite Summary');
        console.log('─'.repeat(50));
        console.log(`Suite: ${this.name}`);
        console.log(`Duration: ${totalDuration}ms`);
        console.log(`Results: ${passed}/${total} passed, ${failed} failed`);

        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`  - ${result.name}: ${result.message}`);
            });
        }

        console.log('─'.repeat(50));
    }
}

// Test utilities
const testUtils = {
    log: (message) => console.log(`[${new Date().toISOString()}] ${message}`),
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    async retry(fn, maxAttempts = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                if (attempt === maxAttempts) throw error;
                await this.wait(delay * attempt);
            }
        }
    },

    // File system utilities
    fs: require('fs'),
    path: require('path'),

    // Check if file exists
    fileExists: (filePath) => {
        try {
            return testUtils.fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    },

    // Read file content
    readFile: (filePath) => {
        try {
            return testUtils.fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    },

    // Check directory structure
    checkDirectory: (dirPath) => {
        try {
            const stats = testUtils.fs.statSync(dirPath);
            return stats.isDirectory();
        } catch (error) {
            return false;
        }
    },

    // List files in directory
    listFiles: (dirPath) => {
        try {
            return testUtils.fs.readdirSync(dirPath);
        } catch (error) {
            throw new Error(`Failed to list files in ${dirPath}: ${error.message}`);
        }
    }
};

// Mock Firebase for testing
const mockFirebase = {
    app: { name: 'Test App' },
    db: {
        collection: (name) => ({ name, docs: [] }),
        doc: (collection, id) => ({ collection, id, exists: () => true })
    },
    auth: {
        currentUser: { uid: 'test-user-123' }
    }
};

module.exports = { 
    TestSuite, 
    TestResult, 
    testUtils, 
    mockFirebase 
};
