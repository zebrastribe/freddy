import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Connect to emulators
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

// Admin users to create
const users = [
  { email: 'user@test.com', role: 'user' },
  { email: 'admin@test.com', role: 'admin' },
  { email: 'superadmin@test.com', role: 'superadmin' }
];

const password = 'AngryLion';

async function createAdminUsers() {
  console.log('🚀 Adding admin users to Firebase Emulator...\n');

  for (const user of users) {
    try {
      console.log(`=== Processing: ${user.email} ===`);
      
      // Create user in Auth
      console.log(`Creating Auth user: ${user.email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, password);
      const userId = userCredential.user.uid;
      
      console.log(`✅ Created Auth user: ${user.email} (ID: ${userId})`);
      
      // Add to Firestore admins collection
      console.log(`Adding to Firestore admins: ${user.email} (role: ${user.role})`);
      
      await setDoc(doc(db, 'admins', userId), {
        email: user.email,
        role: user.role,
        userId: userId,
        createdAt: new Date()
      });
      
      console.log(`✅ Added to Firestore admins: ${user.email}\n`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      
      // If user already exists, try to add to admins collection
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${user.email} already exists, adding to admins collection...`);
        try {
          // We need to get the user ID somehow - for now, let's create a document with email as ID
          await setDoc(doc(db, 'admins', user.email), {
            email: user.email,
            role: user.role,
            createdAt: new Date()
          });
          console.log(`✅ Added to Firestore admins: ${user.email}\n`);
        } catch (firestoreError) {
          console.error(`❌ Error adding to admins: ${firestoreError.message}\n`);
        }
      } else {
        console.log('');
      }
    }
  }

  console.log('🎉 Admin user creation complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('- Firebase Auth Emulator: http://localhost:9099');
  console.log('- Firestore Emulator: http://localhost:8080');
  console.log('- Emulator UI: http://localhost:4000');
  console.log('- SPA Server: http://localhost:8016');
  console.log('');
  console.log('🔑 Test credentials:');
  console.log('- user@test.com / AngryLion (user role)');
  console.log('- admin@test.com / AngryLion (admin role)');
  console.log('- superadmin@test.com / AngryLion (superadmin role)');
}

// Run the script
createAdminUsers().catch(console.error); 