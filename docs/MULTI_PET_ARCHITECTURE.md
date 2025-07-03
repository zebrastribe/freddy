# Multi-Pet Architecture & User Role System

## Overview

This document outlines the design for transforming Freddy from a single-pet application to a multi-pet platform with comprehensive user role management.

## 🏗️ Architecture Design

### 1. **Pet Abstraction Layer**

#### Current State Analysis
- **Hardcoded References**: "Freddy" appears in 15+ files
- **Single Pet Focus**: All data structures assume one pet
- **No Pet Management**: No way to add/remove pets
- **Limited Scalability**: Can't support multiple pets

#### Proposed Multi-Pet Structure

```javascript
// Pet Entity
{
  id: "pet_123",
  name: "Freddy",
  type: "cat",
  breed: "ginger",
  ownerId: "user_456",
  status: "active", // active, missing, inactive
  createdAt: timestamp,
  updatedAt: timestamp,
  metadata: {
    description: "Adventurous ginger cat",
    birthDate: "2020-01-01",
    microchipId: "123456789",
    photoUrl: "https://...",
    color: "ginger",
    personality: "adventurous"
  }
}

// Check-in with Pet Reference
{
  id: "checkin_789",
  petId: "pet_123", // Reference to specific pet
  userId: "user_456",
  name: "John Doe",
  latitude: 55.6761,
  longitude: 12.5683,
  timestamp: timestamp,
  recaptchaToken: "..."
}
```

### 2. **User Role Hierarchy**

#### Role Definitions

```javascript
// User Roles (hierarchical permissions)
const ROLES = {
  SUPER_ADMIN: {
    level: 4,
    permissions: ['*'], // All permissions
    description: 'Full system access'
  },
  ADMIN: {
    level: 3,
    permissions: [
      'manage_pets',
      'manage_users',
      'view_all_checkins',
      'delete_checkins',
      'manage_tokens',
      'view_analytics'
    ],
    description: 'Pet and user management'
  },
  USER: {
    level: 2,
    permissions: [
      'create_checkins',
      'view_own_checkins',
      'manage_own_pets',
      'view_public_pets'
    ],
    description: 'Standard user with pets'
  },
  GUEST: {
    level: 1,
    permissions: [
      'view_public_pets',
      'create_checkins_with_token'
    ],
    description: 'Anonymous users with tokens'
  }
};
```

#### User Entity Structure

```javascript
// User Entity
{
  id: "user_123",
  email: "user@example.com", // Optional for anonymous users
  role: "USER",
  permissions: ["create_checkins", "view_own_checkins"],
  createdAt: timestamp,
  lastLoginAt: timestamp,
  profile: {
    displayName: "John Doe",
    phone: "+1234567890",
    preferences: {
      notifications: true,
      language: "en"
    }
  },
  pets: ["pet_123", "pet_456"], // Owned pet IDs
  accessTokens: ["token_789"] // Valid access tokens
}
```

### 3. **Database Schema Changes**

#### New Collections

```javascript
// pets collection
pets/{petId} = {
  name: string,
  type: string,
  ownerId: string,
  status: string,
  metadata: object,
  createdAt: timestamp,
  updatedAt: timestamp
}

// users collection
users/{userId} = {
  email: string,
  role: string,
  permissions: array,
  profile: object,
  pets: array,
  accessTokens: array,
  createdAt: timestamp,
  lastLoginAt: timestamp
}

// pet_status collection (replaces freddy_status)
pet_status/{petId} = {
  status: string, // OK, MISSING, INACTIVE
  lastSeen: timestamp,
  lastLocation: {lat: number, lng: number},
  updatedAt: timestamp
}
```

#### Modified Collections

```javascript
// clicks collection (add petId)
clicks/{checkinId} = {
  petId: string, // NEW: Reference to specific pet
  userId: string,
  name: string,
  latitude: number,
  longitude: number,
  timestamp: timestamp,
  recaptchaToken: string
}

// fcm_tokens collection (add userId)
fcm_tokens/{tokenId} = {
  userId: string, // NEW: Reference to user
  token: string,
  deviceInfo: object,
  createdAt: timestamp
}
```

## 🔄 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. **Database Schema Migration**
   - Create new collections: `pets`, `users`, `pet_status`
   - Add `petId` field to existing `clicks` collection
   - Add `userId` field to `fcm_tokens` collection

2. **Pet Management System**
   - Create `PetManager` class
   - Create `PetUI` component
   - Implement CRUD operations for pets

3. **User Management System**
   - Create `UserManager` class
   - Create `UserUI` component
   - Implement role-based permissions

### Phase 2: Authentication & Authorization (Week 2)
1. **Role-Based Access Control**
   - Update Firestore security rules
   - Implement permission checking middleware
   - Create role-based UI components

2. **Enhanced Authentication**
   - Support email/password registration
   - Implement role assignment
   - Add session management

### Phase 3: UI/UX Updates (Week 3)
1. **Multi-Pet Interface**
   - Pet selection dropdown
   - Pet-specific check-in forms
   - Pet status management

2. **Admin Interface Enhancement**
   - Pet management dashboard
   - User management interface
   - Role assignment tools

### Phase 4: Migration & Testing (Week 4)
1. **Data Migration**
   - Migrate existing Freddy data to new schema
   - Create default pet and user records
   - Validate data integrity

2. **Comprehensive Testing**
   - Unit tests for new components
   - Integration tests for multi-pet flows
   - Role-based access testing

## 🛠️ Technical Implementation

### 1. **PetManager Class**

```javascript
/**
 * PetManager - Handles all pet-related operations
 * 
 * @class PetManager
 * @description Manages pet CRUD operations, status updates, and ownership
 */
export class PetManager {
  constructor(db, auth, config) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.currentPet = null;
  }

  /**
   * Create a new pet
   * @param {Object} petData - Pet information
   * @returns {Promise<Object>} Created pet document
   */
  async createPet(petData) {
    // Implementation
  }

  /**
   * Get all pets for current user
   * @returns {Promise<Array>} User's pets
   */
  async getUserPets() {
    // Implementation
  }

  /**
   * Set current active pet
   * @param {string} petId - Pet ID
   */
  async setCurrentPet(petId) {
    // Implementation
  }
}
```

### 2. **UserManager Class**

```javascript
/**
 * UserManager - Handles user authentication and role management
 * 
 * @class UserManager
 * @description Manages user accounts, roles, and permissions
 */
export class UserManager {
  constructor(db, auth, config) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.currentUser = null;
    this.userRole = null;
  }

  /**
   * Register new user with role
   * @param {Object} userData - User information
   * @param {string} role - User role
   * @returns {Promise<Object>} Created user document
   */
  async registerUser(userData, role = 'USER') {
    // Implementation
  }

  /**
   * Check if user has permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  hasPermission(permission) {
    // Implementation
  }
}
```

### 3. **Updated Firestore Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function hasPermission(permission) {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return permission in user.data.permissions;
    }
    
    function isPetOwner(petId) {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return petId in user.data.pets;
    }
    
    // Pet rules
    match /pets/{petId} {
      allow read: if isAuthenticated();
      allow create: if hasPermission('manage_pets') || getUserRole() == 'SUPER_ADMIN';
      allow update, delete: if isPetOwner(petId) || hasPermission('manage_pets') || getUserRole() == 'SUPER_ADMIN';
    }
    
    // User rules
    match /users/{userId} {
      allow read: if request.auth.uid == userId || hasPermission('manage_users') || getUserRole() == 'SUPER_ADMIN';
      allow write: if request.auth.uid == userId || hasPermission('manage_users') || getUserRole() == 'SUPER_ADMIN';
    }
    
    // Check-in rules
    match /clicks/{checkinId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        hasPermission('create_checkins') || 
        getUserRole() == 'GUEST'
      );
      allow update, delete: if hasPermission('delete_checkins') || getUserRole() == 'SUPER_ADMIN';
    }
  }
}
```

## 📊 Migration Strategy

### 1. **Data Migration Script**

```javascript
// migration-script.js
async function migrateToMultiPet() {
  // 1. Create default pet (Freddy)
  const freddyPet = await createPet({
    name: "Freddy",
    type: "cat",
    breed: "ginger",
    status: "active",
    metadata: {
      description: "Adventurous ginger cat with a heart as fiery as his fur!",
      personality: "adventurous"
    }
  });

  // 2. Create default admin user
  const adminUser = await createUser({
    email: "admin@freddy.com",
    role: "SUPER_ADMIN",
    displayName: "System Administrator"
  });

  // 3. Update existing check-ins with petId
  const checkIns = await getAllCheckIns();
  for (const checkIn of checkIns) {
    await updateCheckIn(checkIn.id, { petId: freddyPet.id });
  }

  // 4. Migrate freddy_status to pet_status
  const freddyStatus = await getFreddyStatus();
  await createPetStatus(freddyPet.id, freddyStatus);
}
```

### 2. **Backward Compatibility**

- Maintain existing API endpoints during transition
- Provide fallback to "Freddy" for existing functionality
- Gradual deprecation of hardcoded references

## 🎯 Benefits of Multi-Pet Architecture

### 1. **Scalability**
- Support unlimited pets per user
- Horizontal scaling for multiple pet owners
- Flexible pet types and metadata

### 2. **User Experience**
- Personalized pet tracking
- Family pet management
- Pet-specific notifications

### 3. **Business Value**
- Multi-tenant architecture
- Subscription-based pet management
- Advanced analytics per pet

### 4. **Technical Advantages**
- Modular, maintainable code
- Role-based security
- Extensible data model

## 🚀 Next Steps

1. **Review and Approve Design**
2. **Set up development environment**
3. **Begin Phase 1 implementation**
4. **Create comprehensive test suite**
5. **Plan deployment strategy**

---

*This architecture provides a solid foundation for scaling Freddy from a single-pet application to a comprehensive multi-pet platform with robust user management.* 