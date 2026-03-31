/**
 * Database Setup Script: Multi-User, Multi-Pet Collections
 * 
 * This script sets up the new database collections and migrates existing data
 * from the single-pet system to the multi-user, multi-pet architecture.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc,
  writeBatch,
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { firebaseConfig } from './firebase_config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Setup Configuration
 */
const SETUP_CONFIG = {
  // Default super admin user
  superAdmin: {
    email: 'admin@trace.com',
    displayName: 'System Administrator',
    role: 'SUPER_ADMIN'
  },
  
  // Freddy pet configuration (migrated from current system)
  freddyPet: {
    name: 'Freddy',
    type: 'cat',
    breed: 'ginger',
    status: 'active',
    isPublic: true,
    domain: 'freddy.stri.be',
    metadata: {
      description: 'Adventurous ginger cat with a heart as fiery as his fur!',
      personality: 'adventurous',
      color: 'ginger',
      birthDate: '2020-01-01'
    }
  }
};

/**
 * Main setup function
 */
async function setupDatabaseCollections() {
  console.log('🚀 Setting up multi-user, multi-pet database collections...');
  
  try {
    // Step 1: Create super admin user
    const superAdmin = await createSuperAdmin();
    console.log('✅ Super admin created:', superAdmin.id);
    
    // Step 2: Create Freddy pet
    const freddyPet = await createFreddyPet(superAdmin.id);
    console.log('✅ Freddy pet created:', freddyPet.id);
    
    // Step 3: Migrate existing check-ins
    const checkInCount = await migrateCheckIns(freddyPet.id);
    console.log(`✅ Migrated ${checkInCount} check-ins`);
    
    // Step 4: Migrate Freddy status
    await migrateFreddyStatus(freddyPet.id);
    console.log('✅ Freddy status migrated');
    
    // Step 5: Migrate FCM tokens
    const fcmCount = await migrateFCMTokens();
    console.log(`✅ Migrated ${fcmCount} FCM tokens`);
    
    // Step 6: Migrate access tokens
    const tokenCount = await migrateAccessTokens(freddyPet.id);
    console.log(`✅ Migrated ${tokenCount} access tokens`);
    
    // Step 7: Create domain record for Freddy
    await createFreddyDomain(freddyPet);
    console.log('✅ Freddy domain record created');
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log(`• Super Admin: ${superAdmin.id}`);
    console.log(`• Freddy Pet: ${freddyPet.id}`);
    console.log(`• Check-ins: ${checkInCount}`);
    console.log(`• FCM Tokens: ${fcmCount}`);
    console.log(`• Access Tokens: ${tokenCount}`);
    
    return {
      success: true,
      superAdmin,
      freddyPet,
      stats: {
        checkIns: checkInCount,
        fcmTokens: fcmCount,
        accessTokens: tokenCount
      }
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

/**
 * Create super admin user
 */
async function createSuperAdmin() {
  const superAdminId = `user_${Date.now()}_super_admin`;
  const superAdminData = {
    id: superAdminId,
    email: SETUP_CONFIG.superAdmin.email,
    role: SETUP_CONFIG.superAdmin.role,
    permissions: ['*'], // All permissions
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    profile: {
      displayName: SETUP_CONFIG.superAdmin.displayName,
      phone: '',
      preferences: {
        notifications: true,
        language: 'en',
        timezone: 'UTC'
      }
    },
    pets: [], // Will be populated when Freddy is created
    accessTokens: [],
    isActive: true
  };
  
  await setDoc(doc(db, 'users', superAdminId), superAdminData);
  return { id: superAdminId, ...superAdminData };
}

/**
 * Create Freddy pet
 */
async function createFreddyPet(ownerId) {
  const freddyId = `pet_${Date.now()}_freddy`;
  const freddyData = {
    id: freddyId,
    name: SETUP_CONFIG.freddyPet.name,
    type: SETUP_CONFIG.freddyPet.type,
    breed: SETUP_CONFIG.freddyPet.breed,
    ownerId: ownerId,
    status: SETUP_CONFIG.freddyPet.status,
    isPublic: SETUP_CONFIG.freddyPet.isPublic,
    domain: SETUP_CONFIG.freddyPet.domain,
    hosting: {
      provider: 'github_pages',
      baseUrl: 'https://zebrastribe.github.io/trace',
      path: '/freddy/',
      fullUrl: 'https://zebrastribe.github.io/trace/freddy/'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    metadata: SETUP_CONFIG.freddyPet.metadata
  };
  
  await setDoc(doc(db, 'pets', freddyId), freddyData);
  
  // Update super admin's pets array
  await updateDoc(doc(db, 'users', ownerId), {
    pets: [freddyId]
  });
  
  return { id: freddyId, ...freddyData };
}

/**
 * Migrate existing check-ins to include petId
 */
async function migrateCheckIns(freddyPetId) {
  const oldClicksQuery = query(collection(db, 'clicks'));
  const oldClicksSnapshot = await getDocs(oldClicksQuery);
  
  let count = 0;
  const batch = writeBatch(db);
  
  oldClicksSnapshot.forEach(docSnapshot => {
    const oldData = docSnapshot.data();
    const newData = {
      ...oldData,
      petId: freddyPetId,
      domain: SETUP_CONFIG.freddyPet.domain,
      metadata: {
        accuracy: oldData.accuracy || null,
        altitude: oldData.altitude || null,
        speed: oldData.speed || null,
        heading: oldData.heading || null,
        deviceInfo: oldData.deviceInfo || {},
        weather: oldData.weather || {}
      }
    };
    
    // Update the existing document
    batch.update(docSnapshot.ref, newData);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
  }
  
  return count;
}

/**
 * Migrate Freddy status to new pet_status collection
 */
async function migrateFreddyStatus(freddyPetId) {
  const oldStatusQuery = query(collection(db, 'freddy_status'));
  const oldStatusSnapshot = await getDocs(oldStatusQuery);
  
  if (!oldStatusSnapshot.empty) {
    const oldStatus = oldStatusSnapshot.docs[0].data();
    const newStatusData = {
      petId: freddyPetId,
      status: oldStatus.mode || 'OK',
      lastSeen: oldStatus.lastSeen || serverTimestamp(),
      lastLocation: oldStatus.lastLocation || null,
      updatedAt: serverTimestamp(),
      updatedBy: 'setup_script'
    };
    
    await setDoc(doc(db, 'pet_status', freddyPetId), newStatusData);
  } else {
    // Create default status if none exists
    const defaultStatus = {
      petId: freddyPetId,
      status: 'OK',
      lastSeen: serverTimestamp(),
      lastLocation: null,
      updatedAt: serverTimestamp(),
      updatedBy: 'setup_script'
    };
    
    await setDoc(doc(db, 'pet_status', freddyPetId), defaultStatus);
  }
}

/**
 * Migrate FCM tokens to include userId
 */
async function migrateFCMTokens() {
  const oldFCMQuery = query(collection(db, 'fcm_tokens'));
  const oldFCMSnapshot = await getDocs(oldFCMQuery);
  
  let count = 0;
  const batch = writeBatch(db);
  
  oldFCMSnapshot.forEach(docSnapshot => {
    const oldData = docSnapshot.data();
    const newData = {
      ...oldData,
      userId: null, // Anonymous users
      createdAt: oldData.createdAt || serverTimestamp(),
      lastUsed: oldData.lastUsed || serverTimestamp(),
      trackedPets: [] // Will be populated if needed
    };
    
    batch.update(docSnapshot.ref, newData);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
  }
  
  return count;
}

/**
 * Migrate access tokens to include petId
 */
async function migrateAccessTokens(freddyPetId) {
  const oldTokensQuery = query(collection(db, 'tokens'));
  const oldTokensSnapshot = await getDocs(oldTokensQuery);
  
  let count = 0;
  const batch = writeBatch(db);
  
  oldTokensSnapshot.forEach(docSnapshot => {
    const oldData = docSnapshot.data();
    const newData = {
      ...oldData,
      petId: freddyPetId,
      domain: SETUP_CONFIG.freddyPet.domain,
      createdAt: oldData.createdAt || serverTimestamp(),
      usedAt: oldData.usedAt || null
    };
    
    batch.update(docSnapshot.ref, newData);
    count++;
  });
  
  if (count > 0) {
    await batch.commit();
  }
  
  return count;
}

/**
 * Create domain record for Freddy
 */
async function createFreddyDomain(freddyPet) {
  const domainData = {
    petId: freddyPet.id,
    domain: freddyPet.domain,
    hosting: freddyPet.hosting,
    dnsRecords: [
      {
        type: 'CNAME',
        name: freddyPet.domain,
        value: 'zebrastribe.github.io',
        ttl: 300
      }
    ],
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(doc(db, 'domains', freddyPet.id), domainData);
}

/**
 * Validate setup
 */
async function validateSetup() {
  console.log('🔍 Validating database setup...');
  
  const validation = {
    superAdmin: false,
    freddyPet: false,
    checkIns: 0,
    petStatus: false,
    domain: false
  };
  
  // Check super admin
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const superAdmin = usersSnapshot.docs.find(doc => doc.data().role === 'SUPER_ADMIN');
  validation.superAdmin = !!superAdmin;
  
  if (superAdmin) {
    // Check Freddy pet
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    const freddyPet = petsSnapshot.docs.find(doc => doc.data().name === 'Freddy');
    validation.freddyPet = !!freddyPet;
    
    if (freddyPet) {
      // Debug: Check all check-ins
      const allCheckInsSnapshot = await getDocs(collection(db, 'clicks'));
      console.log(`📊 Total check-ins in database: ${allCheckInsSnapshot.size}`);
      
      if (allCheckInsSnapshot.size > 0) {
        console.log('📋 Sample check-in data:');
        const sampleCheckIn = allCheckInsSnapshot.docs[0].data();
        console.log('   - Has petId:', !!sampleCheckIn.petId);
        console.log('   - petId value:', sampleCheckIn.petId);
        console.log('   - Expected petId:', freddyPet.id);
      }
      
      // Check check-ins with petId
      const checkInsQuery = query(collection(db, 'clicks'), where('petId', '==', freddyPet.id));
      const checkInsSnapshot = await getDocs(checkInsQuery);
      validation.checkIns = checkInsSnapshot.size;
      
      // Check pet status
      const petStatusDoc = await getDoc(doc(db, 'pet_status', freddyPet.id));
      validation.petStatus = petStatusDoc.exists();
      
      // Check domain
      const domainDoc = await getDoc(doc(db, 'domains', freddyPet.id));
      validation.domain = domainDoc.exists();
    }
  }
  
  console.log('📊 Validation Results:', validation);
  return validation;
}

// Export main functions for use in other modules
export {
  setupDatabaseCollections,
  validateSetup,
  migrateCheckIns
};

// Run setup if this script is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  setupDatabaseCollections()
    .then(result => {
      console.log('Setup completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
} 