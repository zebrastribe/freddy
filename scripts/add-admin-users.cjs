// Script to add admin users to Firebase Auth emulator
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');
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
        password: 'AngryLion',
        role: 'superadmin',
        displayName: 'Super Admin'
    },
    {
        email: 'admin@test.com',
        password: 'AngryLion',
        role: 'admin',
        displayName: 'Admin User'
    },
    {
        email: 'user@test.com',
        password: 'AngryLion',
        role: 'user',
        displayName: 'Regular User'
    },
    {
        email: 'guest@test.com',
        password: 'AngryLion',
        role: 'guest',
        displayName: 'Guest User'
    }
];

async function addAdminUsers() {
    console.log('🚀 Adding admin users to Firebase Auth emulator...');
    
    for (const userData of adminUsers) {
        try {
            console.log(`📝 Creating user: ${userData.email}`);
            
            // Create user in Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth, 
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            console.log(`✅ User created: ${user.email} (UID: ${user.uid})`);
            
            // Add admin role to Firestore
            if (userData.role === 'admin' || userData.role === 'superadmin') {
                await setDoc(doc(db, 'admins', user.uid), {
                    email: userData.email,
                    role: userData.role,
                    displayName: userData.displayName,
                    createdAt: new Date()
                });
                console.log(`👑 Admin role added for: ${userData.email}`);
            }
            
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️ User already exists: ${userData.email}`);
                
                // Still try to add admin role if needed
                if (userData.role === 'admin' || userData.role === 'superadmin') {
                    try {
                        // We need to get the user by email since we can't get UID from error
                        // For now, we'll skip this and let the user handle it manually
                        console.log(`ℹ️ Please manually add admin role for: ${userData.email}`);
                    } catch (roleError) {
                        console.error(`❌ Failed to add admin role for ${userData.email}:`, roleError);
                    }
                }
            } else {
                console.error(`❌ Failed to create user ${userData.email}:`, error);
            }
        }
    }
    
    console.log('✅ Admin users setup complete!');
    console.log('\n📋 Available users:');
    adminUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Password: ${user.password}`);
    });
}

// Run the script
addAdminUsers().catch(console.error); 