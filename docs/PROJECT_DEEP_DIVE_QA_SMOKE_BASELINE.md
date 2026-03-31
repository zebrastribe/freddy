# Project Deep Dive: QA and Smoke Test Baseline

This document is a canonical deep-dive baseline for the current repository state. It is designed to support:
- QA planning
- Smoke test analysis
- Doc/code drift detection
- Migration tracking from legacy `freddy` layout to `trace` layout

## 1) Executive Snapshot

- The repository is in a migration phase with **legacy tracked files** and **new untracked active implementation** coexisting.
- Current runtime appears centered around:
  - Root orchestration scripts (`start-trace.js`, `shutdown-trace.js`, `spa-server.js`, `v2-server.js`)
  - New frontend/admin code under `trace/v2-frontend` and `trace/admin`
  - Firebase backend (`functions`, `firestore.rules`, `firebase.json`)
  - Mixed QA strategy (`tests/e2e` Playwright + many manual HTML test pages)
- Main QA risk is **path/version drift** (docs and scripts referencing legacy `js/` and root `v2-frontend`, while code is mostly in `trace/*`).

## 2) Runtime and Deployment Topology

### Runtime services

- **App server**: root Express server (`spa-server.js` or `v2-server.js`)
- **Frontend dev server**: Vite in `trace/v2-frontend`
- **Admin dev server**: Vite in `trace/admin`
- **Firebase emulators**: Firestore/Auth plus additional emulator services via `firebase.json`
- **Cloud Functions**: `functions/index.js`

### Key ports (as configured)

- `8016` app or frontend base URL (used in Playwright config)
- `8080` Firestore emulator and also referenced by startup scripts for app readiness (collision risk)
- `9099` Auth emulator
- `5001` Functions emulator
- `4000` Emulator UI (default)

## 3) Critical Architecture Findings (Docs vs Code)

### High impact mismatches

- `spa-server.js` and `v2-server.js` serve root `v2-frontend` and root `admin`, but active app source is under `trace/v2-frontend` and `trace/admin`.
- Root `v2-frontend` currently appears artifact-only (`public/styles/tailwind.css`) while real source is in `trace/v2-frontend/src`.
- Many docs mention legacy paths (`js/*`, old router/imports) while those tracked files are deleted in current working tree.
- `firestore.rules` is currently fully open (`allow read, write: if true;`) which is only safe for local emulator usage.

### Medium impact mismatches

- Multiple startup scripts overlap; behavior and assumptions can diverge.
- Migration and infrastructure scripts still reference old modules or transitional scaffolding.
- Test assets include both legacy and new suites with different assumptions about routes/entrypoints.

## 4) QA Canonical Scope (Recommended)

Use these paths as canonical for QA and smoke coverage now:

- `trace/v2-frontend/*` (public app)
- `trace/admin/*` (admin app)
- root orchestration:
  - `package.json` scripts
  - `start-trace.js`, `shutdown-trace.js`
  - `start-emulators-with-users.js`, `setup-test-users.js`
- backend/security:
  - `functions/index.js`
  - `firestore.rules`
  - `firestore.indexes.json`
  - `firebase.json`
- test automation:
  - `tests/playwright.config.js`
  - `tests/e2e/*.spec.js`
  - `run-tests.cjs`

Treat these as non-canonical or legacy during QA unless explicitly needed:
- old `js/*` stack
- `tests/freddy/*` snapshots
- root `v2-frontend` artifact-only folder
- backup folders and generated reports

## 5) File-by-File Inventory Baseline

This section is intentionally split into:
- **Tracked legacy baseline** (what Git currently tracks)
- **Active implementation baseline** (newer untracked structure used by runtime/testing)

---

### 5.1 Tracked Legacy Baseline (Git tracked list)

#### Root and global config

- `.babelrc` - Babel compatibility config (legacy tooling compatibility).
- `.cursor-guide.md` - internal project guidance.
- `.firebaserc` - Firebase project aliases/config.
- `.gitignore` - ignore rules.
- `.vscode/settings.json` - editor settings.
- `.well-known/appspecific/com.chrome.devtools.json` - app-specific devtools config.
- `LICENSE` - project license.
- `README.md` - high-level project description.
- `_config.yml` - static site/config artifact.
- `package.json` - root scripts, dependencies, orchestration.
- `package-lock.json` - root lockfile.
- `index.html` - root HTML entry placeholder.
- `jest.config.js` - Jest config.
- `manifest.json` - web app manifest (legacy pathing).
- `firebase.json` - emulator/functions settings.
- `firestore.rules` - Firestore access rules.
- `firestore.indexes.json` - Firestore indexes.
- `apphosting.emulator.yaml` - app hosting emulator config.
- `firebase-messaging-sw.js` - service worker (tracked legacy path).

#### Legacy frontend/admin tracked entries

- `admin.html` - old admin entry.
- `admin/index.html` - old admin shell.
- `css/main.css` - legacy style bundle.
- `img/android-chrome-192x192.png` - icon asset.
- `img/android-chrome-512x512.png` - icon asset.
- `img/apple-touch-icon.png` - icon asset.
- `img/emoji-cat-192x192.png` - icon asset.
- `img/emoji-cat-512x512.png` - icon asset.
- `img/emojis.com cat-cat.png` - icon asset.
- `img/favicon-16x16.png` - favicon asset.
- `img/favicon-32x32.png` - favicon asset.
- `img/favicon.ico` - favicon asset.
- `img/favicon.png` - favicon asset.

#### Legacy JS module tree (`js/`)

- `js/app.js` - old SPA entry.
- `js/config.js` - legacy app config.
- `js/firebase-setup.js` - legacy Firebase init.
- `js/incoming.js` - legacy incoming route glue.
- `js/features/checkin/checkin_manager.js` - checkin logic (legacy).
- `js/features/checkin/checkin_ui.js` - checkin UI layer (legacy).
- `js/features/infrastructure/dns_manager.js` - DNS abstraction (legacy).
- `js/features/maps/map_manager.js` - map feature logic (legacy).
- `js/features/notifications/firebase_messaging.js` - client notification module (legacy).
- `js/features/pets/pet_domain_manager.js` - pet domain/url management (legacy).
- `js/features/pets/pet_manager.js` - pet data operations (legacy).
- `js/features/pets/pet_ui.js` - pet UI module (legacy).
- `js/features/users/auth_manager.js` - auth management (legacy).
- `js/features/users/index.js` - users feature entry (legacy).
- `js/features/users/permission_middleware.js` - role checks (legacy).
- `js/features/users/user_manager.js` - user data logic (legacy).
- `js/lib/__mocks__/uuid.js` - UUID mock.
- `js/lib/firebase_config.js` - firebase configuration (legacy).
- `js/lib/storage.js` - storage helpers.
- `js/lib/uuid.js` - UUID helpers.
- `js/modules/recaptacha/recaptcha.js` - recaptcha module (legacy path typo kept).
- `js/modules/translation/json/da_DK.json` - Danish localization.
- `js/modules/translation/json/en_GB.json` - English localization.
- `js/modules/translation/translation.js` - translation runtime.

#### Docs (tracked baseline set)

- `docs/ADMIN_GUIDE.md` - admin operations guide.
- `docs/API_REFERENCE.md` - API reference.
- `docs/CHANGELOG.md` - change history.
- `docs/CLEANUP_SUMMARY.md` - cleanup summary.
- `docs/COMPONENT_ARCHITECTURE.md` - architecture overview.
- `docs/CONTRIBUTING.md` - contribution rules.
- `docs/DEPLOYMENT.md` - deployment instructions.
- `docs/FIRESTORE_RULES_TESTING_CHECKLIST.md` - rules testing checklist.
- `docs/IMPLEMENTATION_CHECKLIST.md` - implementation task list.
- `docs/IMPLEMENTATION_ROADMAP.md` - roadmap.
- `docs/KNOWN_ISSUES.md` - known issues.
- `docs/MULTI_OBJECT_ARCHITECTURE.md` - multi-object model design.
- `docs/MULTI_USER_IMPLEMENTATION_SUMMARY.md` - multi-user summary.
- `docs/MULTI_USER_OBJECT_ANALYSIS.md` - deep analysis and long-form planning.
- `docs/PUSH_NOTIFICATIONS_SETUP.md` - notification setup.
- `docs/RECAPTCHA_FIXES.md` - recaptcha fix notes.
- `docs/SECURITY_FOUNDATION_IMPLEMENTATION.md` - security foundation details.
- `docs/SECURITY_IMPROVEMENTS.md` - security improvements list.
- `docs/TESTING.md` - testing instructions.
- `docs/THIRD_PARTY_LICENSES.md` - licenses.
- `docs/VERIFICATION_SUMMARY.md` - verification notes.

#### Backend and infra

- `functions/.eslintrc.js` - functions lint rules.
- `functions/.gitignore` - functions ignore list.
- `functions/index.js` - cloud functions implementation.
- `functions/package-lock.json` - functions lockfile.
- `functions/package.json` - functions dependencies/scripts.
- `hosting/config.js` - hosting config abstraction.
- `hosting/hosting_abstraction.js` - provider abstraction runtime.
- `hosting/url_router.js` - URL routing helpers.
- `hosting/providers/custom.js` - custom provider placeholder.
- `hosting/providers/firebase_hosting.js` - firebase hosting provider.
- `hosting/providers/github_pages.js` - github pages provider.

#### Migration and scripts

- `migration-scripts/migrate-to-objects.js` - migration flow.
- `migration-scripts/setup-database-collections.js` - DB collection setup.
- `scripts/setup-infrastructure.js` - infra setup script.
- `scripts/test-infrastructure.js` - infra test script.
- `setup-firebase-security.js` - legacy security setup.
- `setup-freddy-status.js` - legacy status setup.

#### Test and report tracked baseline

- `test-module-system.html` - module system manual test.
- `test-multi-user.html` - multi-user manual test.
- `test-simple.html` - simple manual test.
- `test-report.xml` - generated report artifact.
- `test-results/.last-run.json` - last run artifact.
- `tests/debug-login.spec.js` - auth debug test.
- `tests/emulator-test.html` - emulator test harness.
- `tests/favicon.ico` - tests favicon.
- `tests/firestore-guest-checkin-emulator.js` - emulator checkin test.
- `tests/firestore-rules-test.html` - rules test page.
- `tests/firestore-rules-test.js` - rules test script.
- `tests/index.html` - tests index harness.
- `tests/minimal-test.html` - minimal test page.
- `tests/mocks/firebase-auth.js` - auth mock.
- `tests/mocks/firebase-firestore.js` - firestore mock.
- `tests/notification-system.spec.js` - notification e2e spec (tracked legacy location).
- `tests/pages/recaptcha-debug.html` - recaptcha debug harness.
- `tests/pages/test.html` - general test page.
- `tests/pages/test_checkin_system.html` - checkin test page.
- `tests/pages/test_firebase_messaging.html` - messaging test page.
- `tests/pages/test_integration.html` - integration test page.
- `tests/pages/test_map_system.html` - map test page.
- `tests/pages/test_storage.html` - storage test page.
- `tests/setup.js` - test initialization.
- `tests/unit/README.md` - unit test docs.
- `tests/unit/features/users/user_manager.test.js` - user manager unit tests.
- `tests/unit/lib/storage.test.js` - storage unit tests.

#### Emulator metadata

- `emulator-data/firebase-export-metadata.json` - emulator export metadata.
- `emulator-data/firestore_export/firestore_export.overall_export_metadata` - Firestore export metadata.

---

### 5.2 Active Implementation Baseline (newer paths in working tree)

#### Root operational scripts and helpers

- `start-trace.js` - starts emulators, CSS build, Vite, and app server.
- `shutdown-trace.js` - coordinated shutdown utility.
- `start-emulators-with-users.js` - emulator startup and user setup.
- `setup-test-users.js` - seed auth/firestore users and roles.
- `setup-users-after-emulators.js` - post-start user bootstrap.
- `run-tests.cjs` - test dispatcher.
- `postcss.config.js` - postcss config.
- `tailwind.config.js` - tailwind config.
- `css/tailwind.css` - generated tailwind output.

#### New frontend stack (`trace/v2-frontend`)

- `trace/v2-frontend/package.json` - frontend package and scripts.
- `trace/v2-frontend/vite.config.js` - Vite configuration.
- `trace/v2-frontend/index.html` - frontend entry HTML.
- `trace/v2-frontend/src/main.js` - frontend bootstrap (debug import style).
- `trace/v2-frontend/src/app.js` - route handling and page rendering.
- `trace/v2-frontend/src/shared/router.js` - class-based router (parallel approach to app.js router logic).
- `trace/v2-frontend/src/pages/home-page.js` - home page render.
- `trace/v2-frontend/src/pages/user-page.js` - user page placeholder/renderer.
- `trace/v2-frontend/src/pages/object-page.js` - major feature page (object check-in, notifications, translation).
- `trace/v2-frontend/src/shared/lib/firebase_config.js` - firebase config for v2 frontend.
- `trace/v2-frontend/src/shared/modules/translation/translation.js` - i18n runtime.
- `trace/v2-frontend/src/shared/modules/translation/json/da_DK.json` - Danish locale.
- `trace/v2-frontend/src/shared/modules/translation/json/en_GB.json` - English locale.
- `trace/v2-frontend/public/firebase-messaging-sw.js` - service worker for push flows.
- `trace/v2-frontend/public/locales/da_DK.json` - locale file.
- `trace/v2-frontend/public/locales/en_GB.json` - locale file.

#### New admin stack (`trace/admin` and frontend admin feature mirror)

- `trace/admin/index.html` - admin shell entry.
- `trace/admin/package.json` - admin package.
- `trace/admin/css/admin.css` - admin styles.
- `trace/admin/js/main.js` - admin entry script.
- `trace/admin/js/admin.js` - admin app orchestrator and module wiring.
- `trace/admin/js/components/AdminPanel.js` - overview/dashboard component.
- `trace/admin/js/components/AuthManager.js` - admin auth handling.
- `trace/admin/js/components/ObjectManager.js` - object admin features.
- `trace/admin/js/components/UserManager.js` - user admin features.
- `trace/admin/js/components/NotificationManager.js` - token and notification admin.
- `trace/admin/js/components/SystemManager.js` - system controls.
- `trace/admin/js/components/UrlNameManager.js` - URL name generation/management.
- `trace/admin/js/services/FirebaseService.js` - Firebase service wrapper.
- `trace/admin/js/services/ModalService.js` - modal utility.
- `trace/admin/js/services/ToastService.js` - toast utility.

Mirror/variant files also exist under:
- `trace/v2-frontend/src/features/admin/*`

This duplicate admin implementation should be treated as a consolidation target.

#### Extended scripts and migrations

- `migration-scripts/migrate-to-objects.js` - object ID migration utility.
- `migration-scripts/migrate-to-uuid-system.js` - UUID migration path.
- `scripts/add-admin-users.js` and `.cjs` - admin user setup.
- `scripts/add-admin-roles.cjs` - role assignment.
- `scripts/add-users-to-firestore.cjs` - user import.
- `scripts/fix-firestore-users.cjs` - corrective user document updates.
- `scripts/setup-database.js` - seed/setup utility.
- `scripts/setup-database.js` - database bootstrapping.
- `scripts/test-database-setup.js` - setup validation.
- `scripts/test-simply-api.js` - simply API checks.
- `trace/add-url-names.cjs` - URL name backfill helper used by emulator startup.

#### Modern QA paths (`tests`)

- `tests/package.json` - Playwright test package.
- `tests/playwright.config.js` - browser matrix + base URL.
- `tests/README.md` - notification-focused testing guide.
- `tests/e2e/*.spec.js` - primary E2E specs.
- `run-tests.cjs` - canonical test dispatcher.
- `tests/cursor-test-framework.cjs`, `tests/test-framework.cjs` - supporting test frameworks.
- `tests/setup-db.js`, `tests/setup-database-collections.js` - test DB setup.
- `tests/test-*.html/js` and `tests/pages/*.html` - many manual test harnesses.

## 6) QA and Smoke Test Baseline Matrix

### Smoke suite S0 (must pass every run)

1. **Service boot**
   - Start emulators + app stack with one canonical command.
   - Confirm app route and admin route respond.
2. **Public routes**
   - `/`
   - `/{urlName}`
   - `/{urlName}/{petName}`
3. **Pet checkin flow**
   - open pet page
   - submit checkin
   - verify Firestore write and UI success state
4. **Notification toggle**
   - enable/disable pet-specific notifications
   - verify localStorage + UI reflects state
5. **Admin auth + load**
   - admin login path
   - load users and pets section without runtime error
6. **Security sanity (local-only)**
   - document open Firestore rules are for emulator only

### Regression suite S1 (daily)

- E2E notifications (cross-device)
- Role and URL name management scripts
- Translation loading (en_GB / da_DK)
- Geolocation fallback behavior
- Startup/shutdown scripts consistency checks

### Deep QA suite S2 (release gate)

- Data migration scripts dry-run and rollback checks
- Cloud Functions endpoint behavior and failure handling
- Browser matrix from Playwright projects
- Performance and reliability under repeated checkins

## 7) Known Risk Register for QA

- **R1 Path drift**: servers/scripts may point to wrong frontend/admin root.
- **R2 Duplicate implementations**: admin code duplicated in two trees.
- **R3 Open rules**: potential accidental deployment with permissive rules.
- **R4 Legacy tests**: tests tied to removed `js/*` files may fail noisily.
- **R5 Port overlap**: shared/assumed ports can mask failures.

## 8) Immediate Documentation Follow-ups

- Align all docs to one canonical runtime path (`trace/*` or root path strategy).
- Add a single authoritative startup section (one command and expected services).
- Add environment profiles:
  - local emulator
  - staging
  - production
- Mark legacy file groups as deprecated with removal timeline.

## 9) Suggested Next Documentation Artifacts

- `docs/QA_SMOKE_CHECKLIST.md` (step-by-step runbook)
- `docs/ROUTE_TO_COMPONENT_MATRIX.md` (source-of-truth path map)
- `docs/SCRIPT_CATALOG.md` (all scripts with inputs/outputs/side effects)
- `docs/SECURITY_PROFILES.md` (local vs production rules and keys)

---

This file is intended as the QA/smoke baseline source of truth while migration is in progress.
