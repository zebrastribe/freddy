const ALL_ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'pet_admin', label: 'Pet Admin' },
  { value: 'user', label: 'User' },
  { value: 'guest', label: 'Guest' }
];

export class UserManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.users = [];
    }

    async init() {
        console.log('👥 Initializing User Manager...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadUsers();
        
        console.log('✅ User Manager initialized');
    }

    setupEventListeners() {
        const refreshUsersBtn = document.getElementById('refreshUsersBtn');
        const searchUsers = document.getElementById('searchUsers');

        if (refreshUsersBtn) {
            refreshUsersBtn.addEventListener('click', () => this.loadUsers());
        }

        if (searchUsers) {
            searchUsers.addEventListener('input', () => this.filterUsers());
        }
    }

    async loadUsers() {
        const usersContent = document.getElementById('usersContent');
        if (!usersContent) return;

        // Show loading spinner
        usersContent.innerHTML = `<div id="usersLoading" class="flex justify-center items-center py-8"><span class="text-gray-500">Loading users...</span></div>`;

        try {
            const firebase = this.adminApp.getService('firebase');
            this.users = await firebase.getUsers();

            // Render search and grid
            usersContent.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <input id="searchUsers" type="text" placeholder="Search users..." class="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    <button id="refreshUsersBtn" class="ml-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Refresh</button>
                </div>
                <div id="usersGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            `;
            this.renderUsers();
            this.setupEventListeners();
        } catch (error) {
            usersContent.innerHTML = `<div class="text-red-600">Failed to load users: ${error.message}</div>`;
            console.error('Error loading users:', error);
        }
    }

    renderUsers() {
        const usersGrid = document.getElementById('usersGrid');
        if (!usersGrid) return;

        usersGrid.innerHTML = this.users.map(user => this.createUserCard(user)).join('');

        // Attach event listeners for edit and delete buttons
        usersGrid.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-userid');
                this.editUser(userId);
            });
        });
        usersGrid.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.getAttribute('data-userid');
                this.deleteUser(userId);
            });
        });
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
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 edit-user-btn" data-userid="${user.id}">✏️ Edit</button>
                        <button class="flex-1 px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 delete-user-btn" data-userid="${user.id}">🗑️ Delete</button>
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
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Debug: Log the user data being edited
        console.log('Editing user:', user);

        // Use unique IDs for form fields
        const emailId = `userEmail_${userId}`;
        const displayNameId = `userDisplayName_${userId}`;
        const roleId = `userRole_${userId}`;

        // Generate role options dynamically
        const roleOptions = ALL_ROLES.map(
          r => `<option value="${r.value}" ${user.role === r.value ? 'selected' : ''}>${r.label}</option>`
        ).join('');

        this.adminApp.modalService?.show('Edit User', `
            <form id="editUserForm_${userId}" class="space-y-6 p-6">
                <div>
                    <label for="${emailId}" class="block text-sm font-medium text-gray-700">Email</label>
                    <div class="mt-1">
                        <input type="email" id="${emailId}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value="${user.email || ''}" required placeholder="you@example.com" aria-describedby="${emailId}-desc">
                    </div>
                    <p class="mt-2 text-sm text-gray-500" id="${emailId}-desc">We'll only use this for spam.</p>
                </div>
                <div>
                    <label for="${displayNameId}" class="block text-sm font-medium text-gray-700">Display Name</label>
                    <div class="mt-1">
                        <input type="text" id="${displayNameId}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" value="${user.displayName || ''}" required placeholder="Full name" aria-describedby="${displayNameId}-desc">
                    </div>
                    <p class="mt-2 text-sm text-gray-500" id="${displayNameId}-desc">This will be visible to other users.</p>
                </div>
                <div>
                    <label for="${roleId}" class="block text-sm font-medium text-gray-700">Role</label>
                    <div class="mt-1">
                        <select id="${roleId}" class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" aria-describedby="${roleId}-desc">
                            ${roleOptions}
                        </select>
                    </div>
                    <p class="mt-2 text-sm text-gray-500" id="${roleId}-desc">Controls access level for this user.</p>
                </div>
                <div class="flex gap-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Save Changes</button>
                    <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cancel-edit-user-btn">Cancel</button>
                </div>
            </form>
        `);

        document.getElementById(`editUserForm_${userId}`)?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateUser(userId);
        });
        // Attach cancel button event
        document.querySelector('.cancel-edit-user-btn')?.addEventListener('click', () => {
            this.adminApp.modalService?.hide();
        });
    }

    async updateUser(userId) {
        try {
            const emailField = document.getElementById(`userEmail_${userId}`);
            const displayNameField = document.getElementById(`userDisplayName_${userId}`);
            const roleField = document.getElementById(`userRole_${userId}`);

            // Debug logging
            console.log('Form fields found:', {
                emailField: !!emailField,
                displayNameField: !!displayNameField,
                roleField: !!roleField
            });

            const email = emailField?.value?.trim();
            const displayName = displayNameField?.value?.trim();
            const role = roleField?.value;

            // Debug logging
            console.log('Form values:', { email, displayName, role });

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
                role
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
} 