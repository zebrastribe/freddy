/*
The provided JavaScript code sets up Firebase services for a web application, including initialization, analytics, Firestore, and authentication. It also includes functions to handle user authentication and monitor authentication state changes.
The script begins by importing necessary Firebase services from the Firebase CDN. These services include initializeApp for initializing the Firebase app, getAnalytics for Firebase Analytics, getFirestore for Firestore database, and getAuth, signInAnonymously, and onAuthStateChanged for authentication.
Next, the script defines the Firebase configuration object, firebaseConfig, which contains the necessary credentials and identifiers for the Firebase project. This configuration includes the API key, authentication domain, project ID, storage bucket, messaging sender ID, app ID, and measurement ID.
The Firebase app is then initialized using the initializeApp function with the provided configuration. The getAnalytics, getFirestore, and getAuth functions are called to initialize Firebase Analytics, Firestore, and Authentication services, respectively. These initialized services are stored in the analytics, db, and auth constants.
The authenticateUser function handles user authentication by signing in anonymously using the signInAnonymously function from Firebase Authentication. If an error occurs during the sign-in process, it is caught and logged to the console.
The checkAuthState function monitors the authentication state of the user using the onAuthStateChanged function. It checks if the user is authenticated and logs a message accordingly. If the user is not authenticated, it attempts to re-authenticate the user by calling the authenticateUser function. Any errors during re-authentication are caught and logged to the console.
Finally, the script exports the db, auth, checkAuthState, and onAuthStateChanged variables and functions, making them available for use in other parts of the application. This setup ensures that the Firebase services are properly initialized and that user authentication is managed effectively.
*/

// Import Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js";

// Your web app's Firebase configuration 
const firebaseConfig = {
  apiKey: "AIzaSyBwLFO04OQgD6LjYdYlrEXb73THTp5H0Ss",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// FCM Token management
let fcmToken = null;

// Function to handle user authentication
function authenticateUser() {
  return signInAnonymously(auth).catch((error) => {
    console.error("Error signing in anonymously: ", error);
  });
}

// Check authentication state and re-authenticate if necessary
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User is authenticated on SiteB");
      // Proceed with your logic here
    } else {
      console.log("User is not authenticated on SiteB, re-authenticating...");
      authenticateUser().then(() => {
        // Proceed with your logic here
      }).catch((error) => {
        console.error("Error during re-authentication on SiteB:", error);
      });
    }
  });
}

// Request FCM permission and get token
async function requestFCMPermission() {
  console.log('[DEBUG] Entered requestFCMPermission handler');
  try {
    console.log('[DEBUG] Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('[DEBUG] Notification permission result:', permission);
    if (permission === 'granted') {
      console.log('[DEBUG] Notification permission granted');
      
      // Get the existing service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      console.log('[DEBUG] Existing service worker registration:', registration);
      
      if (!registration) {
        console.log('[DEBUG] No service worker registration found, registering now...');
        await registerFirebaseMessagingServiceWorker();
      }
      
      // Get FCM token using the existing service worker
      try {
        console.log('[DEBUG] Requesting FCM token...');
        const token = await getToken(messaging, {
          vapidKey: 'BI4KzajvA8eJRZ8p3D-yRATNm0eDeS2hfToxP7LB6_9uTU0b3UjooAgdnJoqszasRw2qWxWFxmMN9WnZxK1EUiY',
          serviceWorkerRegistration: registration || await navigator.serviceWorker.getRegistration()
        });
        console.log('[DEBUG] FCM token result:', token);
        if (token) {
          fcmToken = token;
          console.log('[DEBUG] FCM Token:', token);
          // Save token to Firestore for server-side notifications
          await saveFCMToken(token);
          return token;
        } else {
          console.log('[DEBUG] No registration token available');
        }
      } catch (tokenError) {
        console.log('[DEBUG] FCM token error:', tokenError);
      }
    } else {
      console.log('[DEBUG] Notification permission denied');
    }
  } catch (error) {
    console.error('[DEBUG] Error getting FCM permission:', error);
  }
  return null;
}

// Save FCM token to Firestore
async function saveFCMToken(token) {
  try {
    console.log('[DEBUG] Saving FCM token to Firestore...');
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");
    await setDoc(doc(db, "fcm_tokens", "admin"), {
      token: token,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    });
    console.log('[DEBUG] FCM token saved to Firestore');
  } catch (error) {
    console.error('[DEBUG] Error saving FCM token:', error);
  }
}

// Handle foreground messages
onMessage(messaging, (payload) => {
  console.log('Message received in foreground:', payload);
  
  // Show notification even when app is in foreground
  const notificationTitle = payload.notification?.title || 'Ny Freddy Check-in! 🐱';
  const notificationOptions = {
    body: payload.notification?.body || 'Nogen har lige checket ind!',
    icon: '/freddy/img/emoji-cat-192x192.png',
    badge: '/freddy/img/emoji-cat-192x192.png',
    tag: 'freddy-checkin-fcm',
    requireInteraction: false,
    silent: false
  };

  if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    // Fallback to browser notifications
    new Notification(notificationTitle, notificationOptions);
  }
});

// Register Firebase messaging service worker (for FCM push notifications)
export async function registerFirebaseMessagingServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Detect if we're on GitHub Pages (repository name in path)
      const isGitHubPages = window.location.hostname === 'zebrastribe.github.io';
      const swPath = isGitHubPages ? '/freddy/firebase-messaging-sw.js' : '/firebase-messaging-sw.js';
      
      console.log('[DEBUG] Registering service worker at:', swPath);
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Firebase messaging service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      // Try fallback path for GitHub Pages
      if (window.location.hostname === 'zebrastribe.github.io') {
        try {
          console.log('[DEBUG] Trying fallback path for GitHub Pages');
          const fallbackRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
          console.log('Firebase messaging service worker registered with fallback:', fallbackRegistration);
          return fallbackRegistration;
        } catch (fallbackError) {
          console.error('Fallback service worker registration also failed:', fallbackError);
        }
      }
    }
  }
  return null;
}

// Export necessary functions and variables
export { db, auth, checkAuthState, onAuthStateChanged, requestFCMPermission, fcmToken };