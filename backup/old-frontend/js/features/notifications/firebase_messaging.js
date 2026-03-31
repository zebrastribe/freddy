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
   * @param {string} userId - User ID (optional for backward compatibility)
   * @param {string} petId - Pet UUID (optional for backward compatibility)
   */
  constructor(app, db, vapidKey, userId = null, petId = null) {
    this.app = app;
    this.db = db;
    this.vapidKey = vapidKey;
    this.userId = userId;
    this.petId = petId;
    this.messaging = getMessaging(app);
    this.fcmToken = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Firebase messaging
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up foreground message handler
      this.setupForegroundHandler();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing FirebaseMessaging:', error);
      throw error;
    }
  }

  /**
   * Request FCM permission and get token
   * @returns {Promise<string|null>} FCM token or null if permission denied
   */
  async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get the existing service worker registration
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          await this.registerServiceWorker();
        }
        
        // Get FCM token using the existing service worker
        try {
          const token = await getToken(this.messaging, {
            vapidKey: this.vapidKey,
            serviceWorkerRegistration: registration || await navigator.serviceWorker.getRegistration()
          });
          
          if (token) {
            this.fcmToken = token;
            // Save token to Firestore for server-side notifications
            await this.saveToken(token);
            return token;
          }
        } catch (tokenError) {
          console.error('FCM token error:', tokenError);
        }
      }
    } catch (error) {
      console.error('Error getting FCM permission:', error);
    }
    
    return null;
  }

  /**
   * Save FCM token to Firestore
   * @param {string} token - FCM token to save
   */
  async saveToken(token) {
    try {
      // Use multi-user structure if userId and petId are provided
      if (this.userId && this.petId) {
        await setDoc(doc(this.db, "fcm_tokens", `${this.userId}_${this.petId}`), {
          userId: this.userId,
          petId: this.petId,
          token: token,
          timestamp: new Date(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          },
          permissions: {
            granted: Notification.permission === 'granted',
            denied: Notification.permission === 'denied',
            default: Notification.permission === 'default'
          }
        });
      } else {
        // Fallback to legacy structure for backward compatibility
        await setDoc(doc(this.db, "fcm_tokens", "admin"), {
          token: token,
          timestamp: new Date(),
          userAgent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  }

  /**
   * Set up foreground message handler
   */
  setupForegroundHandler() {
    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      // Check if notification is for this user/pet (if multi-user mode)
      if (this.userId && this.petId) {
        const { userId, petId } = payload.data || {};
        if (userId !== this.userId || petId !== this.petId) {
          return; // Not for this user/pet
        }
      }
      
      const notificationTitle = payload.notification?.title || 
        `Ny ${payload.data?.petName || 'Pet'} Check-in! 🐱`;
      const notificationOptions = {
        body: payload.notification?.body || 'Nogen har lige checket ind!',
        icon: '/img/emoji-cat-192x192.png',
        badge: '/img/emoji-cat-192x192.png',
        tag: this.userId && this.petId ? 
          `checkin-${this.userId}-${this.petId}` : 'freddy-checkin-fcm',
        requireInteraction: false,
        silent: false,
        data: payload.data
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
        
        const registration = await navigator.serviceWorker.register(swPath);
        return registration;
      } catch (error) {
        console.error('Service worker registration failed:', error);
        // Try fallback path for GitHub Pages
        if (window.location.hostname === 'zebrastribe.github.io') {
          try {
            const fallbackRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
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