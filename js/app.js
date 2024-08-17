// app.js
import { initMap, addMarker } from './map.js';
import { db } from './firebase-setup.js';

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching logic
  document.getElementById('checkInTab').addEventListener('click', () => {
    document.getElementById('checkInContent').classList.remove('hidden');
    document.getElementById('recordedCheckInsContent').classList.add('hidden');
    document.getElementById('checkInTab').classList.add('text-blue-600', 'border-blue-600');
    document.getElementById('checkInTab').classList.remove('text-gray-600');
    document.getElementById('recordedCheckInsTab').classList.add('text-gray-600');
    document.getElementById('recordedCheckInsTab').classList.remove('text-blue-600', 'border-blue-600');
  });

  document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
    document.getElementById('checkInContent').classList.add('hidden');
    document.getElementById('recordedCheckInsContent').classList.remove('hidden');
    document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
    document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600');
    document.getElementById('checkInTab').classList.add('text-gray-600');
    document.getElementById('checkInTab').classList.remove('text-blue-600', 'border-blue-600');

    // Initialize the map if it hasn't been initialized yet
    if (!window.recordedMap) {
      initMap();
    }

    // Fetch and display check-ins
    fetchCheckIns();
  });

  // Function to fetch check-ins from Firestore and add markers
  async function fetchCheckIns() {
    try {
      const querySnapshot = await db.collection("checkins").get();
      querySnapshot.forEach((doc) => {
        const checkIn = doc.data();
        const position = { lat: checkIn.latitude, lng: checkIn.longitude };
        addMarker(window.recordedMap, position, checkIn.name);
      });
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  }
});