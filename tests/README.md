# Trace Notification System Test Suite

This test suite validates the pet-specific cross-device notification system using Playwright.

## Canonical QA Path

Use the project root commands as the single source of truth:

- `npm run test:unit` - Jest unit tests
- `npm run test:e2e:smoke` - Playwright smoke tests (Chromium)
- `npm run test:qa` - canonical QA gate (unit + smoke)

## Legacy Runner Policy

Legacy mock-heavy runner files have been removed to reduce maintenance overhead and avoid false positives.
Use only the canonical commands in the section above.

## 🎯 Test Coverage

### Core Functionality Tests (`notification-system.spec.js`)
- **Pet Page Navigation**: Verifies pet pages load correctly
- **Notification Permission Handling**: Tests permission requests and denials
- **Pet-Specific Storage**: Validates per-pet notification settings
- **Check-in Functionality**: Tests form submission and validation
- **Cross-Device Notifications**: Verifies notification creation and delivery
- **Real-time Listening**: Tests Firestore listeners for specific pets
- **Notification Display**: Validates browser notification creation
- **Mobile Responsiveness**: Tests mobile device compatibility
- **Error Handling**: Tests graceful error handling
- **Performance**: Validates load times and rapid operations

### Cross-Device Tests (`cross-device-notification.spec.js`)
- **Multi-Device Communication**: Tests notifications between different devices
- **Self-Notification Prevention**: Ensures devices don't receive their own notifications
- **Multi-Pet Settings**: Tests different notification settings per pet
- **Permission Changes**: Tests dynamic permission updates
- **Network Resilience**: Tests behavior during network issues

## 🚀 Quick Start

### Prerequisites
1. Node.js 16+ installed
2. The main Trace application running (`npm run dev:trace`)

### Installation
   ```bash
cd tests
npm install
npx playwright install
   ```

### Running Tests

#### All Tests
   ```bash
npm test
```

#### Specific Test File
```bash
npx playwright test notification-system.spec.js
npx playwright test cross-device-notification.spec.js
```

#### With UI (Debug Mode)
```bash
npm run test:ui
```

#### Headed Mode (See Browser)
```bash
npm run test:headed
```

#### Debug Mode
```bash
npm run test:debug
```

## 📋 Test Scenarios

### 1. Pet-Specific Notification Settings
```
✅ User enables notifications for Pet A
✅ User disables notifications for Pet B
✅ Check-in for Pet A → Notification sent
✅ Check-in for Pet B → No notification sent
```

### 2. Cross-Device Communication
```
✅ Device 1: Enables notifications for Pet A
✅ Device 2: Submits check-in for Pet A
✅ Device 1: Receives notification
✅ Device 2: Does NOT receive notification (same device)
```

### 3. Permission Handling
```
✅ Browser permission granted → Notifications work
✅ Browser permission denied → Help message shown
✅ Permission changes → System adapts
```

### 4. Error Scenarios
```
✅ Network disconnection → Graceful error handling
✅ Firestore errors → User-friendly error messages
✅ Geolocation errors → Fallback to manual location
```

## 🔧 Test Configuration

### Browser Support
- **Chromium**: Desktop and mobile
- **Firefox**: Desktop and mobile  
- **WebKit**: Desktop and mobile (Safari)

### Test Environment
- **Base URL**: `http://localhost:8016`
- **Timeout**: 10 seconds for page loads
- **Retries**: 2 on CI, 0 locally
- **Parallel**: Enabled for faster execution

### Mocking Strategy
- **Notification API**: Mocked for consistent testing
- **Firestore**: Mocked for controlled test scenarios
- **Geolocation**: Mocked for predictable results
- **Network**: Mocked for error testing

## 📊 Test Results

### Expected Output
```
✓ Pet Page Navigation (3 tests)
✓ Notification Permission Handling (2 tests)  
✓ Pet-Specific Notification Storage (2 tests)
✓ Check-in Functionality (2 tests)
✓ Cross-Device Notification System (5 tests)
✓ Real-time Notification Listening (1 test)
✓ Notification Display (1 test)
✓ Mobile Responsiveness (1 test)
✓ Error Handling (2 tests)
✓ Performance (2 tests)

21 tests passed
```

### Coverage Areas
- ✅ **UI Elements**: All notification buttons and forms
- ✅ **Storage**: localStorage per-pet settings
- ✅ **API Calls**: Firestore operations
- ✅ **Real-time**: WebSocket/Firestore listeners
- ✅ **Cross-browser**: Chrome, Firefox, Safari
- ✅ **Mobile**: Responsive design
- ✅ **Error States**: Network, permission, validation errors

## 🐛 Debugging Tests

### View Test Reports
```bash
npm run report
```

### Debug Specific Test
```bash
npx playwright test --debug notification-system.spec.js
```

### Run Single Test
```bash
npx playwright test -g "should submit check-in successfully"
```

### View Traces
```bash
npx playwright show-trace test-results/trace.zip
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Test Notification System
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: cd tests && npm install
      - run: cd tests && npx playwright install
      - run: cd tests && npm test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: tests/playwright-report/
```

## 📝 Test Maintenance

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `*.spec.js`
3. Use descriptive test names
4. Include proper setup/teardown

### Updating Mocks
- Update mock implementations in test files
- Ensure mocks match real API behavior
- Test both success and failure scenarios

### Browser Updates
- Run `npx playwright install` after browser updates
- Test on multiple browser versions
- Verify mobile responsiveness

## 🎯 Key Test Principles

1. **Isolation**: Each test is independent
2. **Realism**: Tests mimic real user behavior
3. **Coverage**: Test all major code paths
4. **Reliability**: Tests are stable and repeatable
5. **Performance**: Tests run quickly
6. **Maintainability**: Tests are easy to understand and update

## 🚨 Common Issues

### Test Failures
- **Timing Issues**: Increase timeouts for slow operations
- **Selector Changes**: Update selectors when UI changes
- **Mock Updates**: Update mocks when APIs change
- **Browser Differences**: Test on multiple browsers

### Debugging Tips
- Use `--headed` to see browser actions
- Use `--debug` to step through tests
- Check console logs for errors
- Verify test data in Firestore emulator

## 📈 Performance Benchmarks

### Expected Performance
- **Page Load**: < 5 seconds
- **Check-in Submission**: < 2 seconds
- **Notification Display**: < 1 second
- **Cross-device Delay**: < 3 seconds

### Load Testing
- **Concurrent Users**: 10+ simultaneous users
- **Rapid Check-ins**: 5+ check-ins per second
- **Multiple Pets**: 3+ pets with different settings
- **Network Conditions**: Various connection speeds
