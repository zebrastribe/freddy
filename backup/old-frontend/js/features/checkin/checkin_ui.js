/**
 * CheckInUI - Enhanced check-in user interface with pet support
 * 
 * This class provides UI components and interactions for creating check-ins
 * with support for multiple pets in the multi-user system.
 */
import { CheckInManager } from './checkin_manager.js';

class CheckInUI {
  /**
   * Create a new CheckInUI instance
   * @param {CheckInManager} checkinManager - CheckInManager instance
   * @param {Object} petUI - PetUI instance
   * @param {Object} config - App configuration
   */
  constructor(checkinManager, petUI, config) {
    this.checkinManager = checkinManager;
    this.petUI = petUI;
    this.config = config;
    this.currentPet = null;
    this.isSubmitting = false;
  }

  /**
   * Initialize check-in UI components
   */
  async initialize() {
    try {
      // Set up event listeners
    this.setupEventListeners();
      
      // Render initial UI
      this.renderCheckInForm();
      
      // Set up pet selection listener
      this.setupPetSelectionListener();
      
      console.log('CheckInUI initialized successfully');
    } catch (error) {
      console.error('Error initializing CheckInUI:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners for check-in UI
   */
  setupEventListeners() {
    // Check-in form submission
    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
      checkinForm.addEventListener('submit', this.handleCheckInSubmit.bind(this));
    }

    // Pet selection for check-in
    const checkinPetSelect = document.getElementById('checkin-pet-select');
    if (checkinPetSelect) {
      checkinPetSelect.addEventListener('change', this.handleCheckInPetSelection.bind(this));
    }

    // Location button
    const locationButton = document.getElementById('get-location-btn');
    if (locationButton) {
      locationButton.addEventListener('click', this.handleGetLocation.bind(this));
    }

    // Clear form button
    const clearButton = document.getElementById('clear-checkin-btn');
    if (clearButton) {
      clearButton.addEventListener('click', this.handleClearForm.bind(this));
    }
  }

  /**
   * Set up pet selection listener to sync with PetUI
   */
  setupPetSelectionListener() {
    // Listen for pet selection changes from PetUI
    const petSelect = document.getElementById('pet-select');
    if (petSelect) {
      petSelect.addEventListener('change', (event) => {
        const petId = event.target.value;
        this.updateCheckInPetSelection(petId);
      });
    }
  }

  /**
   * Render check-in form
   */
  renderCheckInForm() {
    const formContainer = document.getElementById('checkin-form-container');
    if (!formContainer) return;

    formContainer.innerHTML = `
      <form id="checkin-form" class="space-y-6 bg-white p-6 rounded-lg shadow-md max-w-xl mx-auto">
        <h3 class="text-xl font-bold mb-4">Create Check-in</h3>
        
        <div class="mb-4">
          <label for="checkin-pet-select" class="block text-sm font-medium text-gray-700">Pet (Optional)</label>
          <select id="checkin-pet-select" name="petId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50">
            <option value="">No specific pet</option>
          </select>
          <small class="text-xs text-gray-500">Select a pet to associate with this check-in</small>
        </div>

        <div class="mb-4">
          <label for="checkin-name" class="block text-sm font-medium text-gray-700">Your Name *</label>
          <input type="text" id="checkin-name" name="name" required maxlength="100" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Enter your name">
        </div>

        <div class="mb-4">
          <label for="checkin-latitude" class="block text-sm font-medium text-gray-700">Latitude *</label>
          <input type="number" id="checkin-latitude" name="latitude" required step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 55.6761">
        </div>

        <div class="mb-4">
          <label for="checkin-longitude" class="block text-sm font-medium text-gray-700">Longitude *</label>
          <input type="number" id="checkin-longitude" name="longitude" required step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 12.5683">
        </div>

        <div class="mb-4">
          <label for="checkin-accuracy" class="block text-sm font-medium text-gray-700">GPS Accuracy (meters)</label>
          <input type="number" id="checkin-accuracy" name="accuracy" min="0" step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 5">
        </div>

        <div class="mb-4">
          <label for="checkin-altitude" class="block text-sm font-medium text-gray-700">Altitude (meters)</label>
          <input type="number" id="checkin-altitude" name="altitude" step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 10">
        </div>

        <div class="mb-4">
          <label for="checkin-speed" class="block text-sm font-medium text-gray-700">Speed (m/s)</label>
          <input type="number" id="checkin-speed" name="speed" min="0" step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 2.5">
        </div>

        <div class="mb-4">
          <label for="checkin-heading" class="block text-sm font-medium text-gray-700">Heading (degrees)</label>
          <input type="number" id="checkin-heading" name="heading" min="0" max="360" step="any" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="e.g., 180">
        </div>

        <div class="mb-4">
          <label for="checkin-description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="checkin-description" name="description" maxlength="500" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50" placeholder="Optional description of the check-in"></textarea>
        </div>

        <div class="flex flex-wrap gap-2 items-center justify-between mt-6">
          <button type="button" id="get-location-btn" class="inline-flex items-center bg-gray-500 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            📍 Get Current Location
          </button>
          <button type="button" id="clear-checkin-btn" class="inline-flex items-center bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            Clear Form
          </button>
          <button type="submit" id="submit-checkin-btn" class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" disabled>
            Create Check-in
          </button>
        </div>

        <div id="checkin-status" class="mt-4 text-sm" style="display: none;"></div>
      </form>
    `;

    // Populate pet selection dropdown
    this.populatePetSelection();
  }

  /**
   * Populate pet selection dropdown
   */
  populatePetSelection() {
    const petSelect = document.getElementById('checkin-pet-select');
    if (!petSelect) return;

    // Clear existing options (except the first "No specific pet" option)
    petSelect.innerHTML = '<option value="">No specific pet</option>';

    // Get user's pets from PetUI
    const userPets = this.petUI.getUserPets();
    
    userPets.forEach(pet => {
      const option = document.createElement('option');
      option.value = pet.id;
      option.textContent = pet.name;
      option.dataset.petId = pet.id;
      petSelect.appendChild(option);
    });

    // If there's a currently selected pet in PetUI, select it here too
    const currentPet = this.petUI.getCurrentPet();
    if (currentPet) {
      petSelect.value = currentPet.id;
      this.currentPet = currentPet;
    }
  }

  /**
   * Update check-in pet selection based on PetUI selection
   * @param {string} petId - Pet ID to select
   */
  updateCheckInPetSelection(petId) {
    const checkinPetSelect = document.getElementById('checkin-pet-select');
    if (checkinPetSelect) {
      checkinPetSelect.value = petId || '';
    }
    
    if (petId) {
      const userPets = this.petUI.getUserPets();
      this.currentPet = userPets.find(pet => pet.id === petId) || null;
    } else {
      this.currentPet = null;
    }
  }

  /**
   * Handle check-in pet selection
   * @param {Event} event - Selection change event
   */
  handleCheckInPetSelection(event) {
    const petId = event.target.value;
    
    if (petId) {
      const userPets = this.petUI.getUserPets();
      this.currentPet = userPets.find(pet => pet.id === petId) || null;
    } else {
      this.currentPet = null;
    }
  }

  /**
   * Handle check-in form submission
   * @param {Event} event - Form submission event
   */
  async handleCheckInSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) {
      return;
    }
    
    try {
      this.isSubmitting = true;
      this.showStatus('Creating check-in...', 'info');
      
      const formData = new FormData(event.target);
      const checkinData = {
        name: formData.get('name').trim(),
        latitude: parseFloat(formData.get('latitude')),
        longitude: parseFloat(formData.get('longitude')),
        accuracy: formData.get('accuracy') ? parseFloat(formData.get('accuracy')) : null,
        altitude: formData.get('altitude') ? parseFloat(formData.get('altitude')) : null,
        speed: formData.get('speed') ? parseFloat(formData.get('speed')) : null,
        heading: formData.get('heading') ? parseFloat(formData.get('heading')) : null,
        description: formData.get('description').trim(),
        domain: window.location.hostname
      };

      // Validate check-in data
      const validation = CheckInManager.validateCheckInData(checkinData);
      if (!validation.isValid) {
        this.showStatus(validation.errors.join(', '), 'error');
        return;
      }

      // Get pet ID if selected
      const petId = formData.get('petId') || null;

      // Create check-in
      const checkin = await this.checkinManager.createCheckIn(checkinData, petId);
      
      // Show success message
      const petName = this.currentPet ? ` for ${this.currentPet.name}` : '';
      this.showStatus(`Check-in created successfully${petName}!`, 'success');
      
      // Clear form
      this.clearForm();
      
      // Trigger any success callbacks
      if (this.onCheckInCreated) {
        this.onCheckInCreated(checkin);
      }

    } catch (error) {
      console.error('Error creating check-in:', error);
      this.showStatus('Failed to create check-in: ' + error.message, 'error');
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Handle get current location button click
   * @param {Event} event - Click event
   */
  async handleGetLocation(event) {
    event.preventDefault();
    
    try {
      this.showStatus('Getting your location...', 'info');
      
      const position = await this.getCurrentLocation();
      
      // Update form fields
      const latitudeField = document.getElementById('checkin-latitude');
      const longitudeField = document.getElementById('checkin-longitude');
      const accuracyField = document.getElementById('checkin-accuracy');
      
      if (latitudeField) latitudeField.value = position.latitude;
      if (longitudeField) longitudeField.value = position.longitude;
      if (accuracyField) accuracyField.value = position.accuracy || '';
      
      this.showStatus('Location obtained successfully!', 'success');
      
      // Enable submit button
      this.updateSubmitButton();
      
    } catch (error) {
      console.error('Error getting location:', error);
      this.showStatus('Failed to get location: ' + error.message, 'error');
    }
  }

  /**
   * Handle clear form button click
   * @param {Event} event - Click event
   */
  handleClearForm(event) {
    event.preventDefault();
    this.clearForm();
    this.showStatus('Form cleared', 'info');
  }

  /**
   * Get current location using geolocation API
   * @returns {Promise<Object>} Location data
   */
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Error getting location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Clear the check-in form
   */
  clearForm() {
    const form = document.getElementById('checkin-form');
    if (form) {
      form.reset();
    }
    
    // Keep the current pet selection
    const petSelect = document.getElementById('checkin-pet-select');
    if (petSelect && this.currentPet) {
      petSelect.value = this.currentPet.id;
    }
    
    this.updateSubmitButton();
  }

  /**
   * Update submit button state based on form validity
   */
  updateSubmitButton() {
    const submitButton = document.getElementById('submit-checkin-btn');
    const form = document.getElementById('checkin-form');
    
    if (submitButton && form) {
      const isValid = form.checkValidity();
      submitButton.disabled = !isValid || this.isSubmitting;
    }
  }

  /**
   * Show status message
   * @param {string} message - Status message
   * @param {string} type - Message type (info, success, error)
   */
  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('checkin-status');
    if (!statusElement) return;

    const typeClass = {
      info: 'status-info',
      success: 'status-success',
      error: 'status-error'
    }[type] || 'status-info';

    statusElement.className = `checkin-status ${typeClass}`;
    statusElement.textContent = message;
    statusElement.style.display = 'block';

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Hide status message
   */
  hideStatus() {
    const statusElement = document.getElementById('checkin-status');
    if (statusElement) {
      statusElement.style.display = 'none';
    }
  }

  /**
   * Set callback for when check-in is created
   * @param {Function} callback - Callback function
   */
  setOnCheckInCreated(callback) {
    this.onCheckInCreated = callback;
  }

  /**
   * Get current pet
   * @returns {Object|null} Current pet document
   */
  getCurrentPet() {
    return this.currentPet;
  }

  /**
   * Set current pet
   * @param {Object} pet - Pet document
   */
  setCurrentPet(pet) {
    this.currentPet = pet;
    this.updateCheckInPetSelection(pet?.id || null);
  }

  /**
   * Refresh the UI (e.g., after pet list changes)
   */
  refresh() {
    this.populatePetSelection();
    this.updateSubmitButton();
  }
}

// At the end of the file, export as ES module
export { CheckInUI }; 