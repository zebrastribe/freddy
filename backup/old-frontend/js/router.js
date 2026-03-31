/**
 * Enhanced SPA Router with User ID Support
 * Supports URLs: /userId/petName/, /petName/, /
 */

import { PetUUIDManager } from './features/pets/pet_uuid_manager.js';
import { MapManager } from './features/maps/map_manager.js';

// Get Firestore instance from global Firebase app
function getDb() {
  if (window.firebaseDB) {
    return window.firebaseDB;
  }
  throw new Error('Firebase DB not initialized');
}

// Global flag to prevent multiple router initializations
let routerInitialized = false;

export class SPARouter {
  constructor(firebaseDB = null) {
    this.routes = new Map();
    this.currentRoute = null;
    this.petUUIDManager = new PetUUIDManager();
    this.mapManager = null;
    this.basePath = '';
    this.firebaseDB = firebaseDB;
    
    // Bind methods
    this.handleRoute = this.handleRoute.bind(this);
    this.navigate = this.navigate.bind(this);
  }

  async init() {
    // Prevent multiple initializations
    if (routerInitialized) {
      console.log('Router already initialized, skipping...');
      return;
    }
    
    routerInitialized = true;
    
    // Set up event listeners immediately
    window.addEventListener('popstate', this.handleRoute.bind(this));
    
    // Handle initial route immediately
    await this.handleRoute();
    
    // Wait for DOM to be ready for map initialization
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize map manager after DOM is ready
    try {
      this.mapManager = new MapManager();
      await this.mapManager.initializeMaps();
    } catch (error) {
      console.warn('Map initialization failed:', error);
    }
  }

  /**
   * Parse URL to extract user ID and pet name
   * Supports formats: /userId/petName/, /petName/, /
   */
  parseURL(pathname) {
    const path = pathname.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      return { type: 'home', userId: null, petName: null };
    }

    if (segments.length === 1) {
      // Single segment - could be pet name or user ID
      const segment = segments[0];
      
      // Check if it looks like a user ID (alphanumeric, 3+ chars)
      if (/^[a-zA-Z0-9]{3,}$/.test(segment)) {
        return { type: 'user', userId: segment, petName: null };
      } else {
        return { type: 'pet', userId: null, petName: segment };
      }
    }

    if (segments.length === 2) {
      // Two segments - userId/petName format
      const [userId, petNameWithSuffix] = segments;
      
      // Validate user ID format
      if (!/^[a-zA-Z0-9]{3,}$/.test(userId)) {
        return { type: 'invalid', error: 'Invalid user ID format' };
      }

      // Parse pet name and suffix (e.g., "freddy-1" -> petName: "freddy", suffix: 1)
      const petNameMatch = petNameWithSuffix.match(/^(.+?)(?:-(\d+))?$/);
      if (!petNameMatch) {
        return { type: 'invalid', error: 'Invalid pet name format' };
      }

      const [, petName, suffix] = petNameMatch;
      const petIndex = suffix ? parseInt(suffix, 10) : 0;

      return { 
        type: 'userPet', 
        userId, 
        petName, 
        petIndex,
        petNameWithSuffix 
      };
    }

    // More than 2 segments - invalid
    return { type: 'invalid', error: 'Too many URL segments' };
  }

  /**
   * Generate URL for a specific user and pet
   */
  generateURL(userId, petName, petIndex = 0) {
    if (!userId || !petName) {
      return '/';
    }
    
    // If petIndex is 0, don't add suffix (e.g., /uid123/freddy/)
    // If petIndex > 0, add suffix (e.g., /uid123/freddy-1/)
    const suffix = petIndex > 0 ? `-${petIndex}` : '';
    return `/${userId}/${petName}${suffix}/`;
  }

  /**
   * Generate URL for a specific pet by index
   */
  generateURLForPetIndex(userId, petName, petIndex) {
    return this.generateURL(userId, petName, petIndex);
  }

  /**
   * Handle route changes
   */
  async handleRoute() {
    const urlInfo = this.parseURL(window.location.pathname);
    
    // Only log if it's a different route to reduce spam
    if (!this.currentRoute || JSON.stringify(this.currentRoute) !== JSON.stringify(urlInfo)) {
      console.log('Router: Parsed URL:', urlInfo);
    }

    // Wait for DOM to be ready before rendering
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    switch (urlInfo.type) {
      case 'home':
        this.renderHome();
        break;
      
      case 'user':
        this.renderUserHome(urlInfo.userId);
        break;
      
      case 'pet':
        this.renderPetPage(null, urlInfo.petName);
        break;
      
      case 'userPet':
        this.renderPetPage(urlInfo.userId, urlInfo.petName, urlInfo.petIndex);
        break;
      
      case 'invalid':
        this.renderError(urlInfo.error);
        break;
      
      default:
        this.renderError('Unknown route');
    }

    this.currentRoute = urlInfo;
  }

  /**
   * Navigate to a new route
   */
  navigate(userId, petName) {
    const url = this.generateURL(userId, petName);
    window.history.pushState({}, '', url);
    this.handleRoute();
  }

  /**
   * Render home page
   */
  renderHome() {
    const mainContent = document.getElementById('root');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-2 sm:px-6 lg:px-8">
        <div class="w-full max-w-2xl bg-white/90 shadow-xl rounded-2xl p-8 sm:p-12 mx-auto">
          <div class="flex flex-col items-center">
            <h1 class="text-4xl font-black mb-2 text-gray-900 tracking-tight text-center">Welcome to Pet Tracker</h1>
            <p class="mb-8 text-lg text-gray-600 text-center max-w-2xl">Track your pets' check-ins and locations</p>
          </div>
          <div class="w-full mb-10">
            <h2 class="text-2xl font-bold mb-4 text-center text-gray-800">Quick Access</h2>
            <div class="flex flex-wrap gap-4 justify-center items-center overflow-x-auto pb-2">
              <a href="/uid123/freddy/" class="inline-block bg-blue-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition whitespace-nowrap">Freddy <span class="text-xs font-normal">(User: uid123)</span></a>
              <a href="/uid456/anna/" class="inline-block bg-blue-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition whitespace-nowrap">Anna <span class="text-xs font-normal">(User: uid456)</span></a>
              <a href="/uid789/max/" class="inline-block bg-blue-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition whitespace-nowrap">Max <span class="text-xs font-normal">(User: uid789)</span></a>
            </div>
          </div>
          <div class="w-full max-w-lg mx-auto">
            <h2 class="text-xl font-semibold mb-4 text-center text-gray-800">Create New Pet</h2>
            <form id="create-pet-form" class="space-y-4 bg-gray-50 p-8 rounded-xl shadow-inner">
              <div>
                <label for="new-user-id" class="block text-sm font-medium text-gray-700 mb-1">User ID:</label>
                <input type="text" id="new-user-id" required pattern="[a-zA-Z0-9]{3,}" placeholder="e.g., uid123" title="3+ alphanumeric characters" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white" />
              </div>
              <div>
                <label for="new-pet-name" class="block text-sm font-medium text-gray-700 mb-1">Pet Name:</label>
                <input type="text" id="new-pet-name" required placeholder="e.g., freddy" title="Pet name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-500 bg-white" />
              </div>
              <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 font-bold text-lg shadow">Create Pet Page</button>
            </form>
          </div>
        </div>
      </div>
    `;

    // Add event listener for form
    const form = document.getElementById('create-pet-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = document.getElementById('new-user-id').value;
        const petName = document.getElementById('new-pet-name').value;
        this.navigate(userId, petName);
      });
    }
  }

  /**
   * Render user home page
   */
  renderUserHome(userId) {
    const mainContent = document.getElementById('root');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="flex flex-col items-center my-8">
        <h1 class="text-3xl font-bold mb-4 text-gray-800">User: ${userId}</h1>
        <p class="mb-8 text-lg text-gray-600 text-center">Welcome to your pet dashboard</p>
        <div class="w-full max-w-xl mb-10">
          <h2 class="text-xl font-semibold mb-4 text-center">Your Pets</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium mb-2">Freddy</h3>
              <a href="/${userId}/freddy/" class="bg-blue-600 text-white rounded-lg px-8 py-4 text-lg font-medium hover:bg-blue-700 transition text-center block">View Pet</a>
            </div>
            <div>
              <h3 class="text-lg font-medium mb-2">Luna</h3>
              <a href="/${userId}/luna/" class="bg-blue-600 text-white rounded-lg px-8 py-4 text-lg font-medium hover:bg-blue-700 transition text-center block">View Pet</a>
            </div>
          </div>
        </div>
        <div class="w-full max-w-md">
          <h2 class="text-xl font-semibold mb-4 text-center">Add New Pet</h2>
          <form id="add-pet-form" class="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label for="add-pet-name" class="block text-sm font-medium text-gray-700 mb-2">Pet Name:</label>
              <input type="text" id="add-pet-name" required placeholder="e.g., max" title="Pet name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium">Add Pet</button>
          </form>
        </div>
      </div>
    `;

    // Add event listener for form
    const form = document.getElementById('add-pet-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const petName = document.getElementById('add-pet-name').value;
        this.navigate(userId, petName);
      });
    }
  }

  /**
   * Render pet page - preserve original Freddy UI structure
   */
  async renderPetPage(userId, petName, petIndex = 0) {
    const mainContent = document.getElementById('root');
    if (!mainContent) {
      console.warn('[renderPetPage] #root element not found');
      return;
    }
    console.log(`[renderPetPage] Rendering pet page for userId=${userId}, petName=${petName}, petIndex=${petIndex}`);

    // Try to find existing pet by name and user ID first
    let petUUID = null;
    let existingPet = null;
    try {
      const allPets = await this.searchExistingPets(petName, userId);
      console.log('[renderPetPage] searchExistingPets result:', allPets);
      if (allPets.length > 0) {
        const targetIndex = petIndex > 0 ? petIndex - 1 : 0;
        if (targetIndex < allPets.length) {
          existingPet = allPets[targetIndex];
          petUUID = existingPet.id;
          console.log(`[renderPetPage] Found existing pet: ${petName} (index ${petIndex}) with ID: ${petUUID}`);
        } else {
          console.log(`[renderPetPage] Pet index ${petIndex} not found, using first pet`);
          existingPet = allPets[0];
          petUUID = existingPet.id;
        }
      }
    } catch (error) {
      console.warn('[renderPetPage] Could not search for existing pets:', error);
    }
    if (!petUUID) {
      petUUID = this.petUUIDManager.generatePetUUID(petName);
      console.log(`[renderPetPage] Generated new pet UUID for ${petName}: ${petUUID}`);
    }
    const parsedUUID = this.petUUIDManager.parsePetUUID(petUUID);
    // Always render the main UI, even if pet data is missing
    mainContent.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center py-12 px-2 sm:px-6 lg:px-8">
        <div class="w-full max-w-2xl bg-white/90 shadow-xl rounded-2xl p-8 sm:p-12 mx-auto">
          <div class="flex flex-col items-center">
            <h1 class="text-4xl font-black mb-2 text-gray-900 tracking-tight text-center">${petName ? petName : 'Pet'}'s Page</h1>
            <p class="mb-8 text-lg text-gray-600 text-center max-w-2xl">Track check-ins and location for this pet.</p>
          </div>
          <div class="w-full flex justify-center mb-8">
            <a href="/" class="inline-block bg-blue-600 text-white rounded-full px-8 py-3 text-lg font-semibold shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition whitespace-nowrap">Home</a>
          </div>
          <div class="bg-white rounded-lg shadow-md mb-8">
            <div class="border-b border-gray-200">
              <nav class="flex gap-6 justify-center items-center px-6 pt-4" aria-label="Tabs">
                <button class="tab-button active border-b-2 border-blue-500 text-blue-600 bg-white rounded-t-lg px-4 py-2 text-sm font-medium transition" data-tab="checkin">Check-in</button>
                <button class="tab-button border-b-2 border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-t-lg px-4 py-2 text-sm font-medium transition" data-tab="map">Map</button>
                <button class="tab-button border-b-2 border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-t-lg px-4 py-2 text-sm font-medium transition" data-tab="history">History</button>
              </nav>
            </div>
            <div class="p-6">
              <div id="checkin-tab" class="tab-content active">
                <div class="max-w-md mx-auto mt-8">
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Report ${petName ? petName : 'Pet'}'s Location</h3>
                  <form id="checkin-form" class="space-y-4">
                    <div>
                      <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                      <input type="text" id="name" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Enter your name">
                    </div>
                    <div>
                      <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div class="flex gap-2">
                        <input type="text" id="location" name="location" readonly class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" placeholder="Click 'Get Location' to detect">
                        <button type="button" id="get-location-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">Get Location</button>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label for="latitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                        <input type="number" id="latitude" name="latitude" step="any" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      </div>
                      <div>
                        <label for="longitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                        <input type="number" id="longitude" name="longitude" step="any" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      </div>
                    </div>
                    <div>
                      <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                      <textarea id="notes" name="notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Any additional information about the check-in"></textarea>
                    </div>
                    <button type="submit" class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium">Submit Check-in</button>
                  </form>
                  <div id="checkin-message" class="mt-4 hidden"></div>
                </div>
              </div>
              <div id="map-tab" class="tab-content hidden">
                <div class="text-center py-12">
                  <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span class="text-2xl">🗺️</span>
                  </div>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Map View</h3>
                  <p class="text-gray-600">Interactive map showing ${petName ? petName : 'pet'}'s location history will be displayed here.</p>
                </div>
              </div>
              <div id="history-tab" class="tab-content hidden">
                <div class="max-w-4xl mx-auto">
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-medium text-gray-900">Check-in History for ${petName ? petName : 'pet'}</h3>
                    <button id="refresh-checkins-btn" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">🔄 Refresh</button>
                  </div>
                  <div id="checkins-loading" class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="mt-2 text-gray-600">Loading check-ins...</p>
                  </div>
                  <div id="checkins-content" class="hidden">
                    <div id="checkins-stats" class="bg-gray-50 rounded-lg p-4 mb-6">
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <div class="text-2xl font-bold text-blue-600" id="total-checkins">0</div>
                          <div class="text-sm text-gray-600">Total Check-ins</div>
                        </div>
                        <div>
                          <div class="text-2xl font-bold text-green-600" id="recent-checkins">0</div>
                          <div class="text-sm text-gray-600">Last 24 Hours</div>
                        </div>
                        <div>
                          <div class="text-2xl font-bold text-purple-600" id="last-checkin">-</div>
                          <div class="text-sm text-gray-600">Last Seen</div>
                        </div>
                      </div>
                    </div>
                    <div id="checkins-table-container">
                      <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                          <thead class="bg-gray-50">
                            <tr>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody id="checkins-table-body" class="bg-white divide-y divide-gray-200">
                            <!-- Check-ins will be loaded here -->
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div id="no-checkins" class="text-center py-12 hidden">
                      <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span class="text-2xl">📝</span>
                      </div>
                      <h3 class="text-lg font-medium text-gray-900 mb-2">No Check-ins Yet</h3>
                      <p class="text-gray-600">No one has reported seeing this pet yet.</p>
                    </div>
                  </div>
                  <div id="checkins-error" class="text-center py-12 hidden">
                    <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-lg flex items-center justify-center">
                      <span class="text-2xl">⚠️</span>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Check-ins</h3>
                    <p class="text-gray-600" id="error-message">Failed to load check-ins. Please try again.</p>
                    <button id="retry-loading-btn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Try Again</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Search for existing pets by name and user ID
   */
  async searchExistingPets(petName, userId = null) {
    try {
      // Wait for Firebase to be available
      let db = null;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!db && attempts < maxAttempts) {
        try {
          // Try to get Firebase from global scope
          if (window.app && window.app.db) {
            db = window.app.db;
            console.log('✅ Found Firebase DB from window.app.db');
          } else if (window.firebaseApp) {
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
            db = getFirestore(window.firebaseApp);
            console.log('✅ Found Firebase DB from window.firebaseApp');
          } else {
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        } catch (error) {
          console.warn('Waiting for Firebase to be available...', error);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      if (!db) {
        console.warn('Firebase not available after multiple attempts');
        return [];
      }
      
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const petsSnapshot = await getDocs(collection(db, 'pets'));
      
      const matchingPets = [];
      petsSnapshot.forEach(doc => {
        const petData = doc.data();
        if (petData.name && petData.name.toLowerCase() === petName.toLowerCase()) {
          // If userId is provided, filter by user ID as well
          if (userId && petData.userId && petData.userId !== userId) {
            return; // Skip pets that don't belong to this user
          }
          matchingPets.push({ id: doc.id, ...petData });
        }
      });
      
      // Sort pets by creation time or ID for consistent ordering
      matchingPets.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          try {
            // Handle different timestamp formats
            const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            
            // Check if dates are valid
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return a.id.localeCompare(b.id);
            }
            
            return dateA - dateB;
          } catch (error) {
            console.warn('Error sorting by createdAt, falling back to ID sort:', error);
            return a.id.localeCompare(b.id);
          }
        }
        return a.id.localeCompare(b.id);
      });
      
      if (matchingPets.length > 0) {
        console.log(`🔍 Found ${matchingPets.length} existing pets for "${petName}"${userId ? ` (User: ${userId})` : ''}:`, matchingPets.map(p => p.id));
      }
      return matchingPets;
    } catch (error) {
      console.error('❌ Error searching for existing pets:', error);
      return [];
    }
  }

  /**
   * Setup tab functionality
   */
  setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        
        // Remove active class from all tabs and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding pane
        btn.classList.add('active');
        const targetPane = document.getElementById(`${targetTab}-tab`);
        if (targetPane) {
          targetPane.classList.add('active');
          
          // Initialize map if map tab is clicked
          if (targetTab === 'map' && this.mapManager) {
            this.initializeMapForTab();
          }
        }
      });
    });
  }

  /**
   * Initialize map for the current tab
   */
  initializeMapForTab() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
      console.warn('Map element not found');
      return;
    }

    // Check if map is already initialized
    if (this.mapManager && this.mapManager.isMapsInitialized()) {
      console.log('Map already initialized');
      return;
    }

    // Try to initialize the map
    if (this.mapManager) {
      this.mapManager.initializeMaps().catch(error => {
        console.warn('Failed to initialize map:', error);
        mapElement.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; background: #f8f9fa; color: #6c757d; font-size: 16px; text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 10px;">🗺️</div>
            <div style="font-weight: bold; margin-bottom: 10px;">Map Unavailable</div>
            <div style="font-size: 14px; color: #868e96;">
              Google Maps could not be loaded.<br>
              This doesn't affect the check-in functionality.
            </div>
          </div>
        `;
      });
    }
  }

  /**
   * Setup form handlers for pet page
   */
  setupPetForms(userId, petName, petUUID) {
    // Check-in form
    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
      checkinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const location = document.getElementById('checkin-location').value;
        const notes = document.getElementById('checkin-notes').value;
        
        this.handleCheckin(userId, petName, petUUID, location, notes);
      });
    }
  }

  /**
   * Handle check-in submission
   */
  handleCheckin(userId, petName, petUUID, location, notes) {
    const checkinData = {
      petUUID,
      userId,
      petName,
      location,
      notes,
      timestamp: new Date().toISOString(),
      coordinates: null // Will be filled by geolocation
    };

    console.log('Check-in data:', checkinData);
    
    // Show success message
    this.showMessage('Check-in successful!', 'success');
    
    // Clear form
    const form = document.getElementById('checkin-form');
    if (form) form.reset();
  }

  /**
   * Show message to user
   */
  showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    
    const mainContent = document.getElementById('root');
    if (mainContent) {
      mainContent.insertBefore(messageDiv, mainContent.firstChild);
      
      // Remove message after 3 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.parentNode.removeChild(messageDiv);
        }
      }, 3000);
    }
  }

  /**
   * Render error page
   */
  renderError(error) {
    const mainContent = document.getElementById('root');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="error-page">
        <h1>❌ Error</h1>
        <p>${error}</p>
        <a href="/" class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">← Back to Home</a>
      </div>
    `;
  }
}

window.firebaseApp = window.firebaseApp || null;
