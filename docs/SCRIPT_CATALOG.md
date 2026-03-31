# Script Catalog

Canonical scripts for daily development and QA.

## NPM scripts (root)

- `npm run start` - run the SPA server (`spa-server.js`).
- `npm run stack:start` - run full local stack (`start-trace.js`).
- `npm run dev` - run the SPA server with `nodemon`.
- `npm run stop` - stop local Trace processes (`shutdown-trace.js`).
- `npm run stack:stop` - alias for full-stack shutdown.
- `npm run emulators:start` - start emulators and seed URL names.
- `npm run build-css` - watch/build Tailwind CSS output.
- `npm run test` - run canonical QA gate (`test:qa`).
- `npm run test:unit` - run Jest unit tests.
- `npm run test:e2e` - run full Playwright suite from `tests`.
- `npm run test:e2e:smoke` - run smoke Playwright suite.
- `npm run test:qa` - run unit + smoke tests (CI gate).

## Core runner scripts

- `start-trace.js` - starts full local stack (emulators, CSS, Vite, SPA).
- `shutdown-trace.js` - coordinated local shutdown utility.
- `run-tests.cjs` - canonical test dispatcher.
- `start-emulators-with-users.js` - emulator bootstrap with user setup.
- `setup-test-users.js` - seed auth/emulator test users.
- `setup-users-after-emulators.js` - post-emulator setup helper.

## Policy

- Prefer npm scripts over direct file execution.
- Avoid adding duplicate shell/one-liner wrappers for existing npm commands.
- Add new operational scripts under `scripts/` and document them here.
