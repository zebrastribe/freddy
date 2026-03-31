export class AuthManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.currentUser = null;
        this.firebase = adminApp.getService('firebase');
        this._userHydratedResolve = null;
        this.userHydratedPromise = new Promise((resolve) => {
            this._userHydratedResolve = resolve;
        });
    }

    async init() {
        console.log('🔐 Initializing Auth Manager...');
        
        // Setup auth event listeners
        this.setupAuthEventListeners();
        
        // Setup Firebase auth state listener
        if (this.firebase) {
            this.firebase.onAuthStateChanged(async (user) => {
                console.log('🔄 Auth state changed:', user ? user.email : 'No user');
                if (user) {
                    console.log('🔍 Hydrating user with Firestore data...');
                    // Fetch user doc to get role
                    const userDoc = await this.firebase.getDoc('users', user.uid);
                    let role = 'user';
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        role = data.role || 'user';
                        console.log('📋 User role from Firestore:', role);
                    } else {
                        console.log('⚠️ User doc not found in Firestore, using default role');
                    }
                    user.role = role;
                    console.log('✅ User hydrated with role:', user.role);
                }
                this.currentUser = user;
                if (user) {
                    console.log('User authenticated:', user.email);
                    await this.checkAdminAccess();
                    if (this._userHydratedResolve) this._userHydratedResolve();
                } else {
                    console.log('User signed out');
                    this.showAuthSection();
                    if (this._userHydratedResolve) this._userHydratedResolve();
                }
            });
            // Check if user is already authenticated
            const currentUser = this.firebase.getCurrentUser();
            if (currentUser) {
                console.log('👤 User already authenticated, triggering hydration...');
                // Manually trigger the auth state change
                this.firebase.authStateCallback?.(currentUser);
            }
        }
        
        console.log('✅ Auth Manager initialized');
    }

    setupAuthEventListeners() {
        const loginForm = document.getElementById('loginForm');
        const loginBtn = document.getElementById('loginBtn');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');

        // Handle form submission
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Handle button click as fallback
        if (loginBtn) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Allow login on Enter key in password field
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.login();
                }
            });
        }
    }

    async checkAdminAccess() {
        if (!this.currentUser) {
            this.showAuthSection();
            return;
        }

        try {
            // Check if user is admin
            const isAdmin = await this.firebase.isCurrentUserAdmin();
            if (isAdmin) {
                console.log('✅ User has admin access');
                if (this.adminApp && this.adminApp.adminPanel) {
                    this.adminApp.adminPanel.checkAuthStatus();
                }
                if (this.adminApp && this.adminApp.toastService) {
                    const name = this.currentUser.displayName || this.currentUser.email || 'User';
                    this.adminApp.toastService.show(`Welcome, ${name}!`, 'success');
                }
            } else {
                console.log('❌ User does not have admin access');
                await this.logout();
                if (this.adminApp && this.adminApp.toastService) {
                    this.adminApp.toastService.show('Access denied: Admin privileges required', 'error');
                }
            }
        } catch (error) {
            console.error('Error checking admin access:', error);
            await this.logout();
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Error checking admin access', 'error');
            }
        }
    }

    async login() {
        try {
            const email = document.getElementById('emailInput').value.trim();
            const password = document.getElementById('passwordInput').value;

            if (!email || !password) {
                if (this.adminApp && this.adminApp.toastService) {
                    this.adminApp.toastService.show('Please enter both email and password', 'error');
                }
                return;
            }

            // Show loading state
            const loginBtn = document.getElementById('loginBtn');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            // Sign in with Firebase
            await this.firebase.signInWithEmailAndPassword(email, password);
            
            // Check admin access will be handled by auth state change listener

        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'User not found';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later';
            } else {
                errorMessage = error.message;
            }
            
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show(errorMessage, 'error');
            }
        } finally {
            // Reset button state
            const loginBtn = document.getElementById('loginBtn');
            loginBtn.textContent = 'Login';
            loginBtn.disabled = false;
        }
    }

    async logout() {
        try {
            if (this.firebase) {
                await this.firebase.signOut();
            }
            this.currentUser = null;
            if (this.adminApp && this.adminApp.adminPanel) {
                this.adminApp.adminPanel.showAuthSection();
            }
            console.log('✅ Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    showAuthSection() {
        if (this.adminApp && this.adminApp.adminPanel) {
            this.adminApp.adminPanel.showAuthSection();
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    async isAdmin() {
        if (!this.currentUser) {
            return false;
        }
        
        try {
            return await this.firebase.isCurrentUserAdmin();
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
} 