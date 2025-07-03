# Multi-User, Multi-Pet System Analysis

## 📊 Current System Analysis

### 1. **Existing Architecture Assessment**

#### Infrastructure Hardcoding Issues
The current system is hardcoded to "Freddy" at multiple infrastructure levels:

1. **Repository Name**: `freddy` (GitHub repo)
2. **Domain Structure**: `freddy.stri.be` → `https://zebrastribe.github.io/freddy/`
3. **Application Logic**: "Freddy" appears in 15+ files
4. **Database Collections**: `freddy_status` collection
5. **URL Structure**: All URLs contain "freddy"

#### Current Infrastructure Setup
- **DNS Provider**: Simply.com with API access
- **Hosting**: GitHub Pages (`zebrastribe.github.io/freddy/`)
- **Domain Pattern**: `{petname}.stri.be` → `https://zebrastribe.github.io/{petname}/`
- **Token System**: URL-based token validation for check-ins

#### Infrastructure Limitations
1. **Single Pet Domain**: Only `freddy.stri.be` works
2. **Repository Coupling**: One repo per pet (not scalable)
3. **Static Deployment**: Each pet requires separate GitHub Pages deployment
4. **DNS Management**: Manual DNS configuration per pet

#### Current Data Model
```javascript
// Current Firestore Collections
clicks/{checkinId} = {
  userId: string,        // Anonymous user ID
  name: string,          // User's name
  latitude: number,
  longitude: number,
  timestamp: timestamp,
  recaptchaToken: string
}

freddy_status/{statusId} = {
  mode: string           // "OK" or "MISSING"
}

fcm_tokens/{tokenId} = {
  token: string,
  deviceInfo: object
}

tokens/{tokenId} = {
  valid: boolean,
  used: boolean,
  createdAt: timestamp
}
```

#### Current Authentication
- **Anonymous Authentication**: Users get anonymous UIDs
- **Admin Authentication**: Password-based with session tokens
- **No User Profiles**: No persistent user accounts
- **No Role System**: Binary admin/user distinction

#### Current Limitations
1. **Single Pet Hardcoding**: "Freddy" appears in 15+ files
2. **No User Management**: Can't track individual users
3. **No Pet Ownership**: No concept of pet ownership
4. **Limited Scalability**: Can't support multiple pets
5. **No User Roles**: No granular permissions
6. **Infrastructure Coupling**: Repository and domain hardcoded to single pet
7. **DNS Management**: Manual DNS configuration required per pet
8. **Deployment Complexity**: Separate deployment per pet

### 2. **Impact Analysis**

#### Files Requiring Changes
```
js/app.js                    - Main application logic
js/config.js                 - Configuration and status
js/features/checkin/         - Check-in system
js/features/maps/           - Map system
js/features/notifications/   - Notification system
admin.html                   - Admin interface
firestore.rules             - Security rules
index.html                   - Main UI
translation files            - Multi-language support
```

#### Infrastructure Changes Required
```
Repository Structure         - Rename from 'freddy' to 'trace'
DNS Configuration           - Dynamic subdomain management
Deployment Strategy         - Multi-pet deployment system
Domain Management          - Simply.com API integration
```

#### Database Migration Impact
- **High**: Requires schema changes
- **Medium**: Data migration needed
- **Low**: Backward compatibility possible

## 🎯 Multi-User, Multi-Pet Requirements

### 1. **User Management Requirements**

#### User Types (Updated Role Hierarchy)
```javascript
const USER_TYPES = {
  SUPER_ADMIN: {
    level: 4,
    permissions: ['*'], // All permissions
    description: 'Full system access - can delete admins, manage everything'
  },
  ADMIN: {
    level: 3,
    permissions: [
      'manage_pets',           // Add/remove pets
      'manage_users',          // Add/remove users (except admins)
      'view_all_checkins',     // View all check-ins
      'delete_checkins',       // Delete check-ins
      'manage_tokens',         // Manage access tokens
      'view_analytics',        // View system analytics
      'manage_pet_domains'     // Manage pet-specific domains
    ],
    description: 'Pet and user management - can add pets, delete users, delete check-ins'
  },
  USER: {
    level: 2,
    permissions: [
      'create_checkins',       // Create check-ins
      'view_own_checkins',     // View own check-ins
      'manage_own_pets',       // Manage own pets
      'view_public_pets'       // View public pets
    ],
    description: 'Standard user - can check-in and manage own pets'
  },
  GUEST: {
    level: 1,
    permissions: [
      'view_public_pets',      // View public pets
      'create_checkins_with_token' // Create check-ins with valid token
    ],
    description: 'Anonymous users with tokens - limited access'
  }
};
```

#### User Profile Requirements
- **Email Registration**: Optional for anonymous users
- **Profile Information**: Display name, phone, preferences
- **Pet Ownership**: Multiple pets per user
- **Access Tokens**: Token-based access for guests
- **Notification Preferences**: Per-user settings

### 2. **Pet Management Requirements**

#### Pet Entity Structure (Enhanced)
```javascript
{
  id: "pet_123",
  name: "Anna",              // Pet name (used for domain)
  type: "cat",
  breed: "ginger",
  ownerId: "user_456",
  status: "active", // active, missing, inactive
  isPublic: true,   // Can be viewed by all users
  domain: "anna.stri.be",    // Custom domain for this pet
  githubPagesPath: "anna",   // GitHub Pages path
  createdAt: timestamp,
  updatedAt: timestamp,
  metadata: {
    description: "Adventurous ginger cat",
    birthDate: "2020-01-01",
    microchipId: "123456789",
    photoUrl: "https://...",
    color: "ginger",
    personality: "adventurous",
    tags: ["adventurous", "friendly", "ginger"]
  }
}
```

#### Pet Status Management
```javascript
{
  id: "pet_123_status",
  petId: "pet_123",
  status: "OK", // OK, MISSING, INACTIVE
  lastSeen: timestamp,
  lastLocation: {
    latitude: 55.6761,
    longitude: 12.5683
  },
  updatedAt: timestamp,
  updatedBy: "user_456"
}
```

### 3. **Infrastructure Requirements**

#### Domain Management System
```javascript
// Domain configuration for each pet
{
  petId: "pet_123",
  petName: "anna",
  domain: "anna.stri.be",
  hosting: {
    provider: "github_pages", // github_pages, firebase_hosting, custom
    baseUrl: "https://zebrastribe.github.io/trace",
    path: "/anna/",
    fullUrl: "https://zebrastribe.github.io/trace/anna/"
  },
  dnsRecords: [
    {
      type: "CNAME",
      name: "anna.stri.be",
      value: "zebrastribe.github.io"
    }
  ],
  status: "active", // active, pending, error
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Hosting Abstraction Layer
```javascript
// Hosting configuration abstraction
{
  currentProvider: "github_pages",
  providers: {
    github_pages: {
      baseUrl: "https://zebrastribe.github.io/trace",
      deploymentMethod: "git_push",
      configFile: "_config.yml"
    },
    firebase_hosting: {
      baseUrl: "https://trace-pets.web.app",
      deploymentMethod: "firebase_deploy",
      configFile: "firebase.json"
    },
    custom: {
      baseUrl: "https://trace.stri.be",
      deploymentMethod: "custom",
      configFile: "deployment.json"
    }
  },
  petPathTemplate: "/{petname}/",
  adminPath: "/admin/"
}
```

#### Repository Structure (Updated)
```
trace/                           # Main repository (renamed from 'freddy')
├── pets/                        # Pet-specific configurations
│   ├── anna/                   # Anna's pet configuration
│   │   ├── config.json         # Pet-specific settings
│   │   ├── assets/             # Pet-specific assets
│   │   ├── customizations/     # Pet-specific customizations
│   │   └── index.html          # Pet-specific entry point
│   ├── freddy/                 # Freddy's configuration (migrated)
│   └── template/               # Template for new pets
├── core/                       # Core application code
│   ├── js/                     # JavaScript modules
│   ├── css/                    # Stylesheets
│   └── shared/                 # Shared components
├── admin/                      # Admin interface
├── docs/                       # Documentation
├── deployment/                 # Deployment scripts
├── hosting/                    # Hosting abstraction layer
│   ├── providers/              # Hosting provider configurations
│   │   ├── github_pages.js     # GitHub Pages provider
│   │   ├── firebase_hosting.js # Firebase Hosting provider
│   │   └── custom.js           # Custom hosting provider
│   ├── router.js               # URL routing abstraction
│   └── config.js               # Hosting configuration
└── _config.yml                 # Jekyll configuration (GitHub Pages)
```

### 4. **Check-in System Requirements**

#### Enhanced Check-in Structure
```javascript
{
  id: "checkin_789",
  petId: "pet_123",        // NEW: Reference to specific pet
  userId: "user_456",      // Enhanced user reference
  name: "John Doe",
  latitude: 55.6761,
  longitude: 12.5683,
  timestamp: timestamp,
  recaptchaToken: string,
  domain: "anna.stri.be",  // NEW: Domain where check-in occurred
  metadata: {
    accuracy: number,      // GPS accuracy
    altitude: number,      // GPS altitude
    speed: number,         // GPS speed
    heading: number,       // GPS heading
    deviceInfo: object,    // Device information
    weather: object        // Weather at check-in time
  }
}
```

## 🏗️ Proposed Architecture

### 1. **Database Schema Design**

#### New Collections
```javascript
// users collection
users/{userId} = {
  email: string,           // Optional for anonymous users
  role: string,            // SUPER_ADMIN, ADMIN, USER, GUEST
  permissions: array,      // Array of permission strings
  createdAt: timestamp,
  lastLoginAt: timestamp,
  profile: {
    displayName: string,
    phone: string,
    preferences: {
      notifications: boolean,
      language: string,
      timezone: string
    }
  },
  pets: array,             // Array of owned pet IDs
  accessTokens: array,     // Valid access tokens
  isActive: boolean
}

// pets collection
pets/{petId} = {
  name: string,
  type: string,            // cat, dog, bird, etc.
  breed: string,
  ownerId: string,         // Reference to user
  status: string,          // active, missing, inactive
  isPublic: boolean,       // Can be viewed by all users
  domain: string,          // Custom domain (e.g., "anna.stri.be")
  hosting: {
    provider: string,      // github_pages, firebase_hosting, custom
    baseUrl: string,       // Base URL for hosting provider
    path: string,          // Path for this pet
    fullUrl: string        // Complete URL for this pet
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  metadata: object         // Flexible metadata object
}

// pet_status collection
pet_status/{petId} = {
  petId: string,           // Reference to pet
  status: string,          // OK, MISSING, INACTIVE
  lastSeen: timestamp,
  lastLocation: {
    latitude: number,
    longitude: number
  },
  updatedAt: timestamp,
  updatedBy: string        // User who updated status
}

// domains collection
domains/{domainId} = {
  petId: string,           // Reference to pet
  domain: string,          // Full domain (e.g., "anna.stri.be")
  hosting: {
    provider: string,      // github_pages, firebase_hosting, custom
    baseUrl: string,       // Base URL for hosting provider
    path: string,          // Path for this pet
    fullUrl: string        // Complete URL for this pet
  },
  dnsRecords: array,       // DNS configuration
  status: string,          // active, pending, error
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Modified Collections
```javascript
// Enhanced clicks collection
clicks/{checkinId} = {
  petId: string,           // NEW: Reference to specific pet
  userId: string,          // Enhanced user reference
  name: string,
  latitude: number,
  longitude: number,
  timestamp: timestamp,
  recaptchaToken: string,
  domain: string,          // NEW: Domain where check-in occurred
  metadata: object         // NEW: Additional check-in data
}

// Enhanced fcm_tokens collection
fcm_tokens/{tokenId} = {
  userId: string,          // NEW: Reference to user
  token: string,
  deviceInfo: object,
  createdAt: timestamp,
  lastUsed: timestamp
}
```

### 2. **Component Architecture**

#### New Components
```javascript
// js/features/users/
├── user_manager.js        // User CRUD operations
├── user_ui.js            // User interface components
├── role_manager.js       // Role and permission management
└── auth_manager.js       // Enhanced authentication

// js/features/pets/
├── pet_manager.js        // Pet CRUD operations
├── pet_ui.js            // Pet interface components
├── pet_status_manager.js // Pet status management
├── pet_selection.js     // Pet selection interface
└── pet_domain_manager.js // Domain management

// js/features/admin/
├── admin_dashboard.js    // Enhanced admin interface
├── user_management.js    // User management interface
├── pet_management.js     // Pet management interface
├── domain_management.js  // Domain management interface
└── analytics.js         // System analytics

// js/features/infrastructure/
├── dns_manager.js       // Simply.com DNS API integration
├── deployment_manager.js // GitHub Pages deployment
├── domain_validator.js  // Domain validation
├── infrastructure_monitor.js // Infrastructure monitoring
├── hosting_abstraction.js // Hosting provider abstraction
└── url_router.js       // URL routing abstraction
```

#### Enhanced Components
```javascript
// js/features/checkin/
├── checkin_manager.js    // Enhanced with petId support
├── checkin_ui.js        // Enhanced with pet selection
└── checkin_analytics.js // Check-in analytics

// js/features/maps/
├── map_manager.js       // Enhanced with multi-pet support
├── map_ui.js           // Enhanced with pet filtering
└── map_analytics.js    // Map usage analytics
```

## 🔄 Implementation Strategy

### Phase 1: Foundation & Infrastructure (Week 1-2)

#### 1.1 Repository Migration
```bash
# Rename repository from 'freddy' to 'trace'
git remote set-url origin https://github.com/zebrastribe/trace.git
git push origin main
```

#### 1.2 Infrastructure Setup
```javascript
// scripts/setup-infrastructure.js
async function setupInfrastructure() {
  // 1. Initialize Simply.com DNS API
  const dnsManager = new DNSManager(simplyApiKey);
  
  // 2. Set up GitHub Pages for multi-pet deployment
  const deploymentManager = new DeploymentManager(githubToken);
  
  // 3. Create domain management system
  const domainManager = new DomainManager(dnsManager, deploymentManager);
  
  // 4. Migrate existing Freddy configuration
  await migrateFreddyToTrace();
}
```

#### 1.3 Database Schema Migration
```javascript
// migration-script.js
async function migrateToMultiUserPet() {
  // 1. Create new collections
  await createCollections(['users', 'pets', 'pet_status', 'domains']);
  
  // 2. Create default super admin user
  const superAdmin = await createUser({
    email: 'admin@trace.com',
    role: 'SUPER_ADMIN',
    displayName: 'System Administrator'
  });
  
  // 3. Create default pet (Freddy) with domain
  const freddyPet = await createPet({
    name: 'Freddy',
    type: 'cat',
    breed: 'ginger',
    ownerId: superAdmin.id,
    status: 'active',
    isPublic: true,
    domain: 'freddy.stri.be',
    hosting: {
      provider: 'github_pages',
      baseUrl: 'https://zebrastribe.github.io/trace',
      path: '/freddy/',
      fullUrl: 'https://zebrastribe.github.io/trace/freddy/'
    },
    metadata: {
      description: 'Adventurous ginger cat with a heart as fiery as his fur!',
      personality: 'adventurous',
      color: 'ginger'
    }
  });
  
  // 4. Set up Freddy's domain
  await setupPetDomain(freddyPet);
  
  // 5. Migrate existing check-ins
  const checkIns = await getAllCheckIns();
  for (const checkIn of checkIns) {
    await updateCheckIn(checkIn.id, { 
      petId: freddyPet.id,
      domain: 'freddy.stri.be'
    });
  }
  
  // 6. Migrate freddy_status to pet_status
  const freddyStatus = await getFreddyStatus();
  await createPetStatus(freddyPet.id, freddyStatus);
}
```

### Phase 2: Domain Management System (Week 3)

#### 2.1 Simply.com DNS Integration
```javascript
// js/features/infrastructure/dns_manager.js
export class DNSManager {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.simply.com/v1';
  }
  
  async createSubdomain(petName) {
    const domain = `${petName}.stri.be`;
    const cnameRecord = {
      type: 'CNAME',
      name: domain,
      value: 'zebrastribe.github.io',
      ttl: 300
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/domains/stri.be/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cnameRecord)
      });
      
      if (!response.ok) {
        throw new Error(`DNS creation failed: ${response.statusText}`);
      }
      
      return { domain, status: 'created' };
    } catch (error) {
      console.error('DNS creation error:', error);
      throw error;
    }
  }
  
  async deleteSubdomain(petName) {
    const domain = `${petName}.stri.be`;
    // Implementation for deleting DNS records
  }
}
```

#### 2.2 Hosting Abstraction Layer
```javascript
// js/features/infrastructure/hosting_abstraction.js
/**
 * HostingAbstraction - Abstract hosting provider management
 * 
 * @class HostingAbstraction
 * @description Manages different hosting providers with a unified interface
 */
export class HostingAbstraction {
  constructor(config) {
    this.config = config;
    this.currentProvider = config.currentProvider || 'github_pages';
    this.providers = this.initializeProviders();
  }

  /**
   * Initialize hosting providers
   */
  initializeProviders() {
    return {
      github_pages: new GitHubPagesProvider(this.config.providers.github_pages),
      firebase_hosting: new FirebaseHostingProvider(this.config.providers.firebase_hosting),
      custom: new CustomHostingProvider(this.config.providers.custom)
    };
  }

  /**
   * Get current provider
   */
  getCurrentProvider() {
    return this.providers[this.currentProvider];
  }

  /**
   * Switch hosting provider
   */
  async switchProvider(newProvider) {
    if (!this.providers[newProvider]) {
      throw new Error(`Unknown hosting provider: ${newProvider}`);
    }

    // Migrate all pets to new provider
    await this.migrateAllPets(newProvider);
    this.currentProvider = newProvider;
  }

  /**
   * Create pet hosting configuration
   */
  async createPetHosting(petName, petConfig) {
    const provider = this.getCurrentProvider();
    return await provider.createPetHosting(petName, petConfig);
  }

  /**
   * Get pet URL
   */
  getPetUrl(petName) {
    const provider = this.getCurrentProvider();
    return provider.getPetUrl(petName);
  }

  /**
   * Deploy pet
   */
  async deployPet(petName, petConfig) {
    const provider = this.getCurrentProvider();
    return await provider.deployPet(petName, petConfig);
  }
}

/**
 * GitHub Pages Provider
 */
class GitHubPagesProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.deploymentMethod = config.deploymentMethod;
  }

  async createPetHosting(petName, petConfig) {
    return {
      provider: 'github_pages',
      baseUrl: this.baseUrl,
      path: `/${petName}/`,
      fullUrl: `${this.baseUrl}/${petName}/`
    };
  }

  getPetUrl(petName) {
    return `${this.baseUrl}/${petName}/`;
  }

  async deployPet(petName, petConfig) {
    // GitHub Pages deployment logic
    console.log(`Deploying ${petName} to GitHub Pages`);
  }
}

/**
 * Firebase Hosting Provider
 */
class FirebaseHostingProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.deploymentMethod = config.deploymentMethod;
  }

  async createPetHosting(petName, petConfig) {
    return {
      provider: 'firebase_hosting',
      baseUrl: this.baseUrl,
      path: `/${petName}/`,
      fullUrl: `${this.baseUrl}/${petName}/`
    };
  }

  getPetUrl(petName) {
    return `${this.baseUrl}/${petName}/`;
  }

  async deployPet(petName, petConfig) {
    // Firebase Hosting deployment logic
    console.log(`Deploying ${petName} to Firebase Hosting`);
  }
}

/**
 * Custom Hosting Provider
 */
class CustomHostingProvider {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.deploymentMethod = config.deploymentMethod;
  }

  async createPetHosting(petName, petConfig) {
    return {
      provider: 'custom',
      baseUrl: this.baseUrl,
      path: `/${petName}/`,
      fullUrl: `${this.baseUrl}/${petName}/`
    };
  }

  getPetUrl(petName) {
    return `${this.baseUrl}/${petName}/`;
  }

  async deployPet(petName, petConfig) {
    // Custom hosting deployment logic
    console.log(`Deploying ${petName} to custom hosting`);
  }
}
```

#### 2.3 URL Router Abstraction
```javascript
// js/features/infrastructure/url_router.js
/**
 * URLRouter - Handles URL routing abstraction
 * 
 * @class URLRouter
 * @description Manages URL routing independent of hosting provider
 */
export class URLRouter {
  constructor(hostingAbstraction) {
    this.hostingAbstraction = hostingAbstraction;
  }

  /**
   * Get pet URL based on current hosting provider
   */
  getPetUrl(petName) {
    return this.hostingAbstraction.getPetUrl(petName);
  }

  /**
   * Get admin URL
   */
  getAdminUrl() {
    const provider = this.hostingAbstraction.getCurrentProvider();
    return `${provider.baseUrl}/admin/`;
  }

  /**
   * Parse URL to extract pet name
   */
  parsePetFromUrl(url) {
    // Extract pet name from URL path
    const pathMatch = url.match(/\/([^\/]+)\/?$/);
    return pathMatch ? pathMatch[1] : null;
  }

  /**
   * Check if URL is for admin interface
   */
  isAdminUrl(url) {
    return url.includes('/admin/');
  }

  /**
   * Generate redirect URL for pet domain
   */
  generateRedirectUrl(petName) {
    return this.getPetUrl(petName);
  }
}
```

#### 2.4 Pet Domain Management
```javascript
// js/features/pets/pet_domain_manager.js
export class PetDomainManager {
  constructor(dnsManager, hostingAbstraction, urlRouter) {
    this.dnsManager = dnsManager;
    this.hostingAbstraction = hostingAbstraction;
    this.urlRouter = urlRouter;
  }
  
  async createPetWithDomain(petData) {
    try {
      // 1. Create pet in database
      const pet = await this.createPet(petData);
      
      // 2. Create hosting configuration
      const hostingConfig = await this.hostingAbstraction.createPetHosting(pet.name, petData);
      
      // 3. Create DNS record
      await this.dnsManager.createSubdomain(pet.name);
      
      // 4. Deploy to hosting provider
      await this.hostingAbstraction.deployPet(pet.name, petData);
      
      // 5. Update pet with domain and hosting info
      await this.updatePet(pet.id, {
        domain: `${pet.name}.stri.be`,
        hosting: hostingConfig
      });
      
      return pet;
    } catch (error) {
      console.error('Error creating pet with domain:', error);
      throw error;
    }
  }

  /**
   * Switch hosting provider for all pets
   */
  async switchHostingProvider(newProvider) {
    try {
      // 1. Switch provider in hosting abstraction
      await this.hostingAbstraction.switchProvider(newProvider);
      
      // 2. Update all pets with new hosting configuration
      const pets = await this.getAllPets();
      for (const pet of pets) {
        const newHostingConfig = await this.hostingAbstraction.createPetHosting(pet.name, pet);
        await this.updatePet(pet.id, { hosting: newHostingConfig });
      }
      
      // 3. Update DNS records if needed
      await this.updateDNSForNewProvider(newProvider);
      
      console.log(`Successfully switched to ${newProvider} hosting`);
    } catch (error) {
      console.error('Error switching hosting provider:', error);
      throw error;
    }
  }

  /**
   * Get pet URL regardless of hosting provider
   */
  getPetUrl(petName) {
    return this.urlRouter.getPetUrl(petName);
  }
}
```

### Phase 3: Authentication & Authorization (Week 4)

#### 3.1 Enhanced Authentication
```javascript
// js/features/users/auth_manager.js
export class AuthManager {
  constructor(db, auth, config) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.currentUser = null;
    this.userRole = null;
  }
  
  async registerUser(userData, role = 'USER') {
    // Create user account with role
  }
  
  async loginUser(email, password) {
    // Enhanced login with role assignment
  }
  
  hasPermission(permission) {
    // Check user permissions
  }
  
  // Role-specific methods
  async deleteUser(userId) {
    if (!this.hasPermission('manage_users')) {
      throw new Error('Insufficient permissions');
    }
    // Delete user implementation
  }
  
  async deleteAdmin(adminId) {
    if (this.userRole !== 'SUPER_ADMIN') {
      throw new Error('Only super admins can delete admins');
    }
    // Delete admin implementation
  }
}
```

#### 3.2 Security Rules Update
```javascript
// firestore.rules
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
    
    function isSuperAdmin() {
      return getUserRole() == 'SUPER_ADMIN';
    }
    
    // Pet rules
    match /pets/{petId} {
      allow read: if isAuthenticated();
      allow create: if hasPermission('manage_pets') || isSuperAdmin();
      allow update, delete: if isPetOwner(petId) || hasPermission('manage_pets') || isSuperAdmin();
    }
    
    // User rules
    match /users/{userId} {
      allow read: if request.auth.uid == userId || hasPermission('manage_users') || isSuperAdmin();
      allow write: if request.auth.uid == userId || hasPermission('manage_users') || isSuperAdmin();
      allow delete: if hasPermission('manage_users') || isSuperAdmin();
    }
    
    // Check-in rules
    match /clicks/{checkinId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && (
        hasPermission('create_checkins') || 
        getUserRole() == 'GUEST'
      );
      allow update, delete: if hasPermission('delete_checkins') || isSuperAdmin();
    }
    
    // Domain rules
    match /domains/{domainId} {
      allow read: if isAuthenticated();
      allow write: if hasPermission('manage_pet_domains') || isSuperAdmin();
    }
  }
}
```

### Phase 4: UI/UX Enhancement (Week 5)

#### 4.1 Multi-Pet Interface
- Pet selection dropdown
- Pet-specific check-in forms
- Pet status management interface
- Pet profile pages

#### 4.2 Enhanced Admin Interface
- User management dashboard
- Pet management interface
- Role assignment tools
- Domain management interface
- System analytics

### Phase 5: Testing & Migration (Week 6)

#### 5.1 Comprehensive Testing
```javascript
// tests/unit/features/users/user_manager.test.js
describe('UserManager', () => {
  test('should create user with role', async () => {
    // Test user creation
  });
  
  test('should check permissions correctly', () => {
    // Test permission system
  });
  
  test('should allow super admin to delete admins', async () => {
    // Test super admin permissions
  });
  
  test('should allow admin to delete users but not admins', async () => {
    // Test admin permissions
  });
});

// tests/unit/features/pets/pet_manager.test.js
describe('PetManager', () => {
  test('should create pet with domain', async () => {
    // Test pet creation with domain
  });
  
  test('should manage pet status', async () => {
    // Test status management
  });
});
```

#### 5.2 Data Migration
- Automated migration scripts
- Data validation
- Rollback procedures

## 📈 Benefits Analysis

### 1. **Scalability Benefits**
- **Multi-Tenant**: Support unlimited users and pets
- **Horizontal Scaling**: Distribute load across multiple pets
- **Flexible Data Model**: Extensible metadata system
- **Dynamic Domains**: Automatic domain creation per pet

### 2. **User Experience Benefits**
- **Personalized**: Each user manages their own pets
- **Family Support**: Multiple pets per family
- **Enhanced Features**: Pet-specific notifications and analytics
- **Custom Domains**: Each pet gets its own domain (anna.stri.be)

### 3. **Business Value**
- **Subscription Model**: Premium features per pet
- **Analytics**: Detailed insights per pet and user
- **Monetization**: Advanced features for power users
- **Branding**: Custom domains for each pet

### 4. **Technical Benefits**
- **Modular Architecture**: Clean separation of concerns
- **Role-Based Security**: Granular access control
- **Maintainable Code**: Well-structured components
- **Infrastructure Automation**: DNS and deployment automation
- **Hosting Agnostic**: Easy migration between hosting providers
- **URL Abstraction**: Consistent URLs regardless of hosting provider

## 🚨 Risk Assessment

### 1. **Technical Risks**
- **Migration Complexity**: High risk during data migration
- **Breaking Changes**: Potential compatibility issues
- **Performance Impact**: Additional database queries
- **DNS Management**: API failures or rate limits

### 2. **Mitigation Strategies**
- **Phased Migration**: Gradual rollout with rollback capability
- **Backward Compatibility**: Maintain existing functionality
- **Performance Optimization**: Efficient queries and caching
- **DNS Monitoring**: Automated monitoring and alerting

### 3. **User Impact**
- **Minimal Disruption**: Maintain existing user experience
- **Gradual Transition**: Optional new features
- **Clear Communication**: User education and support

### 4. **Hosting Migration Scenarios**
- **GitHub Pages → Firebase Hosting**: Seamless migration with URL preservation
- **GitHub Pages → Custom Server**: Gradual migration with DNS updates
- **Any Provider → Any Provider**: Automated migration with minimal downtime

## 🎯 Success Metrics

### 1. **Technical Metrics**
- **Migration Success Rate**: 100% data integrity
- **Performance**: <2s page load times
- **Uptime**: 99.9% availability
- **DNS Success Rate**: 99.5% domain creation success

### 2. **User Metrics**
- **User Adoption**: 80% of users try new features
- **Feature Usage**: 60% use multi-pet functionality
- **User Satisfaction**: 4.5/5 rating
- **Domain Usage**: 90% of pets have custom domains

### 3. **Business Metrics**
- **User Growth**: 50% increase in active users
- **Feature Engagement**: 40% use advanced features
- **Revenue Potential**: Subscription model viability

## 🚀 Next Steps

### Immediate Actions (Week 1)
1. **Review and Approve Design**
2. **Set up Development Environment**
3. **Create Database Migration Scripts**
4. **Begin Core Component Development**
5. **Set up Simply.com DNS API integration**

### Short-term Goals (Month 1)
1. **Complete Phase 1 Implementation**
2. **Implement Authentication System**
3. **Create Basic Multi-Pet UI**
4. **Begin Testing Suite**
5. **Deploy first multi-pet domain**

### Long-term Vision (3 Months)
1. **Full Multi-Pet Platform**
2. **Advanced Analytics**
3. **Mobile App Development**
4. **API for Third-party Integration**
5. **Automated Domain Management**

---

*This analysis provides a comprehensive roadmap for transforming Freddy into a scalable, multi-user, multi-pet platform with dynamic domain management while maintaining the existing user experience and ensuring smooth migration.*
