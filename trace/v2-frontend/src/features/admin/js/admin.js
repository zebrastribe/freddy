// Admin Panel Main JavaScript
import { AdminPanel } from './components/AdminPanel.js';
import { AuthManager } from './components/AuthManager.js';
import { ObjectManager } from './components/ObjectManager.js';
import { UserManager } from './components/UserManager.js';
import { NotificationManager } from './components/NotificationManager.js';
import { SystemManager } from './components/SystemManager.js';
import { ModalService } from './services/ModalService.js';
import { ToastService } from './services/ToastService.js';
import { FirebaseService } from './services/FirebaseService.js';
// Import Firebase Auth functions properly for Vite
import { updateProfile, updateEmail } from 'firebase/auth';

class AdminApp {
    constructor() {
        this.adminPanel = null;
        this.authManager = null;
        this.petManager = null;
        this.userManager = null;
        this.notificationManager = null;
        this.systemManager = null;
        this.modalService = null;
        this.toastService = null;
        this.firebaseService = null;
    }

    async init() {
        const appInitStart = performance.now();
        console.log('🚀 Initializing Trace Admin Panel...', { timestamp: new Date().toISOString() });
        
        try {
            // Initialize services first
            const firebaseInitStart = performance.now();
            console.log('🔥 Initializing Firebase Service...', { timestamp: new Date().toISOString() });
            this.firebaseService = new FirebaseService();
            await this.firebaseService.init();
            const firebaseInitEnd = performance.now();
            console.log('✅ Firebase Service initialized:', { 
                duration: firebaseInitEnd - firebaseInitStart,
                timestamp: new Date().toISOString()
            });
            
            const modalInitStart = performance.now();
            console.log('🔧 Initializing Modal Service...', { timestamp: new Date().toISOString() });
            this.modalService = new ModalService();
            this.modalService.init();
            const modalInitEnd = performance.now();
            console.log('✅ Modal Service initialized:', { 
                duration: modalInitEnd - modalInitStart,
                timestamp: new Date().toISOString()
            });
            
            const toastInitStart = performance.now();
            console.log('🍞 Initializing Toast Service...', { timestamp: new Date().toISOString() });
            this.toastService = new ToastService();
            this.toastService.init();
            const toastInitEnd = performance.now();
            console.log('✅ Toast Service initialized:', { 
                duration: toastInitEnd - toastInitStart,
                timestamp: new Date().toISOString()
            });
            
            // Initialize AuthManager only
            const authInitStart = performance.now();
            console.log('🔐 Initializing Auth Manager...', { timestamp: new Date().toISOString() });
            this.authManager = new AuthManager(this);
            await this.authManager.init();
            const authInitEnd = performance.now();
            console.log('✅ Auth Manager initialized:', { 
                duration: authInitEnd - authInitStart,
                timestamp: new Date().toISOString()
            });
            
            // Wait for user hydration and admin check
            const hydrationStart = performance.now();
            console.log('⏳ Waiting for user hydration...', { timestamp: new Date().toISOString() });
            await this.authManager.userHydratedPromise;
            const hydrationEnd = performance.now();
            console.log('✅ User hydration completed:', { 
                duration: hydrationEnd - hydrationStart,
                timestamp: new Date().toISOString()
            });
            
            const user = this.authManager.getCurrentUser();
            if (!user) {
                console.warn('❌ No authenticated user, aborting admin panel init.', { timestamp: new Date().toISOString() });
                return;
            }
            
            const adminCheckStart = performance.now();
            console.log('🔍 Checking admin privileges...', { timestamp: new Date().toISOString() });
            const isAdmin = await this.authManager.isAdmin();
            const adminCheckEnd = performance.now();
            console.log('✅ Admin check completed:', { 
                isAdmin: isAdmin,
                duration: adminCheckEnd - adminCheckStart,
                timestamp: new Date().toISOString()
            });
            
            if (!isAdmin) {
                console.warn('❌ User is not admin, aborting admin panel init.', { timestamp: new Date().toISOString() });
                return;
            }
            
            // Now safe to initialize the rest
            const componentsInitStart = performance.now();
            console.log('🏗️ Initializing admin components...', { timestamp: new Date().toISOString() });
            
            this.adminPanel = new AdminPanel(this);
            this.petManager = new ObjectManager(this);
            this.userManager = new UserManager(this);
            this.notificationManager = new NotificationManager(this);
            this.systemManager = new SystemManager(this);
            
            const componentsInitEnd = performance.now();
            console.log('✅ Admin components created:', { 
                duration: componentsInitEnd - componentsInitStart,
                timestamp: new Date().toISOString()
            });
            
            const componentInitStart = performance.now();
            console.log('🔧 Initializing individual components...', { timestamp: new Date().toISOString() });
            
            await this.adminPanel.init();
            await this.petManager.init();
            await this.userManager.init();
            await this.notificationManager.init();
            await this.systemManager.init();
            
            const componentInitEnd = performance.now();
            console.log('✅ All components initialized:', { 
                duration: componentInitEnd - componentInitStart,
                timestamp: new Date().toISOString()
            });
            
            const navSetupStart = performance.now();
            console.log('🧭 Setting up navigation...', { timestamp: new Date().toISOString() });
            this.setupNavigation();
            const navSetupEnd = performance.now();
            console.log('✅ Navigation setup completed:', { 
                duration: navSetupEnd - navSetupStart,
                timestamp: new Date().toISOString()
            });
            
            const appInitEnd = performance.now();
            console.log('✅ Admin Panel initialized successfully:', { 
                totalInitTime: appInitEnd - appInitStart,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            const errorTime = performance.now();
            console.error('❌ Failed to initialize admin panel:', error, { 
                duration: errorTime - appInitStart,
                timestamp: new Date().toISOString()
            });
            if (this.toastService) {
                this.toastService.show('Failed to initialize admin panel', 'error');
            }
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.getAttribute('data-section');
                
                // Update navigation active state
                navItems.forEach(nav => {
                    nav.classList.remove('bg-blue-600', 'text-white');
                    nav.classList.add('text-gray-700', 'hover:bg-gray-100');
                });
                item.classList.remove('text-gray-700', 'hover:bg-gray-100');
                item.classList.add('bg-blue-600', 'text-white');
                
                // Hide all sections
                const allSections = [
                    'authSection', 'adminDashboard', 'overviewSection', 
                    'petsSection', 'usersSection', 'notificationsSection', 
                    'systemSection', 'profileSection'
                ];
                
                allSections.forEach(sectionId => {
                    const section = document.getElementById(sectionId);
                    if (section) {
                        section.classList.add('hidden');
                    }
                });
                
                // Show target section
                const targetElement = document.getElementById(targetSection + 'Section');
                if (targetElement) {
                    targetElement.classList.remove('hidden');
                    
                    // Load section-specific content
                    if (targetSection === 'overview' && this.adminPanel) {
                        this.adminPanel.loadOverviewData();
                    }
                    if (targetSection === 'pets' && this.petManager) {
                        this.petManager.loadPets();
                    }
                    if (targetSection === 'users' && this.userManager) {
                        this.userManager.loadUsers();
                    }
                    if (targetSection === 'notifications' && this.notificationManager) {
                        this.notificationManager.loadDeviceTokens();
                    }
                    if (targetSection === 'system' && this.systemManager) {
                        this.systemManager.loadSystemInfo();
                    }
                    if (targetSection === 'profile' && this.adminPanel) {
                        this.adminPanel.showProfile();
                    }
                }
            });
        });
    }

    // Getters for components
    getComponent(name) {
        switch (name) {
            case 'pets': return this.petManager;
            case 'users': return this.userManager;
            case 'notifications': return this.notificationManager;
            case 'system': return this.systemManager;
            default: return null;
        }
    }

    getService(name) {
        switch (name) {
            case 'modal': return this.modalService;
            case 'toast': return this.toastService;
            case 'firebase': return this.firebaseService;
            default: return null;
        }
    }

    getCurrentUser() {
        return this.authManager ? this.authManager.getCurrentUser() : null;
    }
}

// Initialize the admin app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.adminApp = new AdminApp();
        await window.adminApp.init();
    } catch (error) {
        console.error('Failed to initialize admin app:', error);
    }
});

// Make admin panel globally accessible
window.adminPanel = window.adminApp;

// Profile form is now handled by AdminPanel.showProfile() and renderProfileSection() 