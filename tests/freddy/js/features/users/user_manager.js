/**
 * UserManager - Handles user management and role-based permissions
 * 
 * This class provides a secure interface for managing users, roles, and permissions
 * in the multi-user, multi-pet system.
 */

// Import Firebase functions
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { UUIDGenerator } from '../../lib/uuid.js';

// User role definitions with hierarchical permissions
const USER_ROLES = {
  SUPER_ADMIN: {
    level: 4,
    permissions: ['*'], // All permissions
    description: 'Full system access - can delete admins, manage everything'
  },
  ADMIN: {
    level: 3,
    permissions: [
      'manage_pets',           // Add/remove pets
      'manage_users',          // Add/remove users (except admins)
      'view_all_checkins',     // View all check-ins
      'delete_checkins',       // Delete check-ins
      'manage_tokens',         // Manage access tokens
      'view_analytics',        // View system analytics
      'manage_pet_domains',    // Manage pet-specific domains
      'manage_pet_status'      // Manage pet status
    ],
    description: 'Pet and user management - can add pets, delete users, delete check-ins'
  },
  USER: {
    level: 2,
    permissions: [
      'create_checkins',       // Create check-ins
      'view_own_checkins',     // View own check-ins
      'manage_own_pets',       // Manage own pets
      'view_public_pets'       // View public pets
    ],
    description: 'Standard user - can check-in and manage own pets'
  },
  GUEST: {
    level: 1,
    permissions: [
      'view_public_pets',      // View public pets
      'create_checkins_with_token' // Create check-ins with valid token
    ],
    description: 'Anonymous users with tokens - limited access'
  }
};

class UserManager {
  /**
   * Create a new UserManager instance
   * @param {Object} db - Firestore database instance
   * @param {Object} auth - Firebase auth instance
   * @param {Object} config - App configuration
   */
  constructor(db, auth, config) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = [];
  }

  /**
   * Create a new user with role
   * @param {Object} userData - User information
   * @param {string} role - User role (default: 'USER')
   * @returns {Promise<Object>} Created user document
   */
  async createUser(userData, role = 'USER') {
    try {
      // Validate role
      if (!USER_ROLES[role]) {
        throw new Error(`Invalid role: ${role}`);
      }

      // Generate user ID if not provided
      const userId = userData.uid || userData.id || UUIDGenerator.generateUserUUID();
      
      const user = {
        id: userId,
        uid: userId, // Firebase auth UID
        email: userData.email || null,
        role: role,
        permissions: USER_ROLES[role].permissions,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        profile: {
          displayName: userData.displayName || 'Anonymous User',
          phone: userData.phone || null,
          preferences: {
            notifications: true,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        },
        pets: [], // Array of owned pet IDs
        accessTokens: [], // Valid access tokens
        isActive: true
      };

      await setDoc(doc(this.db, 'users', userId), user);
      console.log(`User created successfully: ${userId} with role ${role}`);
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User document or null
   */
  async getUser(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (!userDoc.exists()) {
        return null;
      }
      return userDoc.data();
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * @returns {Promise<Object|null>} Current user document or null
   */
  async getCurrentUser() {
    try {
      if (!this.auth.currentUser) {
        return null;
      }

      const user = await this.getUser(this.auth.currentUser.uid);
      if (user) {
        this.currentUser = user;
        this.userRole = user.role;
        this.userPermissions = user.permissions;
      }
      
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user document
   */
  async updateUser(userId, updates) {
    try {
      // Validate user exists
      const existingUser = await this.getUser(userId);
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Add updated timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(doc(this.db, 'users', userId), updateData);
      
      // Update local cache if it's the current user
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = { ...this.currentUser, ...updateData };
      }

      return { ...existingUser, ...updateData };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    try {
      // Check permissions
      if (!this.hasPermission('manage_users') && !this.isSuperAdmin()) {
        throw new Error('Insufficient permissions to delete users');
      }

      // Prevent self-deletion for admins
      if (this.currentUser && this.currentUser.id === userId && this.isAdmin()) {
        throw new Error('Cannot delete your own admin account');
      }

      await deleteDoc(doc(this.db, 'users', userId));
      console.log(`User deleted successfully: ${userId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Has permission
   */
  hasPermission(permission) {
    // Super admin has all permissions
    if (this.userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check specific permission
    return this.userPermissions.includes(permission);
  }

  /**
   * Check if user is admin
   * @returns {boolean} Is admin
   */
  isAdmin() {
    return this.userRole === 'ADMIN' || this.userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user is super admin
   * @returns {boolean} Is super admin
   */
  isSuperAdmin() {
    return this.userRole === 'SUPER_ADMIN';
  }

  /**
   * Get user role level
   * @returns {number} Role level (1-4)
   */
  getRoleLevel() {
    return USER_ROLES[this.userRole]?.level || 1;
  }

  /**
   * Add pet to user's owned pets
   * @param {string} userId - User ID
   * @param {string} petId - Pet ID to add
   * @returns {Promise<boolean>} Success status
   */
  async addPetToUser(userId, petId) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.pets.includes(petId)) {
        await updateDoc(doc(this.db, 'users', userId), {
          pets: [...user.pets, petId],
          updatedAt: new Date()
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding pet to user:', error);
      throw error;
    }
  }

  /**
   * Remove pet from user's owned pets
   * @param {string} userId - User ID
   * @param {string} petId - Pet ID to remove
   * @returns {Promise<boolean>} Success status
   */
  async removePetFromUser(userId, petId) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const updatedPets = user.pets.filter(id => id !== petId);
      await updateDoc(doc(this.db, 'users', userId), {
        pets: updatedPets,
        updatedAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Error removing pet from user:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} Array of user documents
   */
  async getAllUsers() {
    try {
      if (!this.hasPermission('manage_users') && !this.isSuperAdmin()) {
        throw new Error('Insufficient permissions to view all users');
      }

      const usersSnapshot = await getDocs(collection(this.db, 'users'));
      return usersSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Update user's last login time
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      await updateDoc(doc(this.db, 'users', userId), {
        lastLoginAt: new Date()
      });
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for login time updates
    }
  }

  /**
   * Get role permissions
   * @param {string} role - Role name
   * @returns {Array} Array of permissions
   */
  static getRolePermissions(role) {
    return USER_ROLES[role]?.permissions || [];
  }

  /**
   * Get role description
   * @param {string} role - Role name
   * @returns {string} Role description
   */
  static getRoleDescription(role) {
    return USER_ROLES[role]?.description || 'Unknown role';
  }

  /**
   * Get all available roles
   * @returns {Array} Array of role names
   */
  static getAvailableRoles() {
    return Object.keys(USER_ROLES);
  }
}

// Export as ES module
export { UserManager, USER_ROLES }; 