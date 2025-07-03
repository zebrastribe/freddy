/**
 * Database Migration Script: Single-Pet to Multi-User, Multi-Pet System
 * 
 * This script migrates the current Freddy system to support multiple users and pets
 * while maintaining backward compatibility and data integrity.
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where,
  updateDoc,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  // Your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Migration Configuration
 */
const MIGRATION_CONFIG = {
  // Default super admin user
  SUPER_ADMIN: {
    email: 'admin@trace.com',
    displayName: 'System Administrator',
    role: 'SUPER_ADMIN',
    permissions: ['*'] // All permissions
  },
  
  // Default pet (Freddy) configuration
  DEFAULT_PET: {
    name: 'Freddy',
    type: 'cat',
    breed: 'ginger',
    status: 'active',
    isPublic: true,
    domain: 'freddy.stri.be',
    hosting: {
      provider: 'github_pages',
      baseUrl: 'https://zebrastribe.github.io/trace',
      path: '/freddy/',
      fullUrl: 'https://zebrastribe.github.io/trace/freddy/'
    },
    metadata: {
      description: 'Adventurous ginger cat with a heart as fiery as his fur!',
      personality: 'adventurous',
      color: 'ginger',
      tags: ['adventurous', 'friendly', 'ginger']
    }
  }
};

/**
 * Helper Functions
 */
async function createUser(userData) {
  const userRef = doc(db, 'users', userData.id || `user_${Date.now()}`);
  const userDoc = {
    email: userData.email,
    role: userData.role,
    permissions: userData.permissions || [],
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    profile: {
      displayName: userData.displayName,
      phone: userData.phone || '',
      preferences: {
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      }
    },
    pets: userData.pets || [],
    accessTokens: userData.accessTokens || [],
    isActive: true
  };
  
  await setDoc(userRef, userDoc);
  console.log(`✅ Created user: ${userData.displayName} (${userData.role})`);
  return { id: userRef.id, ...userDoc };
}

async function createPet(petData) {
  const petRef = doc(db, 'pets', petData.id || `pet_${Date.now()}`);
  const petDoc = {
    name: petData.name,
    type: petData.type,
    breed: petData.breed,
    ownerId: petData.ownerId,
    status: petData.status,
    isPublic: petData.isPublic,
    domain: petData.domain,
    hosting: petData.hosting,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    metadata: petData.metadata || {}
  };
  
  await setDoc(petRef, petDoc);
  console.log(`✅ Created pet: ${petData.name} (${petData.domain})`);
  return { id: petRef.id, ...petDoc };
}

async function createPetStatus(petId, statusData) {
  const statusRef = doc(db, 'pet_status', petId);
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
}

async function createDomain(domainData) {
  const domainRef = doc(db, 'domains', domainData.id || `domain_${Date.now()}`);
  const domainDoc = {
    petId: domainData.petId,
    domain: domainData.domain,
    hosting: domainData.hosting,
    dnsRecords: domainData.dnsRecords || [],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(domainRef, domainDoc);
  console.log(`✅ Created domain: ${domainData.domain}`);
  return { id: domainRef.id, ...domainDoc };
}

/**
 * Migration Functions
 */
async function migrateToMultiUserPet() {
  console.log('🚀 Starting migration to multi-user, multi-pet system...');
  
  try {
    // Step 1: Create new collections structure
    console.log('\n📋 Step 1: Creating new collections structure...');
    
    // Step 2: Create default super admin user
    console.log('\n👤 Step 2: Creating default super admin user...');
    const superAdmin = await createUser({
      id: 'super_admin_001',
      ...MIGRATION_CONFIG.SUPER_ADMIN
    });
    
    // Step 3: Create default pet (Freddy) with domain
    console.log('\n🐱 Step 3: Creating default pet (Freddy)...');
    const freddyPet = await createPet({
      id: 'pet_freddy_001',
      ownerId: superAdmin.id,
      ...MIGRATION_CONFIG.DEFAULT_PET
    });
    
    // Step 4: Set up Freddy's domain
    console.log('\n🌐 Step 4: Setting up Freddy\'s domain...');
    await createDomain({
      id: 'domain_freddy_001',
      petId: freddyPet.id,
      domain: MIGRATION_CONFIG.DEFAULT_PET.domain,
      hosting: MIGRATION_CONFIG.DEFAULT_PET.hosting,
      dnsRecords: [
        {
          type: 'CNAME',
          name: MIGRATION_CONFIG.DEFAULT_PET.domain,
          value: 'zebrastribe.github.io',
          ttl: 300
        }
      ]
    });
    
    // Step 5: Migrate existing check-ins
    console.log('\n📍 Step 5: Migrating existing check-ins...');
    const checkInsSnapshot = await getDocs(collection(db, 'clicks'));
    let migratedCheckIns = 0;
    
    for (const checkInDoc of checkInsSnapshot.docs) {
      const checkInData = checkInDoc.data();
      await updateDoc(doc(db, 'clicks', checkInDoc.id), {
        petId: freddyPet.id,
        domain: MIGRATION_CONFIG.DEFAULT_PET.domain,
        metadata: {
          ...checkInData.metadata,
          migratedAt: serverTimestamp(),
          originalData: checkInData
        }
      });
      migratedCheckIns++;
    }
    console.log(`✅ Migrated ${migratedCheckIns} check-ins`);
    
    // Step 6: Migrate freddy_status to pet_status
    console.log('\n📊 Step 6: Migrating pet status...');
    const freddyStatusSnapshot = await getDocs(collection(db, 'freddy_status'));
    
    if (!freddyStatusSnapshot.empty) {
      const freddyStatus = freddyStatusSnapshot.docs[0].data();
      await createPetStatus(freddyPet.id, {
        status: freddyStatus.mode || 'OK',
        lastSeen: freddyStatus.timestamp || serverTimestamp(),
        updatedBy: superAdmin.id
      });
    } else {
      // Create default status if none exists
      await createPetStatus(freddyPet.id, {
        status: 'OK',
        updatedBy: superAdmin.id
      });
    }
    
    // Step 7: Update super admin with pet ownership
    console.log('\n🔗 Step 7: Linking super admin to Freddy...');
    await updateDoc(doc(db, 'users', superAdmin.id), {
      pets: [freddyPet.id]
    });
    
    // Step 8: Create infrastructure configuration
    console.log('\n⚙️ Step 8: Creating infrastructure configuration...');
    const infrastructureRef = doc(db, 'infrastructure', 'hosting_config');
    await setDoc(infrastructureRef, {
      currentProvider: 'github_pages',
      providers: {
        github_pages: {
          baseUrl: 'https://zebrastribe.github.io/trace',
          deploymentMethod: 'git_push',
          configFile: '_config.yml'
        },
        firebase_hosting: {
          baseUrl: 'https://trace-pets.web.app',
          deploymentMethod: 'firebase_deploy',
          configFile: 'firebase.json'
        },
        custom: {
          baseUrl: 'https://trace.stri.be',
          deploymentMethod: 'custom',
          configFile: 'deployment.json'
        }
      },
      petPathTemplate: '/{petname}/',
      adminPath: '/admin/',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`- Super Admin: ${superAdmin.displayName} (${superAdmin.id})`);
    console.log(`- Default Pet: ${freddyPet.name} (${freddyPet.id})`);
    console.log(`- Domain: ${freddyPet.domain}`);
    console.log(`- Check-ins migrated: ${migratedCheckIns}`);
    
    return {
      success: true,
      superAdmin,
      freddyPet,
      migratedCheckIns
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback Function (for safety)
 */
async function rollbackMigration() {
  console.log('🔄 Rolling back migration...');
  
  try {
    // Delete new collections
    const collectionsToDelete = ['users', 'pets', 'pet_status', 'domains', 'infrastructure'];
    
    for (const collectionName of collectionsToDelete) {
      const snapshot = await getDocs(collection(db, collectionName));
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
      console.log(`✅ Deleted collection: ${collectionName}`);
    }
    
    // Restore original check-in data
    const checkInsSnapshot = await getDocs(collection(db, 'clicks'));
    for (const checkInDoc of checkInsSnapshot.docs) {
      const checkInData = checkInDoc.data();
      if (checkInData.metadata && checkInData.metadata.originalData) {
        await updateDoc(doc(db, 'clicks', checkInDoc.id), {
          ...checkInData.metadata.originalData,
          metadata: undefined
        });
      }
    }
    
    console.log('✅ Rollback completed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  }
}

/**
 * Validation Function
 */
async function validateMigration() {
  console.log('🔍 Validating migration...');
  
  try {
    // Check if super admin exists
    const superAdminDoc = await getDoc(doc(db, 'users', 'super_admin_001'));
    if (!superAdminDoc.exists()) {
      throw new Error('Super admin user not found');
    }
    
    // Check if Freddy pet exists
    const freddyPetDoc = await getDoc(doc(db, 'pets', 'pet_freddy_001'));
    if (!freddyPetDoc.exists()) {
      throw new Error('Freddy pet not found');
    }
    
    // Check if domain exists
    const domainDoc = await getDoc(doc(db, 'domains', 'domain_freddy_001'));
    if (!domainDoc.exists()) {
      throw new Error('Freddy domain not found');
    }
    
    // Check if pet status exists
    const petStatusDoc = await getDoc(doc(db, 'pet_status', 'pet_freddy_001'));
    if (!petStatusDoc.exists()) {
      throw new Error('Freddy pet status not found');
    }
    
    console.log('✅ Migration validation passed');
    return true;
    
  } catch (error) {
    console.error('❌ Migration validation failed:', error);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await migrateToMultiUserPet();
      break;
    case 'rollback':
      await rollbackMigration();
      break;
    case 'validate':
      await validateMigration();
      break;
    default:
      console.log('Usage: node migrate-to-multi-user-pet.js [migrate|rollback|validate]');
      console.log('\nCommands:');
      console.log('  migrate  - Run the migration');
      console.log('  rollback - Rollback the migration');
      console.log('  validate - Validate the migration');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  migrateToMultiUserPet,
  rollbackMigration,
  validateMigration
}; 