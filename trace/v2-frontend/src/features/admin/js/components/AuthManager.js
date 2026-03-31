import { onAuthStateChanged } from 'firebase/auth';

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
        const startTime = performance.now();
        console.log('🔐 Initializing Auth Manager...', { timestamp: new Date().toISOString() });
        
        // Setup auth event listeners
        this.setupAuthEventListeners();
        
        // Setup Firebase auth state listener
        if (this.firebase) {
            // Set up the auth state listener directly with Firebase
            const auth = this.firebase.auth;
            if (auth) {
                onAuthStateChanged(auth, async (user) => {
                    const authChangeTime = performance.now();
                    console.log('🔄 Auth state changed:', user ? user.email : 'No user', { 
                        timestamp: new Date().toISOString(),
                        timeSinceInit: authChangeTime - startTime
                    });
                if (user) {
                        const hydrationStart = performance.now();
                        console.log('🔍 Hydrating user with Firestore data...', { timestamp: new Date().toISOString() });
                    // Fetch user doc to get role
                        const userDocStart = performance.now();
                    const userDoc = await this.firebase.getDoc('users', user.uid);
                        const userDocEnd = performance.now();
                        console.log('📋 Firestore user doc fetch:', { 
                            duration: userDocEnd - userDocStart,
                            timestamp: new Date().toISOString()
                        });
                        
                    let role = 'user';
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        role = data.role || 'user';
                            console.log('📋 User role from Firestore:', role, { timestamp: new Date().toISOString() });
                    } else {
                            console.log('⚠️ User doc not found in Firestore, using default role', { timestamp: new Date().toISOString() });
                    }
                    user.role = role;
                        const hydrationEnd = performance.now();
                        console.log('✅ User hydrated with role:', user.role, { 
                            hydrationDuration: hydrationEnd - hydrationStart,
                            timestamp: new Date().toISOString()
                        });
                }
                this.currentUser = user;
                if (user) {
                        console.log('User authenticated:', user.email, { timestamp: new Date().toISOString() });
                        const adminCheckStart = performance.now();
                    await this.checkAdminAccess();
                        const adminCheckEnd = performance.now();
                        console.log('✅ Admin access check completed:', { 
                            duration: adminCheckEnd - adminCheckStart,
                            timestamp: new Date().toISOString()
                        });
                    if (this._userHydratedResolve) this._userHydratedResolve();
                } else {
                        console.log('User signed out', { timestamp: new Date().toISOString() });
                    this.showAuthSection();
                    if (this._userHydratedResolve) this._userHydratedResolve();
                }
            });
            }
            
            // Check if user is already authenticated
            const currentUser = this.firebase.getCurrentUser();
            if (currentUser) {
                console.log('👤 User already authenticated, triggering hydration...', { timestamp: new Date().toISOString() });
                // Manually trigger the auth state change
                this.firebase.authStateCallback?.(currentUser);
            }
        }
        
        const initEnd = performance.now();
        console.log('✅ Auth Manager initialized', { 
            totalInitTime: initEnd - startTime,
            timestamp: new Date().toISOString()
        });
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
            const adminCheckStart = performance.now();
            console.log('🔍 Checking admin access...', { timestamp: new Date().toISOString() });
            
            // Check if user is admin
            const isAdminCheckStart = performance.now();
            const isAdmin = await this.firebase.isCurrentUserAdmin();
            const isAdminCheckEnd = performance.now();
            console.log('🔐 Admin check completed:', { 
                isAdmin,
                duration: isAdminCheckEnd - isAdminCheckStart,
                timestamp: new Date().toISOString()
            });
            
            if (isAdmin) {
                console.log('✅ User has admin access', { timestamp: new Date().toISOString() });
                if (this.adminApp && this.adminApp.adminPanel) {
                    this.adminApp.adminPanel.showDashboard();
                }
                if (this.adminApp && this.adminApp.toastService) {
                    const name = this.currentUser.displayName || this.currentUser.email || 'User';
                    this.adminApp.toastService.show(`Welcome, ${name}!`, 'success');
                }
            } else {
                console.log('❌ User does not have admin access', { timestamp: new Date().toISOString() });
                await this.logout();
                if (this.adminApp && this.adminApp.toastService) {
                    this.adminApp.toastService.show('Access denied: Admin privileges required', 'error');
                }
            }
            
            const adminCheckEnd = performance.now();
            console.log('✅ Admin access check completed:', { 
                totalDuration: adminCheckEnd - adminCheckStart,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error checking admin access:', error, { timestamp: new Date().toISOString() });
            await this.logout();
            if (this.adminApp && this.adminApp.toastService) {
                this.adminApp.toastService.show('Error checking admin access', 'error');
            }
        }
    }

    async login() {
        const loginStart = performance.now();
        console.log('🚀 Login process started', { timestamp: new Date().toISOString() });
        
        try {
            const email = document.getElementById('emailInput').value.trim();
            const password = document.getElementById('passwordInput').value;

            if (!email || !password) {
                console.log('❌ Login validation failed: missing email or password', { timestamp: new Date().toISOString() });
                if (this.adminApp && this.adminApp.toastService) {
                    this.adminApp.toastService.show('Please enter both email and password', 'error');
                }
                return;
            }

            console.log('📝 Login credentials validated', { 
                email: email,
                timestamp: new Date().toISOString() 
            });

            // Show loading state
            const loginBtn = document.getElementById('loginBtn');
            const originalText = loginBtn.textContent;
            loginBtn.textContent = 'Logging in...';
            loginBtn.disabled = true;

            const firebaseSignInStart = performance.now();
            console.log('🔥 Starting Firebase sign in...', { timestamp: new Date().toISOString() });

            // Sign in with Firebase
            await this.firebase.signInWithEmailAndPassword(email, password);
            
            const firebaseSignInEnd = performance.now();
            console.log('✅ Firebase sign in completed:', { 
                duration: firebaseSignInEnd - firebaseSignInStart,
                timestamp: new Date().toISOString()
            });
            
            // Check admin access will be handled by auth state change listener
            const loginEnd = performance.now();
            console.log('✅ Login process completed:', { 
                totalDuration: loginEnd - loginStart,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            const errorTime = performance.now();
            console.error('❌ Login error:', error, { 
                duration: errorTime - loginStart,
                timestamp: new Date().toISOString()
            });
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
            this.showAuthSection();
            
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