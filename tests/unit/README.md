# Unit Testing Guide

## Overview

This directory contains unit tests for all components in the Freddy project. Each component should have dedicated unit tests that verify its functionality, error handling, and integration with dependencies.

## Testing Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── lib/                # Tests for core library components
│   │   ├── storage.test.js
│   │   └── firebase_config.test.js
│   ├── features/           # Tests for feature components
│   │   ├── notifications/
│   │   │   └── firebase_messaging.test.js
│   │   ├── checkin/
│   │   │   ├── checkin_manager.test.js
│   │   │   └── checkin_ui.test.js
│   │   └── maps/
│   │       └── map_manager.test.js
│   └── modules/            # Tests for third-party integrations
│       ├── translation/
│       │   └── translation.test.js
│       └── recaptcha/
│           └── recaptcha.test.js
├── integration/            # Integration tests (existing)
└── e2e/                   # End-to-end tests (future)
```

## Component Documentation Standards

Each component should include:

### 1. **Component Header Documentation**
```javascript
/**
 * @component StorageManager
 * @description Manages localStorage operations with type safety and error handling
 * @version 1.0.0
 * @author Freddy Team
 * 
 * @requirements
 * - Browser localStorage support
 * - ES6+ JavaScript support
 * 
 * @dependencies
 * - None (standalone utility)
 * 
 * @public-api
 * - constructor(key, defaultValue)
 * - get() -> string
 * - set(value) -> void
 * - getBoolean() -> boolean
 * - setBoolean(value) -> void
 * - remove() -> void
 * 
 * @usage
 * ```javascript
 * const storage = new StorageManager('userPreference', 'false');
 * storage.setBoolean(true);
 * const value = storage.getBoolean(); // true
 * ```
 * 
 * @error-handling
 * - Gracefully handles localStorage errors
 * - Returns default values when localStorage is unavailable
 * - Logs errors to console for debugging
 */
```

### 2. **Method Documentation**
```javascript
/**
 * Sets a boolean value in localStorage
 * @param {boolean} value - The boolean value to store
 * @throws {Error} When localStorage is not available
 * @example
 * storage.setBoolean(true);
 */
setBoolean(value) {
  // Implementation
}
```

## Unit Test Standards

### 1. **Test File Structure**
```javascript
/**
 * @file StorageManager.test.js
 * @description Unit tests for StorageManager component
 * @test-framework Jest
 * @coverage-target 100%
 */

describe('StorageManager', () => {
  let storage;
  
  beforeEach(() => {
    // Setup
    storage = new StorageManager('testKey', 'default');
    localStorage.clear();
  });
  
  afterEach(() => {
    // Cleanup
    localStorage.clear();
  });
  
  describe('Constructor', () => {
    test('should initialize with key and default value', () => {
      // Test implementation
    });
  });
  
  describe('get()', () => {
    test('should return stored value', () => {
      // Test implementation
    });
    
    test('should return default value when no value stored', () => {
      // Test implementation
    });
    
    test('should handle localStorage errors gracefully', () => {
      // Test implementation
    });
  });
  
  // More test suites...
});
```

### 2. **Test Categories**

#### **Constructor Tests**
- Valid initialization
- Parameter validation
- Default value handling

#### **Public Method Tests**
- Happy path scenarios
- Edge cases
- Error conditions
- Return value validation

#### **Error Handling Tests**
- Invalid inputs
- External dependency failures
- Browser compatibility issues

#### **Integration Tests**
- Mock dependency interactions
- Event handling
- State management

### 3. **Mocking Strategy**

```javascript
// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock Firebase
const mockFirebase = {
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  },
  auth: {
    onAuthStateChanged: jest.fn()
  }
};
```

## Running Tests

### **Setup**
```bash
npm install --save-dev jest @testing-library/jest-dom
```

### **Configuration (jest.config.js)**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.js'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/old/**',
    '!js/firebase-setup.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### **Commands**
```bash
# Run all unit tests
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Run tests for specific component
npm run test:unit -- --testNamePattern="StorageManager"

# Watch mode for development
npm run test:watch
```

## Component-Specific Requirements

### **StorageManager**
- **Requirements**: localStorage support, ES6+
- **Dependencies**: None
- **Test Focus**: localStorage operations, error handling, type conversion

### **FirebaseConfig**
- **Requirements**: Firebase SDK, valid configuration
- **Dependencies**: Firebase services
- **Test Focus**: Configuration validation, service initialization

### **FirebaseMessaging**
- **Requirements**: Firebase Messaging, service worker support
- **Dependencies**: Firebase app, Firestore, VAPID key
- **Test Focus**: Permission handling, token management, service worker registration

### **CheckInManager**
- **Requirements**: Firebase Firestore, authentication
- **Dependencies**: Firestore, Auth, MapManager interface
- **Test Focus**: Data operations, authentication state, error handling

### **CheckInUI**
- **Requirements**: DOM manipulation, event handling
- **Dependencies**: CheckInManager, MapManager interface
- **Test Focus**: UI interactions, event handling, state updates

### **MapManager**
- **Requirements**: Google Maps API, valid API key
- **Dependencies**: Google Maps JavaScript API
- **Test Focus**: Map initialization, marker management, API loading

### **Translation**
- **Requirements**: JSON translation files, DOM elements
- **Dependencies**: Translation JSON files
- **Test Focus**: Language detection, translation loading, DOM updates

## Quality Standards

### **Coverage Requirements**
- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical paths**: 100% coverage

### **Test Quality**
- **Descriptive test names**
- **Single assertion per test**
- **Proper setup/teardown**
- **Mock external dependencies**
- **Test error conditions**

### **Documentation Quality**
- **Complete API documentation**
- **Usage examples**
- **Dependency lists**
- **Error handling documentation**
- **Version information**

## Continuous Integration

### **Pre-commit Hooks**
```bash
# Run unit tests before commit
npm run test:unit

# Check coverage thresholds
npm run test:coverage:check
```

### **CI Pipeline**
```yaml
# .github/workflows/test.yml
- name: Run Unit Tests
  run: npm run test:unit

- name: Check Coverage
  run: npm run test:coverage:check

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Benefits

1. **Reliability**: Catch bugs early in development
2. **Maintainability**: Clear documentation and test coverage
3. **Refactoring Safety**: Tests ensure functionality is preserved
4. **Onboarding**: New developers can understand components quickly
5. **Quality Assurance**: Automated verification of component behavior

## Next Steps

1. **Create unit test structure**
2. **Add component documentation**
3. **Implement test framework setup**
4. **Write tests for each component**
5. **Set up CI/CD pipeline**
6. **Establish code coverage monitoring**

---

*This testing structure ensures that all components are thoroughly tested and well-documented, making the codebase more maintainable and reliable.* 