/**
 * Database Setup Script for Multi-User, Multi-Pet System
 * 
 * This script creates the necessary test data in the Firebase emulator
 * to restore the missing pet and heartbeat data.
 */

const { initializeApp } = require('firebase/app');
const { 
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
} = require('firebase/firestore');

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

/**
 * Setup Configuration
 */
const SETUP_CONFIG = {
  // Test user
  testUser: {
    uid: 'S8dZFyzNdNYON5OcKcA59XrizZu2',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'USER'
  },
  
  // Freddy pet configuration
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
async function setupDatabase() {
  console.log('🚀 Setting up database with test data...');
  
  try {
    // Step 1: Create test user
    const testUser = await createTestUser();
    console.log('✅ Test user created:', testUser.id);
    
    // Step 2: Create Freddy pet
    const freddyPet = await createFreddyPet(testUser.id);
    console.log('✅ Freddy pet created:', freddyPet.id);
    
    // Step 3: Create some test heartbeats
    const heartbeatCount = await createTestHeartbeats(freddyPet.id);
    console.log(`✅ Created ${heartbeatCount} test heartbeats`);
    
    // Step 4: Create some test check-ins
    const checkInCount = await createTestCheckIns(freddyPet.id);
    console.log(`✅ Created ${checkInCount} test check-ins`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📊 Setup Summary:');
    console.log(`• Test User: ${testUser.id}`);
    console.log(`• Freddy Pet: ${freddyPet.id}`);
    console.log(`• Heartbeats: ${heartbeatCount}`);
    console.log(`• Check-ins: ${checkInCount}`);
    
    return {
      success: true,
      testUser,
      freddyPet,
      stats: {
        heartbeats: heartbeatCount,
        checkIns: checkInCount
      }
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

/**
 * Create test user
 */
async function createTestUser() {
  const userId = SETUP_CONFIG.testUser.uid;
  const userData = {
    id: userId,
    email: SETUP_CONFIG.testUser.email,
    role: SETUP_CONFIG.testUser.role,
    permissions: ['read', 'write'],
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    profile: {
      displayName: SETUP_CONFIG.testUser.displayName,
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
  
  await setDoc(doc(db, 'users', userId), userData);
  return { id: userId, ...userData };
}

/**
 * Create Freddy pet
 */
async function createFreddyPet(ownerId) {
  const freddyId = `pet_142b268c-b46c-4ab5-8ea7-b1fdbf6ad2f6_${ownerId}_freddy_1751637183`;
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
  
  // Update user's pets array
  await updateDoc(doc(db, 'users', ownerId), {
    pets: [freddyId]
  });
  
  return { id: freddyId, ...freddyData };
}

/**
 * Create test heartbeats
 */
async function createTestHeartbeats(petId) {
  const batch = writeBatch(db);
  const count = 5;
  
  for (let i = 0; i < count; i++) {
    const heartbeatId = `heartbeat_${Date.now()}_${i}`;
    const heartbeatData = {
      id: heartbeatId,
      petId: petId,
      timestamp: serverTimestamp(),
      status: 'active',
      location: {
        latitude: 55.6761 + (Math.random() - 0.5) * 0.01,
        longitude: 12.5683 + (Math.random() - 0.5) * 0.01,
        accuracy: Math.random() * 10
      },
      metadata: {
        battery: Math.floor(Math.random() * 100),
        signal: Math.floor(Math.random() * 5) + 1
      }
    };
    
    batch.set(doc(db, 'heartbeats', heartbeatId), heartbeatData);
  }
  
  await batch.commit();
  return count;
}

/**
 * Create test check-ins
 */
async function createTestCheckIns(petId) {
  const batch = writeBatch(db);
  const count = 3;
  
  for (let i = 0; i < count; i++) {
    const checkInId = `checkin_${Date.now()}_${i}`;
    const checkInData = {
      id: checkInId,
      petId: petId,
      timestamp: serverTimestamp(),
      location: {
        latitude: 55.6761 + (Math.random() - 0.5) * 0.01,
        longitude: 12.5683 + (Math.random() - 0.5) * 0.01,
        accuracy: Math.random() * 10
      },
      visitor: {
        name: `Visitor ${i + 1}`,
        email: `visitor${i + 1}@example.com`
      },
      metadata: {
        device: 'mobile',
        browser: 'chrome',
        ip: '127.0.0.1'
      }
    };
    
    batch.set(doc(db, 'checkins', checkInId), checkInData);
  }
  
  await batch.commit();
  return count;
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 