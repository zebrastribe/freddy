const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'pet_admin', label: 'Pet Admin' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' }
];

// Default permissions matrix
const DEFAULT_PERMISSIONS = {
  super_admin: {
    overview: { view: true, create: false, edit: false, delete: false },
    users: { view: true, create: true, edit: true, delete: true, all: true },
    pets: { view: true, create: true, edit: true, delete: true, all: true },
    notifications: { view: true, create: true, edit: true, delete: true, all: true },
    profile: { view: true, create: false, edit: true, delete: false, all: true }
  },
  admin: {
    overview: { view: true, create: false, edit: false, delete: false },
    users: { view: true, create: true, edit: true, delete: false, all: true },
    pets: { view: true, create: true, edit: true, delete: true, all: true },
    notifications: { view: true, create: true, edit: true, delete: false, all: true },
    profile: { view: true, create: false, edit: true, delete: false, all: false }
  },
  pet_admin: {
    overview: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false, all: false },
    pets: { view: true, create: true, edit: true, delete: true, all: true },
    notifications: { view: true, create: false, edit: false, delete: false, all: false },
    profile: { view: true, create: false, edit: true, delete: false, all: false }
  },
  user: {
    overview: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false, all: false },
    pets: { view: true, create: true, edit: true, delete: true, all: false, own: true },
    notifications: { view: true, create: false, edit: false, delete: false, all: false, own: true },
    profile: { view: true, create: false, edit: true, delete: false, all: false, own: true }
  },
  guest: {
    overview: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false, all: false },
    pets: { view: true, create: false, edit: false, delete: false, all: false },
    notifications: { view: false, create: false, edit: false, delete: false, all: false },
    profile: { view: false, create: false, edit: false, delete: false, all: false }
  }
};

export class UserManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.users = [];
        this.permissions = DEFAULT_PERMISSIONS;
    }

    async init() {
        console.log('👥 Initializing User Manager...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load permissions from Firestore
        await this.loadPermissions();
        
        // Load initial data
        await this.loadUsers();
        
        console.log('✅ User Manager initialized');
    }

    async loadPermissions() {
        try {
            console.log('[UserManager] loadPermissions() called');
            const firebase = this.adminApp.getService('firebase');
            console.log('[UserManager] Getting permissions document...');
            const permissionsDoc = await firebase.getDocument('system_config', 'permissions');
            console.log('[UserManager] Permissions document:', permissionsDoc);
            
            if (permissionsDoc && permissionsDoc.exists()) {
                console.log('[UserManager] Permissions document exists, loading data...');
                this.permissions = { ...DEFAULT_PERMISSIONS, ...permissionsDoc.data() };
                console.log('[UserManager] Permissions loaded from Firestore:', this.permissions);
            } else {
                console.log('[UserManager] Permissions document does not exist, initializing with defaults...');
                // Initialize with default permissions
                await firebase.setDocument('system_config', 'permissions', DEFAULT_PERMISSIONS);
                this.permissions = DEFAULT_PERMISSIONS;
                console.log('[UserManager] Default permissions initialized:', this.permissions);
            }
        } catch (error) {
            console.error('[UserManager] Error loading permissions:', error);
            this.permissions = DEFAULT_PERMISSIONS;
            console.log('[UserManager] Using default permissions due to error:', this.permissions);
        }
    }

    async savePermissions() {
        try {
            const firebase = this.adminApp.getService('firebase');
            await firebase.setDocument('system_config', 'permissions', this.permissions);
            this.adminApp.toastService?.show('Permissions saved successfully', 'success');
        } catch (error) {
            console.error('Error saving permissions:', error);
            this.adminApp.toastService?.show('Failed to save permissions', 'error');
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchUsers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const userItems = document.querySelectorAll('#usersTabPanel li');
                
                userItems.forEach(item => {
                    const userName = item.querySelector('.text-gray-900').textContent.toLowerCase();
                    const userEmail = item.querySelector('.text-gray-500').textContent.toLowerCase();
                    const userUrl = item.querySelector('.font-mono').textContent.toLowerCase();
                    
                    if (userName.includes(searchTerm) || userEmail.includes(searchTerm) || userUrl.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }

        // Add User button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }

        // Edit and Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-user-btn')) {
                const userId = e.target.dataset.userId;
                console.log('[UserManager] Edit button clicked for user:', userId);
                this.editUser(userId);
            }
            
            if (e.target.classList.contains('delete-user-btn')) {
                const userId = e.target.dataset.userId;
                this.deleteUser(userId);
            }
        });
    }

    async loadUsers() {
        console.log('[UserManager] loadUsers() called');
        const usersContent = document.getElementById('usersSection');
        console.log('[UserManager] usersContent found:', !!usersContent);
        if (!usersContent) return;

        console.log('[UserManager] Before loading, usersContent.innerHTML length:', usersContent.innerHTML.length);
        
        // Show loading spinner
        usersContent.innerHTML = `<div id="usersLoading" class="flex justify-center items-center py-8"><span class="text-gray-500">Loading users...</span></div>`;
        console.log('[UserManager] Loading spinner set, usersContent.innerHTML length:', usersContent.innerHTML.length);

        try {
            // Load permissions first
            await this.loadPermissions();
            
            const firebase = this.adminApp.getService('firebase');
            const usersSnapshot = await firebase.getCollection('users');
            
            const users = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    ...userData
                });
            });

            console.log('[UserManager] Users loaded:', users.length);
            
            // Store users in instance variable for later use
            this.users = users;
            console.log('[UserManager] Stored users in this.users:', this.users.length);
            console.log('[UserManager] User IDs:', this.users.map(u => u.id));
            
            // Create the tabbed interface
            const newContent = `
                <div class="mb-6 border-b border-gray-200">
                  <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button id="tab-users" class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600" data-tab="users">Users</button>
                    <button id="tab-roles" class="tab-btn whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" data-tab="roles">Roles & Permissions</button>
                  </nav>
                </div>
                
                <div id="usersTabPanel" class="tab-panel">
                  <div class="flex items-center justify-between mb-4">
                      <input id="searchUsers" type="text" placeholder="Search users..." class="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <div class="flex gap-2">
                          <button id="addUserBtn" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">Add New User</button>
                          <button id="refreshUsersBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">Refresh</button>
                      </div>
                  </div>
                  
                  <div class="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul class="divide-y divide-gray-200">
                          ${users.map(user => `
                              <li class="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                  <div class="flex items-center">
                                      <div class="flex-shrink-0">
                                          <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                              <span class="text-sm font-medium text-blue-800">${user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</span>
                                          </div>
                                      </div>
                                      <div class="ml-4">
                                          <div class="text-sm font-medium text-gray-900">${user.displayName || 'No name'}</div>
                                          <div class="text-sm text-gray-500">${user.email}</div>
                                          <div class="text-xs text-gray-400">URL: <span class="font-mono bg-gray-100 px-1 rounded">${user.urlName || 'No URL name'}</span></div>
                                      </div>
                                  </div>
                                  <div class="flex items-center space-x-2">
                                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getRoleBadgeColor(user.role)}">${user.role || 'user'}</span>
                                      <button class="edit-user-btn text-blue-600 hover:text-blue-900 text-sm font-medium" data-user-id="${user.id}">Edit</button>
                                      <button class="delete-user-btn text-red-600 hover:text-red-900 text-sm font-medium" data-user-id="${user.id}">Delete</button>
                                  </div>
                              </li>
                          `).join('')}
                      </ul>
                  </div>
                </div>
                
                <div id="rolesTabPanel" class="tab-panel hidden">
                  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                      <div class="px-4 py-5 sm:p-6">
                          ${this.getRolesTableRows()}
                      </div>
                  </div>
                </div>
            `;
            
            usersContent.innerHTML = newContent;
            console.log('[UserManager] Content set, usersContent.innerHTML length:', usersContent.innerHTML.length);
            
            // Setup event listeners
            this.setupEventListeners();
            this.setupTabSwitching();
            
        } catch (error) {
            console.error('[UserManager] Error loading users:', error);
            usersContent.innerHTML = `<div class="text-red-500">Error loading users: ${error.message}</div>`;
        }
    }

    renderUsers() {
        console.log('[UserManager] renderUsers() called');
        const usersGrid = document.getElementById('usersGrid');
        console.log('[UserManager] usersGrid found:', !!usersGrid);
        if (!usersGrid) {
            console.warn('[UserManager] usersGrid not found!');
            return;
        }

        console.log('[UserManager] About to render', this.users.length, 'users');
        const userCards = this.users.map(user => this.createUserCard(user)).join('');
        console.log('[UserManager] User cards generated, length:', userCards.length);
        
        usersGrid.innerHTML = userCards;
        console.log('[UserManager] usersGrid.innerHTML set, length:', usersGrid.innerHTML.length);

        // Check if content persists after a short delay
        setTimeout(() => {
            console.log('[UserManager] After 50ms, usersGrid.innerHTML length:', usersGrid.innerHTML.length);
        }, 50);

        // Attach event listeners for edit and delete buttons
        usersGrid.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.editUser(userId);
            });
        });
        usersGrid.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-user-id');
                this.deleteUser(userId);
            });
        });
        
        console.log('[UserManager] renderUsers() completed');
    }

    createUserCard(user) {
        // Role badge color mapping (match pet badge style, with reliable color for superadmin)
        const role = (user.role || '').toLowerCase();
        let badgeClass = 'bg-gray-100 text-gray-800';
        if (role === 'user') badgeClass = 'bg-blue-100 text-blue-800';
        else if (role === 'admin') badgeClass = 'bg-purple-100 text-purple-800';
        else if (role === 'superadmin') badgeClass = 'bg-red-100 text-red-800';
        else if (role === 'guest') badgeClass = 'bg-gray-100 text-gray-800';
        // Capitalize role text
        const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        return `
            <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-xl font-semibold text-gray-900">${user.displayName || 'Unknown User'}</div>
                        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${badgeClass}">${roleLabel}</span>
                    </div>
                    <div class="space-y-2 text-sm text-gray-600 mb-4">
                        <p><span class="font-medium">User ID:</span> ${user.id}</p>
                        <p><span class="font-medium">Created:</span> ${this.formatTime(user.createdAt)}</p>
                        <p><span class="font-medium">Last Login:</span> ${this.formatTime(user.lastLogin)}</p>
                    </div>
                    <div class="flex gap-2 pt-4 border-t border-gray-200">
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 edit-user-btn" data-user-id="${user.id}">✏️ Edit</button>
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 delete-user-btn" data-user-id="${user.id}">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    filterUsers() {
        const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
        const usersGrid = document.getElementById('usersGrid');
        
        if (!usersGrid) return;

        const filteredUsers = this.users.filter(user => 
            user.email.toLowerCase().includes(searchTerm) ||
            user.displayName.toLowerCase().includes(searchTerm) ||
            user.role.toLowerCase().includes(searchTerm)
        );

        usersGrid.innerHTML = filteredUsers.map(user => this.createUserCard(user)).join('');
    }

    showLoading(show) {
        const loadingElement = document.getElementById('usersLoading');
        const usersGrid = document.getElementById('usersGrid');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        
        if (usersGrid) {
            usersGrid.style.display = show ? 'none' : 'grid';
        }
    }

    formatTime(date) {
        if (!date) return 'Unknown';
        return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
    }

    async editUser(userId) {
        console.log('[UserManager] editUser called for user:', userId);
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            console.log('[UserManager] User not found:', userId);
            return;
        }

        console.log('[UserManager] Found user:', user);

        // Use unique IDs for form fields
        const emailId = `userEmail_${userId}`;
        const displayNameId = `userDisplayName_${userId}`;
        const roleId = `userRole_${userId}`;
        const passwordId = `userPassword_${userId}`;
        const phoneId = `userPhone_${userId}`;

        // Generate role options dynamically
        const roleOptions = ALL_ROLES.map(
          r => `<option value="${r.value}" ${user.role === r.value ? 'selected' : ''}>${r.label}</option>`
        ).join('');

        console.log('[UserManager] About to call modalService.show() for user:', userId);
        console.log('[UserManager] modalService available:', !!this.adminApp.modalService);
        
        if (!this.adminApp.modalService) {
            console.error('[UserManager] ModalService is not available!');
            return;
        }

        console.log('[UserManager] Calling modalService.show()...');
        this.adminApp.modalService.show('Edit User', `
            <form id="editUserForm_${userId}" class="space-y-6 p-6">
                <div>
                    <label for="${displayNameId}" class="block text-base font-semibold text-gray-800 mb-1">Display Name</label>
                    <input type="text" id="${displayNameId}" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value="${user.displayName || ''}" required placeholder="Full name" />
                </div>
                <div>
                    <label for="${emailId}" class="block text-base font-semibold text-gray-800 mb-1">Email</label>
                    <input type="email" id="${emailId}" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value="${user.email || ''}" required placeholder="you@example.com" />
                </div>
                <div>
                    <label for="${phoneId}" class="block text-base font-semibold text-gray-800 mb-1">Phone Number</label>
                    <input type="text" id="${phoneId}" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value="${user.phone || ''}" placeholder="Phone number" />
                </div>
                <div>
                    <label for="${passwordId}" class="block text-base font-semibold text-gray-800 mb-1">New Password</label>
                    <input type="password" id="${passwordId}" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Leave blank to keep current password" />
                </div>
                <div>
                    <label class="block text-base font-semibold text-gray-800 mb-1">User ID</label>
                    <input type="text" class="block w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-base text-gray-500" value="${user.id}" readonly />
                </div>
                <div>
                    <label for="${roleId}" class="block text-base font-semibold text-gray-800 mb-1">Role</label>
                    <select id="${roleId}" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                        ${roleOptions}
                    </select>
                </div>
                <div class="pt-4">
                    <button type="submit" class="w-full inline-flex justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition">Save Changes</button>
                </div>
            </form>
        `);

        console.log('[UserManager] modalService.show() called successfully');

        document.getElementById(`editUserForm_${userId}`)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateUser(userId);
        });
        // Attach cancel button event
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.adminApp.modalService?.hide();
        });
    }

    async updateUser(userId) {
        try {
            const emailField = document.getElementById(`userEmail_${userId}`);
            const displayNameField = document.getElementById(`userDisplayName_${userId}`);
            const roleField = document.getElementById(`userRole_${userId}`);
            const phoneField = document.getElementById(`userPhone_${userId}`);

            // Debug logging
            console.log('Form fields found:', {
                emailField: !!emailField,
                displayNameField: !!displayNameField,
                roleField: !!roleField,
                phoneField: !!phoneField
            });

            const email = emailField?.value?.trim();
            const displayName = displayNameField?.value?.trim();
            const role = roleField?.value;
            const phone = phoneField?.value?.trim();

            // Debug logging
            console.log('Form values:', { email, displayName, role, phone });

            // Validate required fields with better error messages
            if (!email) {
                console.error('Email validation failed: email is empty or undefined');
                this.adminApp.toastService?.show('Email is required', 'error');
                return;
            }

            if (!displayName) {
                console.error('Display name validation failed: displayName is empty or undefined');
                this.adminApp.toastService?.show('Display name is required', 'error');
                return;
            }

            if (!role) {
                console.error('Role validation failed: role is empty or undefined');
                this.adminApp.toastService?.show('Role is required', 'error');
                return;
            }

            // Create update object with only defined values
            const updateData = {
                email,
                displayName,
                role,
                phone
            };

            console.log('Updating user with data:', updateData);

            // Update in Firestore
            const firebase = this.adminApp.getService('firebase');
            await firebase.updateUser(userId, updateData);

            // Update local cache
            const userIndex = this.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.users[userIndex] = { ...this.users[userIndex], ...updateData };
            }

            this.adminApp.toastService?.show('User updated successfully', 'success');
            this.adminApp.modalService?.hide();
            this.renderUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            this.adminApp.toastService?.show('Failed to update user', 'error');
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            // Simulate delete
            this.users = this.users.filter(u => u.id !== userId);
            
            this.adminApp.toastService?.show('User deleted successfully', 'success');
            this.renderUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            this.adminApp.toastService?.show('Failed to delete user', 'error');
        }
    }

    showAddUserModal() {
        // Use unique IDs for form fields
        const emailId = `newUserEmail`;
        const displayNameId = `newUserDisplayName`;
        const roleId = `newUserRole`;
        const passwordId = `newUserPassword`;
        const phoneIdNew = `newUserPhone`;
        // Generate role options dynamically
        const roleOptions = ALL_ROLES.map(
          r => `<option value="${r.value}">${r.label}</option>`
        ).join('');
        this.adminApp.modalService?.show('Add New User', `
            <form id="addUserForm" class="space-y-6 p-6">
                <div>
                    <label for="${displayNameId}" class="block text-base font-semibold text-gray-800 mb-1">Display Name</label>
                    <input type="text" id="${displayNameId}" name="displayName" autocomplete="name" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required placeholder="Full name" />
                </div>
                <div>
                    <label for="${emailId}" class="block text-base font-semibold text-gray-800 mb-1">Email</label>
                    <input type="email" id="${emailId}" name="email" autocomplete="email" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required placeholder="you@example.com" />
                </div>
                <div>
                    <label for="${phoneIdNew}" class="block text-base font-semibold text-gray-800 mb-1">Phone Number</label>
                    <input type="text" id="${phoneIdNew}" name="phone" autocomplete="tel" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Phone number" />
                </div>
                <div>
                    <label for="${passwordId}" class="block text-base font-semibold text-gray-800 mb-1">Password</label>
                    <input type="password" id="${passwordId}" name="password" autocomplete="new-password" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required placeholder="Password" />
                </div>
                <div>
                    <label for="${roleId}" class="block text-base font-semibold text-gray-800 mb-1">Role</label>
                    <select id="${roleId}" name="role" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                        ${roleOptions}
                    </select>
                </div>
                <div class="pt-4">
                    <button type="submit" class="w-full inline-flex justify-center rounded-lg bg-green-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 transition">Add User</button>
                </div>
            </form>
        `);
        setTimeout(() => {
            document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.addUser({
                    displayName: document.getElementById(displayNameId).value,
                    email: document.getElementById(emailId).value,
                    password: document.getElementById(passwordId).value,
                    role: document.getElementById(roleId).value,
                    phone: document.getElementById(phoneIdNew).value
                });
            });
        }, 0);
    }

    async addUser({ displayName, email, password, role, phone }) {
        try {
            const firebase = this.adminApp.getService('firebase');
            // Create user in Firebase Auth and Firestore
            await firebase.createUser({ displayName, email, password, role, phone });
            this.adminApp.toastService?.show('User added successfully', 'success');
            this.adminApp.modalService?.hide();
            await this.loadUsers();
        } catch (error) {
            this.adminApp.toastService?.show('Failed to add user: ' + error.message, 'error');
        }
    }

    switchTab(tab) {
        console.log('Switching to tab:', tab);
        const usersTab = document.getElementById('tab-users');
        const rolesTab = document.getElementById('tab-roles');
        const usersPanel = document.getElementById('usersTabPanel');
        const rolesPanel = document.getElementById('rolesTabPanel');
        
        console.log('Tab elements found:', {
            usersTab: !!usersTab,
            rolesTab: !!rolesTab,
            usersPanel: !!usersPanel,
            rolesPanel: !!rolesPanel
        });
        
        if (tab === 'users') {
            usersTab.classList.add('border-blue-500', 'text-blue-600');
            usersTab.classList.remove('border-transparent', 'text-gray-500');
            rolesTab.classList.remove('border-blue-500', 'text-blue-600');
            rolesTab.classList.add('border-transparent', 'text-gray-500');
            usersPanel.classList.remove('hidden');
            rolesPanel.classList.add('hidden');
        } else {
            rolesTab.classList.add('border-blue-500', 'text-blue-600');
            rolesTab.classList.remove('border-transparent', 'text-gray-500');
            usersTab.classList.remove('border-blue-500', 'text-blue-600');
            usersTab.classList.add('border-transparent', 'text-gray-500');
            usersPanel.classList.add('hidden');
            rolesPanel.classList.remove('hidden');
            
            console.log('Setting up permission event listeners for roles tab');
            // Setup permission event listeners when roles tab is shown
            setTimeout(() => this.setupPermissionEventListeners(), 100);
        }
    }

    getRolesTableRows() {
        const currentUser = this.adminApp.getCurrentUser();
        
        // Debug logging
        console.log('Current user:', currentUser);
        console.log('User role:', currentUser?.role);
        
        // Only show detailed permissions to super admins (handle both 'super_admin' and 'superadmin')
        if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'superadmin')) {
            console.log('Showing simple roles table - user is not super admin');
            return this.getSimpleRolesTable();
        }

        console.log('Showing detailed permissions table - user is super admin');
        return this.getDetailedPermissionsTable();
    }

    getSimpleRolesTable() {
        const roles = [
          { role: 'Super Admin', desc: 'Full access to all system features', funcs: 'All functions' },
          { role: 'Admin', desc: 'Manage users, pets, and system settings', funcs: 'User management, Pet management, System settings' },
          { role: 'Pet Admin', desc: 'Manage pets and related data', funcs: 'Pet management' },
          { role: 'User', desc: 'Standard user access', funcs: 'Own pets, Profile, Notifications' },
          { role: 'Guest', desc: 'Limited access', funcs: 'View public info' }
        ];
        return roles.map(r => `
          <tr>
            <td class="px-4 py-2 text-gray-900 font-semibold">${r.role}</td>
            <td class="px-4 py-2 text-gray-600">${r.desc}</td>
            <td class="px-4 py-2 text-gray-500">${r.funcs}</td>
          </tr>
        `).join('');
    }

    getDetailedPermissionsTable() {
        const features = [
            { key: 'overview', label: 'Overview' },
            { key: 'users', label: 'Users' },
            { key: 'pets', label: 'Pets' },
            { key: 'notifications', label: 'Notification System' },
            { key: 'profile', label: 'Profile' }
        ];

        const permissions = ['view', 'create', 'edit', 'delete'];
        const scopeOptions = ['all', 'own'];

        let tableHTML = `
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-2">Detailed Permissions Matrix</h3>
                <p class="text-sm text-gray-600 mb-4">Check/uncheck permissions for each role. Changes are saved automatically.</p>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white rounded-lg shadow">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Role</th>
                            ${features.map(f => `
                                <th class="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b" colspan="${permissions.length + scopeOptions.length}">
                                    ${f.label}
                                </th>
                            `).join('')}
                        </tr>
                        <tr>
                            <th class="px-4 py-2 text-left text-xs text-gray-500 border-b"></th>
                            ${features.map(f => `
                                ${permissions.map(p => `<th class="px-2 py-1 text-xs text-gray-500 border-b text-center">${p.toUpperCase()}</th>`).join('')}
                                ${scopeOptions.map(s => `<th class="px-2 py-1 text-xs text-gray-500 border-b text-center">${s.toUpperCase()}</th>`).join('')}
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        ALL_ROLES.forEach(role => {
            tableHTML += `<tr class="border-b">`;
            tableHTML += `<td class="px-4 py-2 text-gray-900 font-semibold">${role.label}</td>`;
            
            features.forEach(feature => {
                const rolePerms = this.permissions[role.value]?.[feature.key] || {};
                
                // Permission checkboxes
                permissions.forEach(perm => {
                    const isChecked = rolePerms[perm] ? 'checked' : '';
                    const disabled = perm === 'create' && (feature.key === 'overview' || feature.key === 'profile') ? 'disabled' : '';
                    tableHTML += `
                        <td class="px-2 py-1 text-center">
                            <input type="checkbox" 
                                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2" 
                                ${isChecked} ${disabled}
                                onchange="this.closest('tr').dispatchEvent(new CustomEvent('permissionChanged', {
                                    detail: { role: '${role.value}', feature: '${feature.key}', permission: '${perm}', value: this.checked }
                                }))"
                            />
                        </td>
                    `;
                });
                
                // Scope checkboxes (All/Own)
                scopeOptions.forEach(scope => {
                    const isChecked = rolePerms[scope] ? 'checked' : '';
                    const disabled = !rolePerms.view ? 'disabled' : '';
                    tableHTML += `
                        <td class="px-2 py-1 text-center">
                            <input type="checkbox" 
                                class="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2" 
                                ${isChecked} ${disabled}
                                onchange="this.closest('tr').dispatchEvent(new CustomEvent('permissionChanged', {
                                    detail: { role: '${role.value}', feature: '${feature.key}', permission: '${scope}', value: this.checked }
                                }))"
                            />
                        </td>
                    `;
                });
            });
            
            tableHTML += `</tr>`;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div class="mt-4 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <span class="font-medium">Legend:</span> 
                    <span class="text-blue-600">Blue</span> = Permissions, 
                    <span class="text-green-600">Green</span> = Scope (All/Own)
                </div>
                <button id="savePermissionsBtn" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Save Permissions
                </button>
            </div>
        `;

        return tableHTML;
    }

    setupPermissionEventListeners() {
        // Listen for permission changes
        document.querySelectorAll('tr').forEach(row => {
            row.addEventListener('permissionChanged', (e) => {
                const { role, feature, permission, value } = e.detail;
                
                // Update permissions object
                if (!this.permissions[role]) this.permissions[role] = {};
                if (!this.permissions[role][feature]) this.permissions[role][feature] = {};
                
                this.permissions[role][feature][permission] = value;
                
                // Auto-save after a short delay
                clearTimeout(this.saveTimeout);
                this.saveTimeout = setTimeout(() => this.savePermissions(), 1000);
            });
        });

        // Save button
        const saveBtn = document.getElementById('savePermissionsBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePermissions());
        }
    }

    getRoleBadgeColor(role) {
        const colors = {
            'super_admin': 'bg-purple-100 text-purple-800',
            'superadmin': 'bg-purple-100 text-purple-800',
            'admin': 'bg-blue-100 text-blue-800',
            'pet_admin': 'bg-green-100 text-green-800',
            'user': 'bg-gray-100 text-gray-800',
            'guest': 'bg-yellow-100 text-yellow-800'
        };
        return colors[role] || colors['user'];
    }

    setupTabSwitching() {
        const usersTab = document.getElementById('tab-users');
        const rolesTab = document.getElementById('tab-roles');
        const usersPanel = document.getElementById('usersTabPanel');
        const rolesPanel = document.getElementById('rolesTabPanel');
        
        if (usersTab && rolesTab && usersPanel && rolesPanel) {
            usersTab.addEventListener('click', () => this.switchTab('users'));
            rolesTab.addEventListener('click', () => this.switchTab('roles'));
            this.switchTab('users'); // Default to users tab
        }
    }
} 