// Firestore role-based check-in test for the emulator
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, connectAuthEmulator } = require('firebase/auth');

// Use your real API key for emulator testing (safe, does not touch prod)
const firebaseConfig = {
  projectId: 'demo-test', // or your real projectId
  apiKey: 'AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss', // <-- replace with your real API key if needed
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
connectFirestoreEmulator(db, 'localhost', 8080);
connectAuthEmulator(auth, 'http://localhost:9099');

const roles = [
  { label: 'GUEST', email: null, password: null, docId: 'guest_checkin_emulator' },
  { label: 'USER', email: 'user@test.com', password: 'AngryLion', docId: 'user_checkin_emulator' },
  { label: 'ADMIN', email: 'admin@test.com', password: 'AngryLion', docId: 'admin_checkin_emulator' },
  { label: 'SUPER_ADMIN', email: 'superadmin@test.com', password: 'AngryLion', docId: 'superadmin_checkin_emulator' },
];

async function ensureUser(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log(`Created user: ${email}`);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      // User already exists, that's fine
      return;
    } else {
      throw e;
    }
  }
}

async function testCheckin(role) {
  try {
    if (role.email) {
      await ensureUser(role.email, role.password);
      await signOut(auth);
      await signInWithEmailAndPassword(auth, role.email, role.password);
    } else {
      await signOut(auth); // Guest
    }
    await setDoc(doc(db, 'clicks', role.docId), {
      petId: 'test_pet_1',
      userId: role.email || 'anonymous',
      name: `${role.label} Emulator`,
      latitude: 55.6761,
      longitude: 12.5683,
      timestamp: new Date().toISOString(),
      domain: 'testpet1.stri.be'
    });
    console.log(`✅ ${role.label} check-in creation (emulator): ALLOWED`);
    return { role: role.label, allowed: true };
  } catch (e) {
    console.error(`❌ ${role.label} check-in creation (emulator): DENIED`);
    console.error(e.message);
    return { role: role.label, allowed: false, error: e.message };
  }
}

async function run() {
  const results = [];
  for (const role of roles) {
    results.push(await testCheckin(role));
  }
  console.log('\nSummary:');
  for (const r of results) {
    if (r.allowed) {
      console.log(`  ✅ ${r.role}: ALLOWED`);
    } else {
      console.log(`  ❌ ${r.role}: DENIED (${r.error})`);
    }
  }
}

run(); 