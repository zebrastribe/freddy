/**
 * @file StorageManager.test.js
 * @description Unit tests for StorageManager component
 * @test-framework Jest
 * @coverage-target 100%
 * 
 * @component StorageManager
 * @description Manages localStorage operations with type safety and error handling
 * @requirements Browser localStorage support, ES6+ JavaScript
 * @dependencies None (standalone utility)
 */

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

let StorageManager;

beforeAll(async () => {
  ({ StorageManager } = await import('../../../trace/v2-frontend/src/shared/lib/storage.js'));
});

describe('StorageManager', () => {
  let storage;
  const testKey = 'testKey';
  const defaultValue = 'defaultValue';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a new instance for each test
    storage = new StorageManager(testKey, defaultValue);
  });

  afterEach(() => {
    // Clean up any stored data
    mockLocalStorage.clear();
  });

  describe('Constructor', () => {
    test('should initialize with key and default value', () => {
      expect(storage.key).toBe(testKey);
      expect(storage.defaultValue).toBe(defaultValue);
    });

    test('should handle empty default value', () => {
      const storageWithEmpty = new StorageManager('emptyKey', '');
      expect(storageWithEmpty.defaultValue).toBe('');
    });

    test('should handle null default value', () => {
      const storageWithNull = new StorageManager('nullKey', null);
      expect(storageWithNull.defaultValue).toBe(null);
    });
  });

  describe('get()', () => {
    test('should return stored value when available', () => {
      const storedValue = 'storedValue';
      mockLocalStorage.getItem.mockReturnValue(storedValue);

      const result = storage.get();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toBe(storedValue);
    });

    test('should return default value when no value stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = storage.get();
      
      expect(result).toBe(defaultValue);
    });

    test('should return default value when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = storage.get();
      
      expect(result).toBe(defaultValue);
    });

    test('should handle empty string as stored value', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = storage.get();
      
      expect(result).toBe('');
    });
  });

  describe('set()', () => {
    test('should store value in localStorage', () => {
      const valueToStore = 'valueToStore';

      storage.set(valueToStore);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, valueToStore);
    });

    test('should handle null value', () => {
      storage.set(null);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'null');
    });

    test('should handle undefined value', () => {
      storage.set(undefined);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'undefined');
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      // Should not throw error
      expect(() => {
        storage.set('testValue');
      }).not.toThrow();
    });

    test('should convert non-string values to string', () => {
      const numberValue = 42;
      const objectValue = { key: 'value' };

      storage.set(numberValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, '42');

      storage.set(objectValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, '[object Object]');
    });
  });

  describe('getBoolean()', () => {
    test('should return true for "true" string', () => {
      mockLocalStorage.getItem.mockReturnValue('true');

      const result = storage.getBoolean();
      
      expect(result).toBe(true);
    });

    test('should return false for "false" string', () => {
      mockLocalStorage.getItem.mockReturnValue('false');

      const result = storage.getBoolean();
      
      expect(result).toBe(false);
    });

    test('should return false for null/undefined', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = storage.getBoolean();
      
      expect(result).toBe(false);
    });

    test('should return false for empty string', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      const result = storage.getBoolean();
      
      expect(result).toBe(false);
    });

    test('should return false for any other string', () => {
      mockLocalStorage.getItem.mockReturnValue('random');

      const result = storage.getBoolean();
      
      expect(result).toBe(false);
    });

    test('should handle localStorage errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const result = storage.getBoolean();
      
      expect(result).toBe(false);
    });
  });

  describe('setBoolean()', () => {
    test('should store true as "true" string', () => {
      storage.setBoolean(true);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'true');
    });

    test('should store false as "false" string', () => {
      storage.setBoolean(false);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'false');
    });

    test('should handle truthy values', () => {
      storage.setBoolean(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'true');

      storage.setBoolean('yes');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'true');
    });

    test('should handle falsy values', () => {
      storage.setBoolean(0);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'false');

      storage.setBoolean('');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'false');
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      expect(() => {
        storage.setBoolean(true);
      }).not.toThrow();
    });
  });

  describe('remove()', () => {
    test('should remove item from localStorage', () => {
      storage.remove();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(testKey);
    });

    test('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      expect(() => {
        storage.remove();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should maintain state across get/set operations', () => {
      const testValue = 'integrationTest';
      
      // Set value
      storage.set(testValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, testValue);
      
      // Get value
      mockLocalStorage.getItem.mockReturnValue(testValue);
      const retrievedValue = storage.get();
      expect(retrievedValue).toBe(testValue);
      
      // Remove value
      storage.remove();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(testKey);
    });

    test('should handle boolean conversion correctly', () => {
      // Set boolean true
      storage.setBoolean(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'true');
      
      // Get boolean true
      mockLocalStorage.getItem.mockReturnValue('true');
      expect(storage.getBoolean()).toBe(true);
      
      // Set boolean false
      storage.setBoolean(false);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, 'false');
      
      // Get boolean false
      mockLocalStorage.getItem.mockReturnValue('false');
      expect(storage.getBoolean()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle all localStorage methods throwing errors', () => {
      const errorMessage = 'localStorage not available';
      
      // Mock all localStorage methods to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error(errorMessage);
      });
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // All operations should handle errors gracefully
      expect(() => storage.get()).not.toThrow();
      expect(() => storage.set('value')).not.toThrow();
      expect(() => storage.remove()).not.toThrow();
      expect(() => storage.getBoolean()).not.toThrow();
      expect(() => storage.setBoolean(true)).not.toThrow();
    });

    test('should return appropriate default values when localStorage fails', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(storage.get()).toBe(defaultValue);
      expect(storage.getBoolean()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      const longKeyStorage = new StorageManager(longKey, 'default');
      
      longKeyStorage.set('value');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(longKey, 'value');
    });

    test('should handle very long values', () => {
      const longValue = 'b'.repeat(10000);
      
      storage.set(longValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, longValue);
    });

    test('should handle special characters in keys and values', () => {
      const specialKey = 'key-with-special-chars!@#$%^&*()';
      const specialValue = 'value-with-special-chars!@#$%^&*()';
      
      const specialStorage = new StorageManager(specialKey, 'default');
      specialStorage.set(specialValue);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(specialKey, specialValue);
    });

    test('should handle unicode characters', () => {
      const unicodeValue = '🚀 Unicode test: 中文, Español, Français';
      
      storage.set(unicodeValue);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(testKey, unicodeValue);
    });
  });
}); 