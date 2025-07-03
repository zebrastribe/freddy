/**
 * Jest configuration for Freddy project unit tests
 * @description Configures Jest for testing ES6 modules in browser environment
 */

module.exports = {
  // Test environment - simulate browser environment
  testEnvironment: 'jsdom',
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js'
  ],
  
  // Files to collect coverage from
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/old/**',
    '!js/firebase-setup.js',
    '!js/config.js', // Contains API keys
    '!**/node_modules/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  
  // Module name mapping for ES6 imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
    '^https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js$': '<rootDir>/tests/mocks/firebase-firestore.js',
    '^https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js$': '<rootDir>/tests/mocks/firebase-auth.js'
  },
  
  // Transform configuration for ES6 modules
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout (30 seconds)
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Collect coverage
  collectCoverage: false, // Set to true for coverage runs
  
  // Coverage directory
  coverageDirectory: 'coverage',
  
  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Global test setup
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
}; 