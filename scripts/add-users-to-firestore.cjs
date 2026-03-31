// Script to add users to Firestore users collection
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
const { getFirestore, doc, setDoc, connectFirestoreEmulator } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "tracker-6a648",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Connect to emulators
connectAuthEmulator(auth, 'http://localhost:9099');
connectFirestoreEmulator(db, 'localhost', 8080);

const users = [
    {
        email: 'guest@test.com',
        displayName: 'Guest User',
        role: 'USER',
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date('2024-01-15')
    },
    {
        email: 'user@test.com',
        displayName: 'Regular User',
        role: 'USER',
        createdAt: new Date('2024-01-05'),
        lastLogin: new Date('2024-01-14')
    },
    {
        email: 'admin@test.com',
        displayName: 'Admin User',
        role: 'ADMIN',
        createdAt: new Date('2024-01-10'),
        lastLogin: new Date('2024-01-13')
    },
    {
        email: 'superadmin@test.com',
        displayName: 'Super Admin',
        role: 'ADMIN',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2024-01-12')
    }
];

async function addUsersToFirestore() {
    try {
        console.log('🔐 Adding users to Firestore...');
        
        for (const user of users) {
            // Create a document ID based on email
            const userId = user.email.replace('@', '_at_').replace('.', '_dot_');
            
            await setDoc(doc(db, 'users', userId), {
                ...user,
                id: userId,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            });
            
            console.log(`✅ Added user: ${user.email} (${user.role})`);
        }
        
        console.log('🎉 All users added to Firestore successfully!');
        console.log('📋 Users in admin panel:');
        users.forEach(user => {
            console.log(`  - ${user.email} (${user.role})`);
        });
        
    } catch (error) {
        console.error('❌ Error adding users to Firestore:', error);
    }
}

addUsersToFirestore(); 