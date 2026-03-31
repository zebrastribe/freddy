import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBd3xQgm7vnL2LCmxpabVT5qAhSFOteuGY",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
}

// Initialize Firebase
let app
let auth
let db
let messaging

try {
  console.log('🔥 Initializing Firebase app...')
  app = initializeApp(firebaseConfig)
  
  console.log('🔐 Initializing Firebase Auth...')
  auth = getAuth(app)
  
  console.log('📊 Initializing Firestore...')
  db = getFirestore(app)
  
  console.log('📱 Initializing Firebase Messaging...')
  messaging = getMessaging(app)
  
  console.log('✅ Firebase services initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
}

// Connect to emulators in development
if (window.location.hostname === 'localhost' && auth && db) {
  try {
    console.log('🔗 Connecting to Firebase emulators...')
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8180)
    console.log('✅ Connected to Firebase emulators')
  } catch (error) {
    console.warn('⚠️ Emulator connection failed:', error.message)
  }
}

export async function initializeFirebase() {
  try {
    console.log('🔥 Finalizing Firebase initialization...')
    
    if (!auth) {
      throw new Error('Firebase Auth not initialized')
    }
    
    // Test connection
    await auth.authStateReady()
    
    console.log('✅ Firebase initialized successfully')
    return true
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error)
    return false
  }
}

export { app, auth, db, messaging } 