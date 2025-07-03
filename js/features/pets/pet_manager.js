/**
 * Pet Manager for Multi-User, Multi-Pet System
 * 
 * @class PetManager
 * @description Manages pet CRUD operations, status, and domain management
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore';

export class PetManager {
  constructor(firebaseApp) {
    this.db = getFirestore(firebaseApp);
  }

  /**
   * Create a new pet
   */
  async createPet(petData, ownerId) {
    try {
      const petId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const petRef = doc(this.db, 'pets', petId);
      
      const petDoc = {
        id: petId,
        name: petData.name,
        type: petData.type || 'unknown',
        breed: petData.breed || '',
        ownerId: ownerId,
        status: petData.status || 'active',
        isPublic: petData.isPublic !== undefined ? petData.isPublic : true,
        domain: petData.domain || `${petData.name.toLowerCase()}.stri.be`,
        hosting: petData.hosting || {
          provider: 'github_pages',
          baseUrl: 'https://zebrastribe.github.io/trace',
          path: `/${petData.name.toLowerCase()}/`,
          fullUrl: `https://zebrastribe.github.io/trace/${petData.name.toLowerCase()}/`
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          description: petData.description || '',
          birthDate: petData.birthDate || '',
          microchipId: petData.microchipId || '',
          photoUrl: petData.photoUrl || '',
          color: petData.color || '',
          personality: petData.personality || '',
          tags: petData.tags || [],
          ...petData.metadata
        }
      };

      await setDoc(petRef, petDoc);
      
      // Create pet status
      await this.createPetStatus(petId, {
        status: 'OK',
        updatedBy: ownerId
      });

      console.log(`✅ Created pet: ${petData.name} (${petId})`);
      return { id: petId, ...petDoc };
    } catch (error) {
      console.error('❌ Failed to create pet:', error);
      throw error;
    }
  }

  /**
   * Get pet by ID
   */
  async getPet(petId) {
    try {
      const petDoc = await getDoc(doc(this.db, 'pets', petId));
      
      if (petDoc.exists()) {
        return { id: petDoc.id, ...petDoc.data() };
      } else {
        throw new Error(`Pet not found: ${petId}`);
      }
    } catch (error) {
      console.error('❌ Failed to get pet:', error);
      throw error;
    }
  }

  /**
   * Update pet
   */
  async updatePet(petId, updates) {
    try {
      const petRef = doc(this.db, 'pets', petId);
      
      await updateDoc(petRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Updated pet: ${petId}`);
      return await this.getPet(petId);
    } catch (error) {
      console.error('❌ Failed to update pet:', error);
      throw error;
    }
  }

  /**
   * Delete pet
   */
  async deletePet(petId) {
    try {
      // Delete pet status
      await deleteDoc(doc(this.db, 'pet_status', petId));
      
      // Delete pet
      await deleteDoc(doc(this.db, 'pets', petId));
      
      console.log(`✅ Deleted pet: ${petId}`);
    } catch (error) {
      console.error('❌ Failed to delete pet:', error);
      throw error;
    }
  }

  /**
   * Get all pets (with optional filtering)
   */
  async getAllPets(filters = {}) {
    try {
      let petsQuery = collection(this.db, 'pets');
      
      // Apply filters
      if (filters.ownerId) {
        petsQuery = query(petsQuery, where('ownerId', '==', filters.ownerId));
      }
      
      if (filters.status) {
        petsQuery = query(petsQuery, where('status', '==', filters.status));
      }
      
      if (filters.isPublic !== undefined) {
        petsQuery = query(petsQuery, where('isPublic', '==', filters.isPublic));
      }
      
      if (filters.type) {
        petsQuery = query(petsQuery, where('type', '==', filters.type));
      }
      
      // Order by creation date
      petsQuery = query(petsQuery, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(petsQuery);
      const pets = [];
      
      snapshot.forEach(doc => {
        pets.push({ id: doc.id, ...doc.data() });
      });
      
      return pets;
    } catch (error) {
      console.error('❌ Failed to get pets:', error);
      throw error;
    }
  }

  /**
   * Get pets by owner
   */
  async getPetsByOwner(ownerId) {
    return await this.getAllPets({ ownerId });
  }

  /**
   * Get public pets
   */
  async getPublicPets() {
    return await this.getAllPets({ isPublic: true });
  }

  /**
   * Search pets by name
   */
  async searchPets(searchTerm) {
    try {
      const pets = await this.getAllPets();
      return pets.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pet.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('❌ Failed to search pets:', error);
      throw error;
    }
  }

  /**
   * Create pet status
   */
  async createPetStatus(petId, statusData) {
    try {
      const statusRef = doc(this.db, 'pet_status', petId);
      const statusDoc = {
        petId: petId,
        status: statusData.status || 'OK',
        lastSeen: statusData.lastSeen || serverTimestamp(),
        lastLocation: statusData.lastLocation || null,
        updatedAt: serverTimestamp(),
        updatedBy: statusData.updatedBy || 'system'
      };
      
      await setDoc(statusRef, statusDoc);
      console.log(`✅ Created pet status for: ${petId}`);
      return { id: statusRef.id, ...statusDoc };
    } catch (error) {
      console.error('❌ Failed to create pet status:', error);
      throw error;
    }
  }

  /**
   * Update pet status
   */
  async updatePetStatus(petId, statusData) {
    try {
      const statusRef = doc(this.db, 'pet_status', petId);
      
      await updateDoc(statusRef, {
        ...statusData,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Updated pet status for: ${petId}`);
      return await this.getPetStatus(petId);
    } catch (error) {
      console.error('❌ Failed to update pet status:', error);
      throw error;
    }
  }

  /**
   * Get pet status
   */
  async getPetStatus(petId) {
    try {
      const statusDoc = await getDoc(doc(this.db, 'pet_status', petId));
      
      if (statusDoc.exists()) {
        return { id: statusDoc.id, ...statusDoc.data() };
      } else {
        // Create default status if none exists
        return await this.createPetStatus(petId, {
          status: 'OK',
          updatedBy: 'system'
        });
      }
    } catch (error) {
      console.error('❌ Failed to get pet status:', error);
      throw error;
    }
  }

  /**
   * Mark pet as missing
   */
  async markPetAsMissing(petId, location = null, updatedBy = 'system') {
    try {
      await this.updatePetStatus(petId, {
        status: 'MISSING',
        lastLocation: location,
        updatedBy: updatedBy
      });

      await this.updatePet(petId, {
        status: 'missing'
      });

      console.log(`⚠️ Marked pet as missing: ${petId}`);
    } catch (error) {
      console.error('❌ Failed to mark pet as missing:', error);
      throw error;
    }
  }

  /**
   * Mark pet as found
   */
  async markPetAsFound(petId, location = null, updatedBy = 'system') {
    try {
      await this.updatePetStatus(petId, {
        status: 'OK',
        lastSeen: serverTimestamp(),
        lastLocation: location,
        updatedBy: updatedBy
      });

      await this.updatePet(petId, {
        status: 'active'
      });

      console.log(`✅ Marked pet as found: ${petId}`);
    } catch (error) {
      console.error('❌ Failed to mark pet as found:', error);
      throw error;
    }
  }

  /**
   * Get pets by status
   */
  async getPetsByStatus(status) {
    return await this.getAllPets({ status });
  }

  /**
   * Get missing pets
   */
  async getMissingPets() {
    return await this.getAllPets({ status: 'missing' });
  }

  /**
   * Get active pets
   */
  async getActivePets() {
    return await this.getAllPets({ status: 'active' });
  }

  /**
   * Update pet location
   */
  async updatePetLocation(petId, location, updatedBy = 'system') {
    try {
      await this.updatePetStatus(petId, {
        lastSeen: serverTimestamp(),
        lastLocation: location,
        updatedBy: updatedBy
      });

      console.log(`📍 Updated pet location: ${petId}`);
    } catch (error) {
      console.error('❌ Failed to update pet location:', error);
      throw error;
    }
  }

  /**
   * Get pet analytics
   */
  async getPetAnalytics(petId) {
    try {
      const pet = await this.getPet(petId);
      const status = await this.getPetStatus(petId);
      
      // Get check-ins for this pet
      const checkInsQuery = query(
        collection(this.db, 'clicks'),
        where('petId', '==', petId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      
      const checkInsSnapshot = await getDocs(checkInsQuery);
      const checkIns = [];
      
      checkInsSnapshot.forEach(doc => {
        checkIns.push({ id: doc.id, ...doc.data() });
      });

      return {
        pet: pet,
        status: status,
        totalCheckIns: checkIns.length,
        lastCheckIn: checkIns.length > 0 ? checkIns[0] : null,
        checkIns: checkIns,
        analytics: {
          daysSinceLastSeen: status.lastSeen ? 
            Math.floor((Date.now() - status.lastSeen.toDate()) / (1000 * 60 * 60 * 24)) : 
            null,
          isMissing: status.status === 'MISSING',
          isActive: pet.status === 'active'
        }
      };
    } catch (error) {
      console.error('❌ Failed to get pet analytics:', error);
      throw error;
    }
  }

  /**
   * Validate pet data
   */
  validatePetData(petData) {
    const errors = [];
    
    if (!petData.name || petData.name.trim() === '') {
      errors.push('Pet name is required');
    }
    
    if (petData.name && petData.name.length > 50) {
      errors.push('Pet name must be less than 50 characters');
    }
    
    if (petData.domain && !this.isValidDomain(petData.domain)) {
      errors.push('Invalid domain format');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Validate domain format
   */
  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  /**
   * Generate unique domain name
   */
  async generateUniqueDomain(petName) {
    const baseDomain = `${petName.toLowerCase().replace(/[^a-z0-9]/g, '')}.stri.be`;
    
    // Check if domain already exists
    const existingPets = await this.getAllPets();
    const existingDomains = existingPets.map(pet => pet.domain);
    
    if (!existingDomains.includes(baseDomain)) {
      return baseDomain;
    }
    
    // Generate unique domain with number suffix
    let counter = 1;
    let uniqueDomain = baseDomain;
    
    while (existingDomains.includes(uniqueDomain)) {
      uniqueDomain = `${petName.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}.stri.be`;
      counter++;
    }
    
    return uniqueDomain;
  }

  /**
   * Get pet statistics
   */
  async getPetStatistics() {
    try {
      const allPets = await this.getAllPets();
      
      const stats = {
        total: allPets.length,
        byStatus: {
          active: allPets.filter(pet => pet.status === 'active').length,
          missing: allPets.filter(pet => pet.status === 'missing').length,
          inactive: allPets.filter(pet => pet.status === 'inactive').length
        },
        byType: {},
        public: allPets.filter(pet => pet.isPublic).length,
        private: allPets.filter(pet => !pet.isPublic).length
      };
      
      // Count by type
      allPets.forEach(pet => {
        const type = pet.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('❌ Failed to get pet statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
let petManagerInstance = null;

export function getPetManager(firebaseApp) {
  if (!petManagerInstance) {
    petManagerInstance = new PetManager(firebaseApp);
  }
  return petManagerInstance;
}

export default PetManager; 