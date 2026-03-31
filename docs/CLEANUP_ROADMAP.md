# 🧹 Project Cleanup Roadmap

## 📋 **Overview**
This document outlines the comprehensive cleanup tasks needed to align the Freddy project with the multi-user, multi-object architecture described in `MULTI_USER_OBJECT_ANALYSIS.md`.

## 🎯 **Cleanup Goals**
1. **Remove hardcoded "Freddy" references** from infrastructure and code
2. **Implement multi-user notification system** with proper user/pet context
3. **Update documentation** to reflect current implementation status
4. **Clean up file structure** and remove obsolete files
5. **Standardize code patterns** across the codebase
6. **Update configuration files** for multi-user support

## 📊 **Current Status Assessment**

### ✅ **Completed Features**
- **SPA Server**: Node.js SPA server with dynamic routing (`/userId/petName/`)
- **URL Structure**: Working `/uid123/freddy/` format
- **Firebase Emulator**: Running with data import/export
- **Notification System**: Firebase Cloud Messaging with service worker
- **DNS Manager**: Simply.com API v2 integration
- **Pet UUID System**: UUID generation and validation

### 🔄 **In Progress**
- **Multi-user authentication**: User management system
- **Pet management**: Pet creation and management
- **Check-in system**: Integration with new URL structure

### ❌ **Needs Cleanup**
- **Hardcoded references**: "Freddy" appears in 15+ files
- **Legacy code**: Old Python server, obsolete test files
- **Documentation**: Outdated implementation status
- **File structure**: Inconsistent organization

## 🗂️ **File Structure Cleanup**

### **Root Directory Cleanup**
```
freddy/
├── 📁 docs/                    # Documentation (✅ Keep)
├── 📁 js/                      # JavaScript source (✅ Keep)
├── 📁 css/                     # Stylesheets (✅ Keep)
├── 📁 img/                     # Images (✅ Keep)
├── 📁 hosting/                 # Hosting configuration (✅ Keep)
├── 📁 functions/               # Firebase Functions (✅ Keep)
├── 📁 emulator-data/           # Firebase emulator data (✅ Keep)
├── 📁 migration-scripts/       # Database migration scripts (✅ Keep)
├── 📁 scripts/                 # Utility scripts (✅ Keep)
├── 📁 core/                    # Core functionality (✅ Keep)
├── 📁 deployment/              # Deployment configuration (✅ Keep)
├── 📁 pets/                    # Pet-specific files (🔄 Update)
├── 📁 tests/                   # Test files (🔄 Clean up)
├── 📁 admin/                   # Admin interface (🔄 Update)
├── 📁 .well-known/             # PWA configuration (✅ Keep)
├── 📁 .vscode/                 # VS Code settings (✅ Keep)
├── 📄 spa-server.js            # Node.js SPA server (✅ Keep)
├── 📄 index.html               # Main SPA entry point (✅ Keep)
├── 📄 package.json             # Node.js dependencies (✅ Keep)
├── 📄 firebase.json            # Firebase configuration (✅ Keep)
├── 📄 firestore.rules          # Firestore security rules (✅ Keep)
├── 📄 firebase-messaging-sw.js # Service worker (✅ Keep)
├── 📄 manifest.json            # PWA manifest (✅ Keep)
├── 📄 README.md                # Project documentation (🔄 Update)
└── 🗑️ OBSOLETE FILES TO REMOVE:
    ├── spa_server.py           # Old Python server
    ├── admin.html              # Old admin interface
    ├── test-*.html             # Old test files
    ├── build-css.js            # Old CSS build script
    ├── setup-*.js              # Old setup scripts
    └── .babelrc                # Old Babel config
```

### **JavaScript Structure Cleanup**
```
js/
├── 📁 features/                # Feature modules (✅ Keep)
│   ├── 📁 users/              # User management (✅ Keep)
│   ├── 📁 pets/               # Pet management (✅ Keep)
│   ├── 📁 checkin/            # Check-in system (✅ Keep)
│   ├── 📁 maps/               # Map integration (✅ Keep)
│   ├── 📁 notifications/      # Notification system (✅ Keep)
│   └── 📁 infrastructure/     # DNS and hosting (✅ Keep)
├── 📁 lib/                     # Utility libraries (✅ Keep)
├── 📁 modules/                 # Third-party modules (✅ Keep)
├── 📄 app.js                   # Main application (🔄 Update)
├── 📄 config.js                # Configuration (🔄 Update)
├── 📄 router.js                # SPA router (✅ Keep)
├── 📄 firebase-setup.js        # Firebase initialization (🔄 Update)
└── 📄 incoming.js              # Legacy file (🗑️ Remove)
```

## 🔧 **Code Cleanup Tasks**

### **1. Remove Hardcoded "Freddy" References**
**Files to update:**
- `js/app.js` - Replace hardcoded pet names
- `js/config.js` - Update configuration defaults
- `js/firebase-setup.js` - Remove hardcoded references
- `js/features/pets/pet_manager.js` - Make pet-agnostic
- `js/features/checkin/checkin_manager.js` - Update for multi-user
- `js/features/notifications/firebase_messaging.js` - Multi-user support
- `firebase-messaging-sw.js` - Multi-user routing
- `index.html` - Remove hardcoded content
- `manifest.json` - Update PWA manifest
- `firestore.rules` - Update security rules

### **2. Update Notification System**
**Tasks:**
- ✅ **Completed**: Multi-user notification preferences
- ✅ **Completed**: Service worker with user/pet routing
- 🔄 **In Progress**: Update Firebase messaging class
- ❌ **Todo**: Create notification settings UI
- ❌ **Todo**: Implement Cloud Functions for notifications

### **3. Update Database Schema**
**Collections to create:**
```javascript
// New collections for multi-user support
const collections = {
  users: {
    structure: {
      userId: 'string',
      email: 'string',
      displayName: 'string',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },
  pets: {
    structure: {
      petId: 'string',          // UUID
      userId: 'string',         // Owner
      name: 'string',
      subdomain: 'string',      // e.g., "freddy.stri.be"
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    }
  },
  checkins: {
    structure: {
      checkinId: 'string',      // UUID
      petId: 'string',          // Pet UUID
      userId: 'string',         // Pet owner
      timestamp: 'timestamp',
      location: 'string',
      notes: 'string'
    }
  },
  fcm_tokens: {
    structure: {
      userId: 'string',
      petId: 'string',
      token: 'string',
      deviceInfo: 'object',
      permissions: 'object'
    }
  },
  notification_preferences: {
    structure: {
      userId: 'string',
      petId: 'string',
      preferences: 'object',
      quietHours: 'object'
    }
  }
};
```

### **4. Update Configuration Files**
**Files to update:**
- `package.json` - Update dependencies and scripts
- `firebase.json` - Update emulator configuration
- `firestore.rules` - Update security rules for multi-user
- `tailwind.config.js` - Update for multi-user styling
- `postcss.config.js` - Update build configuration

### **5. Clean Up Test Files**
**Files to remove:**
- `test-*.html` - Old test files
- `tests/` - Legacy test directory
- `test-results/` - Old test results
- `test-report.xml` - Old test report

**Files to keep:**
- `tests/unit/` - Unit tests
- `tests/pages/` - Integration test pages
- `jest.config.js` - Test configuration

## 📚 **Documentation Updates**

### **Files to Update:**
1. **README.md** - Project overview and setup instructions
2. **docs/IMPLEMENTATION_ROADMAP.md** - Current implementation status
3. **docs/COMPONENT_ARCHITECTURE.md** - Updated architecture
4. **docs/API_REFERENCE.md** - Multi-user API documentation
5. **docs/DEPLOYMENT.md** - Updated deployment instructions
6. **docs/ADMIN_GUIDE.md** - Multi-user admin guide

### **Files to Create:**
1. **docs/MULTI_USER_SETUP.md** - Multi-user setup guide
2. **docs/NOTIFICATION_GUIDE.md** - Notification system guide
3. **docs/DATABASE_SCHEMA.md** - Database schema documentation

## 🚀 **Implementation Priority**

### **Phase 1: Core Cleanup (Week 1)**
1. Remove hardcoded "Freddy" references
2. Update notification system for multi-user
3. Clean up file structure
4. Update configuration files

### **Phase 2: Database & API (Week 2)**
1. Implement new database schema
2. Update Firestore security rules
3. Create migration scripts
4. Update API endpoints

### **Phase 3: UI & UX (Week 3)**
1. Update admin interface
2. Create notification settings UI
3. Implement pet management interface
4. Update check-in system

### **Phase 4: Testing & Documentation (Week 4)**
1. Update unit tests
2. Create integration tests
3. Update documentation
4. Final testing and validation

## ✅ **Success Criteria**
- [ ] No hardcoded "Freddy" references in code
- [ ] Multi-user notification system working
- [ ] Clean file structure with no obsolete files
- [ ] Updated documentation reflecting current state
- [ ] All tests passing
- [ ] Multi-user authentication working
- [ ] Pet management system functional
- [ ] Check-in system integrated with new URL structure

## 🔍 **Validation Checklist**
- [ ] SPA server runs without errors
- [ ] All routes return HTTP 200
- [ ] Firebase emulator connects successfully
- [ ] Notifications work for multiple users/pets
- [ ] DNS management works for new pets
- [ ] Admin interface accessible
- [ ] Documentation is up-to-date
- [ ] No console errors in browser
- [ ] All imports resolve correctly
- [ ] Security rules allow proper access

---

**Last Updated:** July 2025  
**Status:** In Progress  
**Next Review:** Weekly during cleanup process 