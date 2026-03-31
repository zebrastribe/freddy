// Pet Manager Component
export class PetManager {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.firebase = adminPanel.getService('firebase');
        this.toast = adminPanel.getService('toast');
        this.modal = adminPanel.getService('modal');
        this.urlNameManager = adminPanel.getService('urlNameManager');
        
        this.pets = [];
        this.deviceTokens = {};
        this.userUrlNames = {}; // Cache for user URL names
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshPetsBtn');
        const searchInput = document.getElementById('searchPets');
        const addPetBtn = document.getElementById('addPetBtn');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPets());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterPets());
        }

        if (addPetBtn) {
            addPetBtn.addEventListener('click', () => this.showAddPetModal());
        }
    }

    async loadPets() {
        console.log('[PetManager] loadPets() called');
        try {
            this.showLoading(true);
            const currentUser = this.adminPanel.getCurrentUser();
            this.currentUser = currentUser;
            
            // Use the new getPets method that fetches from user subcollections
            let petsPromise = this.firebase.getPets();
            let usersPromise = null;
            if (currentUser && currentUser.role === 'superadmin') {
                usersPromise = this.firebase.getUsers();
            }
            
            // Await pets and users in parallel if superadmin
            const [pets, users] = await Promise.all([
                petsPromise,
                usersPromise ? usersPromise : Promise.resolve([])
            ]);
            
            // Pets are now returned as an array with user info included
            this.pets = pets;
            this.users = users;
            
            // Load URL names for users
            await this.loadUserUrlNames();
            
            console.log('[PetManager] Pets loaded:', this.pets);
            await this.loadDeviceTokens();
        } catch (error) {
            console.error('[PetManager] Error loading pets:', error);
            this.toast.show('Failed to load pets', 'danger');
        } finally {
            console.log('[PetManager] Calling renderPets()');
            this.renderPets();
            this.showLoading(false);
            console.log('[PetManager] loadPets() complete');
        }
    }

    async loadDeviceTokens() {
        try {
            const tokensSnapshot = await this.firebase.getCollection('fcm_tokens');
            this.deviceTokens = {};
            
            tokensSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.petId) {
                    if (!this.deviceTokens[data.petId]) {
                        this.deviceTokens[data.petId] = [];
                    }
                    this.deviceTokens[data.petId].push({
                        id: doc.id,
                        ...data
                    });
                }
            });
        } catch (error) {
            console.error('Error loading device tokens:', error);
        }
    }

    async loadUserUrlNames() {
        try {
            if (!this.urlNameManager || !this.users) return;
            
            this.userUrlNames = {};
            for (const user of this.users) {
                if (user && user.id) {
                    const urlName = await this.urlNameManager.getUrlNameForUser(user.id);
                    if (urlName) {
                        this.userUrlNames[user.id] = urlName;
                    }
                }
            }
            console.log('[PetManager] User URL names loaded:', this.userUrlNames);
        } catch (error) {
            console.error('[PetManager] Error loading user URL names:', error);
        }
    }

    renderUserFilterPills() {
        // Ensure pills container exists and is above the pet cards grid
        let pillsContainer = document.getElementById('userFilterPills');
        let petsGrid = document.getElementById('petsGrid');
        if (!pillsContainer) {
            pillsContainer = document.createElement('div');
            pillsContainer.id = 'userFilterPills';
            pillsContainer.className = 'flex flex-wrap gap-2 mb-6';
            // Place pillsContainer just before petsGrid
            if (petsGrid && petsGrid.parentNode) {
                petsGrid.parentNode.insertBefore(pillsContainer, petsGrid);
            }
        }
        // Unique users by id
        const uniqueUsers = [];
        const seen = new Set();
        if (this.users && this.users.length > 0) {
            for (const user of this.users) {
                if (user && user.id && !seen.has(user.id)) {
                    uniqueUsers.push(user);
                    seen.add(user.id);
                }
            }
        }
        // Tailwind pill styles
        const pillBase = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors duration-150 focus:outline-none mr-2 mb-2';
        const pillActive = 'bg-blue-600 text-white border-blue-600 shadow';
        const pillInactive = 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white';
        const pillGray = 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-blue-600 hover:text-white';
        let pillsHtml = '';
        pillsHtml += `<button class="${pillBase} ${this.activeUserFilter === 'all' ? pillActive : pillInactive}" data-userid="all">All pets</button>`;
        // Only show 'My pets' pill for current user, not in user list
        if (this.currentUser) {
            pillsHtml += `<button class="${pillBase} ${this.activeUserFilter === this.currentUser.uid ? pillActive : pillInactive}" data-userid="${this.currentUser.uid}">My pets</button>`;
        }
        for (const user of uniqueUsers) {
            // Do not show a separate pill for the current user
            if (!this.currentUser || user.id !== this.currentUser.uid) {
                pillsHtml += `<button class="${pillBase} ${this.activeUserFilter === user.id ? pillActive : pillInactive}" data-userid="${user.id}">${user.displayName || user.email || user.id}</button>`;
            }
        }
        pillsHtml += `<button class="${pillBase} ${this.activeUserFilter === 'no-owner' ? pillActive : pillGray}" data-userid="no-owner">No owner</button>`;
        pillsContainer.innerHTML = pillsHtml;
        // Add event listeners
        const pills = pillsContainer.querySelectorAll('button');
        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                const userId = pill.getAttribute('data-userid');
                this.activeUserFilter = userId;
                this.renderPets();
                this.renderUserFilterPills();
            });
        });
    }

    renderPetsSection() {
        const petsSection = document.getElementById('petsSection');
        console.log('[PetManager] renderPetsSection called, petsSection:', petsSection);
        if (!petsSection) return;
        
        const content = `
            <div class="px-4 sm:px-6 lg:px-8 py-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">Pet Management</h2>
                    <div class="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
                        <input type="text" id="searchPets" class="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Search pets...">
                        <button id="refreshPetsBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">🔄 Refresh</button>
                        <button id="addPetBtn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">➕ Add Pet</button>
                    </div>
                </div>
                <div id="petsLoading" class="flex flex-col items-center justify-center py-12 hidden">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="mt-4 text-gray-600">Loading pets...</p>
                </div>
                <div id="petUserFilterPills" class="flex gap-2 mb-6"></div>
                <div id="petsGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            </div>
        `;
        
        console.log('[PetManager] About to set innerHTML, content length:', content.length);
        petsSection.innerHTML = content;
        console.log('[PetManager] innerHTML set, petsSection.innerHTML length:', petsSection.innerHTML.length);
        console.log('[PetManager] petsSection.children.length:', petsSection.children.length);
    }

    renderPets() {
        // Render the section container and controls
        this.renderPetsSection();
        console.log('[PetManager] renderPets() called, pets:', this.pets);
        const petsGrid = document.getElementById('petsGrid');
        if (!petsGrid) {
            console.warn('[PetManager] petsGrid not found in DOM');
            return;
        }
        // Render user filter pills if superadmin
        this.renderUserFilterPills && this.renderUserFilterPills();
        let filteredPets = this.pets;
        if (this.activeUserFilter && this.activeUserFilter !== 'all') {
            if (this.activeUserFilter === 'no-owner') {
                filteredPets = this.pets.filter(pet => !pet.userId || pet.userId === 'undefined' || pet.userId === 'null');
            } else if (this.currentUser && this.activeUserFilter === this.currentUser.uid) {
                filteredPets = this.pets.filter(pet => pet.userId === this.currentUser.uid);
            } else {
                filteredPets = this.pets.filter(pet => pet.userId === this.activeUserFilter);
            }
        }
        if (!filteredPets || filteredPets.length === 0) {
            petsGrid.innerHTML = `<div class="text-center text-gray-500 py-8">No pets found.</div>`;
            console.log('[PetManager] No pets found, rendered message.');
            this.setupEventListeners();
            return;
        }
        petsGrid.innerHTML = filteredPets.map(pet => this.createPetCard(pet)).join('');
        console.log('[PetManager] Pets rendered:', filteredPets.length);
        // Attach event listeners for pet actions
        petsGrid.querySelectorAll('.delete-pet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = btn.getAttribute('data-petid');
                this.deletePet(petId);
            });
        });
        petsGrid.querySelectorAll('.edit-pet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = btn.getAttribute('data-petid');
                this.editPet(petId);
            });
        });
        petsGrid.querySelectorAll('.link-device-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = btn.getAttribute('data-petid');
                this.linkDeviceForPet(petId);
            });
        });
        petsGrid.querySelectorAll('.test-notification-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = btn.getAttribute('data-petid');
                this.testPetNotification(petId);
            });
        });
        petsGrid.querySelectorAll('.toggle-missing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const petId = btn.getAttribute('data-petid');
                const pet = this.pets.find(p => p.id === petId);
                let status = pet && pet.status ? pet.status.toLowerCase() : 'active';
                if (status === 'missing') {
                    this.markPetAsFound(petId);
                } else {
                    this.markPetAsMissing(petId);
                }
            });
        });
        // Add event listeners for language dropdowns
        petsGrid.querySelectorAll('.language-dropdown').forEach(dropdown => {
            dropdown.addEventListener('change', (e) => {
                const petId = e.target.getAttribute('data-petid');
                const language = e.target.value;
                console.log('[DEBUG] Dropdown changed:', { petId, language });
                this.updatePetLanguage(petId, language);
            });
        });
        // Re-attach event listeners for controls (Add Pet, Refresh, Search)
        this.setupEventListeners();
    }

    createPetCard(pet) {
        const petDevices = this.deviceTokens[pet.id] || [];
        // Determine status pill
        let status = pet.status ? pet.status.toLowerCase() : 'active';
        let statusPill = '';
        if (status === 'missing') {
            statusPill = '<span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">missing</span>';
        } else {
            statusPill = '<span class="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">found</span>';
        }
        // Owner field (show 'No owner' if missing)
        let ownerField = `Owner: ${(!pet.userId || pet.userId === 'undefined' || pet.userId === 'null') ? 'No owner' : pet.userId}`;
        // Single toggle button for missing/found
        let toggleButton = '';
        if (status === 'missing') {
            toggleButton = `<button class="w-full px-3 py-2 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 toggle-missing-btn" data-petid="${pet.id}">✅ Mark as Found</button>`;
        } else {
            toggleButton = `<button class="w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 toggle-missing-btn" data-petid="${pet.id}">⚠️ Set as Missing</button>`;
        }
        // Get URL name for the pet's owner
        let publicLink = '';
        if (pet.userId && this.userUrlNames[pet.userId]) {
            const urlName = this.userUrlNames[pet.userId];
            const petName = pet.name || 'pet';
            const publicUrl = `http://localhost:8016/${urlName}/${petName}`;
            publicLink = `
                <div class="mb-3">
                    <a href="${publicUrl}" target="_blank" class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        🌐 View Public Page
                    </a>
                </div>
            `;
        }
        
        // Language dropdown
        const currentLanguage = pet.language || 'da_DK';
        const languageDropdown = `
            <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 mb-1">🌐 Pet Page Language</label>
                <select class="language-dropdown w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" data-petid="${pet.id}">
                    <option value="da_DK" ${currentLanguage === 'da_DK' ? 'selected' : ''}>🇩🇰 Dansk (Danish)</option>
                    <option value="en_GB" ${currentLanguage === 'en_GB' ? 'selected' : ''}>🇬🇧 English</option>
                </select>
            </div>
        `;
        
        // Card HTML
        const cardHtml = `
            <div class="bg-white shadow rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold">${pet.name || 'Unnamed Pet'}</h3>
                    ${statusPill}
                </div>
                <div class="text-sm text-gray-700 mb-2">${ownerField}</div>
                ${publicLink}
                ${languageDropdown}
                <div class="text-xs text-gray-500">ID: ${pet.id}</div>
                <div class="text-xs text-gray-500">Created: ${this.formatTime(pet.createdAt)}</div>
                <div class="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 class="font-medium text-gray-900 mb-3">Linked Devices (${petDevices.length})</h4>
                    <div class="space-y-3">
                        ${petDevices.map(device => `
                            <div class="flex justify-between items-center">
                                <div class="flex-1">
                                    <div class="font-medium text-gray-900">${device.deviceName || 'Unknown Device'}</div>
                                    <div class="text-xs text-gray-500">${device.userId || 'Unknown User'} • ${this.formatTime(device.timestamp?.toDate?.() || device.timestamp)}</div>
                                </div>
                                <button class="ml-3 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 unlink-device-btn" data-deviceid="${device.id}" data-petid="${pet.id}">❌</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="space-y-3">
                    <button class="w-full px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 link-device-btn" data-petid="${pet.id}">
                        🔗 Link Device for ${pet.name || 'Pet'}
                    </button>
                    <button class="w-full px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 test-notification-btn" data-petid="${pet.id}">
                        🧪 Test Notification
                    </button>
                    <div class="border-l-4 border-yellow-400 bg-yellow-50 p-3 rounded-r-md">
                        <div class="flex gap-2">
                            ${toggleButton}
                        </div>
                    </div>
                    <div class="flex gap-2 pt-3 border-t border-gray-200">
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 edit-pet-btn" data-petid="${pet.id}">
                            ✏️ Edit
                        </button>
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 delete-pet-btn" data-petid="${pet.id}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        return cardHtml;
    }

    async linkDeviceForPet(petId) {
        try {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) {
                this.toast.show('Pet not found', 'danger');
                return;
            }

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                this.toast.show('Notification permission denied', 'danger');
                return;
            }

            // Get FCM token (this would need to be implemented in FirebaseService)
            const token = await this.getFCMToken();
            if (!token) {
                this.toast.show('Failed to get device token', 'danger');
                return;
            }

            // Save token to Firestore
            const deviceData = {
                token: token,
                petId: petId,
                userId: this.adminPanel.getCurrentUser().uid,
                deviceName: this.getDeviceName(),
                timestamp: new Date(),
                type: 'pet_notification'
            };

            await this.firebase.addDocument('fcm_tokens', deviceData);
            // Log activity
            await this.firebase.addDocument('clicks', {
                description: `Device linked for pet "${pet.name}"`,
                timestamp: new Date(),
                type: 'device_linked',
                userId: this.adminPanel.getCurrentUser().uid,
                petId: petId
            });

            this.toast.show(`Device linked for ${pet.name || 'pet'}`, 'success');
            await this.loadPets(); // Refresh the display
            
        } catch (error) {
            console.error('Error linking device:', error);
            this.toast.show(`Failed to link device: ${error.message}`, 'danger');
        }
    }

    async unlinkDevice(deviceId, petId) {
        try {
            // Log activity before unlinking
            const pet = this.pets.find(p => p.id === petId);
            await this.firebase.addDocument('clicks', {
                description: `Device unlinked from pet "${pet?.name || petId}"`,
                timestamp: new Date(),
                type: 'device_unlinked',
                userId: this.adminPanel.getCurrentUser().uid,
                petId: petId
            });
            await this.firebase.deleteDocument('fcm_tokens', deviceId);
            this.toast.show('Device unlinked', 'success');
            await this.loadPets();
        } catch (error) {
            console.error('Error unlinking device:', error);
            this.toast.show('Failed to unlink device', 'danger');
        }
    }

    async testPetNotification(petId) {
        try {
            // This would call a Cloud Function to send a test notification
            this.toast.show('Test notification sent', 'success');
        } catch (error) {
            console.error('Error sending test notification:', error);
            this.toast.show('Failed to send test notification', 'danger');
        }
    }

    async editPet(petId) {
        const pet = this.pets.find(p => p.id === petId);
        if (!pet) return;

        // Fetch all users for the owner dropdown
        let users = [];
        try {
            users = await this.firebase.getUsers();
        } catch (e) {
            users = [];
        }
        // Add 'No owner' option
        let ownerOptions = `<option value="">No owner</option>`;
        ownerOptions += users.map(u => `<option value="${u.id}"${u.id === pet.userId ? ' selected' : ''}>${u.displayName || u.email || u.id}</option>`).join('');
        // If pet.userId is missing/empty, select 'No owner'
        if (!pet.userId || pet.userId === 'undefined' || pet.userId === 'null') {
            ownerOptions = `<option value="" selected>No owner</option>` +
                users.map(u => `<option value="${u.id}">${u.displayName || u.email || u.id}</option>`).join('');
        }

        this.modal.show('Edit Pet', `
            <form id="editPetForm" class="space-y-4">
                <div>
                    <label for="petName" class="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                    <input type="text" id="petName" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${pet.name || ''}" required>
                </div>
                <div>
                    <label for="petOwner" class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select id="petOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        ${ownerOptions}
                    </select>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">Save Changes</button>
                    <button type="button" id="cancelEditPetBtn" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none">Cancel</button>
                </div>
            </form>
        `);
        setTimeout(() => {
            const form = document.getElementById('editPetForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.updatePet(petId);
                });
            }
            // Handle cancel button
            const cancelBtn = document.getElementById('cancelEditPetBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.modal.hide();
                });
            }
        }, 100);
    }

    async updatePet(petId) {
        try {
            const name = document.getElementById('petName').value;
            let userId = document.getElementById('petOwner').value;
            if (userId === 'undefined' || userId === 'null') userId = '';
            await this.firebase.updateDocument('pets', petId, {
                name: name,
                userId: userId
            });
            // Log activity
            await this.firebase.addDocument('clicks', {
                description: `Pet "${name}" was updated`,
                timestamp: new Date(),
                type: 'pet_updated',
                userId: userId,
                petId: petId
            });
            this.toast.show('Pet updated successfully', 'success');
            this.modal.hide();
            await this.loadPets();
        } catch (error) {
            console.error('Error updating pet:', error);
            this.toast.show('Failed to update pet', 'danger');
        }
    }

    async deletePet(petId) {
        try {
            console.log('[PetManager] Attempting to delete pet:', petId);
            await this.firebase.deletePet(petId);
            this.toast.show('Pet deleted successfully', 'success');
            console.log('[PetManager] Pet deleted, reloading pets...');
            await this.loadPets();
        } catch (error) {
            console.error('[PetManager] Error deleting pet:', error);
            this.toast.show('Failed to delete pet', 'danger');
        }
    }

    async showAddPetModal() {
        // Get current user
        const currentUser = this.adminPanel.getCurrentUser();
        let users = [];
        try {
            users = await this.firebase.getUsers();
        } catch (e) {
            users = [];
        }
        // Add 'No owner' option
        let ownerOptions = `<option value="">No owner</option>`;
        if (currentUser) {
            ownerOptions += `<option value="${currentUser.uid}">Me (${currentUser.displayName || currentUser.email || currentUser.uid})</option>`;
        }
        ownerOptions += users.filter(u => !currentUser || u.id !== currentUser.uid)
            .map(u => `<option value="${u.id}">${u.displayName || u.email || u.id}</option>`)
            .join('');
        this.modal.show('Add New Pet', `
            <form id="addPetForm" class="space-y-4">
                <div>
                    <label for="newPetName" class="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                    <input type="text" id="newPetName" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="newPetOwner" class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select id="newPetOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        ${ownerOptions}
                    </select>
                </div>
                <div class="flex justify-end gap-2">
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">Add Pet</button>
                    <button type="button" id="cancelAddPetBtn" class="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-100 focus:outline-none">Cancel</button>
                </div>
            </form>
        `);
        setTimeout(() => {
            const form = document.getElementById('addPetForm');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.addPet();
                });
            }
            // Handle cancel button
            const cancelBtn = document.getElementById('cancelAddPetBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.modal.hide();
                });
            }
        }, 100);
    }

    async addPet() {
        try {
            const name = document.getElementById('newPetName').value;
            let userId = document.getElementById('newPetOwner').value;
            if (userId === 'undefined' || userId === 'null') userId = '';
            // Set default status to 'active' (found) if not provided
            const petData = {
                name: name,
                userId: userId,
                status: 'active'
            };
            await this.firebase.addPet(petData); // Use service method for auto-ID
            // Log activity/check-in for recent activity feed
            await this.firebase.addDocument('clicks', {
                description: `New pet "${name}" was added`,
                timestamp: new Date(),
                type: 'pet_added',
                userId: userId
            });
            this.toast.show('Pet added successfully', 'success');
            this.modal.hide();
            await this.loadPets();
        } catch (error) {
            console.error('Error adding pet:', error);
            this.toast.show('Failed to add pet', 'danger');
        }
    }

    filterPets() {
        const searchTerm = document.getElementById('searchPets').value.toLowerCase();
        const petCards = document.querySelectorAll('.pet-card');
        
        petCards.forEach(card => {
            const petName = card.querySelector('h3').textContent.toLowerCase();
            const petOwner = card.querySelector('.pet-info p').textContent.toLowerCase();
            const isVisible = petName.includes(searchTerm) || petOwner.includes(searchTerm);
            card.style.display = isVisible ? 'block' : 'none';
        });
    }

    showLoading(show) {
        const loadingEl = document.getElementById('petsLoading');
        const gridEl = document.getElementById('petsGrid');
        
        if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
        if (gridEl) gridEl.style.display = show ? 'none' : 'grid';
    }

    // Utility methods
    getDeviceName() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome')) return 'Chrome Browser';
        if (userAgent.includes('Firefox')) return 'Firefox Browser';
        if (userAgent.includes('Safari')) return 'Safari Browser';
        if (userAgent.includes('Edge')) return 'Edge Browser';
        return 'Unknown Browser';
    }

    async getFCMToken() {
        // This would need to be implemented with Firebase Messaging
        // For now, return a placeholder
        return 'placeholder-token';
    }

    formatTime(date) {
        if (!date) return '-';
        // Firestore Timestamp
        if (typeof date === 'object' && typeof date.toDate === 'function') {
            date = date.toDate();
        }
        // String date
        if (typeof date === 'string') {
            const parsed = Date.parse(date);
            if (!isNaN(parsed)) date = new Date(parsed);
        }
        // JS Date
        if (date instanceof Date && !isNaN(date)) {
            return date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        return '-';
    }

    async markPetAsMissing(petId) {
        try {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) {
                this.toast.show('Pet not found', 'danger');
                return;
            }
            const collectionPath = `users/${pet.userId}/pets`;
            await this.firebase.updateDocument(collectionPath, petId, {
                status: 'missing',
                updatedAt: new Date()
            });
            // Use setDocument with merge:true for pet_status
            await this.firebase.setDocument('pet_status', petId, {
                status: 'MISSING',
                updatedBy: this.adminPanel.getCurrentUser().uid,
                updatedAt: new Date()
            }, true);
            await this.firebase.addDocument('clicks', {
                description: `Pet "${pet.name}" was marked as missing`,
                timestamp: new Date(),
                type: 'pet_missing',
                userId: pet.userId,
                petId: petId
            });
            // Fetch the latest value and show a user-facing status
            const petDoc = await this.firebase.getDoc(collectionPath, petId);
            let status = petDoc.exists() ? petDoc.data().status : 'not found';
            this.toast.show(`${pet.name || 'Pet'} marked as missing. Current status: ${status}`, 'warning');
            await this.loadPets();
        } catch (error) {
            try {
                const pet = this.pets.find(p => p.id === petId);
                const collectionPath = pet ? `users/${pet.userId}/pets` : 'pets';
                const petDoc = await this.firebase.getDoc(collectionPath, petId);
                let status = petDoc.exists() ? petDoc.data().status : 'not found';
                this.toast.show(`Failed to mark pet as missing. Current status: ${status}. Error: ${error && error.message ? error.message : error}`, 'danger');
            } catch (fetchError) {
                this.toast.show(`Failed to mark pet as missing. Could not fetch current status. Error: ${error && error.message ? error.message : error}`, 'danger');
            }
            console.error('Error marking pet as missing:', error, 'petId:', petId);
        }
    }

    async markPetAsFound(petId) {
        try {
            const pet = this.pets.find(p => p.id === petId);
            if (!pet) {
                this.toast.show('Pet not found', 'danger');
                return;
            }
            const collectionPath = `users/${pet.userId}/pets`;
            await this.firebase.updateDocument(collectionPath, petId, {
                status: 'active',
                updatedAt: new Date()
            });
            // Use setDocument with merge:true for pet_status
            await this.firebase.setDocument('pet_status', petId, {
                status: 'OK',
                updatedBy: this.adminPanel.getCurrentUser().uid,
                updatedAt: new Date()
            }, true);
            await this.firebase.addDocument('clicks', {
                description: `Pet "${pet.name}" was marked as found`,
                timestamp: new Date(),
                type: 'pet_found',
                userId: pet.userId,
                petId: petId
            });
            // Fetch the latest value and show a user-facing status
            const petDoc = await this.firebase.getDoc(collectionPath, petId);
            let status = petDoc.exists() ? petDoc.data().status : 'not found';
            this.toast.show(`${pet.name || 'Pet'} marked as found. Current status: ${status}`, 'success');
            await this.loadPets();
        } catch (error) {
            try {
                const pet = this.pets.find(p => p.id === petId);
                const collectionPath = pet ? `users/${pet.userId}/pets` : 'pets';
                const petDoc = await this.firebase.getDoc(collectionPath, petId);
                let status = petDoc.exists() ? petDoc.data().status : 'not found';
                this.toast.show(`Failed to mark pet as found. Current status: ${status}. Error: ${error && error.message ? error.message : error}`, 'danger');
            } catch (fetchError) {
                this.toast.show(`Failed to mark pet as found. Could not fetch current status. Error: ${error && error.message ? error.message : error}`, 'danger');
            }
            console.error('Error marking pet as found:', error, 'petId:', petId);
        }
    }

    async updatePetLanguage(petId, language) {
        try {
            console.log('[DEBUG] updatePetLanguage called with:', { petId, language });
            console.log('[DEBUG] this.pets IDs:', this.pets.map(p => p.id));
            const pet = this.pets.find(p => p.id === petId);
            console.log('[DEBUG] updatePetLanguage:', { petId, language, pet });
            if (!pet) {
                this.toast.show('Pet not found', 'danger');
                return;
            }
            // Always use the pet.id from the loaded object to avoid I/l confusion
            const collectionPath = `users/${pet.userId}/pets`;
            const correctPetId = pet.id;
            console.log('[DEBUG] Firestore path:', collectionPath, 'petId:', correctPetId);
            await this.firebase.updateDocument(collectionPath, correctPetId, {
                language: language
            });
            this.toast.show('Pet language updated successfully', 'success');
            await this.loadPets(); // Refresh the display
        } catch (error) {
            console.error('[DEBUG] Error updating pet language:', error);
            this.toast.show(`${error && error.message ? error.message : error} Failed to update pet language`, 'danger');
        }
    }
} 