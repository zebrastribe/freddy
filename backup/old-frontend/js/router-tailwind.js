/**
 * SPA Router with Tailwind CSS - Handles client-side routing for the pet tracking application
 */
export class SPARouter {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.pets = [
      { name: 'freddy', displayName: 'Freddy', type: 'cat', color: 'ginger' },
      { name: 'anna', displayName: 'Anna', type: 'cat', color: 'ginger' },
      { name: 'luna', displayName: 'Luna', type: 'cat', color: 'black' },
      { name: 'max', displayName: 'Max', type: 'dog', color: 'brown' }
    ];
  }

  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    this.setupRoutes();
    this.setupEventListeners();
    this.handleInitialRoute();
  }

  setupRoutes() {
    // Home route
    this.routes.set('/', () => this.renderHomePage());
    
    // Pet-specific routes
    this.pets.forEach(pet => {
      this.routes.set(`/${pet.name}/`, () => this.renderPetPage(pet));
    });
  }

  setupEventListeners() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Handle pet selector changes
    const petDropdown = document.getElementById('pet-dropdown');
    if (petDropdown) {
      petDropdown.addEventListener('change', (e) => {
        const selectedPet = e.target.value;
        if (selectedPet) {
          this.navigateTo(`/${selectedPet}/`);
        } else {
          this.navigateTo('/');
        }
      });
    }
  }

  handleInitialRoute() {
    const path = window.location.pathname;
    this.handleRoute(path);
  }

  handleRoute(path) {
    const route = this.routes.get(path);
    if (route) {
      this.currentRoute = path;
      route();
      this.updatePetSelector(path);
    } else {
      // Handle unknown routes - show home page
      this.navigateTo('/');
    }
  }

  navigateTo(path) {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  updatePetSelector(path) {
    const petDropdown = document.getElementById('pet-dropdown');
    if (petDropdown) {
      const petName = path.split('/')[1];
      petDropdown.value = petName || '';
    }
  }

  renderHomePage() {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <div class="animate-bounce-gentle inline-block mb-6">
            <img src="img/emoji-cat-192x192.png" alt="Pet Tracker" class="h-24 w-24 mx-auto">
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Pet Tracker</h1>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Track your beloved pets and help them find their way home. 
            Select a pet from the dropdown above to get started.
          </p>
        </div>

        <!-- Pet Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          ${this.pets.map(pet => `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                 onclick="window.router.navigateTo('/${pet.name}/')">
              <div class="p-6 text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-${pet.color === 'ginger' ? 'orange' : pet.color === 'black' ? 'gray' : 'amber'}-400 to-${pet.color === 'ginger' ? 'red' : pet.color === 'black' ? 'gray' : 'yellow'}-600 flex items-center justify-center">
                  <span class="text-2xl">🐱</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-900 mb-2">${pet.displayName}</h3>
                <p class="text-sm text-gray-600 capitalize">${pet.color} ${pet.type}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Features Section -->
        <div class="bg-white rounded-lg shadow-md p-8">
          <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">Features</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
                <span class="text-2xl">📍</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Location Tracking</h3>
              <p class="text-gray-600">Track your pet's location in real-time with GPS accuracy</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-lg flex items-center justify-center">
                <span class="text-2xl">🔔</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Notifications</h3>
              <p class="text-gray-600">Get instant alerts when your pet is found or needs attention</p>
            </div>
            <div class="text-center">
              <div class="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-lg flex items-center justify-center">
                <span class="text-2xl">📊</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p class="text-gray-600">View detailed reports and patterns in your pet's behavior</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPetPage(pet) {
    const content = document.getElementById('content');
    if (!content) return;

    content.innerHTML = `
      <div class="animate-fade-in">
        <!-- Pet Header -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-${pet.color === 'ginger' ? 'orange' : pet.color === 'black' ? 'gray' : 'amber'}-400 to-${pet.color === 'ginger' ? 'red' : pet.color === 'black' ? 'gray' : 'yellow'}-600 flex items-center justify-center mr-4">
                <span class="text-3xl">🐱</span>
              </div>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">${pet.displayName}</h1>
                <p class="text-lg text-gray-600 capitalize">${pet.color} ${pet.type}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Active
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-lg shadow-md mb-8">
          <div class="border-b border-gray-200">
            <nav class="flex space-x-8 px-6" aria-label="Tabs">
              <button class="tab-button active border-b-2 border-blue-500 text-blue-600 py-4 px-1 text-sm font-medium" data-tab="checkin">
                Check-in
              </button>
              <button class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1 text-sm font-medium" data-tab="map">
                Map
              </button>
              <button class="tab-button border-b-2 border-transparent text-gray-500 hover:text-gray-700 py-4 px-1 text-sm font-medium" data-tab="history">
                History
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <div id="checkin-tab" class="tab-content active">
              ${this.renderCheckinForm(pet)}
            </div>
            <div id="map-tab" class="tab-content hidden">
              ${this.renderMapContent(pet)}
            </div>
            <div id="history-tab" class="tab-content hidden">
              ${this.renderHistoryContent(pet)}
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupTabHandlers();
  }

  renderCheckinForm(pet) {
    return `
      <div class="max-w-md mx-auto">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Report ${pet.displayName}'s Location</h3>
        
        <form id="checkin-form" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input type="text" id="name" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Enter your name">
          </div>

          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div class="flex space-x-2">
              <input type="text" id="location" name="location" readonly 
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                     placeholder="Click 'Get Location' to detect">
              <button type="button" id="get-location-btn" 
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                Get Location
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="latitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input type="number" id="latitude" name="latitude" step="any" readonly 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            </div>
            <div>
              <label for="longitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input type="number" id="longitude" name="longitude" step="any" readonly 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
            </div>
          </div>

          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea id="notes" name="notes" rows="3" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any additional information about ${pet.displayName}..."></textarea>
          </div>

          <button type="submit" 
                  class="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium">
            Submit Check-in
          </button>
        </form>

        <div id="checkin-message" class="mt-4 hidden"></div>
      </div>
    `;
  }

  renderMapContent(pet) {
    return `
      <div class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-lg flex items-center justify-center">
          <span class="text-2xl">🗺️</span>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Map View</h3>
        <p class="text-gray-600">Interactive map showing ${pet.displayName}'s location history will be displayed here.</p>
      </div>
    `;
  }

  renderHistoryContent(pet) {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900">Check-in History for ${pet.displayName}</h3>
          <button id="refresh-checkins-btn" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            🔄 Refresh
          </button>
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
            <p class="text-gray-600">No one has reported seeing ${pet.displayName} yet. Be the first to check in!</p>
          </div>
        </div>
        
        <div id="checkins-error" class="text-center py-12 hidden">
          <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Check-ins</h3>
          <p class="text-gray-600" id="error-message">Failed to load check-ins. Please try again.</p>
          <button id="retry-loading-btn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    `;
  }

  setupTabHandlers() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => {
          btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
          btn.classList.add('border-transparent', 'text-gray-500');
        });
        button.classList.add('active', 'border-blue-500', 'text-blue-600');
        button.classList.remove('border-transparent', 'text-gray-500');

        // Show active tab content
        tabContents.forEach(content => {
          content.classList.add('hidden');
          content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}-tab`);
        if (activeContent) {
          activeContent.classList.remove('hidden');
          activeContent.classList.add('active');
          
          // Load check-ins when history tab is clicked
          if (tabName === 'history') {
            this.loadCheckInsForCurrentPet();
          }
        }
      });
    });

    // Setup form handlers
    this.setupFormHandlers();
    
    // Setup check-in refresh button
    this.setupCheckInRefreshButton();
  }

  setupFormHandlers() {
    const getLocationBtn = document.getElementById('get-location-btn');
    const checkinForm = document.getElementById('checkin-form');

    if (getLocationBtn) {
      getLocationBtn.addEventListener('click', () => {
        this.getCurrentLocation();
      });
    }

    if (checkinForm) {
      checkinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCheckinSubmit();
      });
    }
  }

  getCurrentLocation() {
    const locationInput = document.getElementById('location');
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    const getLocationBtn = document.getElementById('get-location-btn');

    if (navigator.geolocation) {
      getLocationBtn.textContent = 'Getting Location...';
      getLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          latInput.value = latitude.toFixed(6);
          lngInput.value = longitude.toFixed(6);
          locationInput.value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          getLocationBtn.textContent = 'Location Found!';
          getLocationBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
          getLocationBtn.classList.add('bg-green-600', 'hover:bg-green-700');
          
          setTimeout(() => {
            getLocationBtn.textContent = 'Get Location';
            getLocationBtn.disabled = false;
            getLocationBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            getLocationBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
          }, 2000);
        },
        (error) => {
          console.error('Error getting location:', error);
          getLocationBtn.textContent = 'Error - Try Again';
          getLocationBtn.disabled = false;
          
          setTimeout(() => {
            getLocationBtn.textContent = 'Get Location';
          }, 2000);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }

  handleCheckinSubmit() {
    const form = document.getElementById('checkin-form');
    const messageDiv = document.getElementById('checkin-message');
    
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      latitude: parseFloat(formData.get('latitude')),
      longitude: parseFloat(formData.get('longitude')),
      notes: formData.get('notes'),
      timestamp: new Date().toISOString()
    };

    // Validate data
    if (!data.name || !data.latitude || !data.longitude) {
      this.showMessage('Please fill in all required fields and get your location.', 'error');
      return;
    }

    // Simulate API call
    this.showMessage('Submitting check-in...', 'info');
    
    setTimeout(() => {
      // Simulate success
      this.showMessage('Check-in submitted successfully! Thank you for helping.', 'success');
      form.reset();
      
      // Reset location inputs
      document.getElementById('location').value = '';
      document.getElementById('latitude').value = '';
      document.getElementById('longitude').value = '';
    }, 1500);
  }

  showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('checkin-message');
    if (!messageDiv) return;

    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    messageDiv.className = `p-4 rounded-lg border ${colors[type]} animate-slide-up`;
    messageDiv.textContent = message;
    messageDiv.classList.remove('hidden');

    if (type === 'success') {
      setTimeout(() => {
        messageDiv.classList.add('hidden');
      }, 5000);
    }
  }

  setupCheckInRefreshButton() {
    const refreshBtn = document.getElementById('refresh-checkins-btn');
    const retryBtn = document.getElementById('retry-loading-btn');
    
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadCheckInsForCurrentPet();
      });
    }
    
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.loadCheckInsForCurrentPet();
      });
    }
  }

  async loadCheckInsForCurrentPet() {
    try {
      // Show loading state
      this.showCheckInsLoading();
      
      // Get current pet info from URL
      const urlInfo = this.parseURL(window.location.pathname);
      if (urlInfo.type !== 'userPet' && urlInfo.type !== 'pet') {
        this.showCheckInsError('Invalid pet URL');
        return;
      }
      
      // Get Firebase DB
      let db = null;
      if (window.app && window.app.db) {
        db = window.app.db;
      } else if (window.firebaseApp) {
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
        db = getFirestore(window.firebaseApp);
      } else {
        throw new Error('Firebase not available');
      }
      
      // Find the pet ID
      let petId = null;
      if (urlInfo.type === 'userPet') {
        // Search for existing pets with this name and user ID
        const allPets = await this.searchExistingPets(urlInfo.petName, urlInfo.userId);
        if (allPets.length > 0) {
          const targetIndex = urlInfo.petIndex > 0 ? urlInfo.petIndex - 1 : 0;
          if (targetIndex < allPets.length) {
            petId = allPets[targetIndex].id;
          } else {
            petId = allPets[0].id;
          }
        }
      } else {
        // For legacy pet URLs, search by name only
        const allPets = await this.searchExistingPets(urlInfo.petName);
        if (allPets.length > 0) {
          petId = allPets[0].id;
        }
      }
      
      if (!petId) {
        this.showNoCheckIns();
        return;
      }
      
      // Load check-ins for this pet
      const { collection, getDocs, query, where, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const checkinsQuery = query(
        collection(db, 'clicks'),
        where('petId', '==', petId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const checkinsSnapshot = await getDocs(checkinsQuery);
      const checkins = [];
      
      checkinsSnapshot.forEach(doc => {
        checkins.push({ id: doc.id, ...doc.data() });
      });
      
      // Display check-ins
      this.displayCheckIns(checkins);
      
    } catch (error) {
      console.error('Error loading check-ins:', error);
      this.showCheckInsError(error.message);
    }
  }

  showCheckInsLoading() {
    const loadingEl = document.getElementById('checkins-loading');
    const contentEl = document.getElementById('checkins-content');
    const errorEl = document.getElementById('checkins-error');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
  }

  showCheckInsError(message) {
    const loadingEl = document.getElementById('checkins-loading');
    const contentEl = document.getElementById('checkins-content');
    const errorEl = document.getElementById('checkins-error');
    const errorMessageEl = document.getElementById('error-message');
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
    if (errorMessageEl) errorMessageEl.textContent = message;
  }

  showNoCheckIns() {
    const loadingEl = document.getElementById('checkins-loading');
    const contentEl = document.getElementById('checkins-content');
    const noCheckinsEl = document.getElementById('no-checkins');
    const errorEl = document.getElementById('checkins-error');
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    if (noCheckinsEl) noCheckinsEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
  }

  displayCheckIns(checkins) {
    const loadingEl = document.getElementById('checkins-loading');
    const contentEl = document.getElementById('checkins-content');
    const noCheckinsEl = document.getElementById('no-checkins');
    const errorEl = document.getElementById('checkins-error');
    const tableBody = document.getElementById('checkins-table-body');
    const totalCheckinsEl = document.getElementById('total-checkins');
    const recentCheckinsEl = document.getElementById('recent-checkins');
    const lastCheckinEl = document.getElementById('last-checkin');
    
    // Hide loading and error states
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    
    if (checkins.length === 0) {
      if (noCheckinsEl) noCheckinsEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');
      return;
    }
    
    // Show content
    if (contentEl) contentEl.classList.remove('hidden');
    if (noCheckinsEl) noCheckinsEl.classList.add('hidden');
    
    // Update stats
    if (totalCheckinsEl) totalCheckinsEl.textContent = checkins.length;
    
    // Calculate recent check-ins (last 24 hours)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentCheckins = checkins.filter(checkin => {
      const timestamp = checkin.timestamp?.toDate ? checkin.timestamp.toDate() : new Date(checkin.timestamp);
      return timestamp >= oneDayAgo;
    });
    
    if (recentCheckinsEl) recentCheckinsEl.textContent = recentCheckins.length;
    
    // Show last check-in time
    if (lastCheckinEl && checkins.length > 0) {
      const lastCheckin = checkins[0];
      const timestamp = lastCheckin.timestamp?.toDate ? lastCheckin.timestamp.toDate() : new Date(lastCheckin.timestamp);
      const timeAgo = this.getTimeAgo(timestamp);
      lastCheckinEl.textContent = timeAgo;
    }
    
    // Populate table
    if (tableBody) {
      tableBody.innerHTML = '';
      
      checkins.forEach(checkin => {
        const timestamp = checkin.timestamp?.toDate ? checkin.timestamp.toDate() : new Date(checkin.timestamp);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            ${checkin.name || 'Anonymous'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${checkin.latitude?.toFixed(6)}, ${checkin.longitude?.toFixed(6)}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${checkin.metadata?.accuracy ? `${checkin.metadata.accuracy.toFixed(1)}m` : 'N/A'}
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  async searchExistingPets(petName, userId = null) {
    try {
      // Wait for Firebase to be available
      let db = null;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!db && attempts < maxAttempts) {
        try {
          if (window.app && window.app.db) {
            db = window.app.db;
          } else if (window.firebaseApp) {
            const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
            db = getFirestore(window.firebaseApp);
          } else {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }
      
      if (!db) {
        throw new Error('Firebase not available');
      }
      
      const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
      const petsSnapshot = await getDocs(collection(db, 'pets'));
      
      const matchingPets = [];
      petsSnapshot.forEach(doc => {
        const petData = doc.data();
        if (petData.name && petData.name.toLowerCase() === petName.toLowerCase()) {
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
            const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return a.id.localeCompare(b.id);
            }
            
            return dateA - dateB;
          } catch (error) {
            return a.id.localeCompare(b.id);
          }
        }
        return a.id.localeCompare(b.id);
      });
      
      return matchingPets;
    } catch (error) {
      console.error('Error searching for existing pets:', error);
      return [];
    }
  }

  parseURL(pathname) {
    const path = pathname.replace(/^\/+|\/+$/g, '');
    const segments = path.split('/').filter(Boolean);

    if (segments.length === 0) {
      return { type: 'home', userId: null, petName: null };
    }

    if (segments.length === 1) {
      const segment = segments[0];
      if (/^[a-zA-Z0-9]{3,}$/.test(segment)) {
        return { type: 'user', userId: segment, petName: null };
      } else {
        return { type: 'pet', userId: null, petName: segment };
      }
    }

    if (segments.length === 2) {
      const [userId, petNameWithSuffix] = segments;
      
      if (!/^[a-zA-Z0-9]{3,}$/.test(userId)) {
        return { type: 'invalid', error: 'Invalid user ID format' };
      }

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

    return { type: 'invalid', error: 'Too many URL segments' };
  }
} 