import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { PetUUIDManager } from './js/features/pets/pet_uuid_manager.js';

// Firebase configuration for emulator
const firebaseConfig = {
  projectId: 'tracker-6a648'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize PetUUIDManager
const petUUIDManager = new PetUUIDManager();

async function addFreddyNewFormat() {
  try {
    console.log('🌱 Adding Freddy with new simplified UUID format...');
    
    // Generate new simplified UUID for freddy
    const petUUID = petUUIDManager.generatePetUUID('freddy');
    console.log('Generated UUID:', petUUID);
    
    // Parse the UUID to verify format
    const parsed = petUUIDManager.parsePetUUID(petUUID);
    console.log('Parsed UUID:', parsed);
    
    // Create pet document with new format
    const petData = {
      id: petUUID,
      name: 'freddy',
      type: 'cat',
      owner: 'uid123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      description: 'Freddy the cat with new simplified UUID format'
    };
    
    // Add to Firestore
    await setDoc(doc(db, 'pets', petUUID), petData);
    console.log('✅ Added document to pets:', petUUID);
    
    // Also create a pet status document
    const statusData = {
      petId: petUUID,
      status: 'active',
      lastSeen: new Date().toISOString(),
      location: 'Home',
      notes: 'Freddy is doing well with the new UUID format'
    };
    
    await setDoc(doc(db, 'pet_status', petUUID), statusData);
    console.log('✅ Added pet status document');
    
    console.log('✅ Freddy added successfully with new format!');
    
  } catch (error) {
    console.error('❌ Error adding Freddy:', error);
  }
}

// Run the function
addFreddyNewFormat();
