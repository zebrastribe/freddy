// Configuration file for API keys and settings
// This file fetches API keys from Firebase Cloud Functions for security

import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Default configuration (fallback)
const defaultConfig = {
  // Google Maps API Configuration
  googleMaps: {
    apiKey: 'demo-google-maps-key',
    mapId: '8bac4e61a05fc3c2',
    defaultCenter: { lat: 55.6606758, lng: 12.5226001 },
    defaultZoom: 15
  },
  
  // reCAPTCHA Configuration
  recaptcha: {
    siteKey: '6LdA7jIqAAAAAKYtion4hiHa7R--TT3maGb0EpNZ'
  },
  
  // Firebase Configuration
  firebase: {
    apiKey: "demo-api-key",
    authDomain: "tracker-6a648.firebaseapp.com",
    projectId: "tracker-6a648",
    storageBucket: "tracker-6a648.appspot.com",
    messagingSenderId: "789878332530",
    appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
    measurementId: "G-XMHHKFJ9QW"
  },
  
  // App Configuration
  app: {
    name: 'Freddy',
    version: '1.0.0',
    entriesPerPage: 10,
    checkInCooldown: 15000 // 15 seconds
  }
};

// Cache for API keys
let apiKeysCache = null;
let apiKeysCacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch API keys from Firebase Cloud Functions
async function fetchApiKeys() {
  try {
    // Check cache first
    const now = Date.now();
    if (apiKeysCache && (now - apiKeysCacheTime) < CACHE_DURATION) {
      return apiKeysCache;
    }

    // Fetch from Cloud Function
    const response = await fetch('https://us-central1-tracker-6a648.cloudfunctions.net/getApiKeys');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiKeys = await response.json();
    
    // Update cache
    apiKeysCache = apiKeys;
    apiKeysCacheTime = now;
    
    return apiKeys;
  } catch (error) {
    console.warn('Failed to fetch API keys from Firebase, using defaults:', error);
    return {
      googleMaps: defaultConfig.googleMaps.apiKey,
      firebase: defaultConfig.firebase.apiKey,
      recaptcha: defaultConfig.recaptcha.siteKey
    };
  }
}

// Dynamic configuration that fetches API keys
export const config = {
  ...defaultConfig,
  // These will be updated when fetchApiKeys() is called
  googleMaps: {
    ...defaultConfig.googleMaps
  },
  recaptcha: {
    ...defaultConfig.recaptcha
  },
  firebase: {
    ...defaultConfig.firebase
  }
};

// Initialize API keys
export async function initializeConfig() {
  try {
    const apiKeys = await fetchApiKeys();
    
    // Update config with fetched keys
    config.googleMaps.apiKey = apiKeys.googleMaps;
    config.firebase.apiKey = apiKeys.firebase;
    config.recaptcha.siteKey = apiKeys.recaptcha;
    
    console.log('Configuration initialized with Firebase API keys');
  } catch (error) {
    console.error('Failed to initialize configuration:', error);
    // Continue with default keys
  }
}

// Environment-specific configurations
export const getConfig = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Development environment
    return {
      ...config,
      environment: 'development'
    };
  } else if (hostname.includes('github.io')) {
    // GitHub Pages environment
    return {
      ...config,
      environment: 'production',
      // Add any production-specific overrides here
    };
  } else {
    // Production environment
    return {
      ...config,
      environment: 'production'
    };
  }
};

// Get Firestore instance from global Firebase app
function getDb() {
  if (window.firebaseDB) {
    return window.firebaseDB;
  }
  // Fallback: create a new instance if global is not available
  const { getFirestore } = require('https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js');
  const { initializeApp } = require('https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js');
  const app = initializeApp(config.firebase);
  return getFirestore(app);
}

export async function getFreddyStatus() {
  try {
    const db = getDb();
    const statusDoc = await getDoc(doc(db, "freddy_status", "current"));
    return statusDoc.exists() ? statusDoc.data().mode : "OK";
  } catch (error) {
    console.error('Failed to get Freddy status:', error);
    return "OK"; // Default to OK if there's an error
  }
}

export async function setFreddyStatus(mode) {
  try {
    const db = getDb();
    await setDoc(doc(db, "freddy_status", "current"), { mode });
  } catch (error) {
    console.error('Failed to set Freddy status:', error);
  }
}

// Initialize config when module loads
initializeConfig();

window.onload = async () => {
  // ...fetch and show status...
}; 