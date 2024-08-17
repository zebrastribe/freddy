// checkin.js
import { db, auth } from './firebase-setup.js';
import { getUser } from './auth.js';
import { updateMap, addMarker } from './map.js';
import { fetchCheckIns } from './fetch.js';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('clickButton').addEventListener('click', async () => {
    const nameInput = document.getElementById('nameInput');
    const errorMessage = document.getElementById('error-message');
    const spinner = document.getElementById('spinner');
    const successMessage = document.getElementById('success-message');

    if (nameInput.value.trim() === "") {
      errorMessage.classList.remove('hidden');
      return;
    } else {
      errorMessage.classList.add('hidden');
    }

    const user = getUser();
    if (user) {
      const name = nameInput.value; // Get the value from the input field
      if (navigator.geolocation) {
        spinner.classList.remove('hidden'); // Show spinner
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            await addDoc(collection(db, "clicks"), {
              timestamp: serverTimestamp(),
              userId: user.uid,
              name: name, // Include the name in the document
              latitude: latitude,
              longitude: longitude
            });
            console.log("Document successfully written with GPS coordinates and name!");
            updateMap(latitude, longitude);
            successMessage.classList.remove('hidden'); // Show success message
            nameInput.value = ""; // Clear the input field
            nameInput.disabled = true; // Disable the input field
            setTimeout(() => {
              nameInput.disabled = false; // Re-enable the input field after 15 seconds
              successMessage.classList.add('hidden'); // Hide success message
            }, 15000);
            fetchCheckIns(); // Refresh the check-ins list
          } catch (error) {
            console.error("Error writing document: ", error);
          } finally {
            spinner.classList.add('hidden'); // Hide spinner
          }
        }, (error) => {
          console.error("Error getting geolocation: ", error);
          spinner.classList.add('hidden'); // Hide spinner
        });
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    } else {
      console.error("User is not authenticated, cannot add document");
    }
  });

  document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
    document.getElementById('checkInContent').classList.add('hidden');
    document.getElementById('recordedCheckInsContent').classList.remove('hidden');
    document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
    document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600');
    document.getElementById('checkInTab').classList.add('text-gray-600');
    document.getElementById('checkInTab').classList.remove('text-blue-600', 'border-blue-600');

    // Fetch and display check-ins
    fetchCheckIns();
  });

  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchCheckIns();
    }
  });

  document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    fetchCheckIns();
  });
});

let currentPage = 1;
const entriesPerPage = 10;