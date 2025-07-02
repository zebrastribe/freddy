/**
 * FirebaseMessaging - Handles Firebase Cloud Messaging operations
 * 
 * This class provides a clean interface for managing FCM tokens,
 * requesting permissions, and handling push notifications.
 */
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export class FirebaseMessaging {
  /**
   * Create a new FirebaseMessaging instance
   * @param {Object} app - Firebase app instance
   * @param {Object} db - Firestore database instance
   * @param {string} vapidKey - VAPID key for FCM
   */
  constructor(app, db, vapidKey) {
    this.app = app;
    this.db = db;
    this.vapidKey = vapidKey;
    this.messaging = getMessaging(app);
    this.fcmToken = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Firebase messaging
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[DEBUG] FirebaseMessaging already initialized');
      return;
    }

    try {
      // Set up foreground message handler
      this.setupForegroundHandler();
      this.isInitialized = true;
      console.log('[DEBUG] FirebaseMessaging initialized successfully');
    } catch (error) {
      console.error('[DEBUG] Error initializing FirebaseMessaging:', error);
      throw error;
    }
  }

  /**
   * Request FCM permission and get token
   * @returns {Promise<string|null>} FCM token or null if permission denied
   */
  async requestPermission() {
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
          await this.registerServiceWorker();
        }
        
        // Get FCM token using the existing service worker
        try {
          console.log('[DEBUG] Requesting FCM token...');
          const token = await getToken(this.messaging, {
            vapidKey: this.vapidKey,
            serviceWorkerRegistration: registration || await navigator.serviceWorker.getRegistration()
          });
          console.log('[DEBUG] FCM token result:', token);
          
          if (token) {
            this.fcmToken = token;
            console.log('[DEBUG] FCM Token:', token);
            // Save token to Firestore for server-side notifications
            await this.saveToken(token);
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

  /**
   * Save FCM token to Firestore
   * @param {string} token - FCM token to save
   */
  async saveToken(token) {
    try {
      console.log('[DEBUG] Saving FCM token to Firestore...');
      await setDoc(doc(this.db, "fcm_tokens", "admin"), {
        token: token,
        timestamp: new Date(),
        userAgent: navigator.userAgent
      });
      console.log('[DEBUG] FCM token saved to Firestore');
    } catch (error) {
      console.error('[DEBUG] Error saving FCM token:', error);
      throw error;
    }
  }

  /**
   * Set up foreground message handler
   */
  setupForegroundHandler() {
    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Show notification even when app is in foreground
      const notificationTitle = payload.notification?.title || 'Ny Freddy Check-in! 🐱';
      const notificationOptions = {
        body: payload.notification?.body || 'Nogen har lige checket ind!',
        icon: '/img/emoji-cat-192x192.png',
        badge: '/img/emoji-cat-192x192.png',
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
  }

  /**
   * Register Firebase messaging service worker
   * @returns {Promise<ServiceWorkerRegistration|null>} Service worker registration
   */
  async registerServiceWorker() {
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

  /**
   * Get the current FCM token
   * @returns {string|null} Current FCM token
   */
  getToken() {
    return this.fcmToken;
  }

  /**
   * Check if FCM is available
   * @returns {boolean} True if FCM is supported
   */
  isSupported() {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  /**
   * Check if permission is granted
   * @returns {boolean} True if notification permission is granted
   */
  isPermissionGranted() {
    return Notification.permission === 'granted';
  }

  /**
   * Check if permission is denied
   * @returns {boolean} True if notification permission is denied
   */
  isPermissionDenied() {
    return Notification.permission === 'denied';
  }
} 