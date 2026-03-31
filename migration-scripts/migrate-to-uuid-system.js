/**
 * Migration Script: Convert to UUID System
 * 
 * This script migrates the existing pet and user data to use the new UUID system
 * while maintaining backward compatibility.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore, collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { PetUUIDManager } from '../js/features/pets/pet_uuid_manager.js';
import { UserUUIDManager } from '../js/features/users/user_uuid_manager.js';
import { UniqueConstraintsManager } from '../js/features/infrastructure/unique_constraints_manager.js';

class UUIDMigration {
  constructor(firebaseApp) {
    this.db = getFirestore(firebaseApp);
    this.petUUIDManager = new PetUUIDManager();
    this.userUUIDManager = new UserUUIDManager();
    this.uniqueConstraintsManager = new UniqueConstraintsManager(firebaseApp);
    
    this.migrationLog = [];
    this.errors = [];
  }

  /**
   * Run the complete migration
   */
  async runMigration() {
    console.log('🚀 Starting UUID Migration...');
    
    try {
      // Step 1: Migrate users
      await this.migrateUsers();
      
      // Step 2: Migrate pets
      await this.migratePets();
      
      // Step 3: Migrate check-ins
      await this.migrateCheckIns();
      
      // Step 4: Migrate pet status
      await this.migratePetStatus();
      
      // Step 5: Create unique constraints
      await this.createUniqueConstraints();
      
      console.log('✅ Migration completed successfully');
      this.printMigrationReport();
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.errors.push(error);
      this.printMigrationReport();
    }
  }

  /**
   * Migrate users to UUID system
   */
  async migrateUsers() {
    console.log('📝 Migrating users...');
    
    const usersRef = collection(this.db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      try {
        // Check if user already has UUID format
        if (this.userUUIDManager.isValidUserID(userId)) {
          console.log(`⏭️ User ${userId} already has UUID format`);
          continue;
        }
        
        // Generate new UUID for user
        const newUserId = this.userUUIDManager.generateUserID(userData.username || userData.email);
        
        // Create new user document with UUID
        await setDoc(doc(this.db, 'users', newUserId), {
          ...userData,
          legacyId: userId,
          migratedAt: new Date(),
          uuid: newUserId
        });
        
        // Update references in other collections
        await this.updateUserReferences(userId, newUserId);
        
        // Mark old document as migrated
        await updateDoc(doc(this.db, 'users', userId), {
          migratedTo: newUserId,
          migratedAt: new Date(),
          isLegacy: true
        });
        
        this.migrationLog.push({
          type: 'user',
          oldId: userId,
          newId: newUserId,
          status: 'success'
        });
        
        console.log(`✅ Migrated user ${userId} → ${newUserId}`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate user ${userId}:`, error);
        this.errors.push({
          type: 'user',
          id: userId,
          error: error.message
        });
      }
    }
  }

  /**
   * Migrate pets to UUID system
   */
  async migratePets() {
    console.log('🐾 Migrating pets...');
    
    const petsRef = collection(this.db, 'pets');
    const petsSnapshot = await getDocs(petsRef);
    
    for (const petDoc of petsSnapshot.docs) {
      const petData = petDoc.data();
      const petId = petDoc.id;
      
      try {
        // Check if pet already has UUID format
        if (this.petUUIDManager.isValidPetUUID(petId)) {
          console.log(`⏭️ Pet ${petId} already has UUID format`);
          continue;
        }
        
        // Generate new UUID for pet
        const newPetId = this.petUUIDManager.generatePetUUID(petData.ownerId, petData.name);
        
        // Create new pet document with UUID
        await setDoc(doc(this.db, 'pets', newPetId), {
          ...petData,
          legacyId: petId,
          migratedAt: new Date(),
          uuid: newPetId
        });
        
        // Update references in other collections
        await this.updatePetReferences(petId, newPetId);
        
        // Mark old document as migrated
        await updateDoc(doc(this.db, 'pets', petId), {
          migratedTo: newPetId,
          migratedAt: new Date(),
          isLegacy: true
        });
        
        this.migrationLog.push({
          type: 'pet',
          oldId: petId,
          newId: newPetId,
          status: 'success'
        });
        
        console.log(`✅ Migrated pet ${petId} → ${newPetId}`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate pet ${petId}:`, error);
        this.errors.push({
          type: 'pet',
          id: petId,
          error: error.message
        });
      }
    }
  }

  /**
   * Migrate check-ins to use new pet UUIDs
   */
  async migrateCheckIns() {
    console.log('📍 Migrating check-ins...');
    
    const checkInsRef = collection(this.db, 'clicks');
    const checkInsSnapshot = await getDocs(checkInsRef);
    
    for (const checkInDoc of checkInsSnapshot.docs) {
      const checkInData = checkInDoc.data();
      const checkInId = checkInDoc.id;
      
      try {
        // If check-in has a petId, update it to new UUID
        if (checkInData.petId) {
          // Get the new pet UUID from migration mapping
          const newPetId = await this.getNewPetId(checkInData.petId);
          
          if (newPetId) {
            await updateDoc(doc(this.db, 'clicks', checkInId), {
              petId: newPetId,
              legacyPetId: checkInData.petId,
              migratedAt: new Date()
            });
            
            console.log(`✅ Updated check-in ${checkInId} pet reference: ${checkInData.petId} → ${newPetId}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Failed to migrate check-in ${checkInId}:`, error);
        this.errors.push({
          type: 'checkin',
          id: checkInId,
          error: error.message
        });
      }
    }
  }

  /**
   * Migrate pet status to use new pet UUIDs
   */
  async migratePetStatus() {
    console.log('📊 Migrating pet status...');
    
    const petStatusRef = collection(this.db, 'pet_status');
    const petStatusSnapshot = await getDocs(petStatusRef);
    
    for (const statusDoc of petStatusSnapshot.docs) {
      const statusData = statusDoc.data();
      const statusId = statusDoc.id;
      
      try {
        // Get the new pet UUID from migration mapping
        const newPetId = await this.getNewPetId(statusId);
        
        if (newPetId) {
          // Create new status document with new pet UUID
          await setDoc(doc(this.db, 'pet_status', newPetId), {
            ...statusData,
            legacyPetId: statusId,
            migratedAt: new Date()
          });
          
          // Mark old document as migrated
          await updateDoc(doc(this.db, 'pet_status', statusId), {
            migratedTo: newPetId,
            migratedAt: new Date(),
            isLegacy: true
          });
          
          console.log(`✅ Migrated pet status ${statusId} → ${newPetId}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to migrate pet status ${statusId}:`, error);
        this.errors.push({
          type: 'pet_status',
          id: statusId,
          error: error.message
        });
      }
    }
  }

  /**
   * Create unique constraints for all UUIDs
   */
  async createUniqueConstraints() {
    console.log('🔒 Creating unique constraints...');
    
    // Get all users and pets
    const usersRef = collection(this.db, 'users');
    const petsRef = collection(this.db, 'pets');
    
    const usersSnapshot = await getDocs(usersRef);
    const petsSnapshot = await getDocs(petsRef);
    
    // Create constraints for users
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.uuid) {
        await this.uniqueConstraintsManager.reserveUserID(userData.uuid, {
          username: userData.username || userData.email,
          migrated: true
        });
      }
    }
    
    // Create constraints for pets
    for (const petDoc of petsSnapshot.docs) {
      const petData = petDoc.data();
      if (petData.uuid) {
        await this.uniqueConstraintsManager.reservePetUUID(petData.uuid, {
          petName: petData.name,
          userId: petData.ownerId,
          migrated: true
        });
      }
    }
    
    console.log('✅ Unique constraints created');
  }

  /**
   * Update user references in other collections
   */
  async updateUserReferences(oldUserId, newUserId) {
    // Update pets owned by this user
    const petsRef = collection(this.db, 'pets');
    const petsSnapshot = await getDocs(petsRef);
    
    for (const petDoc of petsSnapshot.docs) {
      const petData = petDoc.data();
      if (petData.ownerId === oldUserId) {
        await updateDoc(doc(this.db, 'pets', petDoc.id), {
          ownerId: newUserId,
          legacyOwnerId: oldUserId
        });
      }
    }
  }

  /**
   * Update pet references in other collections
   */
  async updatePetReferences(oldPetId, newPetId) {
    // This is handled in migrateCheckIns and migratePetStatus
    // Additional collections can be added here if needed
  }

  /**
   * Get new pet ID from migration mapping
   */
  async getNewPetId(oldPetId) {
    try {
      const petDoc = await getDocs(doc(this.db, 'pets', oldPetId));
      if (petDoc.exists()) {
        const petData = petDoc.data();
        return petData.migratedTo || petData.uuid;
      }
    } catch (error) {
      console.error(`Error getting new pet ID for ${oldPetId}:`, error);
    }
    return null;
  }

  /**
   * Print migration report
   */
  printMigrationReport() {
    console.log('\n📋 Migration Report');
    console.log('==================');
    
    const successCount = this.migrationLog.filter(log => log.status === 'success').length;
    const errorCount = this.errors.length;
    
    console.log(`✅ Successful migrations: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`  - ${error.type} ${error.id}: ${error.error}`);
      });
    }
    
    console.log('\n📝 Migration Log:');
    this.migrationLog.forEach(log => {
      console.log(`  - ${log.type}: ${log.oldId} → ${log.newId} (${log.status})`);
    });
  }
}

// Export for use in other scripts
export { UUIDMigration };

// If run directly, execute migration
if (typeof window !== 'undefined') {
  // Browser environment
  window.UUIDMigration = UUIDMigration;
} else {
  // Node.js environment
  console.log('UUID Migration script loaded');
} 