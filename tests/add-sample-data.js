import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Firebase config
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
connectFirestoreEmulator(db, "localhost", 8080);

// Helper function to add documents
async function addDocument(collectionName, docId, data) {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data);
    console.log(`✅ Added document to ${collectionName}: ${docId}`);
  } catch (error) {
    console.error(`❌ Error adding document to ${collectionName}:`, error);
    throw error;
  }
}

// PetUUIDManager class (copied from the app)
class PetUUIDManager {
  constructor() {
    this.uuidGenerator = this.createUUIDGenerator();
  }

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

  generatePetUUID(ownerId, petName = null) {
    const uuid = this.uuidGenerator.generate();
    const timestamp = Math.floor(Date.now() / 1000);
    const ownerSuffix = ownerId ? `_${ownerId}` : '';
    const nameSuffix = petName ? `_${petName}` : '';
    
    return `pet_${uuid}${ownerSuffix}${nameSuffix}_${timestamp}`;
  }
}

async function addSampleData() {
  try {
    console.log('🌱 Starting to add sample data to Firestore emulator...');
    
    // Create a test user
    const userId = 'uid123';
    const userData = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('👤 Creating user:', userId);
    await addDocument('users', userId, userData);
    
    // Create the specific pet that the app is looking for
    const specificPetId = 'pet_75dbe6b6-f013-4334-b708-e09b7d090306_uid123_freddy_1751643383';
    const specificPetData = {
      id: specificPetId,
      name: 'Freddy',
      type: 'cat',
      breed: 'ginger',
      ownerId: userId,
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
        birthDate: '2020-01-01'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🐱 Creating specific pet:', specificPetId);
    await addDocument('pets', specificPetId, specificPetData);
    
    // Create pet status for the specific pet
    const petStatusId = `status_${specificPetId}`;
    const petStatusData = {
      id: petStatusId,
      petId: specificPetId,
      status: 'active',
      lastSeen: new Date(),
      location: {
        lat: 55.6761,
        lng: 12.5683,
        address: 'Copenhagen, Denmark'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📍 Creating pet status for specific pet');
    await addDocument('petStatus', petStatusId, petStatusData);
    
    // Create check-ins for the specific pet
    const checkinIds = [
      `checkin_${specificPetId}_${Date.now() - 3600000}`, // 1 hour ago
      `checkin_${specificPetId}_${Date.now() - 7200000}`, // 2 hours ago
      `checkin_${specificPetId}_${Date.now() - 10800000}` // 3 hours ago
    ];
    
    const checkinData = [
      {
        id: checkinIds[0],
        petId: specificPetId,
        userId: userId,
        location: {
          lat: 55.6761,
          lng: 12.5683,
          address: 'Copenhagen, Denmark'
        },
        notes: 'Found sleeping in the garden',
        timestamp: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        id: checkinIds[1],
        petId: specificPetId,
        userId: userId,
        location: {
          lat: 55.6765,
          lng: 12.5687,
          address: 'Copenhagen, Denmark'
        },
        notes: 'Playing with toys',
        timestamp: new Date(Date.now() - 7200000),
        createdAt: new Date(Date.now() - 7200000)
      },
      {
        id: checkinIds[2],
        petId: specificPetId,
        userId: userId,
        location: {
          lat: 55.6757,
          lng: 12.5679,
          address: 'Copenhagen, Denmark'
        },
        notes: 'Eating breakfast',
        timestamp: new Date(Date.now() - 10800000),
        createdAt: new Date(Date.now() - 10800000)
      }
    ];
    
    console.log('✅ Creating check-ins for specific pet');
    for (let i = 0; i < checkinIds.length; i++) {
      await addDocument('checkins', checkinIds[i], checkinData[i]);
    }
    
    // Create heartbeats for the specific pet
    const heartbeatIds = [
      `heartbeat_${specificPetId}_${Date.now() - 300000}`, // 5 minutes ago
      `heartbeat_${specificPetId}_${Date.now() - 600000}`, // 10 minutes ago
      `heartbeat_${specificPetId}_${Date.now() - 900000}`  // 15 minutes ago
    ];
    
    const heartbeatData = [
      {
        id: heartbeatIds[0],
        petId: specificPetId,
        location: {
          lat: 55.6761,
          lng: 12.5683,
          address: 'Copenhagen, Denmark'
        },
        timestamp: new Date(Date.now() - 300000),
        createdAt: new Date(Date.now() - 300000)
      },
      {
        id: heartbeatIds[1],
        petId: specificPetId,
        location: {
          lat: 55.6765,
          lng: 12.5687,
          address: 'Copenhagen, Denmark'
        },
        timestamp: new Date(Date.now() - 600000),
        createdAt: new Date(Date.now() - 600000)
      },
      {
        id: heartbeatIds[2],
        petId: specificPetId,
        location: {
          lat: 55.6757,
          lng: 12.5679,
          address: 'Copenhagen, Denmark'
        },
        timestamp: new Date(Date.now() - 900000),
        createdAt: new Date(Date.now() - 900000)
      }
    ];
    
    console.log('💓 Creating heartbeats for specific pet');
    for (let i = 0; i < heartbeatIds.length; i++) {
      await addDocument('heartbeats', heartbeatIds[i], heartbeatData[i]);
    }

    console.log("🎉 Sample data added successfully!");
    console.log(`🐱 Pet ID created: ${specificPetId}`);
    console.log(`