// Firebase configuration and database instance
// This file provides the Firestore database instance for modules that depend on it

import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore instance
export const db = getFirestore(app);

// Connect to emulators in local development
if (window.location.hostname === "localhost") {
  const { connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  connectFirestoreEmulator(db, "localhost", 8080);
  console.log("[DEBUG] Connected to Firestore emulator from firebase_config.js");
} 