## Trace Startup and Shutdown Guide

### Preflight
- Run `npm run preflight` before startup and before QA.
- Expected Node version: `20+`.

### Start Local Stack
- Default safe start (no forced process cleanup):
  - `npm run stack:start`
- Force known port cleanup only when needed:
  - `node start-trace.js --force-clean-ports`

### Start Emulators Only
- `npm run emulators:start`
- This now seeds both test users and URL names after emulator readiness.

### Health Check
- `npm run health:local`
- Expected healthy endpoints:
  - `http://localhost:8016/`
  - `http://localhost:8016/admin`
  - `http://127.0.0.1:8180/`
  - `http://127.0.0.1:9099/`

### Stop Local Stack
- `npm run stack:stop`
- This script now avoids broad name-based process killing and primarily targets known Trace ports/processes.

### Troubleshooting
- If preflight fails for Firebase CLI:
  - install globally: `npm i -g firebase-tools`
  - or ensure local `npx firebase-tools --version` works
- If ports are occupied:
  - retry with `--force-clean-ports` once
 