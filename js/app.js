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

import { logTokenFromUrl, getToken, isTokenValid, useToken } from './incoming.js';
import { config, getConfig } from './config.js';
import { Translation } from './modules/translation/translation.js';
import { getFreddyStatus } from './config.js';
import { StorageManager } from './lib/storage.js';
import { db, auth, checkAuthState, onAuthStateChanged } from './lib/firebase_config.js';
import { FirebaseMessaging } from './features/notifications/firebase_messaging.js';
import { CheckInManager } from './features/checkin/checkin_manager.js';
import { CheckInUI } from './features/checkin/checkin_ui.js';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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
let firebaseMessaging = null; // Firebase messaging instance
let checkInManager = null; // Check-in manager instance
let checkInUI = null; // Check-in UI instance

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

  // Initialize Firebase messaging
  await initializeFirebaseMessaging();
  
  // Initialize check-in system
  await initializeCheckInSystem();
  
  // Register service worker
  await registerServiceWorker();

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
  
  // Set up notification toggle last, after everything else is ready
  console.log('Setting up notification toggle...');
  setupNotificationToggle();
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
  if (checkInUI) {
    checkInUI.updateTokenStatus(hasValidToken);
  } else {
    // Fallback to direct DOM manipulation if CheckInUI is not available
    const clickButton = document.getElementById('clickButton');
    const checkInForm = document.getElementById('check-in-form');
    const checkInTab = document.getElementById('checkInTab');
    const recordedCheckInsTab = document.getElementById('recordedCheckInsTab');
    const checkInContent = document.getElementById('checkInContent');
    const recordedCheckInsContent = document.getElementById('recordedCheckInsContent');

    // Always hide the token status indicators - no need to inform users
    const tokenStatusContainer = document.getElementById('token-status');
    if (tokenStatusContainer) {
      tokenStatusContainer.classList.add('hidden');
    }

    if (hasValidToken) {
      if (clickButton) {
        clickButton.disabled = false;
        clickButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
        clickButton.classList.add('bg-blue-500', 'hover:bg-blue-700');
      }
      if (checkInForm) checkInForm.classList.remove('hidden');
      // Enable the check-in tab
      if (checkInTab) {
        checkInTab.disabled = false;
        checkInTab.classList.remove('opacity-50', 'pointer-events-none');
      }
    } else {
      if (clickButton) {
        clickButton.disabled = true;
        clickButton.classList.add('bg-gray-400', 'cursor-not-allowed');
        clickButton.classList.remove('bg-blue-500', 'hover:bg-blue-700');
      }
      if (checkInForm) checkInForm.classList.add('hidden');
      // Disable the check-in tab
      if (checkInTab) {
        checkInTab.disabled = true;
        checkInTab.classList.add('opacity-50', 'pointer-events-none');
      }
    }
  }
}

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
    
    // Use CheckInManager if available, otherwise fall back to old functions
    if (checkInManager) {
      checkInManager.fetchLastCoordinates().then(coordinates => {
        if (coordinates) {
          updateMap(coordinates.latitude, coordinates.longitude);
        }
      });
      checkInManager.fetchCheckIns();
    } else {
      fetchLastCoordinates(); // Fallback to old function
      fetchCheckIns(); // Fallback to old function
    }
  } else {
    user = null;
    console.info("No Firebase user authenticated (this is OK for public check-in).");
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

// Initialize Firebase messaging
async function initializeFirebaseMessaging() {
  try {
    const { app, VAPID_KEY } = await import('./lib/firebase_config.js');
    firebaseMessaging = new FirebaseMessaging(app, db, VAPID_KEY);
    await firebaseMessaging.initialize();
    console.log('[DEBUG] Firebase messaging initialized successfully');
  } catch (error) {
    console.error('[DEBUG] Failed to initialize Firebase messaging:', error);
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if (!firebaseMessaging) {
    console.error('[DEBUG] Firebase messaging not initialized');
    return false;
  }

  if (!firebaseMessaging.isSupported()) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (firebaseMessaging.isPermissionGranted()) {
    notificationPermission = true;
    return true;
  }

  if (firebaseMessaging.isPermissionDenied()) {
    console.log('Notification permission denied');
    notificationPermission = false;
    return false;
  }

  try {
    const token = await firebaseMessaging.requestPermission();
    notificationPermission = !!token;
    return notificationPermission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    notificationPermission = false;
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

function setupNotificationToggle() {
  const toggle = document.getElementById('notification-toggle');
  const message = document.getElementById('notification-permission-message');
  const toggleLabel = toggle.closest('label');
  if (!toggle) {
    console.error('Notification toggle element not found!');
    return;
  }

  // CURSOR: Using StorageManager for cleaner localStorage handling
  const notificationStorage = new StorageManager('notificationPreference', 'false');

  // Debug: Log initial state
  console.log('[DEBUG] setupNotificationToggle called');
  console.log('[DEBUG] localStorage.notificationPreference:', notificationStorage.get());

  // Set toggle state from localStorage ONLY
  const userPreference = notificationStorage.getBoolean();
  console.log('[DEBUG] Setting toggle.checked to', userPreference, 'from localStorage');
  toggle.checked = userPreference;
  
  // Update the global notificationPermission variable to match localStorage
  notificationPermission = userPreference;

  // Only disable the toggle if browser permission is denied
  if (firebaseMessaging && firebaseMessaging.isPermissionDenied()) {
    console.log('[DEBUG] Browser permission denied, disabling toggle');
    toggle.disabled = true;
    if (message) {
      message.textContent = 'Du har blokeret notifikationer for denne side. Tillad dem i browserens indstillinger for at aktivere.';
      message.classList.remove('hidden');
    }
  } else {
    toggle.disabled = false;
    if (message) message.classList.add('hidden');
  }

  // Add click handler to label for disabled toggle
  if (toggleLabel) {
    toggleLabel.addEventListener('click', (e) => {
      if (toggle.disabled) {
        e.preventDefault();
        alert('Du har blokeret notifikationer for denne side. Gå til browserens indstillinger for at tillade dem igen.');
      }
    });
  }

  toggle.addEventListener('change', async (e) => {
    console.log('[DEBUG] Toggle changed. Checked:', toggle.checked);
    
    if (toggle.checked) {
      // User wants to enable notifications
      // First, update localStorage immediately
      notificationStorage.setBoolean(true);
      notificationPermission = true;
      console.log('[DEBUG] localStorage set to true');
      
      // Then request permission if not already granted
      if (!firebaseMessaging || !firebaseMessaging.isPermissionGranted()) {
        const permission = await Notification.requestPermission();
        console.log('[DEBUG] Notification.requestPermission() result:', permission);
        if (permission !== 'granted') {
          // Permission denied - revert toggle and localStorage
          toggle.checked = false;
          notificationStorage.setBoolean(false);
          notificationPermission = false;
          console.log('[DEBUG] Permission denied - reverted to false');
          if (message) {
            message.textContent = 'Du har blokeret notifikationer for denne side. Tillad dem i browserens indstillinger for at aktivere.';
            message.classList.remove('hidden');
          }
          if (permission === 'denied') {
            toggle.disabled = true;
          }
          return;
        }
      }
      
      // Permission granted, enable notifications
      if (message) message.classList.add('hidden');
      try {
        if (firebaseMessaging) {
          await firebaseMessaging.requestPermission();
        }
        console.log('[DEBUG] Device linked for notifications');
        
        // Update CheckInManager notification permission
        if (checkInManager) {
          checkInManager.setNotificationPermission(true);
        }
      } catch (error) {
        console.error('Failed to link device for notifications:', error);
        // Don't revert the toggle - user preference is still true
        // Just log the error
      }
    } else {
      // User wants to disable notifications
      // Update localStorage immediately
      notificationStorage.setBoolean(false);
      notificationPermission = false;
      console.log('[DEBUG] localStorage set to false');
      
      if (message) message.classList.add('hidden');
      try {
        // You can add logic here to remove the FCM token from your backend
        console.log('[DEBUG] Device unlinked from notifications');
        
        // Update CheckInManager notification permission
        if (checkInManager) {
          checkInManager.setNotificationPermission(false);
        }
      } catch (error) {
        console.error('Failed to unlink device:', error);
      }
    }
    console.log('[DEBUG] localStorage.notificationPreference after change:', notificationStorage.get());
  });
}

// Initialize check-in system
async function initializeCheckInSystem() {
  try {
    const config = getConfig();
    checkInManager = new CheckInManager(db, auth, config);
    
    // Create a simple map manager for now (we'll extract this in Phase 4)
    const mapManager = {
      updateMap: updateMap,
      addMarker: (lat, lng, title) => {
        if (recordedMap && typeof lat === 'number' && typeof lng === 'number') {
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            new google.maps.marker.AdvancedMarkerElement({
              position: { lat, lng },
              map: recordedMap,
              title: title
            });
          }
        }
      }
    };
    
    checkInUI = new CheckInUI(checkInManager, mapManager);
    
    // Set up check-in listener
    checkInManager.setupCheckInListener();
    
    console.log('[DEBUG] Check-in system initialized successfully');
  } catch (error) {
    console.error('[DEBUG] Failed to initialize check-in system:', error);
  }
}
