/**
 * Storage utilities for the Trace platform
 * @author Trace Team
 * @version 1.0.0
 * 
 * @requirements
 * - Browser localStorage support
 * - ES6+ JavaScript support
 * 
 * @dependencies
 * - None (standalone utility)
 * 
 * @public-api
 * - constructor(key, defaultValue)
 * - get() -> string
 * - set(value) -> void
 * - getBoolean() -> boolean
 * - setBoolean(value) -> void
 * - remove() -> void
 * 
 * @usage
 * ```javascript
 * const storage = new StorageManager('userPreference', 'false');
 * storage.setBoolean(true);
 * const value = storage.getBoolean(); // true
 * ```
 * 
 * @error-handling
 * - Gracefully handles localStorage errors
 * - Returns default values when localStorage is unavailable
 * - Logs errors to console for debugging
 * 
 * @examples
 * ```javascript
 * // Basic usage
 * const storage = new StorageManager('theme', 'light');
 * storage.set('dark');
 * const theme = storage.get(); // 'dark'
 * 
 * // Boolean operations
 * const notifications = new StorageManager('notifications', 'false');
 * notifications.setBoolean(true);
 * const enabled = notifications.getBoolean(); // true
 * 
 * // Error handling
 * const storage = new StorageManager('key', 'default');
 * // If localStorage fails, get() returns 'default'
 * ```
 */

/**
 * StorageManager class for handling localStorage operations with error handling
 */
export class StorageManager {
  /**
   * Creates a new StorageManager instance
   * @param {string} key - The localStorage key to manage
   * @param {string} defaultValue - Default value to return if key doesn't exist
   */
  constructor(key, defaultValue = '') {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  /**
   * Gets the stored value from localStorage
   * @returns {string} The stored value or default value if not found
   * @throws {Error} When localStorage is not available (handled internally)
   */
  get() {
    try {
      const value = localStorage.getItem(this.key);
      return value !== null ? value : this.defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage item '${this.key}':`, error);
      return this.defaultValue;
    }
  }

  /**
   * Sets a value in localStorage
   * @param {any} value - The value to store (will be converted to string)
   * @throws {Error} When localStorage is not available (handled internally)
   */
  set(value) {
    try {
      localStorage.setItem(this.key, String(value));
    } catch (error) {
      console.error(`Error setting localStorage item '${this.key}':`, error);
    }
  }

  /**
   * Gets a boolean value from localStorage
   * @returns {boolean} True if stored value is "true", false otherwise
   * @throws {Error} When localStorage is not available (handled internally)
   */
  getBoolean() {
    try {
      const value = localStorage.getItem(this.key);
      return value === 'true';
    } catch (error) {
      console.error(`Error getting boolean localStorage item '${this.key}':`, error);
      return false;
    }
  }

  /**
   * Sets a boolean value in localStorage
   * @param {boolean} value - The boolean value to store
   * @throws {Error} When localStorage is not available (handled internally)
   */
  setBoolean(value) {
    try {
      localStorage.setItem(this.key, String(Boolean(value)));
    } catch (error) {
      console.error(`Error setting boolean localStorage item '${this.key}':`, error);
    }
  }

  /**
   * Removes the item from localStorage
   * @throws {Error} When localStorage is not available (handled internally)
   */
  remove() {
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error(`Error removing localStorage item '${this.key}':`, error);
    }
  }

  /**
   * Get the value as a number
   * @returns {number|null} The stored value converted to number, or null if invalid
   */
  getNumber() {
    const value = this.get();
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Get the value as an object (parsed JSON)
   * @returns {object|null} The parsed object or null if invalid JSON
   */
  getObject() {
    const value = this.get();
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn(`Failed to parse JSON for key "${this.key}":`, error);
      return null;
    }
  }

  /**
   * Check if the key exists in localStorage
   * @returns {boolean} True if key exists
   */
  exists() {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Clear all localStorage data
   */
  static clearAll() {
    localStorage.clear();
  }
} 