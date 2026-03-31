// Admin Authentication Component
export class AdminAuth {
    constructor(adminPanel) {
        this.adminPanel = adminPanel;
        this.firebase = adminPanel.getService('firebase');
        this.toast = adminPanel.getService('toast');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const loginBtn = document.getElementById('loginBtn');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');

        loginBtn.addEventListener('click', () => this.handleLogin());
        
        // Allow Enter key to submit
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleLogin();
                }
            });
        });
    }

    async handleLogin() {
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('passwordInput');
        const loginBtn = document.getElementById('loginBtn');

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            this.toast.show('Please enter both email and password', 'warning');
            return;
        }

        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';

            // Sign in with Firebase
            await this.firebase.signInWithEmailAndPassword(email, password);
            
            // Check if user is admin
            const isAdmin = await this.firebase.isCurrentUserAdmin();
            if (!isAdmin) {
                await this.firebase.signOut();
                this.toast.show('Access denied: Admin privileges required', 'danger');
                return;
            }
            
            this.toast.show('Successfully logged in as admin', 'success');
            
            // Clear form
            emailInput.value = '';
            passwordInput.value = '';

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
            
            this.toast.show(errorMessage, 'danger');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }

    async handleLogout() {
        try {
            await this.firebase.signOut();
            this.toast.show('Successfully logged out', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            this.toast.show('Logout failed', 'danger');
        }
    }
} 