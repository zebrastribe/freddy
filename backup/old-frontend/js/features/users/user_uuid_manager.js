/**
 * UserUUIDManager - Handles user ID generation and validation
 * 
 * @class UserUUIDManager
 * @description Manages unique identifiers for users across the system
 */
export class UserUUIDManager {
  constructor() {
    this.uuidGenerator = this.createUUIDGenerator();
  }

  /**
   * Create a simple UUID generator
   */
  createUUIDGenerator() {
    return {
      generate() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
  }

  /**
   * Generate a new user ID
   * Format: uid_{uuid}_{timestamp}
   */
  generateUserID(username = null) {
    const uuid = this.uuidGenerator.generate();
    const timestamp = Math.floor(Date.now() / 1000);
    const nameSuffix = username ? `_${username}` : '';
    
    return `uid_${uuid}${nameSuffix}_${timestamp}`;
  }

  /**
   * Generate legacy user ID (backward compatibility)
   * Format: uid_{username}_{timestamp}
   */
  generateLegacyUserID(username) {
    const timestamp = Math.floor(Date.now() / 1000);
    return `uid_${username}_${timestamp}`;
  }

  /**
   * Parse user ID to extract components
   */
  parseUserID(userID) {
    const parts = userID.split('_');
    
    if (parts.length < 3) {
      throw new Error('Invalid user ID format');
    }

    const prefix = parts[0];
    if (prefix !== 'uid') {
      throw new Error('Invalid user ID prefix');
    }

    const timestamp = parts[parts.length - 1];
    const uuid = parts[1];
    
    // Extract username from middle parts
    const middleParts = parts.slice(2, -1);
    const username = middleParts.length > 0 ? middleParts.join('_') : null;

    return {
      prefix,
      uuid,
      username,
      timestamp: parseInt(timestamp),
      isValid: true
    };
  }

  /**
   * Validate user ID format
   */
  isValidUserID(userID) {
    try {
      const parsed = this.parseUserID(userID);
      return parsed.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user ID is in legacy format
   */
  isLegacyUserID(userID) {
    const parts = userID.split('_');
    if (parts.length < 3) return false;
    
    const prefix = parts[0];
    const timestamp = parts[parts.length - 1];
    
    return prefix === 'uid' && 
           !parts[1].includes('-') && // Legacy doesn't have UUID format
           !isNaN(parseInt(timestamp));
  }

  /**
   * Migrate legacy user ID to new format
   */
  migrateLegacyUserID(legacyUserID, newUsername = null) {
    if (!this.isLegacyUserID(legacyUserID)) {
      throw new Error('Not a legacy user ID');
    }

    const parts = legacyUserID.split('_');
    const oldUsername = parts[1];
    const timestamp = parts[2];

    // Use new username if provided, otherwise keep old one
    const username = newUsername || oldUsername;

    return this.generateUserID(username);
  }

  /**
   * Generate short user ID for URLs
   * Format: uid{alphanumeric}
   */
  generateShortUserID(username) {
    const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `uid${cleanUsername}${randomSuffix}`;
  }

  /**
   * Validate short user ID format
   */
  isValidShortUserID(shortUserID) {
    return /^uid[a-zA-Z0-9]{4,}$/.test(shortUserID);
  }

  /**
   * Generate checksum for user ID validation
   */
  generateChecksum(userID) {
    let hash = 0;
    for (let i = 0; i < userID.length; i++) {
      const char = userID.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  /**
   * Add checksum to user ID
   */
  addChecksum(userID) {
    const checksum = this.generateChecksum(userID);
    return `${userID}_${checksum}`;
  }

  /**
   * Validate user ID with checksum
   */
  validateWithChecksum(userIDWithChecksum) {
    const parts = userIDWithChecksum.split('_');
    if (parts.length < 4) return false;

    const checksum = parts[parts.length - 1];
    const userID = parts.slice(0, -1).join('_');
    const expectedChecksum = this.generateChecksum(userID);

    return checksum === expectedChecksum;
  }

  /**
   * Extract user ID without checksum
   */
  removeChecksum(userIDWithChecksum) {
    const parts = userIDWithChecksum.split('_');
    if (parts.length < 4) return userIDWithChecksum;

    return parts.slice(0, -1).join('_');
  }

  /**
   * Generate unique constraints for user ID
   */
  generateUniqueConstraints(userID) {
    return {
      userID: userID,
      shortUserID: this.generateShortUserID(userID),
      checksum: this.generateChecksum(userID),
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Validate unique constraints
   */
  validateUniqueConstraints(constraints) {
    return {
      userID: this.isValidUserID(constraints.userID),
      shortUserID: this.isValidShortUserID(constraints.shortUserID),
      checksum: constraints.checksum && constraints.checksum.length === 6,
      createdAt: !isNaN(Date.parse(constraints.createdAt))
    };
  }
} 