/**
 * Permission Middleware - Access control for multi-user system
 * 
 * This module provides middleware functions to check permissions and control access
 * to different parts of the application based on user roles.
 */
import { USER_ROLES } from './user_manager.js';

class PermissionMiddleware {
  /**
   * Create a new PermissionMiddleware instance
   * @param {AuthManager} authManager - AuthManager instance
   */
  constructor(authManager) {
    if (!authManager) {
      console.error('PermissionMiddleware: authManager is required');
      throw new Error('AuthManager is required for PermissionMiddleware');
    }
    
    if (typeof authManager.isAuthenticated !== 'function') {
      console.error('PermissionMiddleware: authManager.isAuthenticated is not a function', {
        authManager: typeof authManager,
        methods: Object.getOwnPropertyNames(authManager),
        prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(authManager))
      });
      throw new Error('Invalid AuthManager instance provided to PermissionMiddleware');
    }
    
    this.authManager = authManager;
  }

  /**
   * Check if user has required permission
   * @param {string} permission - Required permission
   * @returns {boolean} Has permission
   */
  hasPermission(permission) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.hasPermission !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return this.authManager.hasPermission(permission);
  }

  /**
   * Check if user has any of the required permissions
   * @param {Array} permissions - Array of required permissions
   * @returns {boolean} Has any permission
   */
  hasAnyPermission(permissions) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.hasPermission !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return permissions.some(permission => this.authManager.hasPermission(permission));
  }

  /**
   * Check if user has all required permissions
   * @param {Array} permissions - Array of required permissions
   * @returns {boolean} Has all permissions
   */
  hasAllPermissions(permissions) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.hasPermission !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return permissions.every(permission => this.authManager.hasPermission(permission));
  }

  /**
   * Check if user has minimum role level
   * @param {number} minLevel - Minimum role level required
   * @returns {boolean} Has minimum role level
   */
  hasMinimumRole(minLevel) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.getUserRole !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    const userRole = this.authManager.getUserRole();
    const userLevel = USER_ROLES[userRole]?.level || 1;
    return userLevel >= minLevel;
  }

  /**
   * Check if user has specific role
   * @param {string} role - Required role
   * @returns {boolean} Has role
   */
  hasRole(role) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.getUserRole !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return this.authManager.getUserRole() === role;
  }

  /**
   * Check if user is admin or higher
   * @returns {boolean} Is admin
   */
  isAdmin() {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.isAdmin !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return this.authManager.isAdmin();
  }

  /**
   * Check if user is super admin
   * @returns {boolean} Is super admin
   */
  isSuperAdmin() {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.isSuperAdmin !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    return this.authManager.isSuperAdmin();
  }

  /**
   * Create permission guard function
   * @param {string|Array} requiredPermission - Required permission(s)
   * @param {Function} onDenied - Callback when access is denied
   * @returns {Function} Guard function
   */
  createGuard(requiredPermission, onDenied = null) {
    return () => {
      const hasAccess = Array.isArray(requiredPermission) 
        ? this.hasAnyPermission(requiredPermission)
        : this.hasPermission(requiredPermission);
      
      if (!hasAccess) {
        if (onDenied) {
          onDenied();
        } else {
          console.warn('Access denied: insufficient permissions');
        }
        return false;
      }
      
      return true;
    };
  }

  /**
   * Create role guard function
   * @param {string|Array} requiredRole - Required role(s)
   * @param {Function} onDenied - Callback when access is denied
   * @returns {Function} Guard function
   */
  createRoleGuard(requiredRole, onDenied = null) {
    return () => {
      const userRole = this.authManager.getUserRole();
      const hasAccess = Array.isArray(requiredRole) 
        ? requiredRole.includes(userRole)
        : userRole === requiredRole;
      
      if (!hasAccess) {
        if (onDenied) {
          onDenied();
        } else {
          console.warn('Access denied: insufficient role');
        }
        return false;
      }
      
      return true;
    };
  }

  /**
   * Create minimum role level guard
   * @param {number} minLevel - Minimum role level
   * @param {Function} onDenied - Callback when access is denied
   * @returns {Function} Guard function
   */
  createLevelGuard(minLevel, onDenied = null) {
    return () => {
      const hasAccess = this.hasMinimumRole(minLevel);
      
      if (!hasAccess) {
        if (onDenied) {
          onDenied();
        } else {
          console.warn(`Access denied: minimum role level ${minLevel} required`);
        }
        return false;
      }
      
      return true;
    };
  }

  /**
   * Check pet ownership
   * @param {string} petId - Pet ID to check ownership
   * @returns {boolean} Is pet owner
   */
  isPetOwner(petId) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.isAuthenticated !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    
    if (!this.authManager.isAuthenticated()) {
      return false;
    }
    
    const currentUser = this.authManager.getCurrentUser();
    return currentUser && currentUser.pets && currentUser.pets.includes(petId);
  }

  /**
   * Create pet ownership guard
   * @param {string} petId - Pet ID to check ownership
   * @param {Function} onDenied - Callback when access is denied
   * @returns {Function} Guard function
   */
  createPetOwnerGuard(petId, onDenied = null) {
    return () => {
      const isOwner = this.isPetOwner(petId);
      const isAdmin = this.isAdmin();
      
      if (!isOwner && !isAdmin) {
        if (onDenied) {
          onDenied();
        } else {
          console.warn('Access denied: not pet owner or admin');
        }
        return false;
      }
      
      return true;
    };
  }

  /**
   * Get user's accessible pets
   * @returns {Array} Array of pet IDs user can access
   */
  getAccessiblePets() {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.isAuthenticated !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return [];
    }
    
    if (!this.authManager.isAuthenticated()) {
      return [];
    }
    
    const currentUser = this.authManager.getCurrentUser();
    if (!currentUser) {
      return [];
    }
    
    // Admins can access all pets
    if (this.isAdmin()) {
      return ['*']; // Special value indicating all pets
    }
    
    // Regular users can only access their own pets
    return currentUser.pets || [];
  }

  /**
   * Check if user can access specific pet
   * @param {string} petId - Pet ID to check access
   * @returns {boolean} Can access pet
   */
  canAccessPet(petId) {
    // Safety check for authManager
    if (!this.authManager || typeof this.authManager.isAuthenticated !== 'function') {
      console.warn('PermissionMiddleware: authManager not properly initialized');
      return false;
    }
    
    const accessiblePets = this.getAccessiblePets();
    
    // Admins can access all pets
    if (accessiblePets.includes('*')) {
      return true;
    }
    
    // Check if user owns this pet
    return accessiblePets.includes(petId);
  }

  /**
   * Create pet access guard
   * @param {string} petId - Pet ID to check access
   * @param {Function} onDenied - Callback when access is denied
   * @returns {Function} Guard function
   */
  createPetAccessGuard(petId, onDenied = null) {
    return () => {
      const canAccess = this.canAccessPet(petId);
      
      if (!canAccess) {
        if (onDenied) {
          onDenied();
        } else {
          console.warn(`Access denied: cannot access pet ${petId}`);
        }
        return false;
      }
      
      return true;
    };
  }

  /**
   * Get permission summary for current user
   * @returns {Object} Permission summary
   */
  getPermissionSummary() {
    const userRole = this.authManager.getUserRole();
    const userPermissions = this.authManager.getUserPermissions();
    const accessiblePets = this.getAccessiblePets();
    
    return {
      role: userRole,
      roleLevel: USER_ROLES[userRole]?.level || 1,
      permissions: userPermissions,
      accessiblePets: accessiblePets,
      isAdmin: this.isAdmin(),
      isSuperAdmin: this.isSuperAdmin(),
      canManageUsers: this.hasPermission('manage_users'),
      canManagePets: this.hasPermission('manage_pets'),
      canViewAllCheckins: this.hasPermission('view_all_checkins'),
      canDeleteCheckins: this.hasPermission('delete_checkins')
    };
  }

  /**
   * Validate user can perform action on resource
   * @param {string} action - Action to perform
   * @param {string} resourceType - Type of resource
   * @param {string} resourceId - Resource ID (optional)
   * @returns {boolean} Can perform action
   */
  canPerformAction(action, resourceType, resourceId = null) {
    switch (action) {
      case 'create':
        switch (resourceType) {
          case 'user':
            return this.hasPermission('manage_users') || this.isSuperAdmin();
          case 'pet':
            return this.hasPermission('manage_pets') || this.isAdmin();
          case 'checkin':
            return this.hasPermission('create_checkins') || this.hasRole('USER') || this.hasRole('GUEST');
          default:
            return false;
        }
        
      case 'read':
        switch (resourceType) {
          case 'user':
            return this.hasPermission('manage_users') || this.isSuperAdmin();
          case 'pet':
            return this.isAuthenticated();
          case 'checkin':
            return this.hasPermission('view_all_checkins') || this.isAdmin() || 
                   (resourceId && this.canAccessPet(resourceId));
          default:
            return false;
        }
        
      case 'update':
        switch (resourceType) {
          case 'user':
            return this.hasPermission('manage_users') || this.isSuperAdmin();
          case 'pet':
            return (resourceId && this.isPetOwner(resourceId)) || 
                   this.hasPermission('manage_pets') || this.isAdmin();
          case 'checkin':
            return this.hasPermission('delete_checkins') || this.isAdmin();
          default:
            return false;
        }
        
      case 'delete':
        switch (resourceType) {
          case 'user':
            return this.hasPermission('manage_users') || this.isSuperAdmin();
          case 'pet':
            return (resourceId && this.isPetOwner(resourceId)) || 
                   this.hasPermission('manage_pets') || this.isAdmin();
          case 'checkin':
            return this.hasPermission('delete_checkins') || this.isAdmin();
          default:
            return false;
        }
        
      default:
        return false;
    }
  }
}

// At the end of the file, export as ES module
export { PermissionMiddleware }; 