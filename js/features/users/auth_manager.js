/**
 * Enhanced Authentication Manager for Multi-User, Multi-Pet System
 * 
 * @class AuthManager
 * @description Manages user authentication, roles, and permissions
 */

import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';

export class AuthManager {
  constructor(firebaseApp) {
    this.auth = getAuth(firebaseApp);
    this.db = getFirestore(firebaseApp);
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = [];
    this.isInitialized = false;
    
    // Bind methods
    this.handleAuthStateChange = this.handleAuthStateChange.bind(this);
    
    // Initialize auth state listener
    this.initializeAuthStateListener();
  }

  /**
   * Initialize auth state listener
   */
  async initializeAuthStateListener() {
    onAuthStateChanged(this.auth, this.handleAuthStateChange);
  }

  /**
   * Handle authentication state changes
   */
  async handleAuthStateChange(user) {
    if (user) {
      console.log('🔐 User authenticated:', user.uid);
      await this.loadUserProfile(user.uid);
    } else {
      console.log('🔓 User signed out');
      this.currentUser = null;
      this.userRole = null;
      this.userPermissions = [];
    }
    this.isInitialized = true;
  }

  /**
   * Load user profile from Firestore
   */
  async loadUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.currentUser = {
          uid: userId,
          ...userData
        };
        this.userRole = userData.role;
        this.userPermissions = userData.permissions || [];
        
        console.log(`👤 Loaded user profile: ${userData.profile?.displayName} (${userData.role})`);
      } else {
        // Create default user profile for anonymous users
        await this.createDefaultUserProfile(userId);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      throw error;
    }
  }

  /**
   * Create default user profile for anonymous users
   */
  async createDefaultUserProfile(userId) {
    const defaultProfile = {
      role: 'GUEST',
      permissions: ['view_public_pets', 'create_checkins_with_token'],
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      profile: {
        displayName: 'Anonymous User',
        phone: '',
        preferences: {
          notifications: true,
          language: 'en',
          timezone: 'UTC'
        }
      },
      pets: [],
      accessTokens: [],
      isActive: true
    };

    await setDoc(doc(this.db, 'users', userId), defaultProfile);
    
    this.currentUser = {
      uid: userId,
      ...defaultProfile
    };
    this.userRole = 'GUEST';
    this.userPermissions = defaultProfile.permissions;
    
    console.log('👤 Created default user profile for anonymous user');
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    try {
      const result = await signInAnonymously(this.auth);
      console.log('🔐 Anonymous sign-in successful');
      return result.user;
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Register new user with email and password
   */
  async registerUser(email, password, userData = {}) {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      // Create user profile
      const userProfile = {
        email: email,
        role: userData.role || 'USER',
        permissions: userData.permissions || [
          'create_checkins',
          'view_own_checkins',
          'manage_own_pets',
          'view_public_pets'
        ],
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        profile: {
          displayName: userData.displayName || email.split('@')[0],
          phone: userData.phone || '',
          preferences: {
            notifications: true,
            language: 'en',
            timezone: 'UTC'
          }
        },
        pets: [],
        accessTokens: [],
        isActive: true
      };

      await setDoc(doc(this.db, 'users', result.user.uid), userProfile);
      
      console.log('✅ User registration successful');
      return result.user;
    } catch (error) {
      console.error('❌ User registration failed:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Update last login time
      await updateDoc(doc(this.db, 'users', result.user.uid), {
        lastLoginAt: serverTimestamp()
      });
      
      console.log('🔐 Email sign-in successful');
      return result.user;
    } catch (error) {
      console.error('❌ Email sign-in failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      await signOut(this.auth);
      console.log('🔓 Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    
    // Super admin has all permissions
    if (this.userRole === 'SUPER_ADMIN') return true;
    
    // Check specific permission
    return this.userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin() {
    return this.userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.userRole === 'ADMIN' || this.userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user is regular user
   */
  isUser() {
    return this.userRole === 'USER';
  }

  /**
   * Check if user is guest
   */
  isGuest() {
    return this.userRole === 'GUEST';
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get user role
   */
  getUserRole() {
    return this.userRole;
  }

  /**
   * Get user permissions
   */
  getUserPermissions() {
    return [...this.userPermissions];
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      await updateDoc(doc(this.db, 'users', this.currentUser.uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Reload user profile
      await this.loadUserProfile(this.currentUser.uid);
      
      console.log('✅ User profile updated');
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Add pet to user's pets list
   */
  async addPetToUser(petId) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const currentPets = this.currentUser.pets || [];
      if (!currentPets.includes(petId)) {
        await updateDoc(doc(this.db, 'users', this.currentUser.uid), {
          pets: [...currentPets, petId],
          updatedAt: serverTimestamp()
        });

        // Reload user profile
        await this.loadUserProfile(this.currentUser.uid);
        
        console.log(`✅ Added pet ${petId} to user`);
      }
    } catch (error) {
      console.error('❌ Failed to add pet to user:', error);
      throw error;
    }
  }

  /**
   * Remove pet from user's pets list
   */
  async removePetFromUser(petId) {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      const currentPets = this.currentUser.pets || [];
      const updatedPets = currentPets.filter(id => id !== petId);
      
      await updateDoc(doc(this.db, 'users', this.currentUser.uid), {
        pets: updatedPets,
        updatedAt: serverTimestamp()
      });

      // Reload user profile
      await this.loadUserProfile(this.currentUser.uid);
      
      console.log(`✅ Removed pet ${petId} from user`);
    } catch (error) {
      console.error('❌ Failed to remove pet from user:', error);
      throw error;
    }
  }

  /**
   * Check if user owns a specific pet
   */
  isPetOwner(petId) {
    if (!this.currentUser) return false;
    return (this.currentUser.pets || []).includes(petId);
  }

  /**
   * Wait for authentication to be initialized
   */
  async waitForInitialization() {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve();
      } else {
        const checkInitialized = () => {
          if (this.isInitialized) {
            resolve();
          } else {
            setTimeout(checkInitialized, 100);
          }
        };
        checkInitialized();
      }
    });
  }

  /**
   * Get authentication status summary
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      userRole: this.userRole,
      permissions: this.getUserPermissions(),
      isSuperAdmin: this.isSuperAdmin(),
      isAdmin: this.isAdmin(),
      isUser: this.isUser(),
      isGuest: this.isGuest(),
      currentUser: this.currentUser ? {
        uid: this.currentUser.uid,
        displayName: this.currentUser.profile?.displayName,
        email: this.currentUser.email,
        pets: this.currentUser.pets || []
      } : null
    };
  }
}

// Export singleton instance
let authManagerInstance = null;

export function getAuthManager(firebaseApp) {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager(firebaseApp);
  }
  return authManagerInstance;
}

export default AuthManager; 