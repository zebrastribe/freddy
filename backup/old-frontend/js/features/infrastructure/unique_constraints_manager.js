/**
 * UniqueConstraintsManager - Handles global uniqueness validation
 * 
 * @class UniqueConstraintsManager
 * @description Manages unique value constraints for pet UUIDs, user IDs, and subdomain URLs
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where,
  limit 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

export class UniqueConstraintsManager {
  constructor(firebaseApp) {
    this.db = getFirestore(firebaseApp);
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if pet UUID is globally unique
   */
  async isPetUUIDUnique(petUUID) {
    try {
      // Check cache first
      const cacheKey = `pet_${petUUID}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.isUnique;
        }
        this.cache.delete(cacheKey);
      }

      // Check in unique_constraints collection
      const constraintRef = doc(this.db, 'unique_constraints', `pet_${petUUID}`);
      const constraintDoc = await getDoc(constraintRef);
      
      const isUnique = !constraintDoc.exists();
      
      // Cache result
      this.cache.set(cacheKey, {
        isUnique,
        timestamp: Date.now()
      });

      return isUnique;
    } catch (error) {
      console.error('Error checking pet UUID uniqueness:', error);
      return false;
    }
  }

  /**
   * Check if user ID is globally unique
   */
  async isUserIDUnique(userID) {
    try {
      // Check cache first
      const cacheKey = `user_${userID}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.isUnique;
        }
        this.cache.delete(cacheKey);
      }

      // Check in unique_constraints collection
      const constraintRef = doc(this.db, 'unique_constraints', `user_${userID}`);
      const constraintDoc = await getDoc(constraintRef);
      
      const isUnique = !constraintDoc.exists();
      
      // Cache result
      this.cache.set(cacheKey, {
        isUnique,
        timestamp: Date.now()
      });

      return isUnique;
    } catch (error) {
      console.error('Error checking user ID uniqueness:', error);
      return false;
    }
  }

  /**
   * Check if subdomain URL is globally unique
   */
  async isSubdomainUnique(subdomain) {
    try {
      // Check cache first
      const cacheKey = `subdomain_${subdomain}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.isUnique;
        }
        this.cache.delete(cacheKey);
      }

      // Check in unique_constraints collection
      const constraintRef = doc(this.db, 'unique_constraints', `subdomain_${subdomain}`);
      const constraintDoc = await getDoc(constraintRef);
      
      const isUnique = !constraintDoc.exists();
      
      // Cache result
      this.cache.set(cacheKey, {
        isUnique,
        timestamp: Date.now()
      });

      return isUnique;
    } catch (error) {
      console.error('Error checking subdomain uniqueness:', error);
      return false;
    }
  }

  /**
   * Reserve a pet UUID globally
   */
  async reservePetUUID(petUUID, metadata = {}) {
    try {
      const constraintRef = doc(this.db, 'unique_constraints', `pet_${petUUID}`);
      
      await setDoc(constraintRef, {
        type: 'pet_uuid',
        value: petUUID,
        reservedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          checksum: this.generateChecksum(petUUID)
        }
      });

      // Update cache
      this.cache.set(`pet_${petUUID}`, {
        isUnique: false,
        timestamp: Date.now()
      });

      console.log(`✅ Reserved pet UUID: ${petUUID}`);
      return true;
    } catch (error) {
      console.error('Error reserving pet UUID:', error);
      return false;
    }
  }

  /**
   * Reserve a user ID globally
   */
  async reserveUserID(userID, metadata = {}) {
    try {
      const constraintRef = doc(this.db, 'unique_constraints', `user_${userID}`);
      
      await setDoc(constraintRef, {
        type: 'user_id',
        value: userID,
        reservedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          checksum: this.generateChecksum(userID)
        }
      });

      // Update cache
      this.cache.set(`user_${userID}`, {
        isUnique: false,
        timestamp: Date.now()
      });

      console.log(`✅ Reserved user ID: ${userID}`);
      return true;
    } catch (error) {
      console.error('Error reserving user ID:', error);
      return false;
    }
  }

  /**
   * Reserve a subdomain globally
   */
  async reserveSubdomain(subdomain, metadata = {}) {
    try {
      const constraintRef = doc(this.db, 'unique_constraints', `subdomain_${subdomain}`);
      
      await setDoc(constraintRef, {
        type: 'subdomain',
        value: subdomain,
        reservedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          checksum: this.generateChecksum(subdomain)
        }
      });

      // Update cache
      this.cache.set(`subdomain_${subdomain}`, {
        isUnique: false,
        timestamp: Date.now()
      });

      console.log(`✅ Reserved subdomain: ${subdomain}`);
      return true;
    } catch (error) {
      console.error('Error reserving subdomain:', error);
      return false;
    }
  }

  /**
   * Release a reserved constraint
   */
  async releaseConstraint(type, value) {
    try {
      const constraintRef = doc(this.db, 'unique_constraints', `${type}_${value}`);
      await deleteDoc(constraintRef);

      // Update cache
      this.cache.set(`${type}_${value}`, {
        isUnique: true,
        timestamp: Date.now()
      });

      console.log(`✅ Released constraint: ${type}_${value}`);
      return true;
    } catch (error) {
      console.error('Error releasing constraint:', error);
      return false;
    }
  }

  /**
   * Handle collision by generating alternative value
   */
  async handleCollision(type, originalValue, generator) {
    let attempts = 0;
    const maxAttempts = 10;
    let newValue = originalValue;

    while (attempts < maxAttempts) {
      attempts++;
      newValue = generator(originalValue, attempts);
      
      let isUnique = false;
      switch (type) {
        case 'pet_uuid':
          isUnique = await this.isPetUUIDUnique(newValue);
          break;
        case 'user_id':
          isUnique = await this.isUserIDUnique(newValue);
          break;
        case 'subdomain':
          isUnique = await this.isSubdomainUnique(newValue);
          break;
      }

      if (isUnique) {
        console.log(`✅ Generated unique ${type} after ${attempts} attempts: ${newValue}`);
        return newValue;
      }
    }

    throw new Error(`Failed to generate unique ${type} after ${maxAttempts} attempts`);
  }

  /**
   * Generate checksum for validation
   */
  generateChecksum(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  /**
   * Validate constraint with checksum
   */
  validateConstraint(constraint) {
    if (!constraint.metadata || !constraint.metadata.checksum) {
      return false;
    }

    const expectedChecksum = this.generateChecksum(constraint.value);
    return constraint.metadata.checksum === expectedChecksum;
  }

  /**
   * Get all constraints of a specific type
   */
  async getConstraintsByType(type) {
    try {
      const constraintsRef = collection(this.db, 'unique_constraints');
      const q = query(constraintsRef, where('type', '==', type));
      const querySnapshot = await getDocs(q);
      
      const constraints = [];
      querySnapshot.forEach((doc) => {
        constraints.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return constraints;
    } catch (error) {
      console.error('Error getting constraints by type:', error);
      return [];
    }
  }

  /**
   * Monitor constraint usage
   */
  async getConstraintStats() {
    try {
      const stats = {
        pet_uuids: 0,
        user_ids: 0,
        subdomains: 0,
        total: 0
      };

      const constraintsRef = collection(this.db, 'unique_constraints');
      const querySnapshot = await getDocs(constraintsRef);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.total++;
        
        switch (data.type) {
          case 'pet_uuid':
            stats.pet_uuids++;
            break;
          case 'user_id':
            stats.user_ids++;
            break;
          case 'subdomain':
            stats.subdomains++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting constraint stats:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('✅ Cleared constraints cache');
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
} 