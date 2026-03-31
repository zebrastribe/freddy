const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "demo-api-key",
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

async function setupDatabase() {
  console.log('🚀 Setting up test data...');
  
  try {
    // Create test user
    const userId = 'S8dZFyzNdNYON5OcKcA59XrizZu2';
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: 'test@example.com',
      role: 'USER',
      createdAt: serverTimestamp(),
      isActive: true
    });
    console.log('✅ Test user created');
    
    // Create Freddy pet
    const petId = 'pet_142b268c-b46c-4ab5-8ea7-b1fdbf6ad2f6_S8dZFyzNdNYON5OcKcA59XrizZu2_freddy_1751637183';
    await setDoc(doc(db, 'pets', petId), {
      id: petId,
      name: 'Freddy',
      type: 'cat',
      ownerId: userId,
      status: 'active',
      createdAt: serverTimestamp()
    });
    console.log('✅ Freddy pet created');
    
    // Create test heartbeats
    for (let i = 0; i < 5; i++) {
      const heartbeatId = `heartbeat_${Date.now()}_${i}`;
      await setDoc(doc(db, 'heartbeats', heartbeatId), {
        id: heartbeatId,
        petId: petId,
        timestamp: serverTimestamp(),
        status: 'active'
      });
    }
    console.log('✅ Test heartbeats created');
    
    console.log('🎉 Setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase(); 