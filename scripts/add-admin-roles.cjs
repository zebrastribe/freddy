// Script to add admin roles to existing users in Firestore
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

const adminUsers = [
    {
        email: 'superadmin@test.com',
        role: 'superadmin',
        displayName: 'Super Admin'
    },
    {
        email: 'admin@test.com',
        role: 'admin',
        displayName: 'Admin User'
    }
];

async function addAdminRoles() {
    console.log('🚀 Adding admin roles to Firestore...');
    
    for (const userData of adminUsers) {
        try {
            console.log(`🔐 Signing in as: ${userData.email}`);
            
            // Sign in to get the user UID
            const userCredential = await signInWithEmailAndPassword(
                auth, 
                userData.email, 
                'AngryLion'
            );
            
            const user = userCredential.user;
            console.log(`✅ Signed in: ${user.email} (UID: ${user.uid})`);
            
            // Add admin role to Firestore
            await setDoc(doc(db, 'admins', user.uid), {
                email: userData.email,
                role: userData.role,
                displayName: userData.displayName,
                createdAt: new Date()
            });
            console.log(`👑 Admin role added for: ${userData.email} (${userData.role})`);
            
        } catch (error) {
            console.error(`❌ Failed to add admin role for ${userData.email}:`, error);
        }
    }
    
    console.log('✅ Admin roles setup complete!');
}

// Run the script
addAdminRoles().catch(console.error); 