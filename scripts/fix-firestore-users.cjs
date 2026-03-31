// Script to fix Firestore user documents: ensure 'email', 'displayName', and 'role' fields
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, connectFirestoreEmulator } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "tracker-6a648",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
connectFirestoreEmulator(db, 'localhost', 8080);

async function fixUsers() {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        let needsUpdate = false;
        const updateData = {};
        if (!data.email) {
            updateData.email = 'unknown@example.com';
            needsUpdate = true;
        }
        if (!data.displayName) {
            updateData.displayName = 'Unknown User';
            needsUpdate = true;
        }
        if (!data.role) {
            updateData.role = 'USER';
            needsUpdate = true;
        }
        if (needsUpdate) {
            await updateDoc(doc(db, 'users', userDoc.id), updateData);
            console.log(`Updated user ${userDoc.id}:`, updateData);
        } else {
            console.log(`User ${userDoc.id} is OK.`);
        }
    }
    console.log('✅ All user documents checked and fixed.');
}

fixUsers().catch(err => {
    console.error('Error fixing users:', err);
    process.exit(1);
}); 