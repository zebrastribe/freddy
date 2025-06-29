// setup-freddy-status.js
// Usage: node setup-freddy-status.js

const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function setupFreddyStatus() {
  const docRef = db.collection('freddy_status').doc('current');
  await docRef.set({ mode: 'OK' });
  console.log("Created/updated 'freddy_status/current' with mode: 'OK'");
}

setupFreddyStatus().catch(console.error); 