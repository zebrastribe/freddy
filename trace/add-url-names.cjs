const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, updateDoc, collection, getDocs, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

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

// Mythology names for URL generation
const mythologyNames = [
  'zeus', 'hera', 'ares', 'iris', 'pan', 'hades', 'hel', 'atlas', 'rhea', 'theia',
  'nike', 'hebe', 'satyr', 'nymph', 'dryad', 'naiad', 'oread', 'jason', 'cadmus',
  'odin', 'thor', 'tyr', 'vali', 'bragi', 'hodr', 'ullr', 'njord', 'nanna', 'skadi',
  'loki', 'surtr', 'ymir', 'thrym', 'hymir', 'hrod', 'aegir', 'ran', 'kara', 'svava',
  'ragnar', 'gunnar', 'hogni', 'ra', 'isis', 'set', 'nut', 'geb', 'shu', 'bes', 'heqet'
];

// Track used URL names
const usedUrlNames = new Set();

async function loadUsedUrlNames() {
  try {
    const urlNamesSnapshot = await getDocs(collection(db, 'url_names'));
    urlNamesSnapshot.forEach(doc => {
      usedUrlNames.add(doc.data().urlName);
    });
    console.log(`📋 Loaded ${usedUrlNames.size} existing URL names`);
  } catch (error) {
    console.error('❌ Error loading existing URL names:', error);
  }
}

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

async function addUrlNameToUser(userId, userData) {
  try {
    const urlName = generateUniqueUrlName();
    
    // Update user document with URL name
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      urlName: urlName
    });
    
    // Create entry in url_names collection
    const urlNameRef = doc(db, 'url_names', urlName);
    await setDoc(urlNameRef, {
      urlName: urlName,
      userId: userId,
      createdAt: new Date().toISOString(),
      isActive: true
    });
    
    console.log(`✅ Added URL name "${urlName}" to user: ${userData.displayName || userData.email} (${userId})`);
    return urlName;
  } catch (error) {
    console.error(`❌ Failed to add URL name to user ${userId}:`, error.message);
    return null;
  }
}

async function addUrlNamesToExistingUsers() {
  console.log('🚀 Adding URL names to existing users...');
  
  // Load existing URL names
  await loadUsedUrlNames();
  
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let processedCount = 0;
    let addedCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      processedCount++;
      
      // Check if user already has a URL name
      if (!userData.urlName) {
        const urlName = await addUrlNameToUser(userId, userData);
        if (urlName) {
          addedCount++;
        }
      } else {
        console.log(`ℹ️  User ${userData.displayName || userData.email} already has URL name: ${userData.urlName}`);
      }
    }
    
    console.log(`\n✅ URL name assignment complete!`);
    console.log(`📊 Processed: ${processedCount} users`);
    console.log(`➕ Added URL names to: ${addedCount} users`);
    console.log(`�� Total URL names in use: ${usedUrlNames.size}`);
    
  } catch (error) {
    console.error('❌ Error processing users:', error);
  }
}

// Run the script
addUrlNamesToExistingUsers().catch(console.error);
