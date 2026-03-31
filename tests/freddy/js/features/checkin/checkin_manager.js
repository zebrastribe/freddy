/**
 * CheckInManager - Enhanced check-in system with pet-specific support
 * 
 * This class provides check-in functionality with support for multiple pets
 * and enhanced security for the multi-user system.
 */
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { UUIDGenerator } from '../../lib/uuid.js';

class CheckInManager {
  /**
   * Create a new CheckInManager instance
   * @param {Object} db - Firestore database instance
   * @param {Object} auth - Firebase auth instance
   * @param {Object} config - App configuration
   * @param {Object} permissionMiddleware - Permission middleware instance
   * @param {Object} petManager - PetManager instance
   */
  constructor(db, auth, config, permissionMiddleware, petManager) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.permissionMiddleware = permissionMiddleware;
    this.petManager = petManager;
  }

  /**
   * Create a new check-in with pet support
   * @param {Object} checkinData - Check-in data
   * @param {string} petId - Pet ID (optional for backward compatibility)
   * @returns {Promise<Object>} Created check-in document
   */
  async createCheckIn(checkinData, petId = null) {
    try {
      // Check permissions
      if (!this.permissionMiddleware.canPerformAction('create', 'checkin')) {
        throw new Error('Insufficient permissions to create check-ins');
      }

      // Validate pet access if petId is provided
      if (petId && !this.permissionMiddleware.canAccessPet(petId)) {
        throw new Error('Access denied: cannot create check-ins for this pet');
      }

      // Generate check-in ID
      const checkinId = UUIDGenerator.generateUUID();
      
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const checkin = {
        id: checkinId,
        petId: petId, // Can be null for backward compatibility
        userId: userId,
        name: checkinData.name || 'Anonymous',
        latitude: checkinData.latitude,
        longitude: checkinData.longitude,
        timestamp: new Date(),
        recaptchaToken: checkinData.recaptchaToken || null,
        domain: checkinData.domain || window.location.hostname,
        metadata: {
          accuracy: checkinData.accuracy || null,
          altitude: checkinData.altitude || null,
          speed: checkinData.speed || null,
          heading: checkinData.heading || null,
          deviceInfo: checkinData.deviceInfo || this.getDeviceInfo(),
          weather: checkinData.weather || null,
          ...checkinData.metadata
        }
      };

      // Create check-in document
      await setDoc(doc(this.db, 'clicks', checkinId), checkin);
      
      // Update pet's last seen if petId is provided
      if (petId) {
        await this.petManager.updatePetStatus(petId, 'active', {
          latitude: checkinData.latitude,
          longitude: checkinData.longitude
        });
      }
      
      console.log(`Check-in created successfully: ${checkinId} for pet: ${petId || 'none'}`);
      
      return checkin;
    } catch (error) {
      console.error('Error creating check-in:', error);
      throw error;
    }
  }

  /**
   * Get check-in by ID
   * @param {string} checkinId - Check-in ID
   * @returns {Promise<Object|null>} Check-in document or null
   */
  async getCheckIn(checkinId) {
    try {
      const checkinDoc = await getDoc(doc(this.db, 'clicks', checkinId));
      if (!checkinDoc.exists()) {
        return null;
      }
      
      const checkin = checkinDoc.data();
      
      // Check if user can access this check-in
      if (!this.permissionMiddleware.canPerformAction('read', 'checkin', checkin.petId)) {
        throw new Error('Access denied: cannot access this check-in');
      }
      
      return checkin;
    } catch (error) {
      console.error('Error getting check-in:', error);
      throw error;
    }
  }

  /**
   * Get check-ins for a specific pet
   * @param {string} petId - Pet ID
   * @param {number} limit - Maximum number of check-ins to return
   * @returns {Promise<Array>} Array of check-in documents
   */
  async getPetCheckIns(petId, limit = 50) {
    try {
      // Check if user can access this pet's check-ins
      if (!this.permissionMiddleware.canAccessPet(petId)) {
        throw new Error('Access denied: cannot access check-ins for this pet');
      }

      const checkinsQuery = query(
        collection(this.db, 'clicks'),
        where('petId', '==', petId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const checkinsSnapshot = await getDocs(checkinsQuery);
      return checkinsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting pet check-ins:', error);
      throw error;
    }
  }

  /**
   * Get all check-ins for current user
   * @param {number} limit - Maximum number of check-ins to return
   * @returns {Promise<Array>} Array of check-in documents
   */
  async getUserCheckIns(limit = 50) {
    try {
      const userId = this.auth.currentUser?.uid;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const checkinsQuery = query(
        collection(this.db, 'clicks'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const checkinsSnapshot = await getDocs(checkinsQuery);
      return checkinsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting user check-ins:', error);
      throw error;
    }
  }

  /**
   * Get all check-ins (admin only)
   * @param {number} limitCount - Maximum number of check-ins to return
   * @param {boolean} bypassPermissions - Skip permission checks (for legacy mode)
   * @returns {Promise<Array>} Array of check-in documents
   */
  async getAllCheckIns(limitCount = 100, bypassPermissions = false) {
    try {
      // Check permissions unless bypassed
      if (!bypassPermissions && !this.permissionMiddleware.canPerformAction('read', 'checkin')) {
        throw new Error('Insufficient permissions to view all check-ins');
      }

      const checkinsQuery = query(
        collection(this.db, 'clicks'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const checkinsSnapshot = await getDocs(checkinsQuery);
      return checkinsSnapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error getting all check-ins:', error);
      throw error;
    }
  }

  /**
   * Get public check-ins (for legacy mode - bypasses permission checks)
   * @param {number} limit - Maximum number of check-ins to return
   * @returns {Promise<Array>} Array of check-in documents
   */
  async getPublicCheckIns(limit = 100) {
    try {
      console.log('getPublicCheckIns: Fetching public check-ins...');
      
      const checkinsQuery = query(
        collection(this.db, 'clicks'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      
      const checkinsSnapshot = await getDocs(checkinsQuery);
      const checkins = checkinsSnapshot.docs.map(doc => doc.data());
      
      console.log('getPublicCheckIns: Found', checkins.length, 'check-ins');
      return checkins;
    } catch (error) {
      console.error('Error getting public check-ins:', error);
      throw error;
    }
  }

  /**
   * Update check-in
   * @param {string} checkinId - Check-in ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated check-in document
   */
  async updateCheckIn(checkinId, updates) {
    try {
      // Check permissions
      if (!this.permissionMiddleware.canPerformAction('update', 'checkin')) {
        throw new Error('Insufficient permissions to update check-ins');
      }

      // Get existing check-in
      const existingCheckin = await this.getCheckIn(checkinId);
      if (!existingCheckin) {
        throw new Error('Check-in not found');
      }

      // Add updated timestamp
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(doc(this.db, 'clicks', checkinId), updateData);
      
      return { ...existingCheckin, ...updateData };
    } catch (error) {
      console.error('Error updating check-in:', error);
      throw error;
    }
  }

  /**
   * Delete check-in
   * @param {string} checkinId - Check-in ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteCheckIn(checkinId) {
    try {
      // Check permissions
      if (!this.permissionMiddleware.canPerformAction('delete', 'checkin')) {
        throw new Error('Insufficient permissions to delete check-ins');
      }

      await deleteDoc(doc(this.db, 'clicks', checkinId));
      
      console.log(`Check-in deleted successfully: ${checkinId}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting check-in:', error);
      throw error;
    }
  }

  /**
   * Get check-in statistics
   * @param {string} petId - Pet ID (optional, for pet-specific stats)
   * @param {string} userId - User ID (optional, for user-specific stats)
   * @returns {Promise<Object>} Check-in statistics
   */
  async getCheckInStats(petId = null, userId = null) {
    try {
      let checkins;
      
      if (petId) {
        // Pet-specific stats
        if (!this.permissionMiddleware.canAccessPet(petId)) {
          throw new Error('Access denied: cannot access check-in stats for this pet');
        }
        checkins = await this.getPetCheckIns(petId, 1000);
      } else if (userId) {
        // User-specific stats
        if (userId !== this.auth.currentUser?.uid && !this.permissionMiddleware.hasPermission('view_analytics')) {
          throw new Error('Access denied: cannot access check-in stats for this user');
        }
        checkins = await this.getUserCheckIns(1000);
      } else {
        // All check-ins (admin only)
        if (!this.permissionMiddleware.hasPermission('view_analytics')) {
          throw new Error('Insufficient permissions to view all check-in statistics');
        }
        checkins = await this.getAllCheckIns(1000, false);
      }

      const stats = {
        total: checkins.length,
        byPet: {},
        byDate: {},
        byHour: {},
        averageAccuracy: 0,
        totalDistance: 0,
        lastCheckIn: null
      };

      let totalAccuracy = 0;
      let accuracyCount = 0;

      checkins.forEach(checkin => {
        // Count by pet
        if (checkin.petId) {
          stats.byPet[checkin.petId] = (stats.byPet[checkin.petId] || 0) + 1;
        }

        // Count by date
        const date = new Date(checkin.timestamp.toDate()).toDateString();
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;

        // Count by hour
        const hour = new Date(checkin.timestamp.toDate()).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;

        // Track accuracy
        if (checkin.metadata?.accuracy) {
          totalAccuracy += checkin.metadata.accuracy;
          accuracyCount++;
        }

        // Track last check-in
        if (!stats.lastCheckIn || checkin.timestamp > stats.lastCheckIn) {
          stats.lastCheckIn = checkin.timestamp;
        }
      });

      // Calculate averages
      if (accuracyCount > 0) {
        stats.averageAccuracy = totalAccuracy / accuracyCount;
      }

      return stats;
    } catch (error) {
      console.error('Error getting check-in statistics:', error);
      throw error;
    }
  }

  /**
   * Search check-ins by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of matching check-in documents
   */
  async searchCheckIns(criteria = {}) {
    try {
      let checkinsQuery = collection(this.db, 'clicks');

      // Apply filters
      if (criteria.petId) {
        if (!this.permissionMiddleware.canAccessPet(criteria.petId)) {
          throw new Error('Access denied: cannot search check-ins for this pet');
        }
        checkinsQuery = query(checkinsQuery, where('petId', '==', criteria.petId));
      }
      
      if (criteria.userId) {
        if (criteria.userId !== this.auth.currentUser?.uid && !this.permissionMiddleware.hasPermission('view_analytics')) {
          throw new Error('Access denied: cannot search check-ins for this user');
        }
        checkinsQuery = query(checkinsQuery, where('userId', '==', criteria.userId));
      }

      const checkinsSnapshot = await getDocs(checkinsQuery);
      let checkins = checkinsSnapshot.docs.map(doc => doc.data());

      // Apply additional filters that can't be done in Firestore
      if (criteria.startDate) {
        checkins = checkins.filter(checkin => 
          checkin.timestamp.toDate() >= new Date(criteria.startDate)
        );
      }

      if (criteria.endDate) {
        checkins = checkins.filter(checkin => 
          checkin.timestamp.toDate() <= new Date(criteria.endDate)
        );
      }

      if (criteria.name) {
        checkins = checkins.filter(checkin => 
          checkin.name.toLowerCase().includes(criteria.name.toLowerCase())
        );
      }

      // Sort by timestamp (newest first)
      checkins.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());

      return checkins;
    } catch (error) {
      console.error('Error searching check-ins:', error);
      throw error;
    }
  }

  /**
   * Get device information for check-in metadata
   * @returns {Object} Device information
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate check-in data
   * @param {Object} checkinData - Check-in data to validate
   * @returns {Object} Validation result
   */
  static validateCheckInData(checkinData) {
    const errors = [];

    if (!checkinData.latitude || typeof checkinData.latitude !== 'number') {
      errors.push('Valid latitude is required');
    }

    if (!checkinData.longitude || typeof checkinData.longitude !== 'number') {
      errors.push('Valid longitude is required');
    }

    if (checkinData.latitude < -90 || checkinData.latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (checkinData.longitude < -180 || checkinData.longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    if (checkinData.name && checkinData.name.length > 100) {
      errors.push('Name must be 100 characters or less');
    }

    if (checkinData.petId && !UUIDGenerator.isValidPrefixedUUID(checkinData.petId, 'pet')) {
      errors.push('Invalid pet ID format');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Get recent check-ins for a pet
   * @param {string} petId - Pet ID
   * @param {number} hours - Number of hours to look back
   * @returns {Promise<Array>} Array of recent check-in documents
   */
  async getRecentCheckIns(petId, hours = 24) {
    try {
      const checkins = await this.getPetCheckIns(petId, 100);
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return checkins.filter(checkin => 
        checkin.timestamp.toDate() >= cutoffTime
      );
    } catch (error) {
      console.error('Error getting recent check-ins:', error);
      throw error;
    }
  }

  /**
   * Get check-in map data for a pet
   * @param {string} petId - Pet ID
   * @param {number} limit - Maximum number of check-ins to return
   * @returns {Promise<Array>} Array of check-in coordinates
   */
  async getCheckInMapData(petId, limit = 100) {
    try {
      const checkins = await this.getPetCheckIns(petId, limit);
      
      return checkins.map(checkin => ({
        id: checkin.id,
        latitude: checkin.latitude,
        longitude: checkin.longitude,
        timestamp: checkin.timestamp,
        name: checkin.name,
        accuracy: checkin.metadata?.accuracy || null
      }));
    } catch (error) {
      console.error('Error getting check-in map data:', error);
      throw error;
    }
  }

  /**
   * Create a legacy check-in (for anonymous users in legacy mode)
   * @param {Object} checkinData - Check-in data
   * @returns {Promise<Object>} Created check-in document
   */
  async createLegacyCheckIn(checkinData) {
    try {
      // Generate check-in ID
      const checkinId = UUIDGenerator.generateUUID();
      
      // For legacy mode, allow anonymous check-ins
      const userId = this.auth.currentUser?.uid || 'anonymous';
      
      const checkin = {
        id: checkinId,
        petId: null, // No specific pet for legacy mode
        userId: userId,
        name: checkinData.name || 'Anonymous',
        latitude: checkinData.latitude,
        longitude: checkinData.longitude,
        timestamp: new Date(),
        recaptchaToken: checkinData.recaptchaToken || null,
        domain: checkinData.domain || window.location.hostname,
        metadata: {
          accuracy: checkinData.accuracy || null,
          altitude: checkinData.altitude || null,
          speed: checkinData.speed || null,
          heading: checkinData.heading || null,
          deviceInfo: checkinData.deviceInfo || this.getDeviceInfo(),
          weather: checkinData.weather || null,
          isLegacy: true, // Mark as legacy check-in
          ...checkinData.metadata
        }
      };

      // Create check-in document
      await setDoc(doc(this.db, 'clicks', checkinId), checkin);
      
      console.log(`Legacy check-in created successfully: ${checkinId}`);
      
      return checkin;
    } catch (error) {
      console.error('Error creating legacy check-in:', error);
      throw error;
    }
  }
}

// At the end of the file, export as ES module
export { CheckInManager }; 