/*
The provided JavaScript code is a comprehensive script that integrates various functionalities, including translation, token validation, user authentication, and map interactions using Google Maps and Firebase Firestore.
The script begins by importing necessary modules and functions from Firebase and other local files. It then sets up an event listener for the DOMContentLoaded event to initialize translations using the Translation class. This class detects the user's language, loads the appropriate translation file, and applies translations to elements with the data-translate attribute.
The script defines several asynchronous functions to handle token validation and usage. The processToken function checks if a token is valid using isTokenValid and marks it as used with useToken if valid. The logTokenFromUrl function extracts a token from the URL and logs it to the console.
User authentication is managed using Firebase's onAuthStateChanged function, which sets the user variable when a user is authenticated. Upon authentication, it fetches the last known coordinates and all check-ins from Firestore, updating the map and displaying check-ins in a table.
The script also includes an event listener for a button click that captures the user's geolocation, adds a document to the Firestore collection with the user's name and coordinates, and updates the map. It handles errors and displays appropriate messages during this process.
The fetchLastCoordinates and fetchCheckIns functions query Firestore to retrieve the last known coordinates and all check-ins, respectively. The check-ins are displayed in a paginated table, and markers are added to the map for each check-in.
The initMaps and initRecordedMap functions initialize Google Maps for displaying the user's current location and recorded check-ins. The script also includes event listeners for pagination controls and tab switching to manage the display of check-ins.
Overall, this script provides a robust solution for handling translations, token validation, user authentication, and map interactions, leveraging Firebase Firestore and Google Maps APIs.
*/

import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { logTokenFromUrl, getToken, isTokenValid, useToken } from './incoming.js';
import { Translation } from './modules/translation/translation.js';
import { getFreddyStatus } from './config.js';

// Global variables
let user = null;
let marker;
let currentPage = 1;
const entriesPerPage = 10;
let map = null;
let recordedMap = null;

// Initialize maps when Google Maps API is loaded
function initializeMaps() {
  try {
    // Initialize main map
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 55.6606758, lng: 12.5226001 },
      zoom: 15,
      mapId: '8bac4e61a05fc3c2'
    });

    // Initialize recorded check-ins map
    recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
      center: { lat: 55.6606758, lng: 12.5226001 },
      zoom: 15,
      mapId: '8bac4e61a05fc3c2'
    });

    console.log('Maps initialized successfully');
  } catch (error) {
    console.error('Error initializing maps:', error);
  }
}

// Wait for Google Maps API to load
function waitForGoogleMaps(callback) {
  if (window.google && google.maps && typeof google.maps.Map === 'function') {
    callback();
  } else {
    setTimeout(() => waitForGoogleMaps(callback), 100);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const translation = new Translation();
  await translation.loadTranslations();
  translation.applyTranslations();
  
  // Initialize maps
  waitForGoogleMaps(initializeMaps);

  try {
    const mode = await getFreddyStatus();
    if (mode === 'MISSING') {
      document.getElementById('freddy-warning').style.display = '';
    }
  } catch (e) {
    console.warn('Could not fetch Freddy status:', e);
  }
});

// Call the function to log the token
logTokenFromUrl();

// Check if the token is valid and use it
async function processToken() {
    const valid = await isTokenValid();
    if (valid) {
        console.log('Token is valid.');
        await useToken();
    } else {
        console.log('Token is not valid.');
    }
}

// Call the function to process the token
processToken();

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
    fetchLastCoordinates(); // Fetch last coordinates when user is authenticated
    fetchCheckIns(); // Fetch and display all check-ins
  } else {
    user = null;
    console.info("No Firebase user authenticated (this is OK for public check-in).");
  }
});

document.getElementById('clickButton').addEventListener('click', async (event) => {
  event.preventDefault();
  const nameInput = document.getElementById('nameInput');
  const errorMessage = document.getElementById('error-message');
  const spinner = document.getElementById('spinner');
  const successMessage = document.getElementById('success-message');

  if (nameInput.value.trim() === "") {
    errorMessage.classList.remove('hidden');
    errorMessage.innerText = "Please enter your name.";
    return;
  } else {
    errorMessage.classList.add('hidden');
  }

  // Show spinner
  spinner.classList.remove('hidden');

  try {
    // Verify reCAPTCHA first
    if (typeof grecaptcha === 'undefined') {
      throw new Error('reCAPTCHA not loaded. Please refresh the page.');
    }
    console.log('Requesting reCAPTCHA token...');
    const recaptchaToken = await grecaptcha.execute('6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ', {action: 'checkin'});
    console.log('reCAPTCHA token:', recaptchaToken);
    if (!recaptchaToken) {
      throw new Error('reCAPTCHA verification failed. Please try again.');
    }

    const name = nameInput.value;
    if (navigator.geolocation) {
      console.log('Requesting geolocation...');
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        const { latitude, longitude } = position.coords;
        console.log('Geolocation:', latitude, longitude);
        try {
          // Ensure anonymous authentication for unauthenticated users
          if (!auth.currentUser) {
            console.log('No authenticated user, attempting anonymous sign-in...');
            try {
              await signInAnonymously(auth);
              console.log('Anonymous authentication successful');
            } catch (authError) {
              console.log('Anonymous authentication error:', authError.message);
              // Continue anyway, as Firestore rules might allow unauthenticated writes
            }
          }
          
          const docRef = await addDoc(collection(db, "clicks"), {
            timestamp: serverTimestamp(),
            userId: auth.currentUser?.uid || null,
            name: name,
            latitude: latitude,
            longitude: longitude,
            recaptchaToken: recaptchaToken // Include reCAPTCHA token
          });
          console.log("Document successfully written! ID:", docRef.id);
          updateMap(latitude, longitude);
          successMessage.classList.remove('hidden');
          nameInput.value = "";
          nameInput.disabled = true;
          setTimeout(() => {
            nameInput.disabled = false;
            successMessage.classList.add('hidden');
          }, 15000);
          fetchCheckIns();
        } catch (error) {
          console.error("Error writing document: ", error);
          errorMessage.innerText = "Error saving check-in: " + (error.message || error);
          errorMessage.classList.remove('hidden');
        } finally {
          spinner.classList.add('hidden');
        }
      } catch (error) {
        console.error("Error getting geolocation: ", error);
        errorMessage.innerText = "Error getting location: " + (error.message || error);
        errorMessage.classList.remove('hidden');
        spinner.classList.add('hidden');
      }
    } else {
      console.error("Geolocation is not supported by this browser.");
      errorMessage.innerText = "Geolocation is not supported by this browser.";
      errorMessage.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  } catch (error) {
    console.error("reCAPTCHA or general error:", error);
    errorMessage.innerText = error.message || "An error occurred. Please try again.";
    errorMessage.classList.remove('hidden');
    spinner.classList.add('hidden');
  }
});

async function fetchLastCoordinates() {
  if (user) {
    try {
      const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const { latitude, longitude } = lastDoc.data();
        updateMap(latitude, longitude);
      } else {
        console.log("No previous coordinates found.");
      }
    } catch (error) {
      console.error("Error fetching last coordinates:", error);
    }
  }
}

async function fetchCheckIns() {
  if (typeof user === 'undefined') user = null; // Defensive: ensure user is defined
  const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const checkInsList = document.getElementById('checkInsList');
  checkInsList.innerHTML = ''; // Clear the table body

  const docs = querySnapshot.docs;
  const totalPages = Math.ceil(docs.length / entriesPerPage);
  const start = (currentPage - 1) * entriesPerPage;
  const end = start + entriesPerPage;
  const currentDocs = docs.slice(start, end);

  currentDocs.forEach((doc) => {
    const data = doc.data();
    const name = data.name || '-';
    const latitude = typeof data.latitude === 'number' ? data.latitude : '-';
    const longitude = typeof data.longitude === 'number' ? data.longitude : '-';
    let formattedDate = '-';
    let time = '-';
    if (data.timestamp && typeof data.timestamp.toDate === 'function') {
      const date = data.timestamp.toDate();
      formattedDate = `${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    // Only render rows with at least name, latitude, longitude, and timestamp
    if (name !== '-' && latitude !== '-' && longitude !== '-' && formattedDate !== '-') {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-2 px-4 border-b border-gray-200">${name}</td>
        <td class="py-2 px-4 border-b border-gray-200">${latitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${longitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${formattedDate}</td>
        <td class="py-2 px-4 border-b border-gray-200">${time}</td>
      `;
      checkInsList.appendChild(row);
      // Add marker to the recorded map
      if (recordedMap && typeof latitude === 'number' && typeof longitude === 'number') {
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          new google.maps.marker.AdvancedMarkerElement({
            position: { lat: latitude, lng: longitude },
            map: recordedMap,
            title: name
          });
        } else {
          console.error('AdvancedMarkerElement is not available. Make sure the marker library is loaded.');
        }
      }
    }
  });

  document.getElementById('prevPage').disabled = currentPage === 1;
  document.getElementById('nextPage').disabled = currentPage === totalPages;
}

// Call initRecordedMap when the Recorded Check-Ins tab is clicked
document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
  document.getElementById('checkInContent').classList.add('hidden');
  document.getElementById('recordedCheckInsContent').classList.remove('hidden');
  document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
  document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600', 'border-gray-200');
  document.getElementById('checkInTab').classList.add('text-gray-600', 'border-gray-200');
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

function updateMap(latitude, longitude) {
  if (!map) {
    console.error('Map not initialized');
    return;
  }
  
  const position = { lat: latitude, lng: longitude };
  if (marker) {
    marker.position = position;
  } else {
    marker = new google.maps.marker.AdvancedMarkerElement({
      position: position,
      map: map
    });
  }
  map.setCenter(position);
  map.setZoom(15);
}

export async function getFreddyStatus() {
  const statusDoc = await getDoc(doc(db, "status", "freddy"));
  return statusDoc.exists() ? statusDoc.data().mode : "OK";
}

export async function setFreddyStatus(mode) {
  await setDoc(doc(db, "status", "freddy"), { mode });
}
