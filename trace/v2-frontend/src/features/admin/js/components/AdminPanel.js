console.log('[ADMIN PANEL] This is the V2-FRONTEND version');
// Import Firebase Auth functions
import { updateProfile, updateEmail } from 'firebase/auth';

export class AdminPanel {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.currentUser = null;
    }

    async init() {
        console.log('📊 Initializing Admin Panel...');
        
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
                this.showDashboard();
                await this.loadOverviewData();
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
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        
        // Update user info
        const userEmail = document.getElementById('userEmail');
        const userRole = document.getElementById('userRole');
        const userInfo = document.getElementById('userInfo');
        
        if (this.currentUser) {
            // Add greeting at the top, only
            const displayName = this.currentUser.displayName || this.currentUser.email || 'User';
            userInfo.innerHTML = `
                <div class="flex items-center space-x-4 text-base text-gray-800">
                  <span class="font-semibold whitespace-nowrap">Hi ${displayName}!</span>
                  <button id="logoutBtn" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">Logout</button>
                </div>
            `;
        }
        
        // Show the overview section by default
        const overviewSection = document.getElementById('overviewSection');
        if (overviewSection) {
            overviewSection.classList.remove('hidden');
        }
        // No call to renderDashboard()
        // Re-attach logout event listener
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    async loadOverviewData() {
        try {
            const overviewContent = document.getElementById('overviewContent');
            if (!overviewContent) return;
            
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
            if (statsGrid) {
                statsGrid.innerHTML = this.createStatsCards();
                document.getElementById('totalPets').textContent = stats.totalPets ?? '-';
                document.getElementById('totalUsers').textContent = stats.totalUsers ?? '-';
                document.getElementById('missingPets').textContent = stats.missingPets ?? '-';
                document.getElementById('totalDevices').textContent = stats.linkedDevices ?? '-';
            }
            
            // Fetch recent activity (last 3 check-ins as example)
            let activity = [];
            try {
                activity = await this.adminApp.firebaseService.getCheckins({ limit: 3 });
            } catch (e) {
                console.warn('Could not fetch recent activity:', e);
            }
            if (recentActivity) {
                recentActivity.innerHTML = this.createRecentActivity(activity);
            }
        } catch (error) {
            console.error('Error loading overview data:', error);
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
        const profileContent = document.getElementById('profileContent');
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
                await this.adminApp.firebaseService.updateUser(user.uid, { displayName, email });
                
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
        const profileContent = document.getElementById('profileContent');
        if (!profileContent) return;
        
        // Render the profile form
        this.renderProfileSection();
    }
} 