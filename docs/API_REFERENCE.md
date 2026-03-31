# API Reference

This document provides an overview of the main JavaScript classes and modules in the Freddy project, including their public methods and usage examples.

---

## StorageManager (`js/lib/storage.js`)

**Purpose:** Handles localStorage operations with type safety and defaults.

### Constructor
```js
new StorageManager(key, defaultValue)
```
- `key` (string): The localStorage key.
- `defaultValue` (any): The default value if not set.

### Methods
- `get()` — Get the current value.
- `set(value)` — Set a new value.
- `getBoolean()` — Get value as boolean.
- `setBoolean(value)` — Set value as boolean.
- `remove()` — Remove the key from storage.

---

## FirebaseMessaging (`js/features/notifications/firebase_messaging.js`)

**Purpose:** Handles Firebase Cloud Messaging operations.

### Constructor
```js
new FirebaseMessaging(app, db, vapidKey)
```

### Methods
- `initialize()` — Initialize messaging.
- `requestPermission()` — Request notification permission and get token.
- `isPermissionGranted()` — Check if permission is granted.
- `isPermissionDenied()` — Check if permission is denied.
- `getToken()` — Get the FCM token.
- `deleteToken()` — Delete the FCM token.

---

## CheckInManager (`js/features/checkin/checkin_manager.js`)

**Purpose:** Handles check-in business logic.

### Constructor
```js
new CheckInManager(db, auth, config)
```

### Methods
- `fetchLastCoordinates()` — Get last known coordinates.
- `fetchCheckIns()` — Get all check-ins.
- `addCheckIn(data)` — Add a new check-in.
- `setupCheckInListener()` — Set up real-time listener.
- `setNotificationPermission(bool)` — Set notification permission.

---

## CheckInUI (`js/features/checkin/checkin_ui.js`)

**Purpose:** Handles check-in UI logic.

### Constructor
```js
new CheckInUI(checkInManager, mapManagerInterface)
```

### Methods
- `updateTokenStatus(isValid)` — Update UI for token status.
- `renderCheckIns(checkIns)` — Render check-in list/table.
- `showCheckInForm()` — Show the check-in form.
- `hideCheckInForm()` — Hide the check-in form.

---

## MapManager (`js/features/maps/map_manager.js`)

**Purpose:** Handles Google Maps API loading, map initialization, and marker management.

### Constructor
```js
new MapManager(config)
```

### Methods
- `loadGoogleMapsAPI()` — Load the Google Maps API.
- `initializeMaps()` — Initialize map(s).
- `updateMap(lat, lng)` — Update main map marker.
- `addMarker(lat, lng, title)` — Add a marker.
- `clearMarkers()` — Remove all markers.
- `getMap()` — Get the main map instance.
- `getRecordedMap()` — Get the recorded map instance.
- `setOnMapReady(callback)` — Set callback for map ready.
- `setOnMapError(callback)` — Set callback for map error.

---

## Example Usage

```js
import { StorageManager } from './js/lib/storage.js';
const storage = new StorageManager('key', false);
storage.setBoolean(true);

import { MapManager } from './js/features/maps/map_manager.js';
const mapManager = new MapManager(config);
await mapManager.loadGoogleMapsAPI();
await mapManager.initializeMaps();
```

---

*For more details, see the source files in the `js/` directory.* 