# Component Architecture Documentation

## Overview

This document provides comprehensive documentation for all components in the Freddy project, including their requirements, dependencies, public APIs, and testing strategies.

## Component Categories

### 1. **Core Library Components** (`js/lib/`)
Core utilities and configurations used throughout the application.

### 2. **Feature Components** (`js/features/`)
Feature-specific modules that implement business logic and UI interactions.

### 3. **Integration Modules** (`js/modules/`)
Third-party integrations and external service connectors.

## Component Documentation

---

## 🔧 Core Library Components

### StorageManager (`js/lib/storage.js`)

**Purpose**: Manages localStorage operations with type safety and error handling

**Requirements**:
- Browser localStorage support
- ES6+ JavaScript support

**Dependencies**:
- None (standalone utility)

**Public API**:
```javascript
constructor(key: string, defaultValue: string)
get(): string
set(value: any): void
getBoolean(): boolean
setBoolean(value: boolean): void
remove(): void
```

**Usage Example**:
```javascript
const storage = new StorageManager('userPreference', 'false');
storage.setBoolean(true);
const value = storage.getBoolean(); // true
```

**Error Handling**:
- Gracefully handles localStorage errors
- Returns default values when localStorage is unavailable
- Logs errors to console for debugging

**Testing Strategy**:
- Unit tests for all public methods
- Mock localStorage for isolated testing
- Test error conditions and edge cases
- Coverage target: 100%

---

### FirebaseConfig (`js/lib/firebase_config.js`)

**Purpose**: Centralizes Firebase configuration and service initialization

**Requirements**:
- Firebase SDK
- Valid Firebase configuration
- Internet connectivity

**Dependencies**:
- Firebase services (Auth, Firestore, Messaging)
- Firebase configuration object

**Public API**:
```javascript
// Exported variables
app: FirebaseApp
db: Firestore
auth: Auth
VAPID_KEY: string

// Exported functions
checkAuthState(): Promise<User|null>
onAuthStateChanged(auth, callback): void
```

**Usage Example**:
```javascript
import { db, auth, VAPID_KEY } from './lib/firebase_config.js';
const user = await checkAuthState();
```

**Error Handling**:
- Handles Firebase initialization errors
- Provides fallback configurations
- Logs initialization status

**Testing Strategy**:
- Mock Firebase services
- Test configuration validation
- Test authentication state management
- Coverage target: 90%

---

## 🚀 Feature Components

### FirebaseMessaging (`js/features/notifications/firebase_messaging.js`)

**Purpose**: Manages Firebase Cloud Messaging for push notifications

**Requirements**:
- Firebase Messaging SDK
- Service worker support
- Valid VAPID key
- HTTPS environment (production)

**Dependencies**:
- Firebase app instance
- Firestore database
- VAPID key for FCM

**Public API**:
```javascript
constructor(app: FirebaseApp, db: Firestore, vapidKey: string)
initialize(): Promise<void>
requestPermission(): Promise<string|null>
getToken(): string|null
isSupported(): boolean
isPermissionGranted(): boolean
isPermissionDenied(): boolean
```

**Usage Example**:
```javascript
const messaging = new FirebaseMessaging(app, db, VAPID_KEY);
await messaging.initialize();
const token = await messaging.requestPermission();
```

**Error Handling**:
- Handles permission denial gracefully
- Manages service worker registration errors
- Provides fallback notification methods

**Testing Strategy**:
- Mock Firebase Messaging API
- Test permission flow scenarios
- Test service worker registration
- Test token management
- Coverage target: 85%

---

### CheckInManager (`js/features/checkin/checkin_manager.js`)

**Purpose**: Manages location check-in business logic and data operations

**Requirements**:
- Firebase Firestore
- User authentication (optional)
- Geolocation API support

**Dependencies**:
- Firestore database
- Firebase Auth
- MapManager interface
- Configuration object

**Public API**:
```javascript
constructor(db: Firestore, auth: Auth, config: Object)
setupCheckInListener(): void
performCheckIn(name: string, coordinates: Object): Promise<void>
fetchCheckIns(): Promise<Array>
fetchLastCoordinates(): Promise<Object|null>
setNotificationPermission(enabled: boolean): void
```

**Usage Example**:
```javascript
const checkInManager = new CheckInManager(db, auth, config);
await checkInManager.performCheckIn('John', { lat: 55.6, lng: 12.5 });
```

**Error Handling**:
- Handles Firestore operation errors
- Manages authentication state changes
- Provides user-friendly error messages

**Testing Strategy**:
- Mock Firestore operations
- Test authentication state handling
- Test data validation
- Test error scenarios
- Coverage target: 90%

---

### CheckInUI (`js/features/checkin/checkin_ui.js`)

**Purpose**: Manages user interface interactions for check-in functionality

**Requirements**:
- DOM manipulation capabilities
- Event handling support
- Modern browser features

**Dependencies**:
- CheckInManager instance
- MapManager interface
- DOM elements

**Public API**:
```javascript
constructor(checkInManager: CheckInManager, mapManager: Object)
setupEventListeners(): void
updateTokenStatus(hasValidToken: boolean): void
showLoading(): void
hideLoading(): void
showSuccess(message: string): void
showError(message: string): void
```

**Usage Example**:
```javascript
const checkInUI = new CheckInUI(checkInManager, mapManager);
checkInUI.setupEventListeners();
checkInUI.updateTokenStatus(true);
```

**Error Handling**:
- Handles DOM manipulation errors
- Provides user feedback for all states
- Graceful degradation for missing elements

**Testing Strategy**:
- Mock DOM elements and events
- Test user interaction flows
- Test UI state management
- Test error display
- Coverage target: 85%

---

### MapManager (`js/features/maps/map_manager.js`)

**Purpose**: Manages Google Maps integration and map operations

**Requirements**:
- Google Maps JavaScript API
- Valid API key
- Internet connectivity

**Dependencies**:
- Google Maps JavaScript API
- Configuration object

**Public API**:
```javascript
constructor(config: Object)
loadGoogleMapsAPI(): Promise<void>
initializeMaps(): Promise<void>
updateMap(lat: number, lng: number): void
addMarker(lat: number, lng: number, title: string): void
setOnMapReady(callback: Function): void
setOnMapError(callback: Function): void
getMap(): google.maps.Map
getRecordedMap(): google.maps.Map
```

**Usage Example**:
```javascript
const mapManager = new MapManager(config);
await mapManager.loadGoogleMapsAPI();
await mapManager.initializeMaps();
mapManager.updateMap(55.6, 12.5);
```

**Error Handling**:
- Handles API loading failures
- Manages map initialization errors
- Provides fallback behaviors

**Testing Strategy**:
- Mock Google Maps API
- Test API loading scenarios
- Test map operations
- Test error handling
- Coverage target: 80%

---

## 🔌 Integration Modules

### Translation (`js/modules/translation/translation.js`)

**Purpose**: Manages internationalization and text translation

**Requirements**:
- JSON translation files
- DOM elements with data-translate attributes
- Modern browser features

**Dependencies**:
- Translation JSON files
- DOM elements

**Public API**:
```javascript
constructor()
loadTranslations(): Promise<void>
applyTranslations(): void
setLanguage(language: string): void
getLanguage(): string
```

**Usage Example**:
```javascript
const translation = new Translation();
await translation.loadTranslations();
translation.applyTranslations();
```

**Error Handling**:
- Handles missing translation files
- Graceful fallback to default language
- Logs translation loading errors

**Testing Strategy**:
- Mock translation files
- Test language detection
- Test DOM updates
- Test error scenarios
- Coverage target: 85%

---

### reCAPTCHA (`js/modules/recaptcha/recaptcha.js`)

**Purpose**: Integrates Google reCAPTCHA for bot protection

**Requirements**:
- Google reCAPTCHA API
- Valid site key
- Internet connectivity

**Dependencies**:
- Google reCAPTCHA API
- Configuration object

**Public API**:
```javascript
constructor(config: Object)
render(container: HTMLElement): void
execute(): Promise<string>
reset(): void
```

**Usage Example**:
```javascript
const recaptcha = new reCAPTCHA(config);
recaptcha.render(container);
const token = await recaptcha.execute();
```

**Error Handling**:
- Handles API loading failures
- Manages token generation errors
- Provides user feedback

**Testing Strategy**:
- Mock reCAPTCHA API
- Test rendering scenarios
- Test token generation
- Test error handling
- Coverage target: 80%

---

## 🧪 Testing Strategy

### Unit Testing Requirements

**Coverage Targets**:
- Core Library Components: 100%
- Feature Components: 85-90%
- Integration Modules: 80-85%

**Test Categories**:
1. **Constructor Tests**: Valid initialization and parameter validation
2. **Public Method Tests**: Happy path scenarios and edge cases
3. **Error Handling Tests**: Invalid inputs and external failures
4. **Integration Tests**: Mock dependency interactions

**Mocking Strategy**:
- Mock external APIs (Firebase, Google Maps, reCAPTCHA)
- Mock browser APIs (localStorage, service workers)
- Mock DOM elements and events
- Mock network requests

### Integration Testing

**Test Scenarios**:
- Component interaction flows
- End-to-end user journeys
- Error propagation
- Performance benchmarks

### Continuous Integration

**Pre-commit Checks**:
- Unit test execution
- Coverage threshold validation
- Code quality checks

**CI Pipeline**:
- Automated test execution
- Coverage reporting
- Quality gate enforcement

---

## 📋 Component Dependencies Map

```
App (Main Application)
├── StorageManager (Core)
├── FirebaseConfig (Core)
├── FirebaseMessaging (Notifications)
│   ├── FirebaseConfig
│   └── Service Worker
├── CheckInManager (Check-in)
│   ├── FirebaseConfig
│   └── MapManager Interface
├── CheckInUI (Check-in)
│   ├── CheckInManager
│   └── MapManager Interface
├── MapManager (Maps)
│   └── Google Maps API
├── Translation (i18n)
│   └── JSON Files
└── reCAPTCHA (Security)
    └── Google reCAPTCHA API
```

---

## 🎯 Quality Standards

### Documentation Requirements
- Complete API documentation with JSDoc
- Usage examples and code snippets
- Error handling documentation
- Version information and changelog

### Code Quality Standards
- ESLint compliance
- Consistent naming conventions
- Proper error handling
- Performance considerations

### Testing Standards
- Comprehensive unit test coverage
- Integration test scenarios
- Error condition testing
- Performance testing

---

*This documentation ensures that all components are well-understood, properly tested, and maintainable throughout the project lifecycle.* 