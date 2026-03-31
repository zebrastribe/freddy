import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase config for emulator
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8180);

// Test users configuration
const testUsers = [
  {
    email: "guest@test.com",
    password: "password123",
    displayName: "Guest User",
    role: "guest"
  },
  {
    email: "user@test.com", 
    password: "password123",
    displayName: "Regular User",
    role: "user"
  },
  {
    email: "admin@test.com",
    password: "password123", 
    displayName: "Admin User",
    role: "admin"
  },
  {
    email: "superadmin@test.com",
    password: "password123",
    displayName: "Super Admin",
    role: "superadmin"
  }
];

async function createUserInAuth(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`✅ Created Auth user: ${email}`);
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️  Auth user already exists: ${email}`);
      return null;
    } else {
      console.error(`❌ Failed to create Auth user ${email}:`, error.message);
      return null;
    }
  }
}

// Simple mythology names for URL generation
const mythologyNames = [
  'zeus', 'hera', 'ares', 'iris', 'pan', 'hades', 'hel', 'atlas', 'rhea', 'theia',
  'nike', 'hebe', 'satyr', 'nymph', 'dryad', 'naiad', 'oread', 'jason', 'cadmus',
  'odin', 'thor', 'tyr', 'vali', 'bragi', 'hodr', 'ullr', 'njord', 'nanna', 'skadi',
  'loki', 'surtr', 'ymir', 'thrym', 'hymir', 'hrod', 'aegir', 'ran', 'kara', 'svava',
  'ragnar', 'gunnar', 'hogni', 'ra', 'isis', 'set', 'nut', 'geb', 'shu', 'bes', 'heqet'
];

// Track used URL names
const usedUrlNames = new Set();

function generateUniqueUrlName() {
  // Try base mythology names first
  for (const name of mythologyNames) {
    if (!usedUrlNames.has(name)) {
      usedUrlNames.add(name);
      return name;
    }
  }

  // If all mythology names are used, generate with numbers
  let counter = 2;
  while (true) {
    const randomName = mythologyNames[Math.floor(Math.random() * mythologyNames.length)];
    const numberedName = `${randomName}-${counter}`;
    
    if (!usedUrlNames.has(numberedName)) {
      usedUrlNames.add(numberedName);
      return numberedName;
    }
    counter++;
  }
}

async function createUserInFirestore(uid, email, displayName, role) {
  try {
    const urlName = generateUniqueUrlName();
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      email: email,
      displayName: displayName,
      role: role,
      urlName: urlName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Also create entry in url_names collection
    const urlNameRef = doc(db, 'url_names', urlName);
    await setDoc(urlNameRef, {
      urlName: urlName,
      userId: uid,
      createdAt: new Date().toISOString(),
      isActive: true
    });
    
    console.log(`✅ Created Firestore user: ${email} (${role}) with URL name: ${urlName}`);
  } catch (error) {
    console.error(`❌ Failed to create Firestore user ${email}:`, error.message);
  }
}

async function setupTestUsers() {
  console.log('🚀 Setting up test users...');
  
  for (const user of testUsers) {
    console.log(`\n📝 Processing user: ${user.email} (${user.role})`);
    
    // Create user in Auth
    const authUser = await createUserInAuth(user.email, user.password, user.displayName);
    
    // If user was created in Auth, create Firestore record
    if (authUser) {
      await createUserInFirestore(authUser.uid, user.email, user.displayName, user.role);
    } else {
      // If user already exists in Auth, try to update Firestore record
      try {
        const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
        await createUserInFirestore(userCredential.user.uid, user.email, user.displayName, user.role);
        await signOut(auth);
      } catch (error) {
        console.error(`❌ Could not update existing user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('\n✅ Test users setup complete!');
  console.log('\n📋 Available test users:');
  testUsers.forEach(user => {
    console.log(`   ${user.email} (${user.role}) - password: password123`);
  });
}

// Run the setup
setupTestUsers().catch(console.error); 