/**
 * Simple Router for Multi-Pet SPA
 * Handles URLs like /freddy/, /anna/, etc.
 */
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentPet = null;
    this.init();
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      this.handleRoute();
    });

    // Handle initial route
    await this.handleRoute();
  }

  /**
   * Parse the current URL to extract pet name
   */
  getPetFromUrl() {
    const path = window.location.pathname;
    // Extract pet name from URL like /freddy/ -> freddy
    const match = path.match(/^\/([^\/]+)\/?$/);
    return match ? match[1] : null;
  }

  /**
   * Navigate to a pet URL
   */
  navigateToPet(petName) {
    const url = `/${petName}/`;
    window.history.pushState({ pet: petName }, '', url);
    this.handleRoute();
  }

  /**
   * Handle the current route
   */
  async handleRoute() {
    const petName = this.getPetFromUrl();
    
    if (petName) {
      // Pet-specific route
      await this.loadPetContent(petName);
    } else {
      // Root route - show pet selection
      this.showPetSelection();
    }
  }

  /**
   * Load content for a specific pet
   */
  async loadPetContent(petName) {
    try {
      this.currentPet = petName;
      
      // Update UI to show we're loading
      this.showLoading();
      
      // Load pet data from database
      const petData = await this.getPetData(petName);
      
      if (petData) {
        // Render pet-specific content
        this.renderPetContent(petData);
      } else {
        // Pet not found
        this.showPetNotFound(petName);
      }
      
    } catch (error) {
      console.error('Error loading pet content:', error);
      this.showError('Failed to load pet content');
    }
  }

  /**
   * Get pet data from database
   */
  async getPetData(petName) {
    // This will be implemented to fetch from Firestore
    // For now, return mock data
    const mockPets = {
      'freddy': {
        name: 'Freddy',
        type: 'cat',
        breed: 'ginger',
        description: 'Adventurous ginger cat with a heart as fiery as his fur!',
        status: 'active'
      },
      'anna': {
        name: 'Anna',
        type: 'cat',
        breed: 'ginger',
        description: 'Friendly and curious ginger cat',
        status: 'active'
      }
    };
    
    return mockPets[petName] || null;
  }

  /**
   * Render pet-specific content
   */
  renderPetContent(petData) {
    const contentDiv = document.getElementById('content');
    
    if (!contentDiv) {
      console.error('Content div not found in renderPetContent');
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-fade-in">
        <!-- Pet Header -->
        <div class="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
          <div class="text-center">
            <h1 class="text-4xl font-bold mb-2">${petData.name}: Hvor er du henne?</h1>
            <p class="text-primary-100 text-lg mb-2">${petData.description}</p>
            <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white bg-opacity-20">
              <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Status: ${petData.status}
            </div>
          </div>
        </div>
        
        <!-- Pet Actions -->
        <div class="px-6 py-6 bg-gray-50 border-b border-gray-200">
          <div class="text-center">
            <button class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200" onclick="app.checkIn('${petData.name}')">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Registrer dit møde med ${petData.name}
            </button>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="border-b border-gray-200">
          <nav class="flex">
            <button class="tab-btn active flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 border-primary-600 text-primary-600 bg-primary-50" data-tab="checkin">
              Check In
            </button>
            <button class="tab-btn flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="trail">
              ${petData.name}s trail
            </button>
          </nav>
        </div>
        
        <!-- Tab Content -->
        <div class="p-6">
          <div id="checkin-tab" class="tab-panel active">
            <div id="checkin-form-container"></div>
            <div id="map-container" class="mt-6"></div>
          </div>
          <div id="trail-tab" class="tab-panel hidden">
            <div id="checkins-list"></div>
            <div id="trail-map" class="mt-6"></div>
          </div>
        </div>
      </div>
    `;
    
    // Initialize pet-specific functionality
    this.initializePetFeatures(petData);
  }

  /**
   * Initialize pet-specific features
   */
  initializePetFeatures(petData) {
    // Initialize check-in form
    this.initializeCheckInForm(petData);
    
    // Initialize maps
    this.initializeMaps(petData);
    
    // Initialize tabs
    this.initializeTabs();
  }

  /**
   * Initialize check-in form for the pet
   */
  initializeCheckInForm(petData) {
    const container = document.getElementById('checkin-form-container');
    if (!container) return;
    
    container.innerHTML = `
      <form id="checkin-form" class="checkin-form">
        <div class="form-group">
          <label for="name">Dit navn</label>
          <input type="text" id="name" name="name" required maxlength="100" 
                 class="form-control" placeholder="Indtast dit navn">
        </div>
        
        <input type="hidden" id="latitude" name="latitude">
        <input type="hidden" id="longitude" name="longitude">
        <input type="hidden" id="petId" name="petId" value="${petData.name}">
        
        <div class="form-actions">
          <button type="button" id="get-location-btn" class="btn btn-secondary">
            📍 Få nuværende position
          </button>
          <button type="submit" id="submit-btn" class="btn btn-primary">
            Registrer møde med ${petData.name}
          </button>
        </div>
      </form>
    `;
    
    // Add event listeners
    this.setupCheckInFormListeners(petData);
  }

  /**
   * Setup check-in form event listeners
   */
  setupCheckInFormListeners(petData) {
    const form = document.getElementById('checkin-form');
    const getLocationBtn = document.getElementById('get-location-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (getLocationBtn) {
      getLocationBtn.addEventListener('click', () => {
        this.getCurrentLocation();
      });
    }
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitCheckIn(petData);
      });
    }
  }

  /**
   * Get current location
   */
  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          document.getElementById('latitude').value = position.coords.latitude;
          document.getElementById('longitude').value = position.coords.longitude;
          this.showSuccess('Position obtained successfully!');
        },
        (error) => {
          this.showError('Could not get location: ' + error.message);
        }
      );
    } else {
      this.showError('Geolocation is not supported by this browser.');
    }
  }

  /**
   * Submit check-in
   */
  async submitCheckIn(petData) {
    const form = document.getElementById('checkin-form');
    const formData = new FormData(form);
    
    try {
      // This would call your existing check-in logic
      console.log('Submitting check-in for', petData.name, formData);
      this.showSuccess('Check-in submitted successfully!');
    } catch (error) {
      console.error('Error submitting check-in:', error);
      this.showError('Failed to submit check-in');
    }
  }

  /**
   * Initialize maps
   */
  initializeMaps(petData) {
    // Initialize Google Maps for the pet
    console.log('Initializing maps for', petData.name);
  }

  /**
   * Initialize tab switching
   */
  initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab panel
        tabPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
      });
    });
  }

  /**
   * Show pet selection screen
   */
  showPetSelection() {
    const contentDiv = document.getElementById('content');
    
    if (!contentDiv) {
      console.error('Content div not found in showPetSelection');
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="pet-selection">
        <h1>Welcome to Pet Tracker</h1>
        <p>Select a pet to view their page:</p>
        <div class="pet-grid">
          <div class="pet-card" onclick="router.navigateToPet('freddy')">
            <h3>Freddy</h3>
            <p>Adventurous ginger cat</p>
          </div>
          <div class="pet-card" onclick="router.navigateToPet('anna')">
            <h3>Anna</h3>
            <p>Friendly ginger cat</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show loading state
   */
  showLoading() {
    const contentDiv = document.getElementById('content');
    
    if (!contentDiv) {
      console.error('Content div not found in showLoading');
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading pet information...</p>
      </div>
    `;
  }

  /**
   * Show pet not found
   */
  showPetNotFound(petName) {
    const contentDiv = document.getElementById('content');
    
    if (!contentDiv) {
      console.error('Content div not found in showPetNotFound');
      return;
    }
    
    contentDiv.innerHTML = `
      <div class="error">
        <h2>Pet Not Found</h2>
        <p>The pet "${petName}" was not found.</p>
        <button onclick="router.navigateToPet('freddy')">Go to Freddy</button>
      </div>
    `;
  }

  /**
   * Show error message
   */
  showError(message) {
    // Implement error display
    console.error(message);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Implement success display
    console.log(message);
  }
} 