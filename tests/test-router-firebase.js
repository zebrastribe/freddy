// Test script to verify router Firebase access
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration for emulator
const firebaseConfig = {
  projectId: 'tracker-6a648'
};

async function testRouterFirebaseAccess() {
  try {
    console.log('🧪 Testing router Firebase access...');
    
    // Simulate what the router would do
    const { getFirestore, collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
    
    // Try to get Firebase from global scope
    let db = null;
    
    if (window.firebaseApp) {
      console.log('✅ Found window.firebaseApp');
      db = getFirestore(window.firebaseApp);
    } else if (window.firebaseDB) {
      console.log('✅ Found window.firebaseDB');
      db = window.firebaseDB;
    } else if (window.app && window.app.db) {
      console.log('✅ Found window.app.db');
      db = window.app.db;
    } else {
      console.log('❌ No global Firebase instance found');
      return;
    }
    
    // Test the database connection
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    console.log(`✅ Successfully queried ${petsSnapshot.size} pets from database`);
    
    // Search for freddy pets
    const matchingPets = [];
    petsSnapshot.forEach(doc => {
      const petData = doc.data();
      if (petData.name && petData.name.toLowerCase() === 'freddy') {
        matchingPets.push({ id: doc.id, ...petData });
      }
    });
    
    console.log(`✅ Found ${matchingPets.length} pets with name "freddy"`);
    
  } catch (error) {
    console.error('❌ Error testing router Firebase access:', error);
  }
}

// Run the test
testRouterFirebaseAccess();
