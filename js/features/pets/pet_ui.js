/**
 * PetUI - User interface components for pet management
 * 
 * This class provides UI components and interactions for managing pets
 * in the multi-user, multi-pet system.
 */
import { PetManager, PET_STATUS, PET_TYPES } from './pet_manager.js';

class PetUI {
  /**
   * Create a new PetUI instance
   * @param {PetManager} petManager - PetManager instance
   * @param {Object} config - App configuration
   */
  constructor(petManager, config) {
    this.petManager = petManager;
    this.config = config;
    this.currentPet = null;
    this.userPets = [];
  }

  /**
   * Initialize pet UI components
   */
  async initialize() {
    try {
      // Load user's pets
      await this.loadUserPets();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Render initial UI
      this.renderPetSelection();
      
      console.log('PetUI initialized successfully');
    } catch (error) {
      console.error('Error initializing PetUI:', error);
      throw error;
    }
  }

  /**
   * Load user's pets
   */
  async loadUserPets() {
    try {
      const userId = this.petManager.auth.currentUser?.uid;
      if (userId) {
        this.userPets = await this.petManager.getUserPets(userId);
      }
    } catch (error) {
      console.error('Error loading user pets:', error);
      this.userPets = [];
    }
  }

  /**
   * Set up event listeners for pet UI
   */
  setupEventListeners() {
    // Pet creation form
    const createPetForm = document.getElementById('create-pet-form');
    if (createPetForm) {
      createPetForm.addEventListener('submit', this.handleCreatePet.bind(this));
    }

    // Pet selection dropdown
    const petSelect = document.getElementById('pet-select');
    if (petSelect) {
      petSelect.addEventListener('change', this.handlePetSelection.bind(this));
    }

    // Pet status update buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('.update-pet-status')) {
        this.handleStatusUpdate(e);
      }
      
      if (e.target.matches('.edit-pet')) {
        this.handleEditPet(e);
      }
      
      if (e.target.matches('.delete-pet')) {
        this.handleDeletePet(e);
      }
    });
  }

  /**
   * Render pet selection interface
   */
  renderPetSelection() {
    const petSelect = document.getElementById('pet-select');
    if (!petSelect) return;

    // Clear existing options
    petSelect.innerHTML = '';

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select a pet...';
    petSelect.appendChild(defaultOption);

    // Add user's pets
    this.userPets.forEach(pet => {
      const option = document.createElement('option');
      option.value = pet.id;
      option.textContent = pet.name;
      option.dataset.petId = pet.id;
      petSelect.appendChild(option);
    });

    // Add "Add New Pet" option if user can create pets
    if (this.petManager.permissionMiddleware.canPerformAction('create', 'pet')) {
      const addOption = document.createElement('option');
      addOption.value = 'new';
      addOption.textContent = '+ Add New Pet';
      petSelect.appendChild(addOption);
    }
  }

  /**
   * Render pet information
   * @param {Object} pet - Pet document
   */
  renderPetInfo(pet) {
    const petInfoContainer = document.getElementById('pet-info');
    if (!petInfoContainer) return;

    if (!pet) {
      petInfoContainer.innerHTML = '<p>Select a pet to view information</p>';
      return;
    }

    const statusClass = this.getStatusClass(pet.status);
    const statusText = this.getStatusText(pet.status);

    petInfoContainer.innerHTML = `
      <div class="pet-card">
        <div class="pet-header">
          <h3>${pet.name}</h3>
          <span class="pet-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="pet-details">
          <div class="pet-info-row">
            <strong>Type:</strong> ${pet.type}
          </div>
          ${pet.breed ? `<div class="pet-info-row"><strong>Breed:</strong> ${pet.breed}</div>` : ''}
          ${pet.metadata?.description ? `<div class="pet-info-row"><strong>Description:</strong> ${pet.metadata.description}</div>` : ''}
          ${pet.metadata?.color ? `<div class="pet-info-row"><strong>Color:</strong> ${pet.metadata.color}</div>` : ''}
          ${pet.metadata?.personality ? `<div class="pet-info-row"><strong>Personality:</strong> ${pet.metadata.personality}</div>` : ''}
        </div>

        <div class="pet-actions">
          ${this.renderPetActions(pet)}
        </div>
      </div>
    `;
  }

  /**
   * Render pet actions based on permissions
   * @param {Object} pet - Pet document
   * @returns {string} HTML for pet actions
   */
  renderPetActions(pet) {
    const actions = [];

    // Status update buttons
    if (this.petManager.permissionMiddleware.canPerformAction('update', 'pet', pet.id)) {
      actions.push(`
        <button class="btn btn-primary update-pet-status" data-pet-id="${pet.id}" data-status="${PET_STATUS.ACTIVE}">
          Mark as Active
        </button>
        <button class="btn btn-warning update-pet-status" data-pet-id="${pet.id}" data-status="${PET_STATUS.MISSING}">
          Mark as Missing
        </button>
        <button class="btn btn-secondary update-pet-status" data-pet-id="${pet.id}" data-status="${PET_STATUS.INACTIVE}">
          Mark as Inactive
        </button>
      `);
    }

    // Edit button
    if (this.petManager.permissionMiddleware.canPerformAction('update', 'pet', pet.id)) {
      actions.push(`
        <button class="btn btn-outline-primary edit-pet" data-pet-id="${pet.id}">
          Edit Pet
        </button>
      `);
    }

    // Delete button
    if (this.petManager.permissionMiddleware.canPerformAction('delete', 'pet', pet.id)) {
      actions.push(`
        <button class="btn btn-outline-danger delete-pet" data-pet-id="${pet.id}">
          Delete Pet
        </button>
      `);
    }

    return actions.join('');
  }

  /**
   * Render pet creation form
   */
  renderCreatePetForm() {
    const formContainer = document.getElementById('create-pet-form-container');
    if (!formContainer) return;

    const petTypes = PetManager.getPetTypes();
    const typeOptions = petTypes.map(type => 
      `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`
    ).join('');

    formContainer.innerHTML = `
      <form id="create-pet-form" class="pet-form">
        <h3>Add New Pet</h3>
        
        <div class="form-group">
          <label for="pet-name">Pet Name *</label>
          <input type="text" id="pet-name" name="name" required maxlength="50" class="form-control">
        </div>

        <div class="form-group">
          <label for="pet-type">Pet Type</label>
          <select id="pet-type" name="type" class="form-control">
            ${typeOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="pet-breed">Breed</label>
          <input type="text" id="pet-breed" name="breed" maxlength="100" class="form-control">
        </div>

        <div class="form-group">
          <label for="pet-description">Description</label>
          <textarea id="pet-description" name="description" maxlength="500" class="form-control" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="pet-color">Color</label>
          <input type="text" id="pet-color" name="color" maxlength="50" class="form-control">
        </div>

        <div class="form-group">
          <label for="pet-personality">Personality</label>
          <input type="text" id="pet-personality" name="personality" maxlength="100" class="form-control">
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="pet-public" name="isPublic" checked>
            Make pet public (visible to all users)
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Create Pet</button>
          <button type="button" class="btn btn-secondary" onclick="this.cancelCreatePet()">Cancel</button>
        </div>
      </form>
    `;
  }

  /**
   * Handle pet creation form submission
   * @param {Event} event - Form submission event
   */
  async handleCreatePet(event) {
    event.preventDefault();
    
    try {
      const formData = new FormData(event.target);
      const petData = {
        name: formData.get('name').trim(),
        type: formData.get('type'),
        breed: formData.get('breed').trim(),
        description: formData.get('description').trim(),
        color: formData.get('color').trim(),
        personality: formData.get('personality').trim(),
        isPublic: formData.get('isPublic') === 'on'
      };

      // Validate pet data
      const validation = PetManager.validatePetData(petData);
      if (!validation.isValid) {
        this.showError(validation.errors.join(', '));
        return;
      }

      // Create pet
      const userId = this.petManager.auth.currentUser?.uid;
      const pet = await this.petManager.createPet(petData, userId);
      
      // Reload user pets and update UI
      await this.loadUserPets();
      this.renderPetSelection();
      
      // Select the new pet
      this.selectPet(pet.id);
      
      // Hide creation form
      this.hideCreatePetForm();
      
      this.showSuccess(`Pet "${pet.name}" created successfully!`);
      
    } catch (error) {
      console.error('Error creating pet:', error);
      this.showError('Failed to create pet: ' + error.message);
    }
  }

  /**
   * Handle pet selection
   * @param {Event} event - Selection change event
   */
  async handlePetSelection(event) {
    const petId = event.target.value;
    
    if (petId === 'new') {
      this.showCreatePetForm();
      return;
    }
    
    if (petId) {
      await this.selectPet(petId);
    } else {
      this.renderPetInfo(null);
    }
  }

  /**
   * Select and display a pet
   * @param {string} petId - Pet ID to select
   */
  async selectPet(petId) {
    try {
      const pet = await this.petManager.getPet(petId);
      this.currentPet = pet;
      this.renderPetInfo(pet);
      
      // Update pet selection dropdown
      const petSelect = document.getElementById('pet-select');
      if (petSelect) {
        petSelect.value = petId;
      }
      
    } catch (error) {
      console.error('Error selecting pet:', error);
      this.showError('Failed to load pet information');
    }
  }

  /**
   * Handle pet status update
   * @param {Event} event - Click event
   */
  async handleStatusUpdate(event) {
    const petId = event.target.dataset.petId;
    const status = event.target.dataset.status;
    
    try {
      await this.petManager.updatePetStatus(petId, status);
      
      // Reload current pet
      if (this.currentPet && this.currentPet.id === petId) {
        await this.selectPet(petId);
      }
      
      this.showSuccess(`Pet status updated to ${this.getStatusText(status)}`);
      
    } catch (error) {
      console.error('Error updating pet status:', error);
      this.showError('Failed to update pet status');
    }
  }

  /**
   * Handle pet edit
   * @param {Event} event - Click event
   */
  handleEditPet(event) {
    const petId = event.target.dataset.petId;
    // TODO: Implement pet editing UI
    console.log('Edit pet:', petId);
  }

  /**
   * Handle pet deletion
   * @param {Event} event - Click event
   */
  async handleDeletePet(event) {
    const petId = event.target.dataset.petId;
    
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      return;
    }
    
    try {
      await this.petManager.deletePet(petId);
      
      // Reload user pets and update UI
      await this.loadUserPets();
      this.renderPetSelection();
      
      // Clear current pet if it was deleted
      if (this.currentPet && this.currentPet.id === petId) {
        this.currentPet = null;
        this.renderPetInfo(null);
      }
      
      this.showSuccess('Pet deleted successfully');
      
    } catch (error) {
      console.error('Error deleting pet:', error);
      this.showError('Failed to delete pet');
    }
  }

  /**
   * Show pet creation form
   */
  showCreatePetForm() {
    this.renderCreatePetForm();
    const formContainer = document.getElementById('create-pet-form-container');
    if (formContainer) {
      formContainer.style.display = 'block';
    }
  }

  /**
   * Hide pet creation form
   */
  hideCreatePetForm() {
    const formContainer = document.getElementById('create-pet-form-container');
    if (formContainer) {
      formContainer.style.display = 'none';
      formContainer.innerHTML = '';
    }
  }

  /**
   * Cancel pet creation
   */
  cancelCreatePet() {
    this.hideCreatePetForm();
    
    // Reset pet selection
    const petSelect = document.getElementById('pet-select');
    if (petSelect) {
      petSelect.value = '';
    }
    
    this.renderPetInfo(null);
  }

  /**
   * Get CSS class for pet status
   * @param {string} status - Pet status
   * @returns {string} CSS class
   */
  getStatusClass(status) {
    switch (status) {
      case PET_STATUS.ACTIVE:
        return 'status-active';
      case PET_STATUS.MISSING:
        return 'status-missing';
      case PET_STATUS.INACTIVE:
        return 'status-inactive';
      default:
        return 'status-unknown';
    }
  }

  /**
   * Get display text for pet status
   * @param {string} status - Pet status
   * @returns {string} Display text
   */
  getStatusText(status) {
    switch (status) {
      case PET_STATUS.ACTIVE:
        return 'Active';
      case PET_STATUS.MISSING:
        return 'Missing';
      case PET_STATUS.INACTIVE:
        return 'Inactive';
      default:
        return 'Unknown';
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    // TODO: Implement toast or notification system
    console.log('Success:', message);
    alert(message);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    // TODO: Implement toast or notification system
    console.error('Error:', message);
    alert('Error: ' + message);
  }

  /**
   * Get current pet
   * @returns {Object|null} Current pet document
   */
  getCurrentPet() {
    return this.currentPet;
  }

  /**
   * Get user pets
   * @returns {Array} Array of user's pets
   */
  getUserPets() {
    return this.userPets;
  }
}

// At the end of the file, export as ES module
export { PetUI }; 