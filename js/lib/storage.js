/**
 * StorageManager - Handles localStorage operations with type safety and defaults
 * 
 * This class provides a clean interface for managing localStorage data,
 * with built-in support for default values and type conversion.
 */
export class StorageManager {
  /**
   * Create a new StorageManager instance
   * @param {string} key - The localStorage key to manage
   * @param {any} defaultValue - Default value if key doesn't exist
   */
  constructor(key, defaultValue = null) {
    this.key = key;
    this.defaultValue = defaultValue;
  }

  /**
   * Get the current value from localStorage
   * @returns {string|null} The stored value or default
   */
  get() {
    const value = localStorage.getItem(this.key);
    return value !== null ? value : this.defaultValue;
  }

  /**
   * Get the value as a boolean
   * @returns {boolean} The stored value converted to boolean
   */
  getBoolean() {
    const value = this.get();
    return value === 'true';
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
   * Set a value in localStorage
   * @param {any} value - The value to store
   */
  set(value) {
    if (value === null || value === undefined) {
      this.clear();
      return;
    }
    
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(this.key, stringValue);
  }

  /**
   * Set a boolean value
   * @param {boolean} value - The boolean to store
   */
  setBoolean(value) {
    this.set(value ? 'true' : 'false');
  }

  /**
   * Check if the key exists in localStorage
   * @returns {boolean} True if key exists
   */
  exists() {
    return localStorage.getItem(this.key) !== null;
  }

  /**
   * Remove the key from localStorage
   */
  clear() {
    localStorage.removeItem(this.key);
  }

  /**
   * Get all keys that match a pattern
   * @param {string} pattern - Regex pattern to match keys
   * @returns {string[]} Array of matching keys
   */
  static getKeys(pattern = null) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (pattern) {
        if (new RegExp(pattern).test(key)) {
          keys.push(key);
        }
      } else {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clear all localStorage data
   */
  static clearAll() {
    localStorage.clear();
  }
} 