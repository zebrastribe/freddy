/**
 * CheckInManager - Handles all check-in related operations
 * 
 * This class provides a clean interface for managing check-ins,
 * including creating new check-ins, fetching existing ones,
 * and managing the check-in UI and notifications.
 */
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export class CheckInManager {
  /**
   * Create a new CheckInManager instance
   * @param {Object} db - Firestore database instance
   * @param {Object} auth - Firebase auth instance
   * @param {Object} config - App configuration
   */
  constructor(db, auth, config) {
    this.db = db;
    this.auth = auth;
    this.config = config;
    this.currentPage = 1;
    this.entriesPerPage = config.app.entriesPerPage;
    this.lastCheckInTime = null;
    this.notificationPermission = false;
    this.onCheckInCreated = null; // Callback for when check-in is created
    this.onCheckInFetched = null; // Callback for when check-ins are fetched
  }

  /**
   * Set notification permission
   * @param {boolean} permission - Notification permission status
   */
  setNotificationPermission(permission) {
    this.notificationPermission = permission;
  }

  /**
   * Set callback for when check-in is created
   * @param {Function} callback - Callback function
   */
  setOnCheckInCreated(callback) {
    this.onCheckInCreated = callback;
  }

  /**
   * Set callback for when check-ins are fetched
   * @param {Function} callback - Callback function
   */
  setOnCheckInFetched(callback) {
    this.onCheckInFetched = callback;
  }

  /**
   * Create a new check-in
   * @param {string} name - User's name
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @param {string|null} recaptchaToken - reCAPTCHA token (optional)
   * @returns {Promise<Object>} Created check-in document
   */
  async createCheckIn(name, latitude, longitude, recaptchaToken = null) {
    try {
      // Ensure user is authenticated
      if (!this.auth.currentUser) {
        try {
          await this.auth.signInAnonymously();
        } catch (authError) {
          console.log('Anonymous authentication error:', authError.message);
          // Continue anyway, as Firestore rules might allow unauthenticated writes
        }
      }
      
      const docRef = await addDoc(collection(this.db, "clicks"), {
        timestamp: serverTimestamp(),
        userId: this.auth.currentUser?.uid || null,
        name: name,
        latitude: latitude,
        longitude: longitude,
        recaptchaToken: recaptchaToken
      });
      
      console.log("Check-in successfully created! ID:", docRef.id);
      
      // Trigger callback if set
      if (this.onCheckInCreated) {
        this.onCheckInCreated({ latitude, longitude, name });
      }
      
      return docRef;
    } catch (error) {
      console.error("Error creating check-in:", error);
      throw error;
    }
  }

  /**
   * Fetch the last known coordinates
   * @returns {Promise<Object|null>} Last coordinates or null
   */
  async fetchLastCoordinates() {
    if (!this.auth.currentUser) {
      console.log("No authenticated user - skipping last coordinates fetch");
      return null;
    }

    try {
      const q = query(collection(this.db, "clicks"), orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[0];
        const { latitude, longitude } = lastDoc.data();
        return { latitude, longitude };
      } else {
        console.log("No previous coordinates found.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching last coordinates:", error);
      throw error;
    }
  }

  /**
   * Fetch all check-ins with pagination
   * @param {number} page - Page number (1-based)
   * @returns {Promise<Object>} Check-ins data with pagination info
   */
  async fetchCheckIns(page = 1) {
    try {
      const q = query(collection(this.db, "clicks"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      
      const docs = querySnapshot.docs;
      const totalPages = Math.ceil(docs.length / this.entriesPerPage);
      const start = (page - 1) * this.entriesPerPage;
      const end = start + this.entriesPerPage;
      const currentDocs = docs.slice(start, end);

      const checkIns = currentDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '-',
          latitude: typeof data.latitude === 'number' ? data.latitude : '-',
          longitude: typeof data.longitude === 'number' ? data.longitude : '-',
          timestamp: data.timestamp,
          formattedDate: this.formatDate(data.timestamp),
          time: this.formatTime(data.timestamp)
        };
      }).filter(checkIn => 
        checkIn.name !== '-' && 
        checkIn.latitude !== '-' && 
        checkIn.longitude !== '-' && 
        checkIn.formattedDate !== '-'
      );

      const result = {
        checkIns,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: docs.length,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      // Trigger callback if set
      if (this.onCheckInFetched) {
        this.onCheckInFetched(result);
      }

      return result;
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      throw error;
    }
  }

  /**
   * Format date for display
   * @param {Object} timestamp - Firestore timestamp
   * @returns {string} Formatted date string
   */
  formatDate(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '-';
    }
    
    const date = timestamp.toDate();
    return `${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
  }

  /**
   * Format time for display
   * @param {Object} timestamp - Firestore timestamp
   * @returns {string} Formatted time string
   */
  formatTime(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
      return '-';
    }
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /**
   * Show notification for new check-in
   * @param {Object} checkIn - Check-in data
   */
  showCheckInNotification(checkIn) {
    if (!this.notificationPermission) return;

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

  /**
   * Set up real-time listener for new check-ins
   * @returns {Function} Unsubscribe function
   */
  setupCheckInListener() {
    const q = query(collection(this.db, "clicks"), orderBy("timestamp", "desc"), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const checkIn = change.doc.data();
          const checkInTime = checkIn.timestamp?.toDate?.() || new Date();
          
          // Only show notification if this is a new check-in (not from page load)
          if (this.lastCheckInTime && checkInTime > this.lastCheckInTime) {
            this.showCheckInNotification(checkIn);
          }
          
          this.lastCheckInTime = checkInTime;
        }
      });
    }, (error) => {
      console.error("Error listening to check-ins:", error);
    });

    return unsubscribe;
  }

  /**
   * Get user's current geolocation
   * @returns {Promise<Object>} Geolocation coordinates
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Error getting location: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Validate check-in data
   * @param {string} name - User's name
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Object} Validation result
   */
  validateCheckInData(name, latitude, longitude) {
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (typeof latitude !== 'number' || isNaN(latitude)) {
      errors.push("Valid latitude is required");
    }

    if (typeof longitude !== 'number' || isNaN(longitude)) {
      errors.push("Valid longitude is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 