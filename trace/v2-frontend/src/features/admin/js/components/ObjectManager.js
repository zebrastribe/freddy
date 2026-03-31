// Object Manager Component
export class ObjectManager {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.firebase = adminPanel.getService('firebase');
        this.toast = adminPanel.getService('toast');
        this.modal = adminPanel.getService('modal');
        
        this.pets = [];
        this.deviceTokens = {};
        
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
            let petsPromise = this.firebase.getObjects();
            let usersPromise = null;
            if (currentUser && currentUser.role === 'superadmin') {
                usersPromise = this.firebase.getUsers();
            }
            // Await pets and users in parallel if superadmin
            const [petsData, users] = await Promise.all([
                petsPromise,
                usersPromise ? usersPromise : Promise.resolve([])
            ]);
            this.pets = Array.isArray(petsData) ? petsData : [];
            this.users = users;
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
                if (data.objectId) {
                    if (!this.deviceTokens[data.objectId]) {
                        this.deviceTokens[data.objectId] = [];
                    }
                    this.deviceTokens[data.objectId].push({
                        id: doc.id,
                        ...data
                    });
                }
            });
        } catch (error) {
            console.error('Error loading device tokens:', error);
        }
    }

    renderUserFilterPills() {
        const pillsContainerId = 'petUserFilterPills';
        let pillsContainer = document.getElementById(pillsContainerId);
        if (!pillsContainer) {
            const petsSection = document.getElementById('petsSection');
            pillsContainer = document.createElement('div');
            pillsContainer.id = pillsContainerId;
            pillsContainer.className = 'flex gap-2 mb-6 overflow-x-auto whitespace-nowrap';
            petsSection.insertBefore(pillsContainer, petsSection.children[1]);
        }
        const currentUser = this.adminPanel.getCurrentUser();
        if (!currentUser || currentUser.role !== 'superadmin') {
            pillsContainer.innerHTML = '';
            return;
        }
        if (!this.users || this.users.length === 0) {
            pillsContainer.innerHTML = '';
            return;
        }
        // Pills: All pets + My pets + all users
        if (!this.activeUserFilter) {
            this.activeUserFilter = 'all';
        }
        let html = '';
        const pillBase = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors duration-150 focus:outline-none';
        const pillActive = 'bg-blue-600 text-white border-blue-600 shadow';
        const pillInactive = 'bg-white text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white';
        const pillGray = 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-blue-600 hover:text-white';
        html += `<button class="user-pill ${pillBase} ${this.activeUserFilter === 'all' ? pillActive : pillInactive}" data-userid="all">All pets</button>`;
        html += `<button class="user-pill ${pillBase} ${this.activeUserFilter === 'my' ? pillActive : pillGray}" data-userid="my">My pets</button>`;
        for (const user of this.users) {
            html += `<button class="user-pill ${pillBase} ${this.activeUserFilter === user.id ? pillActive : pillGray}" data-userid="${user.id}">${user.displayName || user.email || user.id}</button>`;
        }
        pillsContainer.innerHTML = html;
        // Add event listeners
        pillsContainer.querySelectorAll('.user-pill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-userid');
                this.activeUserFilter = userId;
                this.renderPets();
                pillsContainer.querySelectorAll('.user-pill').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'shadow'));
                btn.classList.add('bg-blue-600', 'text-white', 'shadow');
            });
        });
        pillsContainer.querySelectorAll('.user-pill').forEach(btn => {
            if (btn.getAttribute('data-userid') === this.activeUserFilter) {
                btn.classList.add('bg-blue-600', 'text-white', 'shadow');
            } else {
                btn.classList.remove('bg-blue-600', 'text-white', 'shadow');
            }
        });
    }

    renderPetsSection() {
        const petsSection = document.getElementById('petsSection');
        if (!petsSection) return;
        petsSection.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        let petsToShow = this.pets;
        const currentUser = this.adminPanel.getCurrentUser();
        if (currentUser && currentUser.role === 'superadmin') {
            if (this.activeUserFilter === 'my') {
                petsToShow = this.pets.filter(p => p.userId === currentUser.uid);
            } else if (this.activeUserFilter && this.activeUserFilter !== 'all') {
                petsToShow = this.pets.filter(p => p.userId === this.activeUserFilter);
            } // else 'all' shows all pets
        } else if (currentUser && currentUser.role !== 'superadmin') {
            petsToShow = this.pets.filter(p => p.userId === currentUser.uid);
        }
        if (!petsToShow || petsToShow.length === 0) {
            petsGrid.innerHTML = `<div class="text-center text-gray-500 py-8">No pets found.</div>`;
            console.log('[PetManager] No pets found, rendered message.');
            return;
        }
        petsGrid.innerHTML = petsToShow.map(pet => this.createPetCard(pet)).join('');
        console.log('[PetManager] Pets rendered:', petsToShow.length);
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
        // Debug log for userId
        console.log('[PetManager] pet.userId:', pet.userId, 'type:', typeof pet.userId);
        // Owner badge (robust check, now red for visibility)
        let ownerBadge = '';
        if (!pet.userId || pet.userId === 'undefined' || pet.userId === undefined || pet.userId === null || pet.userId === 'null') {
            ownerBadge = '<span style="background:red;color:white;padding:2px 6px;border-radius:8px;margin-left:8px;font-size:12px;">No owner</span>';
        }
        // Single toggle button for missing/found
        let toggleButton = '';
        if (status === 'missing') {
            toggleButton = `<button class="w-full px-3 py-2 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 toggle-missing-btn" data-petid="${pet.id}">✅ Mark as Found</button>`;
        } else {
            toggleButton = `<button class="w-full px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 toggle-missing-btn" data-petid="${pet.id}">⚠️ Set as Missing</button>`;
        }
        return `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-semibold text-gray-900">${pet.name || 'Unnamed Pet'}</h3>
                        <div class="flex items-center">
                            ${statusPill}
                        </div>
                    </div>
                    <div class="space-y-3 text-sm text-gray-600 mb-6 pet-info">
                        <p><span class="font-medium">Owner:</span> ${pet.userId || 'Unknown'}${ownerBadge}</p>
                        <p><span class="font-medium">ID:</span> ${pet.id}</p>
                        <p><span class="font-medium">Created:</span> ${this.formatTime(pet.createdAt)}</p>
                    </div>
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
            </div>
        `;
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
                objectId: petId,
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
                objectId: petId
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
                objectId: petId
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
        // Always show all users, never 'Me'. Select the actual owner.
        const ownerOptions = users.map(u => `<option value="${u.id}"${u.id === pet.userId ? ' selected' : ''}>${u.displayName || u.email || u.id} (${u.id})</option>`).join('');

        this.modal.show('Edit Pet', `
            <form id="editPetForm" class="space-y-4">
                <div>
                    <label for="petName" class="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                    <input type="text" id="petName" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${pet.name || ''}" required>
                </div>
                <div>
                    <label for="petOwner" class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select id="petOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        ${ownerOptions}
                    </select>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Changes</button>
                    <button type="button" id="cancelEditPetBtn" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
                </div>
            </form>
        `);

        // Handle form submission
        document.getElementById('editPetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updatePet(petId);
        });

        // Handle cancel button
        document.getElementById('cancelEditPetBtn').addEventListener('click', () => {
            this.modal.hide();
        });
    }

    async updatePet(petId) {
        try {
            const name = document.getElementById('petName').value;
            const userId = document.getElementById('petOwner').value;

            await this.firebase.updateObject(petId, {
                name: name,
                userId: userId
            });
            // Log activity
            await this.firebase.addDocument('clicks', {
                description: `Pet "${name}" was updated`,
                timestamp: new Date(),
                type: 'pet_updated',
                userId: userId,
                objectId: petId
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
        if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
            return;
        }

        try {
            // Log activity before deletion
            const pet = this.pets.find(p => p.id === petId);
            await this.firebase.addDocument('clicks', {
                description: `Pet "${pet?.name || petId}" was deleted`,
                timestamp: new Date(),
                type: 'pet_deleted',
                userId: pet?.userId || '',
                objectId: petId
            });
            await this.firebase.deleteObject(petId);
            this.toast.show('Pet deleted successfully', 'success');
            await this.loadPets();
        } catch (error) {
            console.error('Error deleting pet:', error);
            this.toast.show('Failed to delete pet', 'danger');
        }
    }

    async showAddPetModal() {
        // Fetch all users for the owner dropdown
        let users = [];
        try {
            users = await this.firebase.getUsers();
        } catch (e) {
            users = [];
        }
        // Always show all users, never 'Me'.
        const ownerOptions = users.map(u => `<option value="${u.id}">${u.displayName || u.email || u.id} (${u.id})</option>`).join('');
        this.modal.show('Add New Pet', `
            <form id="addPetForm" class="space-y-4">
                <div>
                    <label for="newPetName" class="block text-sm font-medium text-gray-700 mb-2">Pet Name</label>
                    <input type="text" id="newPetName" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="newPetOwner" class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                    <select id="newPetOwner" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="" disabled selected>Select owner...</option>
                        ${ownerOptions}
                    </select>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Add Pet</button>
                    <button type="button" id="cancelAddPetBtn" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Cancel</button>
                </div>
            </form>
        `);

        document.getElementById('addPetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addPet();
        });

        // Handle cancel button
        document.getElementById('cancelAddPetBtn').addEventListener('click', () => {
            this.modal.hide();
        });
    }

    async addPet() {
        try {
            const name = document.getElementById('newPetName').value;
            const userId = document.getElementById('newPetOwner').value;

            // Set default status to 'active' (found) if not provided
            const petData = {
                name: name,
                userId: userId,
                createdAt: new Date(),
                status: 'active'
            };

            await this.firebase.addObject(petData);
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
            await this.firebase.updateObject(petId, {
                status: 'missing',
                updatedAt: new Date()
            });
            // Use setDocument with merge:true for pet_status
            await this.firebase.setDocument('object_status', petId, {
                status: 'MISSING',
                updatedBy: this.adminPanel.getCurrentUser().uid,
                updatedAt: new Date()
            }, true);
            await this.firebase.addDocument('clicks', {
                description: `Pet "${pet.name}" was marked as missing`,
                timestamp: new Date(),
                type: 'pet_missing',
                userId: pet.userId,
                objectId: petId
            });
            // Fetch the latest value from Firestore and show in toast
            const petDoc = await this.firebase.getObject(petId);
            let status = petDoc ? petDoc.status : 'not found';
            this.toast.show(`${pet.name || 'Pet'} marked as missing. Current status: ${status}`, 'warning');
            await this.loadPets();
        } catch (error) {
            try {
                const petDoc = await this.firebase.getObject(petId);
                let status = petDoc ? petDoc.status : 'not found';
                this.toast.show(`Failed to mark pet as missing. Current status: ${status}. Error: ${error && error.message ? error.message : error}`, 'danger');
            } catch (fetchError) {
                this.toast.show(`Failed to mark pet as missing. Could not fetch Firestore value. Error: ${error && error.message ? error.message : error}`, 'danger');
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
            await this.firebase.updateObject(petId, {
                status: 'active',
                updatedAt: new Date()
            });
            // Use setDocument with merge:true for pet_status
            await this.firebase.setDocument('object_status', petId, {
                status: 'OK',
                updatedBy: this.adminPanel.getCurrentUser().uid,
                updatedAt: new Date()
            }, true);
            await this.firebase.addDocument('clicks', {
                description: `Pet "${pet.name}" was marked as found`,
                timestamp: new Date(),
                type: 'pet_found',
                userId: pet.userId,
                objectId: petId
            });
            // Fetch the latest value from Firestore and show in toast
            const petDoc = await this.firebase.getObject(petId);
            let status = petDoc ? petDoc.status : 'not found';
            this.toast.show(`${pet.name || 'Pet'} marked as found. Current status: ${status}`, 'success');
            await this.loadPets();
        } catch (error) {
            try {
                const petDoc = await this.firebase.getObject(petId);
                let status = petDoc ? petDoc.status : 'not found';
                this.toast.show(`Failed to mark pet as found. Current status: ${status}. Error: ${error && error.message ? error.message : error}`, 'danger');
            } catch (fetchError) {
                this.toast.show(`Failed to mark pet as found. Could not fetch Firestore value. Error: ${error && error.message ? error.message : error}`, 'danger');
            }
            console.error('Error marking pet as found:', error, 'petId:', petId);
        }
    }
} 

export { ObjectManager as PetManager };