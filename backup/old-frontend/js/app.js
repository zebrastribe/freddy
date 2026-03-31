/**
 * Main Application Entry Point
 * Enhanced for Multi-User, Multi-Pet System with UUID Support
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

import { SPARouter } from './router.js';
import { PetUUIDManager } from './features/pets/pet_uuid_manager.js';
import { UserUUIDManager } from './features/users/user_uuid_manager.js';
import { UniqueConstraintsManager } from './features/infrastructure/unique_constraints_manager.js';
import { PetManager } from './features/pets/pet_manager.js';
import { UserManager } from './features/users/user_manager.js';
import { CheckInManager } from './features/checkin/checkin_manager.js';
import { MapManager } from './features/maps/map_manager.js';
import { NotificationPreferences } from './features/notifications/notification_preferences.js';
import { FirebaseMessaging } from './features/notifications/firebase_messaging.js';
import { PermissionMiddleware } from './features/users/permission_middleware.js';
import { AuthManager } from './features/users/auth_manager.js';
import { DNSManager } from './features/infrastructure/dns_manager.js';
import { Translation } from './modules/translation/translation.js';
import { logTokenFromUrl, isTokenValid } from './incoming.js';

import { getConfig } from './config.js';

/**
 * Multi-User Pet Application
 * Handles the complete multi-user, multi-pet system
 */
export class MultiUserApp {
  constructor() {
    this.config = getConfig();
    this.firebaseApp = null;
    this.auth = null;
    this.db = null;
    
    // Core managers
    this.petUUIDManager = new PetUUIDManager();
    this.userUUIDManager = new UserUUIDManager();
    this.uniqueConstraintsManager = null;
    
    // Feature managers
    this.petManager = null;
    this.userManager = null;
    this.checkInManager = null;
    this.mapManager = null;
    this.dnsManager = null;
    this.permissionMiddleware = null;
    
    // Router
    this.router = null;
    
    // Notification system
    this.notificationPreferences = null;
    this.firebaseMessaging = null;
    
    // State
    this.currentUser = null;
    this.currentPet = null;
    this.isInitialized = false;

    // --- Pagination state ---
    this.currentCheckInPage = 1;
    this.checkInPageSize = 10;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      console.log('🚀 Initializing Multi-User Pet Application...');
      
      // Initialize Firebase
      await this.initializeFirebase();
      
      // Initialize managers
      await this.initializeManagers();
      
      // Initialize router
      await this.initializeRouter();
      
      // Initialize notification system
      await this.initializeNotifications();
      
      // Set up auth state listener
      this.setupAuthStateListener();
      
      // Sync current pet from router if available
      await this.syncCurrentPetFromRouter();
      
      // --- Legacy check-in form setup ---
      this.setupLegacyCheckInForm();
      
      // Load existing check-ins on page load
      await this.loadAndRenderCheckIns();
      
      this.isInitialized = true;
      console.log('✅ Multi-User Pet Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize Firebase
   */
  async initializeFirebase() {
    try {
      this.firebaseApp = initializeApp(this.config.firebase);
      this.auth = getAuth(this.firebaseApp);
      this.db = getFirestore(this.firebaseApp);
      
      // Connect to emulators in local development
      if (window.location.hostname === "localhost") {
        const { connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        const { connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js');
        
        connectFirestoreEmulator(this.db, "localhost", 8080);
        connectAuthEmulator(this.auth, "http://localhost:9099");
        console.log("[DEBUG] Connected to Firestore and Auth emulators");
      }
      
      // Expose Firebase globally for router access
      window.firebaseApp = this.firebaseApp;
      window.firebaseDB = this.db;
      window.firebaseAuth = this.auth;
      
      console.log('✅ Firebase initialized');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize all managers
   */
  async initializeManagers() {
    try {
      // Initialize unique constraints manager
      this.uniqueConstraintsManager = new UniqueConstraintsManager(this.firebaseApp);
      
      // Initialize auth manager first
      this.authManager = new AuthManager(this.firebaseApp);
      
      // Wait for auth manager to be initialized
      await this.authManager.waitForInitialization();
      
      // Verify auth manager is working
      if (typeof this.authManager.isAuthenticated !== 'function') {
        console.error('AuthManager not properly initialized, creating fallback');
        // Create a simple fallback auth manager
        this.authManager = {
          isAuthenticated: () => false,
          getCurrentUser: () => null,
          getUserRole: () => 'GUEST',
          getUserPermissions: () => [],
          isAdmin: () => false,
          isSuperAdmin: () => false,
          hasPermission: () => false
        };
      }
      
      // Initialize permission middleware with auth manager
      this.permissionMiddleware = new PermissionMiddleware(this.authManager);
      
      // Initialize pet manager
      this.petManager = new PetManager(this.firebaseApp, this.auth, this.permissionMiddleware);
      
      // Initialize user manager
      this.userManager = new UserManager(this.db, this.auth, this.config);
      
      // Initialize check-in manager
      this.checkInManager = new CheckInManager(this.db, this.auth, this.config, this.permissionMiddleware, this.petManager);
      
      // Initialize map manager
      this.mapManager = new MapManager(this.config);
      
      // Initialize maps
      try {
        await this.mapManager.initializeMaps();
        console.log('✅ Maps initialized successfully');
      } catch (error) {
        console.warn('⚠️ Maps initialization failed (non-critical):', error);
        // Don't throw error - maps are optional
      }
      
      // Initialize DNS manager (if credentials available)
      if (this.config.dns && this.config.dns.apiKey) {
        this.dnsManager = new DNSManager(
          this.config.dns.apiKey,
          this.config.dns.accountNo,
          this.config.dns
        );
      }
      
      console.log('✅ All managers initialized');
    } catch (error) {
      console.error('❌ Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize router
   */
  async initializeRouter() {
    try {
      // Use the globally initialized router instead of creating a new one
      if (window.router) {
        this.router = window.router;
        console.log('✅ Router already initialized, using global instance');
    } else {
        const { SPARouter } = await import('./router.js');
        this.router = new SPARouter();
        await this.router.init();
        console.log('✅ Router initialized');
      }
    } catch (error) {
      console.error('❌ Router initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize notification system
   */
  async initializeNotifications() {
    try {
      // Initialize Firebase messaging with correct parameters
      const vapidKey = this.config.firebase?.vapidKey || null;
      this.firebaseMessaging = new FirebaseMessaging(
        this.firebaseApp, 
        this.db, 
        vapidKey,
        this.currentUser?.uid || null,
        this.currentPet?.id || null
      );
      await this.firebaseMessaging.initialize();
      
      console.log('✅ Notification system initialized');
    } catch (error) {
      console.error('❌ Notification system initialization failed:', error);
      // Don't throw error - notifications are optional
    }
  }

  /**
   * Set up authentication state listener
   */
  setupAuthStateListener() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;
      
      if (user) {
        console.log('👤 User authenticated:', user.uid);
        await this.handleUserLogin(user);
      } else {
        console.log('👤 User signed out');
        await this.handleUserLogout();
      }
    });
  }

  /**
   * Handle user login
   */
  async handleUserLogin(user) {
    try {
      // Create or get user profile
      await this.userManager.createOrGetUser(user.uid, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
      
      // Update notification preferences for user
      if (this.currentPet) {
        this.notificationPreferences = new NotificationPreferences(
          this.db, 
          user.uid, 
          this.currentPet.id
        );
      }
      
      console.log('✅ User login handled');
    } catch (error) {
      console.error('❌ User login handling failed:', error);
    }
  }

  /**
   * Handle user logout
   */
  async handleUserLogout() {
    try {
      this.currentPet = null;
      this.notificationPreferences = null;
      
      console.log('✅ User logout handled');
  } catch (error) {
      console.error('❌ User logout handling failed:', error);
    }
  }

  /**
   * Create a new pet with UUID
   */
  async createPet(petData, userId) {
    try {
      // Generate pet UUID (new simplified format)
      const petUUID = this.petUUIDManager.generatePetUUID(petData.name);
      
      // Check uniqueness
      const isUnique = await this.uniqueConstraintsManager.isPetUUIDUnique(petUUID);
      if (!isUnique) {
        throw new Error('Pet UUID collision detected');
      }
      
      // Reserve pet UUID
      await this.uniqueConstraintsManager.reservePetUUID(petUUID, {
        petName: petData.name,
        userId: userId
      });
      
      // Create pet
      const pet = await this.petManager.createPet(petData, userId, this.config.dns);
      
      console.log('✅ Pet created with UUID:', petUUID);
      return pet;
  } catch (error) {
      console.error('❌ Pet creation failed:', error);
      throw error;
    }
  }

  /**
   * Create a new user with UUID
   */
  async createUser(userData) {
    try {
      // Generate user ID
      const userID = this.userUUIDManager.generateUserID(userData.username);
      
      // Check uniqueness
      const isUnique = await this.uniqueConstraintsManager.isUserIDUnique(userID);
      if (!isUnique) {
        throw new Error('User ID collision detected');
      }
      
      // Reserve user ID
      await this.uniqueConstraintsManager.reserveUserID(userID, {
        username: userData.username
      });
      
      // Create user
      const user = await this.userManager.createUser(userID, userData);
      
      console.log('✅ User created with ID:', userID);
      return user;
    } catch (error) {
      console.error('❌ User creation failed:', error);
      throw error;
    }
  }

  /**
   * Get pet by UUID
   */
  async getPet(petUUID) {
    try {
      // Validate pet UUID
      if (!this.petUUIDManager.isValidPetUUID(petUUID)) {
        throw new Error('Invalid pet UUID format');
      }
      
      const pet = await this.petManager.getPet(petUUID);
      this.currentPet = pet;
      
      return pet;
    } catch (error) {
      console.error('❌ Pet retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userID) {
    try {
      // Validate user ID
      if (!this.userUUIDManager.isValidUserID(userID)) {
        throw new Error('Invalid user ID format');
      }
      
      const user = await this.userManager.getUser(userID);
      return user;
    } catch (error) {
      console.error('❌ User retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Create check-in for current pet
   */
  async createCheckIn(checkinData) {
    try {
      if (!this.currentPet) {
        throw new Error('No current pet selected');
      }
      
      const checkin = await this.checkInManager.createCheckIn(checkinData, this.currentPet.id);
      
      // Update map if available
      if (this.mapManager && this.mapManager.isMapsInitialized()) {
        this.mapManager.updateMap(checkinData.latitude, checkinData.longitude);
      }
      
      console.log('✅ Check-in created');
      return checkin;
    } catch (error) {
      console.error('❌ Check-in creation failed:', error);
      throw error;
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  /**
   * Get application status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentUser: this.currentUser,
      currentPet: this.currentPet,
      managers: {
        pet: !!this.petManager,
        user: !!this.userManager,
        checkIn: !!this.checkInManager,
        map: !!this.mapManager,
        dns: !!this.dnsManager,
        notifications: !!this.firebaseMessaging
      }
    };
  }

  /**
   * Update notification system for current pet
   */
  async updateNotificationSystem() {
    try {
      if (this.firebaseMessaging && this.currentUser && this.currentPet) {
        // Update the Firebase messaging instance with new pet information
        this.firebaseMessaging.userId = this.currentUser.uid;
        this.firebaseMessaging.petId = this.currentPet.id;
        
        // Re-save the FCM token with the new pet information
        const currentToken = this.firebaseMessaging.getToken();
        if (currentToken) {
          await this.firebaseMessaging.saveToken(currentToken);
          console.log(`✅ Updated notification system for pet: ${this.currentPet.name} (${this.currentPet.id})`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to update notification system:', error);
    }
  }

  /**
   * Sync current pet from router info
   */
  async syncCurrentPetFromRouter() {
    try {
      if (window.currentPetInfo) {
        const { userId, petName, petUUID } = window.currentPetInfo;
        
        try {
          // Try to get the pet using the UUID
          const pet = await this.getPet(petUUID);
          
          // Store the current pet
          this.currentPet = pet;
          
          // Update notification preferences for this pet
          if (this.currentUser && pet) {
            this.notificationPreferences = new NotificationPreferences(
              this.db, 
              this.currentUser.uid, 
              pet.id
            );
            
            // Update the notification system for the new pet
            await this.updateNotificationSystem();
          }
          
          // Check if pet is missing and show warning
          await this.checkMissingPetWarning();
          
          console.log(`✅ Synced existing pet: ${petName} (${petUUID})`);
          return pet;
        } catch (petError) {
          // Pet doesn't exist in database, but that's okay for check-ins
          // We can still allow check-ins without creating the pet
          console.log(`ℹ️ Pet not found in database: ${petName} (${petUUID}) - continuing without pet creation`);
          
          // Store the pet info for check-ins to use
          this.currentPet = {
            id: petUUID,
            name: petName,
            userId: userId
          };
          
          // Hide warning since pet doesn't exist in database
          this.hideMissingPetWarning();
          
          return this.currentPet;
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync current pet from router:', error);
      this.hideMissingPetWarning();
    }
  }

  /**
   * Load and render check-ins for the current pet, with pagination
   */
  async loadAndRenderCheckIns(page = this.currentCheckInPage, pageSize = this.checkInPageSize) {
    const tableBody = document.getElementById('checkInsList');
    if (!tableBody || !this.checkInManager) {
      console.log('loadAndRenderCheckIns: tableBody or checkinManager not found', { 
        tableBody: !!tableBody, 
        checkinManager: !!this.checkInManager 
      });
      return;
    }

    try {
      console.log('loadAndRenderCheckIns: Fetching public check-ins for current pet...');
      let checkIns = [];
      let totalCheckIns = 0;
      // Get current pet info from router
      if (window.currentPetInfo && window.currentPetInfo.petUUID) {
        const petUUID = window.currentPetInfo.petUUID;
        console.log('loadAndRenderCheckIns: Loading public check-ins for pet UUID:', petUUID);
        // Get all check-ins for this specific pet (public access)
        const allCheckIns = await this.checkInManager.getPetCheckIns(petUUID, 1000);
        totalCheckIns = allCheckIns.length;
        // Paginate
        const start = (page - 1) * pageSize;
        checkIns = allCheckIns.slice(start, start + pageSize);
      } else {
        console.log('loadAndRenderCheckIns: No current pet info, loading all public check-ins');
        const allCheckIns = await this.checkInManager.getPublicCheckIns(1000);
        totalCheckIns = allCheckIns.length;
        const start = (page - 1) * pageSize;
        checkIns = allCheckIns.slice(start, start + pageSize);
      }
      this.currentCheckInPage = page;
      this.checkInPageSize = pageSize;
      // ... existing code for rendering table ...
      tableBody.innerHTML = '';
      if (checkIns.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            Ingen check-ins fundet for denne pet endnu.
          </td>
        `;
        tableBody.appendChild(noDataRow);
      } else {
        checkIns.forEach(checkin => {
          const row = document.createElement('tr');
          let timestamp;
          try {
            if (checkin.timestamp?.toDate) {
              timestamp = checkin.timestamp.toDate();
            } else if (checkin.timestamp?.seconds) {
              timestamp = new Date(checkin.timestamp.seconds * 1000);
            } else {
              timestamp = new Date(checkin.timestamp);
            }
          } catch (error) {
            console.warn('Error parsing timestamp:', error);
            timestamp = new Date();
          }
          row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${checkin.name || 'Anonym'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.latitude?.toFixed(6) || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.longitude?.toFixed(6) || 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp.toLocaleDateString('da-DK')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${timestamp.toLocaleTimeString('da-DK')}</td>
          `;
          tableBody.appendChild(row);
        });
      }
      // Update next/prev button state
      const prevBtn = document.getElementById('prevPage');
      const nextBtn = document.getElementById('nextPage');
      if (prevBtn) prevBtn.disabled = (page <= 1);
      if (nextBtn) nextBtn.disabled = (page * pageSize >= totalCheckIns);
      // Render markers on the map if available
      if (this.mapManager && typeof this.mapManager.renderCheckInMarkers === 'function') {
        this.mapManager.renderCheckInMarkers(checkIns);
      }
    } catch (error) {
      console.error('Error loading check-ins:', error);
      const errorRow = document.createElement('tr');
      errorRow.innerHTML = `
        <td colspan="5" class="px-6 py-4 text-center text-red-500">
          Fejl ved indlæsning af check-ins: ${error.message}
        </td>
      `;
      tableBody.innerHTML = '';
      tableBody.appendChild(errorRow);
    }
  }

  setupLegacyCheckInForm() {
    const form = document.getElementById('legacy-checkin-form');
    const getLocationBtn = document.getElementById('legacy-get-location-btn');
    const nameInput = document.getElementById('legacy-name');
    const latInput = document.getElementById('legacy-latitude');
    const lngInput = document.getElementById('legacy-longitude');
    const submitBtn = document.getElementById('legacy-submit-btn');
    const spinner = document.getElementById('spinner');
    const successMsg = document.getElementById('success-message');

    if (!form) return;

    // Get location button
    if (getLocationBtn) {
      getLocationBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          return;
        }
        getLocationBtn.disabled = true;
        getLocationBtn.textContent = 'Henter position...';
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const latitude = pos.coords.latitude;
            const longitude = pos.coords.longitude;
            
            // Update input fields
            latInput.value = latitude;
            lngInput.value = longitude;
            
            // Update map to show the marker at the obtained position
            if (this.mapManager && this.mapManager.isMapsInitialized()) {
              this.mapManager.updateMap(latitude, longitude);
            }
            
            getLocationBtn.textContent = '📍 Få position';
            getLocationBtn.disabled = false;
          },
          (err) => {
            alert('Kunne ikke hente position: ' + err.message);
            getLocationBtn.textContent = '📍 Få position';
            getLocationBtn.disabled = false;
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.classList.remove('hidden');
      if (successMsg) successMsg.classList.add('hidden');
      try {
        const name = nameInput.value.trim();
        const latitude = parseFloat(latInput.value);
        const longitude = parseFloat(lngInput.value);
        if (!name || isNaN(latitude) || isNaN(longitude)) {
          alert('Udfyld navn og hent position først!');
          if (submitBtn) submitBtn.disabled = false;
          if (spinner) spinner.classList.add('hidden');
          return;
        }
        // Use legacy check-in method with current pet UUID if available
        const petUUID = window.currentPetInfo?.petUUID;
        const checkin = await this.checkInManager.createLegacyCheckIn({ 
          name, 
          latitude, 
          longitude,
          petId: petUUID // Include current pet UUID if available
        });
        if (successMsg) {
          successMsg.textContent = 'Check-in registreret!';
          successMsg.classList.remove('hidden');
        }
        form.reset();
        
        // Update main map to show the new check-in location
        if (this.mapManager && this.mapManager.isMapsInitialized()) {
          this.mapManager.updateMap(latitude, longitude);
        }
        
        // Reload check-ins and update map/table
        await this.loadAndRenderCheckIns();
      } catch (err) {
        alert('Fejl ved check-in: ' + (err.message || err));
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.classList.add('hidden');
      }
    });
  }

  // Add event listeners for next/prev buttons after DOM is ready
  static setupCheckInPagination(appInstance) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    if (prevBtn) {
      prevBtn.addEventListener('click', async () => {
        if (appInstance.currentCheckInPage > 1) {
          await appInstance.loadAndRenderCheckIns(appInstance.currentCheckInPage - 1);
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        await appInstance.loadAndRenderCheckIns(appInstance.currentCheckInPage + 1);
      });
    }
  }

  /**
   * Check if current pet is missing and show warning banner
   */
  async checkMissingPetWarning() {
    try {
      if (!this.currentPet) {
        this.hideMissingPetWarning();
        return;
      }

      // Get the current pet's status
      const petStatus = await this.petManager.getPetStatus(this.currentPet.id);
      
      if (petStatus && petStatus.status === 'MISSING') {
        this.showMissingPetWarning(this.currentPet);
      } else {
        this.hideMissingPetWarning();
      }
    } catch (error) {
      console.error('❌ Failed to check missing pet warning:', error);
      // Don't show error to user, just hide the warning
      this.hideMissingPetWarning();
    }
  }

  /**
   * Show missing pet warning banner
   * @param {Object} pet - Pet object with name and contact info
   */
  showMissingPetWarning(pet) {
    const warningElement = document.getElementById('freddy-warning');
    if (!warningElement) {
      console.warn('Missing pet warning element not found');
      return;
    }

    // Update the warning text with the pet's name
    const petName = pet.name || 'Freddy';
    const contactNumber = pet.contactNumber || '+4531641301';
    
    warningElement.innerHTML = `
      ⚠️ ${petName} er efterlyst! Hvis du ser ham, så rapportér det venligst på 
      <a href="tel:${contactNumber}" style="color:inherit; text-decoration:underline;">${contactNumber}</a>.
    `;
    
    warningElement.style.display = 'block';
    console.log(`⚠️ Showing missing pet warning for: ${petName}`);
  }

  /**
   * Hide missing pet warning banner
   */
  hideMissingPetWarning() {
    const warningElement = document.getElementById('freddy-warning');
    if (warningElement) {
      warningElement.style.display = 'none';
    }
  }
}

// Global app instance
let app = null;
let router = null;

// Global translation instance
let translation = null;

/**
 * Initialize router immediately for direct URL access
 */
async function initializeRouterImmediately() {
  try {
    const { SPARouter } = await import('./router.js');
    router = new SPARouter();
    await router.init();
    console.log('✅ Router initialized immediately for direct URL access');
  } catch (error) {
    console.error('❌ Router initialization failed:', error);
  }
}

/**
 * Initialize the application when DOM is ready
 */
async function startApp() {
  try {
    // Initialize translation system
    translation = new Translation();
    await translation.loadTranslations();
    translation.applyTranslations();
    window.translation = translation;

    app = new MultiUserApp();
    await app.init();
    // Expose app globally for debugging
    window.app = app;
    // Setup pagination for check-in table
    MultiUserApp.setupCheckInPagination(app);
    await handleTokenValidationAndUI();
    
    console.log('🎉 Application ready!');
  } catch (error) {
    console.error('❌ Application initialization failed:', error);
  }
}

// Initialize router immediately for direct URL access
initializeRouterImmediately();

// Start the application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// Add this function after the MultiUserApp class
async function handleTokenValidationAndUI() {
  logTokenFromUrl();
  const tokenLoading = document.getElementById('token-loading');
  const tokenValid = document.getElementById('token-valid');
  const tokenInvalid = document.getElementById('token-invalid');
  // Legacy and multi-pet check-in forms
  const legacyForm = document.getElementById('legacy-checkin-form');
  const legacySubmit = document.getElementById('legacy-submit-btn');
  const multiForm = document.getElementById('checkin-form');
  const multiSubmit = document.getElementById('submit-checkin-btn');

  if (tokenLoading) tokenLoading.style.display = '';
  if (tokenValid) tokenValid.classList.add('hidden');
  if (tokenInvalid) tokenInvalid.classList.add('hidden');
  if (legacySubmit) legacySubmit.disabled = true;
  if (multiSubmit) multiSubmit.disabled = true;

  const valid = await isTokenValid();
  if (tokenLoading) tokenLoading.style.display = 'none';
  if (valid) {
    if (tokenValid) tokenValid.classList.remove('hidden');
    if (tokenInvalid) tokenInvalid.classList.add('hidden');
    if (legacySubmit) legacySubmit.disabled = false;
    if (multiSubmit) multiSubmit.disabled = false;
    if (legacyForm) legacyForm.classList.remove('disabled');
    if (multiForm) multiForm.classList.remove('disabled');
  } else {
    if (tokenValid) tokenValid.classList.add('hidden');
    if (tokenInvalid) tokenInvalid.classList.remove('hidden');
    if (legacySubmit) legacySubmit.disabled = true;
    if (multiSubmit) multiSubmit.disabled = true;
    if (legacyForm) legacyForm.classList.add('disabled');
    if (multiForm) multiForm.classList.add('disabled');
  }
}