/**
 * CheckInUI - Handles all check-in related UI operations
 * 
 * This class manages the check-in form, table display,
 * pagination, and user interactions.
 */
export class CheckInUI {
  /**
   * Create a new CheckInUI instance
   * @param {CheckInManager} checkInManager - CheckInManager instance
   * @param {Object} mapManager - Map manager for updating map display
   */
  constructor(checkInManager, mapManager = null) {
    this.checkInManager = checkInManager;
    this.mapManager = mapManager;
    this.currentPage = 1;
    this.isSubmitting = false;
    
    // Bind methods to preserve context
    this.handleCheckInSubmit = this.handleCheckInSubmit.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleTabSwitch = this.handleTabSwitch.bind(this);
    
    this.initialize();
  }

  /**
   * Initialize the UI components
   */
  initialize() {
    this.setupEventListeners();
    this.setupCallbacks();
  }

  /**
   * Set up event listeners for UI interactions
   */
  setupEventListeners() {
    // Check-in form submission
    const checkInForm = document.getElementById('check-in-form');
    if (checkInForm) {
      checkInForm.addEventListener('submit', this.handleCheckInSubmit);
    }

    // Pagination controls
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => this.handlePageChange('prev'));
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => this.handlePageChange('next'));
    }

    // Tab switching
    const checkInTab = document.getElementById('checkInTab');
    const recordedCheckInsTab = document.getElementById('recordedCheckInsTab');
    
    if (checkInTab) {
      checkInTab.addEventListener('click', () => this.handleTabSwitch('checkin'));
    }
    
    if (recordedCheckInsTab) {
      recordedCheckInsTab.addEventListener('click', () => this.handleTabSwitch('recorded'));
    }
  }

  /**
   * Set up callbacks for CheckInManager events
   */
  setupCallbacks() {
    // When check-in is created
    this.checkInManager.setOnCheckInCreated((checkInData) => {
      this.handleCheckInCreated(checkInData);
    });

    // When check-ins are fetched
    this.checkInManager.setOnCheckInFetched((result) => {
      this.renderCheckInTable(result);
    });
  }

  /**
   * Handle check-in form submission
   * @param {Event} event - Form submission event
   */
  async handleCheckInSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) {
      return; // Prevent double submission
    }

    this.isSubmitting = true;
    this.showSpinner(true);
    this.hideMessages();

    try {
      const nameInput = document.getElementById('nameInput');
      const name = nameInput.value.trim();
      
      if (!name) {
        throw new Error('Please enter your name');
      }

      // Get current location
      const location = await this.checkInManager.getCurrentLocation();
      
      // Validate data
      const validation = this.checkInManager.validateCheckInData(
        name, 
        location.latitude, 
        location.longitude
      );
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Get reCAPTCHA token if available
      let recaptchaToken = null;
      if (window.grecaptcha && window.grecaptcha.ready) {
        try {
          recaptchaToken = await grecaptcha.execute('6LcKqXYpAAAAAJqXqXqXqXqXqXqXqXqXqXqXqXqX', { action: 'checkin' });
        } catch (recaptchaError) {
          console.warn('reCAPTCHA error:', recaptchaError);
          // Continue without reCAPTCHA token
        }
      }

      // Create check-in
      await this.checkInManager.createCheckIn(
        name, 
        location.latitude, 
        location.longitude, 
        recaptchaToken
      );

      // Clear form and show success
      nameInput.value = '';
      this.showSuccessMessage('Check-in successful!');
      
      // Refresh check-ins list
      await this.refreshCheckIns();

    } catch (error) {
      console.error('Check-in error:', error);
      this.showErrorMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      this.isSubmitting = false;
      this.showSpinner(false);
      
      // Re-enable form after delay
      setTimeout(() => {
        const nameInput = document.getElementById('nameInput');
        if (nameInput) {
          nameInput.disabled = false;
        }
        this.hideMessages();
      }, 15000);
    }
  }

  /**
   * Handle check-in creation success
   * @param {Object} checkInData - Check-in data
   */
  handleCheckInCreated(checkInData) {
    // Update map if map manager is available
    if (this.mapManager && typeof this.mapManager.updateMap === 'function') {
      this.mapManager.updateMap(checkInData.latitude, checkInData.longitude);
    }
  }

  /**
   * Handle page change for pagination
   * @param {string} direction - 'prev' or 'next'
   */
  async handlePageChange(direction) {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (direction === 'next') {
      this.currentPage++;
    } else {
      return; // Invalid page change
    }

    await this.refreshCheckIns();
  }

  /**
   * Handle tab switching
   * @param {string} tab - Tab to switch to ('checkin' or 'recorded')
   */
  async handleTabSwitch(tab) {
    const checkInContent = document.getElementById('checkInContent');
    const recordedCheckInsContent = document.getElementById('recordedCheckInsContent');
    const checkInTab = document.getElementById('checkInTab');
    const recordedCheckInsTab = document.getElementById('recordedCheckInsTab');

    if (tab === 'checkin') {
      checkInContent.classList.remove('hidden');
      recordedCheckInsContent.classList.add('hidden');
      checkInTab.classList.add('text-blue-600', 'border-blue-600');
      checkInTab.classList.remove('text-gray-600', 'border-gray-200');
      recordedCheckInsTab.classList.add('text-gray-600', 'border-gray-200');
      recordedCheckInsTab.classList.remove('text-blue-600', 'border-blue-600');
    } else if (tab === 'recorded') {
      checkInContent.classList.add('hidden');
      recordedCheckInsContent.classList.remove('hidden');
      recordedCheckInsTab.classList.add('text-blue-600', 'border-blue-600');
      recordedCheckInsTab.classList.remove('text-gray-600', 'border-gray-200');
      checkInTab.classList.add('text-gray-600', 'border-gray-200');
      checkInTab.classList.remove('text-blue-600', 'border-blue-600');
      
      // Fetch and display check-ins
      await this.refreshCheckIns();
    }
  }

  /**
   * Render check-in table
   * @param {Object} result - Check-ins data with pagination
   */
  renderCheckInTable(result) {
    const { checkIns, pagination } = result;
    const checkInsList = document.getElementById('checkInsList');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    if (!checkInsList) {
      console.error('Check-ins list element not found');
      return;
    }

    // Clear existing rows
    checkInsList.innerHTML = '';

    // Add check-in rows
    checkIns.forEach(checkIn => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-2 px-4 border-b border-gray-200">${checkIn.name}</td>
        <td class="py-2 px-4 border-b border-gray-200">${checkIn.latitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${checkIn.longitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${checkIn.formattedDate}</td>
        <td class="py-2 px-4 border-b border-gray-200">${checkIn.time}</td>
      `;
      checkInsList.appendChild(row);

      // Add marker to map if available
      if (this.mapManager && typeof this.mapManager.addMarker === 'function') {
        this.mapManager.addMarker(checkIn.latitude, checkIn.longitude, checkIn.name);
      }
    });

    // Update pagination controls
    if (prevButton) {
      prevButton.disabled = !pagination.hasPrev;
    }
    
    if (nextButton) {
      nextButton.disabled = !pagination.hasNext;
    }

    this.currentPage = pagination.currentPage;
  }

  /**
   * Refresh check-ins list
   */
  async refreshCheckIns() {
    try {
      await this.checkInManager.fetchCheckIns(this.currentPage);
    } catch (error) {
      console.error('Error refreshing check-ins:', error);
    }
  }

  /**
   * Show spinner
   * @param {boolean} show - Whether to show or hide spinner
   */
  showSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (spinner) {
      if (show) {
        spinner.classList.remove('hidden');
      } else {
        spinner.classList.add('hidden');
      }
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccessMessage(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
      successMessage.textContent = message;
      successMessage.classList.remove('hidden');
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showErrorMessage(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    }
  }

  /**
   * Hide all messages
   */
  hideMessages() {
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    if (successMessage) {
      successMessage.classList.add('hidden');
    }
    
    if (errorMessage) {
      errorMessage.classList.add('hidden');
    }
  }

  /**
   * Update token status in UI
   * @param {boolean} hasValidToken - Whether user has valid token
   */
  updateTokenStatus(hasValidToken) {
    const clickButton = document.getElementById('clickButton');
    const checkInForm = document.getElementById('check-in-form');
    const checkInTab = document.getElementById('checkInTab');

    if (clickButton) {
      if (hasValidToken) {
        clickButton.disabled = false;
        clickButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        clickButton.classList.add('bg-blue-500', 'hover:bg-blue-700');
      } else {
        clickButton.disabled = true;
        clickButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        clickButton.classList.remove('bg-blue-500', 'hover:bg-blue-700');
      }
    }

    if (checkInForm) {
      if (hasValidToken) {
        checkInForm.classList.remove('hidden');
      } else {
        checkInForm.classList.add('hidden');
      }
    }

    if (checkInTab) {
      if (hasValidToken) {
        checkInTab.disabled = false;
        checkInTab.classList.remove('opacity-50', 'pointer-events-none');
      } else {
        checkInTab.disabled = true;
        checkInTab.classList.add('opacity-50', 'pointer-events-none');
      }
    }
  }
} 