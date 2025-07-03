/**
 * UserManager Unit Tests
 * 
 * Tests for the UserManager class to ensure proper user management and role-based permissions.
 */

// Mock Firebase imports
jest.mock('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

// Mock UUID generator

// Import after mocking
const { UserManager, USER_ROLES } = require('../../../js/features/users/user_manager.js');
const { UUIDGenerator } = require('../../../js/lib/uuid.js');

// Get the mocked Firebase functions
const firebaseFirestore = require('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');

// Mock Firebase services
const mockDb = {
  collection: jest.fn(),
  doc: jest.fn()
};

const mockAuth = {
  currentUser: { uid: 'test-user-123' }
};

const mockConfig = {
  app: { name: 'Test App' }
};

// Mock document references
const mockDocRef = {
  exists: jest.fn(),
  data: jest.fn()
};

describe('UserManager', () => {
  let userManager;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock document
    mockDocRef.exists.mockReturnValue(true);
    mockDocRef.data.mockReturnValue({
      id: 'test-user-123',
      role: 'USER',
      permissions: ['create_checkins', 'view_own_checkins'],
      pets: ['pet_1', 'pet_2']
    });
    
    // Setup mock Firebase functions
    firebaseFirestore.doc.mockReturnValue(mockDocRef);
    firebaseFirestore.getDoc.mockResolvedValue(mockDocRef);
    firebaseFirestore.setDoc.mockResolvedValue();
    firebaseFirestore.updateDoc.mockResolvedValue();
    firebaseFirestore.deleteDoc.mockResolvedValue();
    firebaseFirestore.collection.mockReturnValue({
      docs: [
        {
          data: () => ({
            id: 'user-1',
            role: 'USER',
            permissions: ['create_checkins']
          })
        },
        {
          data: () => ({
            id: 'user-2',
            role: 'ADMIN',
            permissions: ['manage_pets', 'manage_users']
          })
        }
      ]
    });
    firebaseFirestore.getDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            id: 'user-1',
            role: 'USER',
            permissions: ['create_checkins']
          })
        },
        {
          data: () => ({
            id: 'user-2',
            role: 'ADMIN',
            permissions: ['manage_pets', 'manage_users']
          })
        }
      ]
    });
    
    // Setup UUID generator mocks
    UUIDGenerator.generateUUID.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    UUIDGenerator.generatePetUUID.mockReturnValue('pet_550e8400-e29b-41d4-a716-446655440000');
    UUIDGenerator.generateUserUUID.mockReturnValue('user_550e8400-e29b-41d4-a716-446655440000');
    UUIDGenerator.isValidUUID.mockReturnValue(true);
    UUIDGenerator.isValidPrefixedUUID.mockReturnValue(true);
    UUIDGenerator.extractUUID.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    UUIDGenerator.generateShortId.mockReturnValue('abc12345');
    
    // Create UserManager instance
    userManager = new UserManager(mockDb, mockAuth, mockConfig);
  });

  describe('User Creation', () => {
    test('should create user with valid role', async () => {
      const userData = {
        uid: 'new-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      };
      
      const result = await userManager.createUser(userData, 'USER');
      
      expect(result).toBeDefined();
      expect(result.role).toBe('USER');
      expect(result.permissions).toEqual(USER_ROLES.USER.permissions);
      expect(firebaseFirestore.setDoc).toHaveBeenCalled();
    });

    test('should throw error for invalid role', async () => {
      const userData = { uid: 'test-user' };
      
      await expect(userManager.createUser(userData, 'INVALID_ROLE'))
        .rejects.toThrow('Invalid role: INVALID_ROLE');
    });

    test('should generate UUID if no user ID provided', async () => {
      const userData = { email: 'test@example.com' };
      
      const result = await userManager.createUser(userData, 'USER');
      
      expect(result.id).toMatch(/^user_/);
      expect(UUIDGenerator.isValidPrefixedUUID(result.id, 'user')).toBe(true);
    });
  });

  describe('User Retrieval', () => {
    test('should get user by ID', async () => {
      const user = await userManager.getUser('test-user-123');
      
      expect(user).toBeDefined();
      expect(user.id).toBe('test-user-123');
      expect(user.role).toBe('USER');
    });

    test('should return null for non-existent user', async () => {
      mockDocRef.exists.mockReturnValue(false);
      
      const user = await userManager.getUser('non-existent');
      
      expect(user).toBeNull();
    });

    test('should get current user', async () => {
      const user = await userManager.getCurrentUser();
      
      expect(user).toBeDefined();
      expect(user.id).toBe('test-user-123');
    });
  });

  describe('User Updates', () => {
    test('should update user profile', async () => {
      const updates = {
        profile: {
          displayName: 'Updated Name'
        }
      };
      
      const result = await userManager.updateUser('test-user-123', updates);
      
      expect(result.profile.displayName).toBe('Updated Name');
      expect(firebaseFirestore.updateDoc).toHaveBeenCalled();
    });

    test('should throw error for non-existent user', async () => {
      mockDocRef.exists.mockReturnValue(false);
      
      await expect(userManager.updateUser('non-existent', {}))
        .rejects.toThrow('User not found');
    });
  });

  describe('User Deletion', () => {
    test('should delete user with proper permissions', async () => {
      // Set up admin permissions
      userManager.userRole = 'ADMIN';
      userManager.userPermissions = ['manage_users'];
      
      const result = await userManager.deleteUser('user-to-delete');
      
      expect(result).toBe(true);
      expect(firebaseFirestore.deleteDoc).toHaveBeenCalled();
    });

    test('should throw error without proper permissions', async () => {
      userManager.userRole = 'USER';
      userManager.userPermissions = ['create_checkins'];
      
      await expect(userManager.deleteUser('user-to-delete'))
        .rejects.toThrow('Insufficient permissions to delete users');
    });

    test('should prevent self-deletion for admins', async () => {
      userManager.userRole = 'ADMIN';
      userManager.userPermissions = ['manage_users'];
      userManager.currentUser = { id: 'admin-user' };
      
      await expect(userManager.deleteUser('admin-user'))
        .rejects.toThrow('Cannot delete your own admin account');
    });
  });

  describe('Permission Checking', () => {
    test('should check user permissions correctly', () => {
      userManager.userRole = 'USER';
      userManager.userPermissions = ['create_checkins', 'view_own_checkins'];
      
      expect(userManager.hasPermission('create_checkins')).toBe(true);
      expect(userManager.hasPermission('manage_users')).toBe(false);
    });

    test('should give super admin all permissions', () => {
      userManager.userRole = 'SUPER_ADMIN';
      userManager.userPermissions = [];
      
      expect(userManager.hasPermission('any_permission')).toBe(true);
      expect(userManager.hasPermission('manage_users')).toBe(true);
    });

    test('should check admin status correctly', () => {
      userManager.userRole = 'ADMIN';
      expect(userManager.isAdmin()).toBe(true);
      
      userManager.userRole = 'SUPER_ADMIN';
      expect(userManager.isAdmin()).toBe(true);
      
      userManager.userRole = 'USER';
      expect(userManager.isAdmin()).toBe(false);
    });

    test('should check super admin status correctly', () => {
      userManager.userRole = 'SUPER_ADMIN';
      expect(userManager.isSuperAdmin()).toBe(true);
      
      userManager.userRole = 'ADMIN';
      expect(userManager.isSuperAdmin()).toBe(false);
    });
  });

  describe('Pet Management', () => {
    test('should add pet to user', async () => {
      const result = await userManager.addPetToUser('test-user-123', 'new-pet-456');
      
      expect(result).toBe(true);
      expect(firebaseFirestore.updateDoc).toHaveBeenCalled();
    });

    test('should remove pet from user', async () => {
      const result = await userManager.removePetFromUser('test-user-123', 'pet_1');
      
      expect(result).toBe(true);
      expect(firebaseFirestore.updateDoc).toHaveBeenCalled();
    });

    test('should throw error for non-existent user in pet operations', async () => {
      mockDocRef.exists.mockReturnValue(false);
      
      await expect(userManager.addPetToUser('non-existent', 'pet-1'))
        .rejects.toThrow('User not found');
      
      await expect(userManager.removePetFromUser('non-existent', 'pet-1'))
        .rejects.toThrow('User not found');
    });
  });

  describe('User Listing', () => {
    test('should get all users with admin permissions', async () => {
      userManager.userRole = 'ADMIN';
      userManager.userPermissions = ['manage_users'];
      
      const users = await userManager.getAllUsers();
      
      expect(users).toHaveLength(2);
      expect(users[0].role).toBe('USER');
      expect(users[1].role).toBe('ADMIN');
    });

    test('should throw error without proper permissions', async () => {
      userManager.userRole = 'USER';
      userManager.userPermissions = ['create_checkins'];
      
      await expect(userManager.getAllUsers())
        .rejects.toThrow('Insufficient permissions to view all users');
    });
  });

  describe('Static Methods', () => {
    test('should get role permissions', () => {
      const permissions = UserManager.getRolePermissions('ADMIN');
      expect(permissions).toEqual(USER_ROLES.ADMIN.permissions);
    });

    test('should get role description', () => {
      const description = UserManager.getRoleDescription('USER');
      expect(description).toBe(USER_ROLES.USER.description);
    });

    test('should get available roles', () => {
      const roles = UserManager.getAvailableRoles();
      expect(roles).toContain('USER');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('GUEST');
    });
  });

  describe('Role Levels', () => {
    test('should get correct role level', () => {
      userManager.userRole = 'USER';
      expect(userManager.getRoleLevel()).toBe(2);
      
      userManager.userRole = 'ADMIN';
      expect(userManager.getRoleLevel()).toBe(3);
      
      userManager.userRole = 'SUPER_ADMIN';
      expect(userManager.getRoleLevel()).toBe(4);
      
      userManager.userRole = 'GUEST';
      expect(userManager.getRoleLevel()).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      firebaseFirestore.setDoc.mockRejectedValue(new Error('Database error'));
      
      await expect(userManager.createUser({ uid: 'test' }, 'USER'))
        .rejects.toThrow('Database error');
    });

    test('should handle authentication errors', async () => {
      mockAuth.currentUser = null;
      
      const user = await userManager.getCurrentUser();
      expect(user).toBeNull();
    });
  });
}); 