/**
 * Main Application - Multi-User, Multi-Pet System
 * 
 * This is the main application file that initializes and coordinates
 * all the multi-user system components while maintaining backward compatibility.
 */

// Import core modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Import configuration
import { config } from './config.js';

// Import multi-user system components
import { AuthManager } from './features/users/auth_manager.js';
import { UserManager } from './features/users/user_manager.js';
import { PermissionMiddleware } from './features/users/permission_middleware.js';
import { PetManager } from './features/pets/pet_manager.js';
import { PetUI } from './features/pets/pet_ui.js';
import { CheckInManager } from './features/checkin/checkin_manager.js';
import { CheckInUI } from './features/checkin/checkin_ui.js';

// Import legacy components for backward compatibility
import { MapManager } from './features/maps/map_manager.js';

// Import Translation class
import { Translation } from './modules/translation/translation.js';

/**
 * Main Application Class
 */
class MultiUserApp {
  /**
   * Create a new MultiUserApp instance
   */
  constructor() {
    this.firebaseApp = null;
    this.db = null;
    this.auth = null;
    this.config = config;
    
    // Multi-user system components
    this.authManager = null;
    this.userManager = null;
    this.permissionMiddleware = null;
    this.petManager = null;
    this.petUI = null;
    this.checkinManager = null;
    this.checkinUI = null;
    
    // Legacy components
    this.mapManager = null;
    
    // State
    this.isInitialized = false;
    this.currentUser = null;
    this.isLegacyMode = false;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing Multi-User Application...');
      this.updateStatus('Initializing Multi-User Application...');
      
      // Note: "heartbeats undefined" messages in console are from browser extensions, not this app
      
      // Initialize Firebase
      this.updateStatus('Initializing Firebase...');
      await this.initializeFirebase();
      
      // Initialize multi-user system
      this.updateStatus('Initializing multi-user system...');
      await this.initializeMultiUserSystem();
      
      // Check if we should run in legacy mode
      this.updateStatus('Checking application mode...');
      await this.checkLegacyMode();
      
      if (this.isLegacyMode) {
        this.updateStatus('Initializing legacy mode...');
        await this.initializeLegacyMode();
      } else {
        this.updateStatus('Initializing multi-user mode...');
        await this.initializeMultiUserMode();
      }
      
      this.isInitialized = true;
      this.updateStatus(`✅ Application initialized successfully in ${this.getCurrentMode()} mode`);
      console.log('Multi-User Application initialized successfully');
      
    } catch (error) {
      console.error('Error initializing application:', error);
      this.updateStatus(`❌ Error initializing application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize Firebase
   */
  async initializeFirebase() {
    try {
      this.firebaseApp = initializeApp(this.config.firebase);
      this.db = getFirestore(this.firebaseApp);
      this.auth = getAuth(this.firebaseApp);
      
      // Enable anonymous authentication for legacy mode
      try {
        const { signInAnonymously } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
        await signInAnonymously(this.auth);
        console.log('Anonymous authentication enabled');
      } catch (authError) {
        console.warn('Could not enable anonymous authentication:', authError.message);
        // Continue without anonymous auth - this is not critical for basic functionality
      }
      
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
      throw error;
    }
  }

  /**
   * Initialize multi-user system components
   */
  async initializeMultiUserSystem() {
    try {
      // Initialize user management first
      this.userManager = new UserManager(this.db, this.auth, this.config);
      this.authManager = new AuthManager(this.firebaseApp);
      
      // Initialize permission middleware with auth manager
      this.permissionMiddleware = new PermissionMiddleware(this.authManager);
      
      // Initialize pet management
      this.petManager = new PetManager(this.firebaseApp, this.auth, this.permissionMiddleware);
      
      // Initialize check-in management
      this.checkinManager = new CheckInManager(this.db, this.auth, this.config, this.permissionMiddleware, this.petManager);
      
      console.log('Multi-user system components initialized');
    } catch (error) {
      console.error('Error initializing multi-user system:', error);
      throw error;
    }
  }

  /**
   * Check if we should run in legacy mode
   */
  async checkLegacyMode() {
    try {
      // Check if we're on a legacy domain (freddy.stri.be)
      const isLegacyDomain = window.location.hostname === 'freddy.stri.be' || 
                            window.location.hostname === 'localhost' ||
                            window.location.pathname.includes('/freddy/');
      
      // If we're on a legacy domain, definitely run in legacy mode
      if (isLegacyDomain) {
        this.isLegacyMode = true;
        console.log('Running in legacy mode (legacy domain detected)');
        return;
      }
      
      // Try to check if there are any pets in the system
      // If this fails due to permissions, we'll default to legacy mode
      try {
        const { collection, getDocs, limit, query } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
        const petsQuery = query(collection(this.db, 'pets'), limit(1));
        const petsSnapshot = await getDocs(petsQuery);
        const hasPets = !petsSnapshot.empty;
        
        // Run in legacy mode if no pets exist in the system yet
        this.isLegacyMode = !hasPets;
        
        console.log(`Running in ${this.isLegacyMode ? 'legacy' : 'multi-user'} mode (${hasPets ? 'pets found' : 'no pets found'})`);
        
      } catch (petsError) {
        console.warn('Could not check for pets (permissions or network issue), defaulting to legacy mode:', petsError.message);
        this.isLegacyMode = true;
      }
      
    } catch (error) {
      console.error('Error checking legacy mode:', error);
      // Default to legacy mode on error
      this.isLegacyMode = true;
    }
  }

  /**
   * Initialize legacy mode (backward compatibility)
   */
  async initializeLegacyMode() {
    try {
      console.log('Initializing legacy mode for backward compatibility...');
      
      // Initialize legacy map manager
      this.mapManager = new MapManager(this.config);
      
      // Set up legacy check-in system
      await this.setupLegacyCheckIn();
      
      // Set up legacy UI
      await this.setupLegacyUI();
      
      console.log('Legacy mode initialized successfully');
    } catch (error) {
      console.error('Error initializing legacy mode:', error);
      throw error;
    }
  }

  /**
   * Initialize multi-user mode
   */
  async initializeMultiUserMode() {
    try {
      console.log('Initializing multi-user mode...');
      
      // Initialize UI components
      this.petUI = new PetUI(this.petManager, this.config);
      this.checkinUI = new CheckInUI(this.checkinManager, this.petUI, this.config);
      
      // Initialize map manager with multi-user support
      this.mapManager = new MapManager(this.config);
      
      // Set up multi-user UI
      await this.setupMultiUserUI();
      
      console.log('Multi-user mode initialized successfully');
    } catch (error) {
      console.error('Error initializing multi-user mode:', error);
      throw error;
    }
  }

  /**
   * Set up legacy check-in system
   */
  async setupLegacyCheckIn() {
    try {
      // Create a legacy check-in manager that doesn't require pet selection
      const legacyCheckinManager = new CheckInManager(this.db, this.auth, this.config, this.permissionMiddleware, this.petManager);
      
      // Override createCheckIn to not require petId
      const originalCreateCheckIn = legacyCheckinManager.createCheckIn.bind(legacyCheckinManager);
      legacyCheckinManager.createCheckIn = async (checkinData) => {
        return await originalCreateCheckIn(checkinData, null);
      };
      
      this.checkinManager = legacyCheckinManager;
      
      console.log('Legacy check-in system set up');
    } catch (error) {
      console.error('Error setting up legacy check-in:', error);
      throw error;
    }
  }

  /**
   * Set up legacy UI
   */
  async setupLegacyUI() {
    try {
      // Hide multi-user UI elements
      this.hideMultiUserElements();
      
      // Set up legacy check-in form
      this.setupLegacyCheckInForm();
      
      // Set up legacy map
      if (this.mapManager) {
        try {
          await this.mapManager.initializeMaps();
          console.log('Legacy maps initialized successfully');
        } catch (mapError) {
          console.warn('Could not initialize maps (Google Maps API or network issue):', mapError.message);
          // Continue without maps - this is not critical for basic functionality
        }
      }
      
      console.log('Legacy UI set up');
      setTimeout(() => this.loadAndRenderCheckIns(), 0);
    } catch (error) {
      console.error('Error setting up legacy UI:', error);
      throw error;
    }
  }

  /**
   * Set up multi-user UI
   */
  async setupMultiUserUI() {
    try {
      // Initialize UI components
      await this.petUI.initialize();
      await this.checkinUI.initialize();
      
      // Set up multi-user interface
      this.setupMultiUserInterface();
      
      // Set up map with pet support
      if (this.mapManager) {
        try {
          await this.mapManager.initializeMaps();
          console.log('Multi-user maps initialized successfully');
        } catch (mapError) {
          console.warn('Could not initialize maps (Google Maps API or network issue):', mapError.message);
          // Continue without maps - this is not critical for basic functionality
        }
      }
      
      console.log('Multi-user UI set up');
    } catch (error) {
      console.error('Error setting up multi-user UI:', error);
      throw error;
    }
  }

  /**
   * Set up multi-user interface
   */
  setupMultiUserInterface() {
    try {
      // Create main interface container
      const mainContainer = document.getElementById('main-container');
      if (!mainContainer) return;

      // Add multi-user interface elements
      mainContainer.innerHTML = `
        <div class="multi-user-interface">
          <div class="header">
            <h1>Pet Tracking System</h1>
            <div class="user-info" id="user-info"></div>
          </div>
          
          <div class="main-content">
            <div class="sidebar">
              <div class="pet-selection">
                <h3>Select Pet</h3>
                <select id="pet-select" class="form-control">
                  <option value="">Select a pet...</option>
                </select>
                <div id="create-pet-form-container" style="display: none;"></div>
              </div>
              
              <div class="pet-info" id="pet-info">
                <p>Select a pet to view information</p>
              </div>
            </div>
            
            <div class="content-area">
              <div class="checkin-section">
                <h3>Create Check-in</h3>
                <div id="checkin-form-container"></div>
              </div>
              
              <div class="map-section">
                <h3>Map</h3>
                <div id="map-container"></div>
              </div>
              
              <div class="checkins-section">
                <h3>Recent Check-ins</h3>
                <div id="checkins-list"></div>
              </div>
            </div>
          </div>
        </div>
      `;

      console.log('Multi-user interface set up');
    } catch (error) {
      console.error('Error setting up multi-user interface:', error);
      throw error;
    }
  }

  /**
   * Set up legacy check-in form
   */
  setupLegacyCheckInForm() {
    try {
      // The form is already in the HTML, just set up event listeners
      this.setupLegacyFormListeners();
      
      // Apply translations to the form
      if (window.translation && typeof window.translation.applyTranslations === 'function') {
        window.translation.applyTranslations();
      }

      // Automatically get location and fill hidden fields
      this.autoFillLocationForLegacyForm();

      console.log('Legacy check-in form set up');
    } catch (error) {
      console.error('Error setting up legacy check-in form:', error);
      throw error;
    }
  }

  /**
   * Automatically get user location and fill hidden fields for legacy form
   */
  async autoFillLocationForLegacyForm() {
    const latitudeField = document.getElementById('legacy-latitude');
    const longitudeField = document.getElementById('legacy-longitude');
    const submitBtn = document.getElementById('legacy-submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    try {
      const position = await this.getCurrentLocation();
      if (latitudeField) latitudeField.value = position.latitude;
      if (longitudeField) longitudeField.value = position.longitude;
      if (submitBtn) submitBtn.disabled = false;
    } catch (error) {
      console.error('Could not get location automatically:', error);
      if (submitBtn) submitBtn.disabled = false;
      // Optionally show a message to the user
    }
  }

  /**
   * Set up legacy form event listeners
   */
  setupLegacyFormListeners() {
    try {
      const form = document.getElementById('legacy-checkin-form');
      if (form) {
        form.addEventListener('submit', this.handleLegacyCheckIn.bind(this));
      }

      const locationBtn = document.getElementById('legacy-get-location-btn');
      if (locationBtn) {
        locationBtn.addEventListener('click', this.handleLegacyGetLocation.bind(this));
        }
      } catch (error) {
      console.error('Error setting up legacy form listeners:', error);
      throw error;
    }
  }

  /**
   * Handle legacy check-in submission
   */
  async handleLegacyCheckIn(event) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const checkinData = {
        name: formData.get('name').trim(),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude'))
      };

      // Validate data
      const validation = CheckInManager.validateCheckInData(checkinData);
      if (!validation.isValid) {
        alert('Error: ' + validation.errors.join(', '));
        return;
      }

      // Create legacy check-in (allows anonymous users)
      const checkin = await this.checkinManager.createLegacyCheckIn(checkinData);
      
      event.target.reset();
      setTimeout(() => this.loadAndRenderCheckIns(), 0);
      
    } catch (error) {
      console.error('Error creating legacy check-in:', error);
      alert('Error creating check-in: ' + error.message);
    }
  }

  /**
   * Handle legacy get location
   */
  async handleLegacyGetLocation(event) {
    event.preventDefault();
    try {
      const position = await this.getCurrentLocation();
      const latitudeField = document.getElementById('legacy-latitude');
      const longitudeField = document.getElementById('legacy-longitude');
      if (latitudeField) latitudeField.value = position.latitude;
      if (longitudeField) longitudeField.value = position.longitude;

      // Add a marker on the map at the user's location
      if (this.mapManager && typeof this.mapManager.updateMap === 'function') {
        this.mapManager.updateMap(position.latitude, position.longitude);
        }
      } catch (error) {
      console.error('Error getting location:', error);
      alert('Error getting location: ' + error.message);
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Error getting location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  /**
   * Hide multi-user elements
   */
  hideMultiUserElements() {
    const elements = [
      'pet-select',
      'pet-info',
      'create-pet-form-container',
      'checkin-pet-select'
    ];
    
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'none';
    }
  });
}

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get current mode
   */
  getCurrentMode() {
    return this.isLegacyMode ? 'legacy' : 'multi-user';
  }

  /**
   * Check if application is initialized
   */
  isAppInitialized() {
    return this.isInitialized;
  }

  /**
   * Update status display
   */
  updateStatus(message) {
    const statusElement = document.getElementById('status-content');
    if (statusElement) {
      statusElement.textContent = message;
    }
    console.log('Status:', message);
  }

  // Add this function to fetch and render check-ins in legacy mode
  async loadAndRenderCheckIns() {
    const tableBody = document.getElementById('checkInsList');
    if (!tableBody || !this.checkinManager) {
      console.log('loadAndRenderCheckIns: tableBody or checkinManager not found', { 
        tableBody: !!tableBody, 
        checkinManager: !!this.checkinManager 
      });
      return;
    }
    try {
      console.log('loadAndRenderCheckIns: Fetching check-ins...');
      // Use bypassPermissions=true for legacy mode to allow public access
      const checkIns = await this.checkinManager.getAllCheckIns(100, true);
      console.log('loadAndRenderCheckIns: Found', checkIns.length, 'check-ins');
      
      tableBody.innerHTML = '';
      checkIns.forEach(checkin => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${checkin.name || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.latitude || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.longitude || ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.timestamp ? new Date(checkin.timestamp.seconds ? checkin.timestamp.seconds * 1000 : checkin.timestamp).toLocaleDateString() : ''}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${checkin.timestamp ? new Date(checkin.timestamp.seconds ? checkin.timestamp.seconds * 1000 : checkin.timestamp).toLocaleTimeString() : ''}</td>
        `;
        tableBody.appendChild(row);
      });
      console.log('loadAndRenderCheckIns: Rendered', checkIns.length, 'check-ins to table');
      // Render markers on the map
      if (this.mapManager && typeof this.mapManager.renderCheckInMarkers === 'function') {
        this.mapManager.renderCheckInMarkers(checkIns);
      }
  } catch (error) {
      console.error('Error loading check-ins:', error);
    }
  }
}

// Create and export global app instance
const app = new MultiUserApp();

// Make app available globally
window.app = app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize Translation
    window.translation = new Translation();
    await window.translation.loadTranslations();
    console.log('Translations loaded:', window.translation.translations);

    await app.initialize();
    console.log('Application ready!');

    // Localhost bypass for token check
    function bypassTokenCheckForLocalhost() {
      if (window.location.hostname === 'localhost') {
        // Hide the 'Checking token...' message
        const tokenLoading = document.getElementById('token-loading');
        if (tokenLoading) tokenLoading.style.display = 'none';

        // Enable the check-in button
        const checkInButton = document.getElementById('clickButton');
        if (checkInButton) checkInButton.disabled = false;

        // Show the form if it's hidden
        const checkInForm = document.getElementById('checkInForm');
        if (checkInForm) checkInForm.style.display = '';

        // Optionally, show a message that check-ins are enabled for localhost
        return true;
      }
      return false;
    }

    // Call this function on DOMContentLoaded or app initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bypassTokenCheckForLocalhost);
    } else {
      bypassTokenCheckForLocalhost();
    }

    // Ensure loadAndRenderCheckIns is called when the 'Freddys møder med andre' tab is clicked
    const recordedCheckInsTab = document.getElementById('recordedCheckInsTab');
    if (recordedCheckInsTab) {
      recordedCheckInsTab.addEventListener('click', () => {
        if (window.app && typeof window.app.loadAndRenderCheckIns === 'function') {
          window.app.loadAndRenderCheckIns();
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize application:', error);
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Error</h1>
        <p>Failed to initialize application: ${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
});

// Export for use in other modules
export { app, MultiUserApp };