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

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { logTokenFromUrl, getToken, isTokenValid, useToken } from './incoming.js';
import { config, getConfig } from './config.js';
import { Translation } from './modules/translation/translation.js';
import { getFreddyStatus } from './config.js';

// Initialize Firebase
const firebaseConfig = getConfig().firebase;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let user = null;
let marker;
let currentPage = 1;
const entriesPerPage = getConfig().app.entriesPerPage;
let map = null;
let recordedMap = null;
let notificationPermission = false;
let lastCheckInTime = null;
let hasValidToken = false; // Track if user has a valid token

// Suppress reCAPTCHA 401 errors from cluttering the console
window.addEventListener('error', (event) => {
  if (event.message && event.message.includes('recaptcha') && event.message.includes('401')) {
    event.preventDefault();
    return false;
  }
});

// Call the function to log the token from URL
logTokenFromUrl();

// Initialize maps when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  const translation = new Translation();
  await translation.loadTranslations();
  translation.applyTranslations();
  
  // Initialize maps
  await initializeFreddyApp();

  // Register service worker and request notification permissions
  await registerServiceWorker();
  await requestNotificationPermission();
  setupCheckInListener();
  setupNotificationToggle();

  try {
    const mode = await getFreddyStatus();
    if (mode === 'MISSING') {
      document.getElementById('freddy-warning').style.display = '';
    }
  } catch (e) {
    console.warn('Could not fetch Freddy status:', e);
    // Don't show error to users, just log it - the warning banner will remain hidden
  }

  // Await token processing after DOM is ready
  await processToken();
});

// Dynamic Google Maps API loader
function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const config = getConfig();
    const apiKey = config.googleMaps.apiKey;
    
    if (!apiKey) {
      reject(new Error('Google Maps API key not available'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps API script loaded');
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
}

// Initialize the app
async function initializeFreddyApp() {
  try {
    // Wait for config to be initialized
    await new Promise(resolve => {
      const checkConfig = () => {
        const config = getConfig();
        if (config.googleMaps.apiKey) {
          resolve();
        } else {
          setTimeout(checkConfig, 100);
        }
      };
      checkConfig();
    });

    // Load Google Maps API
    await loadGoogleMapsAPI();
    
    // Initialize maps
    initializeMaps();
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

function initializeMaps() {
  waitForGoogleMaps(() => {
    const mapConfig = getConfig().googleMaps;
    
    // Initialize the main map
    map = new google.maps.Map(document.getElementById('map'), {
      center: mapConfig.defaultCenter,
      zoom: mapConfig.defaultZoom,
      mapId: mapConfig.mapId,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });

    // Initialize the recorded check-ins map
    recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
      center: mapConfig.defaultCenter,
      zoom: mapConfig.defaultZoom,
      mapId: mapConfig.mapId,
      disableDefaultUI: true,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false
    });

    console.log('Maps initialized successfully');
  });
}

function waitForGoogleMaps(callback, maxAttempts = 100) {
  let attempts = 0;
  
  function checkGoogleMaps() {
    attempts++;
    
    if (window.google && window.google.maps && window.google.maps.Map) {
      console.log('Google Maps API loaded successfully');
      callback();
    } else if (attempts >= maxAttempts) {
      console.error('Google Maps API failed to load after', maxAttempts, 'attempts');
      // Continue without maps - show error message to user
      const mapElements = document.querySelectorAll('#map, #recordedMap');
      mapElements.forEach(element => {
        element.innerHTML = '<div class="flex items-center justify-center h-full bg-gray-100 text-gray-600">Map could not be loaded. Please refresh the page.</div>';
      });
    } else {
      setTimeout(checkGoogleMaps, 100);
    }
  }
  
  checkGoogleMaps();
}

// Make token validation mandatory for check-ins
async function processToken() {
  const token = getToken();
  if (token) {
    const valid = await isTokenValid();
    if (valid) {
      console.log('Token is valid.');
      await useToken();
      hasValidToken = true;
    } else {
      console.log('Token is not valid.');
      hasValidToken = false;
    }
  } else {
    console.log('No token provided - check-ins will be blocked.');
    hasValidToken = false;
  }
  
  // Update the UI to show token status
  updateTokenStatus();
}

// Function to update token status indicator
function updateTokenStatus() {
  const tokenValid = document.getElementById('token-valid');
  const tokenInvalid = document.getElementById('token-invalid');
  const tokenLoading = document.getElementById('token-loading');
  const clickButton = document.getElementById('clickButton');
  
  // Hide all status indicators
  tokenValid.classList.add('hidden');
  tokenInvalid.classList.add('hidden');
  tokenLoading.classList.add('hidden');
  
  // Show the appropriate status and update button state
  if (hasValidToken) {
    tokenValid.classList.remove('hidden');
    clickButton.disabled = false;
    clickButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
    clickButton.classList.add('bg-blue-500', 'hover:bg-blue-700');
  } else {
    tokenInvalid.classList.remove('hidden');
    clickButton.disabled = true;
    clickButton.classList.add('bg-gray-400', 'cursor-not-allowed');
    clickButton.classList.remove('bg-blue-500', 'hover:bg-blue-700');
  }
}

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

  // Check if user has a valid token
  if (!hasValidToken) {
    errorMessage.classList.remove('hidden');
    errorMessage.innerText = "Access denied. A valid token is required to check in.";
    return;
  }

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
    let recaptchaToken = null;
    
    // Get reCAPTCHA key from config
    const recaptchaKey = getConfig().recaptcha.siteKey;
    
    // Only verify reCAPTCHA if it's enabled
    if (recaptchaKey && recaptchaKey !== 'null') {
      // Verify reCAPTCHA first
      if (typeof grecaptcha === 'undefined') {
        console.warn('reCAPTCHA not loaded - continuing without verification');
        recaptchaToken = null;
      } else {
        try {
          console.log('Requesting reCAPTCHA token...');
          recaptchaToken = await grecaptcha.execute(recaptchaKey, {action: 'checkin'});
          console.log('reCAPTCHA token received');
          if (!recaptchaToken) {
            console.warn('reCAPTCHA verification failed - continuing without token');
            recaptchaToken = null;
          }
        } catch (recaptchaError) {
          console.warn('reCAPTCHA error - continuing without verification:', recaptchaError.message);
          recaptchaToken = null;
        }
      }
    } else {
      console.log('reCAPTCHA is disabled - skipping verification');
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
            recaptchaToken: recaptchaToken // Include reCAPTCHA token (null if disabled)
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
    console.warn('Map not initialized - skipping update');
    return;
  }
  
  if (!window.google || !window.google.maps) {
    console.warn('Google Maps API not available - skipping update');
    return;
  }
  
  try {
    const position = { lat: latitude, lng: longitude };
    if (marker) {
      marker.position = position;
    } else {
      if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: position,
          map: map
        });
      } else {
        console.warn('AdvancedMarkerElement not available - using regular marker');
        marker = new google.maps.Marker({
          position: position,
          map: map
        });
      }
    }
    map.setCenter(position);
    map.setZoom(15);
  } catch (error) {
    console.error('Error updating map:', error);
  }
}

// Register Firebase messaging service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
      console.log('Firebase messaging service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
  return null;
}

// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermission = true;
    updateNotificationButton();
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    updateNotificationButton();
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission === 'granted';
    updateNotificationButton();
    
    // If permission granted, also request FCM permission
    if (notificationPermission) {
      await requestFCMPermission();
    }
    
    return notificationPermission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    updateNotificationButton();
    return false;
  }
}

// Update notification button text
function updateNotificationButton() {
  const button = document.getElementById('notification-toggle');
  if (button) {
    button.innerHTML = notificationPermission ? '🔔 Notifikationer: TIL' : '🔕 Notifikationer: FRA';
  }
}

// Handle notification toggle button click
function setupNotificationToggle() {
  const button = document.getElementById('notification-toggle');
  if (button) {
    button.addEventListener('click', async () => {
      if (notificationPermission) {
        notificationPermission = false;
        updateNotificationButton();
      } else {
        const granted = await requestNotificationPermission();
        if (granted) {
          updateNotificationButton();
        }
      }
    });
  }
}

// Show notification for new check-in
function showCheckInNotification(checkIn) {
  if (!notificationPermission) return;

  const notification = new Notification('Ny Freddy Check-in! 🐱', {
    body: `${checkIn.name} har lige checket ind!`,
    icon: '/img/emoji-cat-192x192.png',
    badge: '/img/emoji-cat-192x192.png',
    tag: 'freddy-checkin',
    requireInteraction: false,
    silent: false
  });

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click on notification
  notification.onclick = function() {
    window.focus();
    notification.close();
  };
}

// Set up real-time listener for new check-ins
function setupCheckInListener() {
  const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"), limit(1));
  
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const checkIn = change.doc.data();
        const checkInTime = checkIn.timestamp?.toDate?.() || new Date();
        
        // Only show notification if this is a new check-in (not from page load)
        if (lastCheckInTime && checkInTime > lastCheckInTime) {
          showCheckInNotification(checkIn);
        }
        
        lastCheckInTime = checkInTime;
      }
    });
  }, (error) => {
    console.error("Error listening to check-ins:", error);
  });
}
