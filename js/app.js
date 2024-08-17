// app.js
import { initMap, addMarker, updateMap } from './map.js';

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

  // Example function to fetch check-ins and add markers
  async function fetchCheckIns() {
    try {
      const response = await fetch('/api/checkins');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new TypeError("Received non-JSON response");
      }
      const checkIns = await response.json();

      checkIns.forEach(checkIn => {
        const position = { lat: checkIn.latitude, lng: checkIn.longitude };
        addMarker(window.recordedMap, position, checkIn.name);
      });
    } catch (error) {
      console.error('Error fetching check-ins:', error);
    }
  }
});