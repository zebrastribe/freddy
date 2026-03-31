// Script to add admin users to Firebase Auth emulator
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from 'firebase/firestore';
import fetch from 'node-fetch';

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
        password: 'password123',
        role: 'superadmin',
        displayName: 'Super Admin'
    },
    {
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        displayName: 'Admin User'
    },
    {
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        displayName: 'Regular User'
    },
    {
        email: 'guest@test.com',
        password: 'password123',
        role: 'guest',
        displayName: 'Guest User'
    }
];

async function setCustomUserClaims(uid, claims) {
    const url = `http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/tracker-6a648/accounts:update`;
    const body = {
        localId: uid,
        customAttributes: JSON.stringify(claims)
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        throw new Error(`Failed to set custom claims for ${uid}: ${res.statusText}`);
    }
    return res.json();
}

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
                // Set custom claims in Auth emulator
                try {
                    await setCustomUserClaims(user.uid, { role: userData.role });
                    console.log(`🔑 Custom claim set for: ${userData.email}`);
                } catch (claimErr) {
                    console.error(`❌ Failed to set custom claim for ${userData.email}:`, claimErr);
                }
            }
            
            // After creating or updating a user in Auth, always set the Firestore user document with all required fields
            await setDoc(doc(db, 'users', user.uid), {
                email: userData.email,
                displayName: userData.displayName,
                role: userData.role,
                createdAt: new Date()
            });
            
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                console.log(`⚠️ User already exists: ${userData.email}`);
                
                // Still try to add admin role if needed
                if (userData.role === 'admin' || userData.role === 'superadmin') {
                    try {
                        // Sign in to get the user's UID
                        const userCredential = await signInWithEmailAndPassword(auth, userData.email, userData.password);
                        const user = userCredential.user;
                        await setDoc(doc(db, 'admins', user.uid), {
                            email: userData.email,
                            role: userData.role,
                            displayName: userData.displayName,
                            createdAt: new Date()
                        });
                        console.log(`👑 Admin role added for: ${userData.email}`);
                        // Set custom claims in Auth emulator
                        try {
                            await setCustomUserClaims(user.uid, { role: userData.role });
                            console.log(`🔑 Custom claim set for: ${userData.email}`);
                        } catch (claimErr) {
                            console.error(`❌ Failed to set custom claim for ${userData.email}:`, claimErr);
                        }
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