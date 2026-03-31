# Testing Guide

This document describes the testing philosophy, how to run and interpret tests, and how to add new tests to the Freddy project.

---

## Testing Philosophy
- **Modular:** Each feature/module has its own dedicated test page.
- **Manual & Automated:** Tests can be run manually in the browser; some can be automated with Playwright or similar tools.
- **Comprehensive:** Tests cover storage, notifications, check-ins, maps, and integration.

## Running Tests
- Start the local server: `npm start` or `python3 -m http.server 8000`
- Open the test navigation page: `http://localhost:8000/tests/`
- Click on any test card to open the corresponding test page.

## Test Pages
- `test_storage.html` — StorageManager tests
- `test_firebase_messaging.html` — FirebaseMessaging tests
- `test_checkin_system.html` — Check-in system tests
- `test_map_system.html` — MapManager tests
- `test_integration.html` — Integration tests
- `test.html` — API tests
- `recaptcha-debug.html` — reCAPTCHA debug

## Interpreting Results
- **Success:** Green or "✅" indicators mean the test passed.
- **Failure:** Red or "❌" indicators mean the test failed. Check the browser console for details.
- **Debugging:** Use browser DevTools (F12) to inspect errors and logs.

## Adding New Tests
1. Create a new HTML file in `tests/pages/` (e.g., `test_newfeature.html`).
2. Write test logic using JavaScript modules.
3. Add a card/link to `tests/index.html` for easy access.
4. Optionally, add Playwright or other automated tests in `tests/`.

## Automated Testing
- Use Playwright (`@playwright/test`) for end-to-end tests.
- Place `.spec.js` files in `tests/`.
- Run with `npx playwright test` (if configured).

---

*For more details, see the test pages in `tests/pages/` and the Playwright documentation.* 