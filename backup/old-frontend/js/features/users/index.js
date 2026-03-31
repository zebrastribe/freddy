/**
 * User Management System - Main exports
 * 
 * This module exports all user management components for the multi-user system.
 * Provides a clean interface for importing user management functionality.
 */

// Core user management classes
export { UserManager, USER_ROLES } from './user_manager.js';
export { AuthManager } from './auth_manager.js';
export { PermissionMiddleware } from './permission_middleware.js';

// UUID utilities
export { UUIDGenerator } from '../../lib/uuid.js';

// Re-export commonly used constants
export const USER_ROLE_LEVELS = {
  GUEST: 1,
  USER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

export const PERMISSIONS = {
  // Pet management
  MANAGE_PETS: 'manage_pets',
  MANAGE_PET_STATUS: 'manage_pet_status',
  MANAGE_PET_DOMAINS: 'manage_pet_domains',
  
  // User management
  MANAGE_USERS: 'manage_users',
  
  // Check-in management
  CREATE_CHECKINS: 'create_checkins',
  VIEW_OWN_CHECKINS: 'view_own_checkins',
  VIEW_ALL_CHECKINS: 'view_all_checkins',
  DELETE_CHECKINS: 'delete_checkins',
  
  // Token management
  MANAGE_TOKENS: 'manage_tokens',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  
  // Public access
  VIEW_PUBLIC_PETS: 'view_public_pets',
  CREATE_CHECKINS_WITH_TOKEN: 'create_checkins_with_token'
};

// Default user configuration
export const DEFAULT_USER_CONFIG = {
  role: 'USER',
  permissions: ['create_checkins', 'view_own_checkins', 'manage_own_pets', 'view_public_pets'],
  profile: {
    displayName: 'Anonymous User',
    preferences: {
      notifications: true,
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }
};

// User management utilities
export class UserManagementUtils {
  /**
   * Initialize user management system
   * @param {Object} db - Firestore database instance
   * @param {Object} auth - Firebase auth instance
   * @param {Object} config - App configuration
   * @returns {Object} Initialized user management components
   */
  static async initialize(db, auth, config) {
    try {
      // Create auth manager
      const authManager = new AuthManager(db, auth, config);
      await authManager.initialize();
      
      // Create permission middleware
      const permissionMiddleware = new PermissionMiddleware(authManager);
      
      // Create user manager
      const userManager = new UserManager(db, auth, config);
      
      console.log('User management system initialized successfully');
      
      return {
        authManager,
        userManager,
        permissionMiddleware,
        isInitialized: true
      };
    } catch (error) {
      console.error('Error initializing user management system:', error);
      throw error;
    }
  }

  /**
   * Create default super admin (system setup only)
   * @param {Object} db - Firestore database instance
   * @param {Object} auth - Firebase auth instance
   * @param {Object} config - App configuration
   * @param {string} email - Admin email
   * @param {string} displayName - Admin display name
   * @returns {Promise<Object>} Created super admin user
   */
  static async createSuperAdmin(db, auth, config, email, displayName) {
    try {
      const authManager = new AuthManager(db, auth, config);
      const superAdmin = await authManager.createSuperAdmin(email, displayName);
      
      console.log('Super admin created successfully:', superAdmin.id);
      return superAdmin;
    } catch (error) {
      console.error('Error creating super admin:', error);
      throw error;
    }
  }

  /**
   * Validate user management setup
   * @param {Object} userManagement - User management components
   * @returns {boolean} Setup is valid
   */
  static validateSetup(userManagement) {
    const { authManager, userManager, permissionMiddleware } = userManagement;
    
    if (!authManager || !userManager || !permissionMiddleware) {
      console.error('User management components missing');
      return false;
    }
    
    if (!authManager.isInitialized) {
      console.error('AuthManager not initialized');
      return false;
    }
    
    return true;
  }

  /**
   * Get user management status
   * @param {Object} userManagement - User management components
   * @returns {Object} Status information
   */
  static getStatus(userManagement) {
    const { authManager, permissionMiddleware } = userManagement;
    
    if (!authManager) {
      return { isReady: false, error: 'AuthManager not available' };
    }
    
    const authStatus = authManager.getAuthStatus();
    const permissionSummary = permissionMiddleware ? permissionMiddleware.getPermissionSummary() : null;
    
    return {
      isReady: authManager.isInitialized,
      authStatus,
      permissionSummary,
      timestamp: new Date().toISOString()
    };
  }
}

// Export default configuration
export default {
  UserManager,
  AuthManager,
  PermissionMiddleware,
  UUIDGenerator,
  USER_ROLES,
  USER_ROLE_LEVELS,
  PERMISSIONS,
  DEFAULT_USER_CONFIG,
  UserManagementUtils
}; 