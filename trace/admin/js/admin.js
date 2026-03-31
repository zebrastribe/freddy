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
import { UrlNameManager } from './components/UrlNameManager.js';
// Import updateProfile and updateEmail from Firebase Auth CDN
import { updateProfile, updateEmail } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

class AdminApp {
    constructor() {
        this.adminPanel = new AdminPanel(this);
        this.authManager = null;
        this.petManager = null;
        this.userManager = null;
        this.notificationManager = null;
        this.systemManager = null;
        this.modalService = null;
        this.toastService = null;
        this.firebaseService = null;
        this.urlNameManager = null;
    }

    async init() {
        console.log('🚀 Initializing Admin Application...');
        
        try {
            // Initialize services
            this.firebaseService = new FirebaseService();
            await this.firebaseService.init();
            
            this.urlNameManager = new UrlNameManager(this);
            await this.urlNameManager.init();
            
            this.modalService = new ModalService();
            this.modalService.init();
            this.toastService = new ToastService();
            this.toastService.init();
            
            // Initialize components
            this.authManager = new AuthManager(this);
            this.adminPanel = new AdminPanel(this);
            this.userManager = new UserManager(this);
        this.petManager = new ObjectManager(this);
            this.notificationManager = new NotificationManager(this);
            this.systemManager = new SystemManager(this);
            
            // Initialize components
            await this.authManager.init();
            await this.adminPanel.init();
            await this.userManager.init();
            await this.petManager.init();
            await this.notificationManager.init();
            await this.systemManager.init();
            
            // Setup navigation after all components are initialized
            this.setupNavigation();
            
            console.log('✅ Admin Application initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Admin Application:', error);
        }
    }

    setupNavigation() {
        console.log('[AdminApp] setupNavigation called');
        const navItems = document.querySelectorAll('.nav-item');
        console.log('[AdminApp] Found nav items:', navItems.length);
        
        if (navItems.length === 0) {
            console.error('[AdminApp] No navigation items found! Check HTML structure.');
            return;
        }
        
        navItems.forEach((item, index) => {
            console.log(`[AdminApp] Setting up nav item ${index}:`, item.textContent.trim(), 'with data-section:', item.getAttribute('data-section'));
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = item.getAttribute('data-section');
                console.log('[AdminApp] Nav clicked:', targetSection);
                
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
                
                // Show only the target section
                const targetElement = document.getElementById(targetSection + 'Section');
                if (targetElement) {
                    targetElement.classList.remove('hidden');
                }
                
                // Close sidebar on mobile
                const sidebarDrawer = document.getElementById('sidebarDrawer');
                if (window.innerWidth < 768 && sidebarDrawer) {
                    sidebarDrawer.classList.add('-translate-x-full');
                }

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
            });
        });
        
        console.log('[AdminApp] Navigation setup complete');
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
            case 'urlNameManager': return this.urlNameManager;
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