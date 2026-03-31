console.log('[ADMIN PANEL] This is the ADMIN version');
// Import Firebase Auth functions
import { updateProfile, updateEmail } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

export class AdminPanel {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.currentUser = null;
        console.log('[AdminPanel] constructor called');
    }

    async init() {
        console.log('[AdminPanel] init called');
        // Check authentication status
        await this.checkAuthStatus();
        // Setup event listeners
        this.setupEventListeners();
        console.log('✅ Admin Panel initialized');
    }

    async checkAuthStatus() {
        try {
            const user = this.adminApp && this.adminApp.authManager ? this.adminApp.authManager.getCurrentUser() : null;
            if (user) {
                this.currentUser = user;
                console.log('[AdminPanel] About to call showDashboard');
                this.showDashboard();
                console.log('[AdminPanel] Finished showDashboard');
                console.log('[AdminPanel] About to call loadOverviewData');
                await this.loadOverviewData();
                console.log('[AdminPanel] Finished loadOverviewData');
            } else {
                this.showAuthSection();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.showAuthSection();
        }
    }

    setupEventListeners() {
        // Refresh stats button
        const refreshStatsBtn = document.getElementById('refreshStatsBtn');
        if (refreshStatsBtn) {
            refreshStatsBtn.addEventListener('click', () => this.loadOverviewData());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    showAuthSection() {
        console.log('[AdminPanel] showAuthSection called');
        const authSection = document.getElementById('authSection');
        const loginFormContainer = document.getElementById('loginFormContainer');
        const adminShell = document.getElementById('adminShell');
        const adminDashboard = document.getElementById('adminDashboard');
        const userInfo = document.getElementById('userInfo');
        
        // Add null checks to prevent errors
        if (authSection) {
            console.log('[AdminPanel] showAuthSection: showing #authSection');
            authSection.classList.remove('hidden');
            authSection.style.display = '';
        } else {
            console.warn('[AdminPanel] showAuthSection: #authSection not found');
        }
        
        if (adminShell) {
            console.log('[AdminPanel] showAuthSection: hiding #adminShell');
            adminShell.classList.add('hidden');
            adminShell.style.display = 'none';
        } else {
            console.warn('[AdminPanel] showAuthSection: #adminShell not found');
        }
        
        if (adminDashboard) {
            adminDashboard.classList.add('hidden');
        }
        
        if (userInfo) {
            userInfo.classList.add('hidden');
        }
        
        // Create login form
        if (loginFormContainer) {
            console.log('[AdminPanel] showAuthSection: injecting login form into #loginFormContainer');
            loginFormContainer.innerHTML = '';
            loginFormContainer.innerHTML = `
                <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                    <div class="max-w-md w-full space-y-8">
                        <div>
                            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                                Admin Login
                            </h2>
                            <p class="mt-2 text-center text-sm text-gray-600">
                                Sign in to access the admin panel
                            </p>
                        </div>
                        <form id="loginForm" class="mt-8 space-y-6">
                            <div class="rounded-md shadow-sm -space-y-px">
                                <div>
                                    <label for="emailInput" class="sr-only">Email address</label>
                                    <input id="emailInput" name="email" type="email" autocomplete="email" required 
                                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                        placeholder="Email address">
                                </div>
                                <div>
                                    <label for="passwordInput" class="sr-only">Password</label>
                                    <input id="passwordInput" name="password" type="password" autocomplete="current-password" required 
                                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                        placeholder="Password">
                                </div>
                            </div>
                            <div>
                                <button id="loginBtn" type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Sign in
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
        } else {
            console.warn('[AdminPanel] showAuthSection: #loginFormContainer not found');
        }
        
        // Attach event listeners after rendering the form
        if (this.adminApp && this.adminApp.authManager) {
            this.adminApp.authManager.setupAuthEventListeners();
        }
    }

    showDashboard() {
        const authSection = document.getElementById('authSection');
        const adminShell = document.getElementById('adminShell');
        const adminDashboard = document.getElementById('adminDashboard');
        const userInfo = document.getElementById('userInfo');
        const overviewSection = document.getElementById('overviewSection');
        
        // Add null checks to prevent errors
        if (authSection) {
            authSection.classList.add('hidden');
            authSection.style.display = 'none';
        }
        
        if (adminShell) {
            adminShell.classList.remove('hidden');
            adminShell.style.display = '';
        }
        
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
        }
        
        if (userInfo) {
            userInfo.classList.remove('hidden');
        }
        
        // Update user info
        if (userInfo && this.currentUser) {
            // Add greeting at the top, only
            const displayName = this.currentUser.displayName || this.currentUser.email || 'User';
            userInfo.innerHTML = `
                <div class="flex items-center space-x-4 text-base text-gray-800">
                  <span class="font-semibold whitespace-nowrap">Hi ${displayName}!</span>
                  <button id="logoutBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Logout</button>
                </div>
            `;
        }
        
        // Do NOT show the overview section by default here
        // if (overviewSection) {
        //     overviewSection.classList.remove('hidden');
        // }
        
        // Re-attach logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async loadOverviewData() {
        console.log('[AdminPanel] loadOverviewData called');
        try {
            const overviewContent = document.getElementById('overviewContent');
            if (!overviewContent) {
                console.log('[AdminPanel] overviewContent not found');
                return;
            }
            console.log('[AdminPanel] overviewContent found, rendering overview layout');
            // Create the overview layout
            overviewContent.innerHTML = `
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="statsGrid">
                    <!-- Stats cards will be rendered here -->
                </div>
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div id="recentActivity" class="space-y-3">
                        <!-- Activity items will be rendered here -->
                    </div>
                </div>
            `;
            
            const statsGrid = document.getElementById('statsGrid');
            const recentActivity = document.getElementById('recentActivity');
            
            // Fetch statistics from FirebaseService
            const stats = await this.adminApp.firebaseService.getStatistics();
            console.log('[AdminPanel] fetched stats:', stats);
            if (statsGrid) {
                statsGrid.innerHTML = this.createStatsCards();
                requestAnimationFrame(() => {
                    const petsEl = document.getElementById('totalPets');
                    const usersEl = document.getElementById('totalUsers');
                    const missingEl = document.getElementById('missingPets');
                    const devicesEl = document.getElementById('totalDevices');
                    if (petsEl) petsEl.textContent = stats.totalPets ?? '-';
                    if (usersEl) usersEl.textContent = stats.totalUsers ?? '-';
                    if (missingEl) missingEl.textContent = stats.missingPets ?? '-';
                    if (devicesEl) devicesEl.textContent = stats.linkedDevices ?? '-';
                });
            } else {
                console.log('[AdminPanel] statsGrid not found');
            }
            
            // Fetch recent activity (last 3 check-ins as example)
            let activity = [];
            try {
                activity = await this.adminApp.firebaseService.getCheckins({ limit: 3 });
                console.log('[AdminPanel] fetched activity:', activity);
            } catch (e) {
                console.warn('[AdminPanel] Could not fetch recent activity:', e);
            }
            if (recentActivity) {
                recentActivity.innerHTML = this.createRecentActivity(activity);
            } else {
                console.log('[AdminPanel] recentActivity not found');
            }
        } catch (error) {
            console.error('[AdminPanel] Error loading overview data:', error);
        }
    }

    createStatsCards() {
        return `
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <span class="text-2xl">🐾</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-2xl font-bold text-gray-900" id="totalPets">-</div>
                        <div class="text-sm text-gray-600">Total Pets</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <span class="text-2xl">👥</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-2xl font-bold text-gray-900" id="totalUsers">-</div>
                        <div class="text-sm text-gray-600">Total Users</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <span class="text-2xl">⚠️</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-2xl font-bold text-red-600" id="missingPets">-</div>
                        <div class="text-sm text-gray-600">Missing Pets</div>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <span class="text-2xl">🔔</span>
                    </div>
                    <div class="ml-4">
                        <div class="text-2xl font-bold text-gray-900" id="totalDevices">-</div>
                        <div class="text-sm text-gray-600">Linked Devices</div>
                    </div>
                </div>
            </div>
        `;
    }

    createRecentActivity(activity = []) {
        if (!activity || activity.length === 0) {
            return `<div class="text-gray-500">No recent activity found.</div>`;
        }
        return `
            <div class="space-y-3">
                ${activity.map(item => `
                    <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <span class="text-sm text-gray-500">${this.timeAgo(item.timestamp)}</span>
                        <span class="text-sm text-gray-900">${item.description || 'Activity'}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    timeAgo(date) {
        if (!date) return '';
        const now = new Date();
        const then = date.toDate ? date.toDate() : new Date(date);
        const diff = Math.floor((now - then) / 1000);
        if (diff < 60) return `${diff} seconds ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    }

    async logout() {
        try {
            if (this.adminApp && this.adminApp.authManager) {
                await this.adminApp.authManager.logout();
            }
            this.currentUser = null;
            this.showAuthSection();
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Logged out successfully', 'success');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Error during logout', 'error');
            }
        }
    }

    renderProfileSection() {
        const currentUser = this.adminApp.authManager.getCurrentUser();
        const profileContent = document.getElementById('profileSection');
        if (!profileContent) return;
        
        profileContent.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh]">
                <div class="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
                    <form id="profileForm" class="space-y-6">
                        <div>
                            <label for="profileDisplayName" class="block text-base font-semibold text-gray-800 mb-1">Display Name</label>
                            <input type="text" id="profileDisplayName" name="displayName" autocomplete="name" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value="${currentUser.displayName || ''}" required placeholder="Full name" />
                        </div>
                        <div>
                            <label for="profileEmail" class="block text-base font-semibold text-gray-800 mb-1">Email</label>
                            <input type="email" id="profileEmail" name="email" autocomplete="email" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" value="${currentUser.email || ''}" required placeholder="you@example.com" />
                        </div>
                        <div>
                            <label for="profilePassword" class="block text-base font-semibold text-gray-800 mb-1">New Password</label>
                            <input type="password" id="profilePassword" name="password" autocomplete="new-password" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Leave blank to keep current password" />
                        </div>
                        <div>
                            <label for="profilePhone" class="block text-base font-semibold text-gray-800 mb-1">Phone Number</label>
                            <input type="text" id="profilePhone" name="phone" autocomplete="tel" class="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Phone number" value="${currentUser.phone || ''}" />
                        </div>
                        <div>
                            <label class="block text-base font-semibold text-gray-800 mb-1">User ID</label>
                            <input type="text" class="block w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-base text-gray-500" value="${currentUser.uid || ''}" readonly />
                        </div>
                        <div>
                            <label class="block text-base font-semibold text-gray-800 mb-1">Role</label>
                            <input type="text" class="block w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-base text-gray-500" value="${currentUser.role || 'user'}" readonly />
                        </div>
                        <div class="pt-4">
                            <button type="submit" class="w-full inline-flex justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProfile();
        });
    }

    async saveProfile() {
        const displayName = document.getElementById('profileDisplayName').value;
        const email = document.getElementById('profileEmail').value;
        const password = document.getElementById('profilePassword').value;
        const phone = document.getElementById('profilePhone').value;
        
        try {
            // Update Auth profile (displayName)
            const user = this.adminApp.firebaseService.auth.currentUser;
            if (user) {
                await updateProfile(user, { displayName });
                
                // Update Auth email if changed
                if (email && email !== user.email) {
                    await updateEmail(user, email);
                }
                
                // Update password if provided
                if (password) {
                    await this.adminApp.authManager.updatePassword(password);
                    this.adminApp.toastService.show('Password updated successfully', 'success');
                }
                
                // Update Firestore user doc
                await this.adminApp.firebaseService.updateUser(user.uid, { displayName, email, phone });
                
                // Reload user to get latest displayName
                await user.reload();
                const updatedName = user.displayName || email || 'User';
                this.adminApp.toastService.show(`Profile updated successfully! Welcome, ${updatedName}!`, 'success');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.adminApp.toastService.show('Failed to update profile: ' + (error && error.message ? error.message : error), 'danger');
        }
    }

    // Ensure the profile section always shows the editable form
    showProfile() {
        const profileContent = document.getElementById('profileSection');
        if (!profileContent) return;
        
        // Render the profile form
        this.renderProfileSection();
    }
} 