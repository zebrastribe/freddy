/**
 * UUID Generator - Secure unique identifier generation
 * 
 * This module provides utilities for generating UUIDs and validating them.
 * Essential for the multi-user system to ensure unique, non-guessable IDs.
 */
class UUIDGenerator {
  /**
   * Generate UUID v4
   * @returns {string} UUID v4 string
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate pet-specific UUID with prefix
   * @param {string} prefix - Prefix for the UUID
   * @returns {string} Prefixed UUID
   */
  static generatePetUUID(prefix = 'pet') {
    return `${prefix}_${this.generateUUID()}`;
  }

  /**
   * Generate user-specific UUID with prefix
   * @param {string} prefix - Prefix for the UUID
   * @returns {string} Prefixed UUID
   */
  static generateUserUUID(prefix = 'user') {
    return `${prefix}_${this.generateUUID()}`;
  }

  /**
   * Validate UUID format
   * @param {string} uuid - UUID to validate
   * @returns {boolean} Is valid UUID
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validate prefixed UUID format
   * @param {string} prefixedUUID - Prefixed UUID to validate
   * @param {string} expectedPrefix - Expected prefix
   * @returns {boolean} Is valid prefixed UUID
   */
  static isValidPrefixedUUID(prefixedUUID, expectedPrefix) {
    if (!prefixedUUID || typeof prefixedUUID !== 'string') {
      return false;
    }
    
    const parts = prefixedUUID.split('_');
    if (parts.length !== 2) {
      return false;
    }
    
    const [prefix, uuid] = parts;
    return prefix === expectedPrefix && this.isValidUUID(uuid);
  }

  /**
   * Extract UUID from prefixed UUID
   * @param {string} prefixedUUID - Prefixed UUID
   * @returns {string|null} UUID without prefix or null if invalid
   */
  static extractUUID(prefixedUUID) {
    if (!prefixedUUID || typeof prefixedUUID !== 'string') {
      return null;
    }
    
    const parts = prefixedUUID.split('_');
    if (parts.length !== 2) {
      return null;
    }
    
    const [, uuid] = parts;
    return this.isValidUUID(uuid) ? uuid : null;
  }

  /**
   * Generate short ID for display purposes
   * @param {number} length - Length of short ID (default: 8)
   * @returns {string} Short ID
   */
  static generateShortId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// At the end of the file, export as ES module
export { UUIDGenerator }; 