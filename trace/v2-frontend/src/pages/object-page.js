import { db } from '../shared/lib/firebase_config.js';
import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, onSnapshot, limit } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { Translation } from '../shared/modules/translation/translation.js';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { logger } from '../shared/lib/logger.js';

export class ObjectPage {
  constructor() {
    this.app = window.traceApp;
    this.translation = new Translation();
    this.state = {
      loading: true,
      error: null,
      user: null,
      pet: null,
      checkins: [],
      notificationsEnabled: false,
      notificationStatus: '',
      tokenValid: false,
      checkingToken: true,
      checkinSuccessMessage: ''
    };
    logger.info('object_page_initialized');
    
    // Set up notification listener for cross-device notifications
    this.setupNotificationListener();
    }
  
  setupNotificationListener() {
    logger.debug('notification_listener_setup_start');
    
    // Get current object info for filtering
    const params = this.extractRouteParams();
    if (!params) {
      logger.error('notification_listener_setup_failed', { reason: 'missing_route_params' });
      return;
    }
    
    // Listen for new notifications in Firestore, filtered by object name
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('objectName', '==', params.name),
      orderBy('timestamp', 'desc'), 
      limit(10)
    );
    
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          logger.debug('notification_received', { objectName: notification.objectName });
          
          // Check if user has notifications enabled for THIS specific object
          const objectNotificationKey = `notifications_enabled_${params.name}`;
          const notificationsEnabled = localStorage.getItem(objectNotificationKey) === 'true';
          const permissionGranted = Notification.permission === 'granted';
          
          console.log('[Notification] Object notification key:', objectNotificationKey);
          console.log('[Notification] Notifications enabled for this object:', notificationsEnabled);
          console.log('[Notification] Permission granted:', permissionGranted);
          
          if (notificationsEnabled && permissionGranted) {
            console.log('[Notification] User has notifications enabled for this object, showing notification...');
            this.showCrossDeviceNotification(notification);
          } else {
            console.log('[Notification] User does not have notifications enabled for this object or permission not granted');
          }
        }
      });
    }, (error) => {
      console.error('[Notification] Error listening for notifications:', error);
    });
  }
  
  showCrossDeviceNotification(notification) {
    console.log('[Notification] Showing cross-device notification for:', notification.objectName);
    
    const notificationOptions = {
      body: `📍 ${notification.objectName} has been checked in at ${notification.location}!`,
      icon: '/img/android-chrome-192x192.png',
      badge: '/img/android-chrome-192x192.png',
      tag: 'object-checkin-cross-device',
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200]
    };
    
    try {
      const notificationInstance = new Notification('Object Check-in Alert!', notificationOptions);
      
      notificationInstance.onclick = function() {
        console.log('[Notification] Cross-device notification clicked');
        window.focus();
        notificationInstance.close();
      };
      
      console.log('[Notification] Cross-device notification created successfully');
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        notificationInstance.close();
      }, 10000);
      
    } catch (error) {
      console.error('[Notification] Error creating cross-device notification:', error);
    }
  }
  
  extractRouteParams() {
    const path = window.location.pathname;
    const parts = path.split('/').filter(part => part);
    console.log('🔍 Extracting route params from path:', path, 'parts:', parts);
    
    if (parts.length >= 2) {
      const userid = parts[0];
      const name = parts[1];
      console.log('✅ Route params extracted:', { userid, name });
      return { userid, name };
    }
    
    console.error('❌ Invalid route format');
    return null;
  }

  async fetchUserByUrlName(urlName) {
    console.log('👤 Fetching user by urlName:', urlName);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('urlName', '==', urlName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        console.log('📋 Found userId:', userId);
        
        const userData = userDoc.data();
        console.log('✅ User fetched:', userData);
        return { userId, userData };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('❌ Error fetching user:', error);
      throw error;
    }
  }

  async fetchPetByName(userId, petName) {
    console.log('📦 Fetching object by name:', petName, 'for user:', userId);
    try {
      const objectsRef = collection(db, 'users', userId, 'objects');
      const q = query(objectsRef, where('name', '==', petName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const petDoc = querySnapshot.docs[0];
        const petData = petDoc.data();
        console.log('✅ Object fetched:', petData);
        return { id: petDoc.id, ...petData };
      } else {
        throw new Error('Object not found');
      }
    } catch (error) {
      console.error('❌ Error fetching object:', error);
      throw error;
    }
  }

  async fetchCheckins(userId, objectId) {
    console.log('📋 Fetching checkins for object:', objectId, 'user:', userId);
    try {
      const checkinsRef = collection(db, 'users', userId, 'objects', objectId, 'checkins');
      const q = query(checkinsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const checkins = [];
      querySnapshot.forEach(doc => {
        checkins.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('✅ Checkins fetched:', checkins.length);
      return checkins;
    } catch (error) {
      console.error('❌ Error fetching checkins:', error);
      return [];
    }
  }

  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        options
      );
    });
  }

  async handleCheckin() {
    console.log('[CheckIn] handleCheckin method called!');
    const t = this.translation;
    const submitButton = document.getElementById('checkin-submit');
    const locationInput = document.getElementById('location');
    const notesInput = document.getElementById('notes');
    
    if (!locationInput.value.trim()) {
      this.setState({ checkinSuccessMessage: '' });
      alert(t.translate('location_required_error'));
      return;
    }
    
    // Clear previous success message
    this.setState({ checkinSuccessMessage: '' });
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.textContent = t.translate('submitting');
    
    try {
      // Get current location
      const position = await this.getCurrentLocation();
      
      // Prepare checkin data
      const checkinData = {
        location: locationInput.value.trim(),
        notes: notesInput.value.trim(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: new Date().toISOString(),
        submittedBy: 'guest'
      };
      
      // Get route parameters
      const params = this.extractRouteParams();
      if (!params) {
        throw new Error('Invalid route parameters');
      }
      
      // Add to Firestore
      const userId = this.state.user.uid || this.state.user.id;
      console.log('[CheckIn] Saving checkin for userId:', userId, 'objectName:', params.name);
      console.log('[DEBUG] User object:', this.state.user);
      console.log('[DEBUG] Params object:', params);
      
      if (!userId) {
        throw new Error('User ID is undefined!');
      }
      if (!params.name) {
        throw new Error('Object name is undefined!');
      }
      
      const objectId = this.state.pet && this.state.pet.id;
      if (!objectId) {
        throw new Error('Object ID is undefined!');
      }

      const checkinsRef = collection(db, 'users', userId, 'objects', objectId, 'checkins');
      console.log('[DEBUG] Checkins collection path:', `users/${userId}/objects/${objectId}/checkins`);
      await addDoc(checkinsRef, checkinData);
      
      const clicksRef = collection(db, 'clicks');
      await addDoc(clicksRef, {
        objectId,
        objectName: params.name,
        userId,
        location: locationInput.value.trim(),
        type: 'object_checkin',
        timestamp: new Date().toISOString()
      });
      
      // Add a visual indicator in the console
      console.log('🎉 🎉 🎉 CHECK-IN SUCCESSFUL - NOTIFICATION SENT TO OTHER USERS! 🎉 🎉 🎉');
      console.log('📱 Other users with notifications enabled will receive this notification');
      console.log('🔔 The notification will appear on their devices/browsers');
      
      // Clear form
      locationInput.value = '';
      notesInput.value = '';
      
      // Show success message
      this.setState({
        checkinSuccessMessage: t.translate('checkin_saved'),
      });
      
      // Add a visual notification indicator on the page
      const successDiv = document.getElementById('checkin-success-message');
      if (successDiv) {
        successDiv.innerHTML = `
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div class="flex items-center">
              <span class="text-2xl mr-2">✅</span>
              <div>
                <strong>Check-in saved successfully!</strong>
                <br>
                <span class="text-sm">🔔 Notification sent to other users</span>
              </div>
            </div>
          </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
          if (successDiv) {
            successDiv.innerHTML = '';
          }
        }, 5000);
      }
      
      // Create a floating notification that appears on the page
      this.showFloatingNotification();
      
      // Refresh checkins
      const checkins = await this.fetchCheckins(userId, objectId);
      this.setState({ checkins });
      this.renderContent();
      
    } catch (error) {
      logger.error('checkin_save_failed', {
        message: error && error.message,
        code: error && error.code
      });
      this.setState({
        checkinSuccessMessage: '',
      });
      alert(t.translate('checkin_error_message') + (error && error.message ? ('\n' + error.message) : ''));
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = t.translate('submit_checkin');
    }
  }

  async render() {
    console.log('🎨 Starting PetPage render...');
    
    try {
      // Extract route parameters
      const params = this.extractRouteParams();
      if (!params) {
        throw new Error('Invalid route');
      }
      
      // Set loading state
      this.setState({ loading: true, error: null });
      console.log('🔄 Setting loading state...');
      
      // Fetch data
      console.log('📡 Fetching data...');
      const { userId, userData } = await this.fetchUserByUrlName(params.userid);
      const pet = await this.fetchPetByName(userId, params.name);
      const checkins = await this.fetchCheckins(userId, pet.id);
      
      // Set the language based on pet preference, fallback to browser detection
      const petLanguage = pet.language || 'auto';
      if (petLanguage !== 'auto') {
        this.translation.setLanguage(petLanguage);
        console.log('🌐 Using pet language preference:', petLanguage);
      } else {
        console.log('🌐 Using browser language detection');
      }
      
      // Load translations
      await this.translation.loadTranslations();
      
      // Read token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const tokenValid = Boolean(token && token.trim().length > 0);
      console.log('🔐 Token validation result:', tokenValid);
      
      // Update state with fetched data and token validation
      this.setState({
        loading: false,
        user: { ...userData, id: userId }, // Add the user ID to the user object
        pet,
        checkins,
        tokenValid,
        checkingToken: false
      });
      
      // Render the content first
      this.renderContent();
      
      // Check notification permission AFTER initial render
      await this.checkNotificationPermission();
      
      // Wait a bit for DOM to be ready, then re-render notification section
      setTimeout(() => {
        this.renderNotificationSection();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in PetPage render:', error);
      this.setState({
        loading: false,
        error: error.message,
        checkingToken: false
      });
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  setupNotificationButton() {
    const notificationToggle = document.getElementById('notification-toggle');
    if (notificationToggle) {
      notificationToggle.addEventListener('click', async () => {
        console.log('[Notification] Button clicked');
        const permission = Notification.permission;
        console.log('[Notification] Current permission:', permission);
        
        // Get current pet info for pet-specific notifications
        const params = this.extractRouteParams();
        if (!params) {
          console.error('[Notification] Cannot setup notifications - no route params');
          return;
        }
        
        const petNotificationKey = `notifications_enabled_${params.name}`;
        console.log('[Notification] Pet notification key:', petNotificationKey);
        
        if (permission === 'denied') {
          console.log('[Notification] Permission denied, showing help message');
          this.setState({ notificationStatus: this.translation.translate('notification_denied') });
          this.renderNotificationSection();
          return;
        }
        
        if (this.state.notificationsEnabled) {
          // Disable notifications for this specific pet
          console.log('[Notification] Disabling notifications for pet:', params.name);
          this.setState({
            notificationsEnabled: false,
            notificationStatus: ''
          });
          localStorage.removeItem(petNotificationKey);
          console.log('[Notification] Notifications disabled for pet:', params.name);
          this.renderNotificationSection();
        } else {
          // Request permission
          console.log('[Notification] Requesting permission for pet:', params.name);
          this.setState({
            notificationStatus: this.translation.translate('notification_requesting')
          });
          this.renderNotificationSection();
          
          try {
            // Safari requires user interaction to request permission
            const result = await Notification.requestPermission();
            console.log('[Notification] Permission result:', result);
            
            if (result === 'granted') {
              console.log('[Notification] Permission granted, enabling notifications for pet:', params.name);
              this.setState({
                notificationsEnabled: true,
                notificationStatus: this.translation.translate('notification_enabled')
              });
              localStorage.setItem(petNotificationKey, 'true');
              console.log('[Notification] Notifications enabled for pet:', params.name);
              this.renderNotificationSection();
              
              // Test notification immediately
              setTimeout(async () => {
                console.log('[Notification] Sending test notification after enabling...');
                // Force a permission check before sending
                if (Notification.permission !== 'granted') {
                  console.log('[Notification] Permission not granted after enabling, requesting again...');
                  const result = await Notification.requestPermission();
                  console.log('[Notification] Second permission request result:', result);
                }
                await this.sendTestNotification();
              }, 1000);
            } else if (result === 'denied') {
              console.log('[Notification] Permission denied');
              this.setState({
                notificationsEnabled: false,
                notificationStatus: this.translation.translate('notification_denied')
              });
              localStorage.removeItem(petNotificationKey);
              this.renderNotificationSection();
            } else {
              console.log('[Notification] Permission defaulted');
              this.setState({
                notificationsEnabled: false,
                notificationStatus: ''
              });
              localStorage.removeItem(petNotificationKey);
              this.renderNotificationSection();
            }
          } catch (err) {
            console.error('[Notification] Error requesting permission:', err);
            this.setState({
              notificationStatus: this.translation.translate('notification_error')
            });
            this.renderNotificationSection();
          }
        }
      });
    }
  }

  async sendTestNotification() {
    console.log('[Notification] Attempting to send notification...');
    console.log('[Notification] Notifications enabled:', this.state.notificationsEnabled);
    console.log('[Notification] Permission status:', Notification.permission);
    
    // Get current pet info for pet-specific notifications
    const params = this.extractRouteParams();
    if (!params) {
      console.error('[Notification] Cannot send test notification - no route params');
      return;
    }
    
    const petNotificationKey = `notifications_enabled_${params.name}`;
    console.log('[Notification] Pet notification key:', petNotificationKey);
    
    // Check if notifications should be enabled (fallback check)
    const hasEverEnabled = localStorage.getItem(petNotificationKey) === 'true';
    const permissionGranted = Notification.permission === 'granted';
    const shouldEnable = this.state.notificationsEnabled || (hasEverEnabled && permissionGranted);
    console.log('[Notification] Should enable (fallback check):', shouldEnable);
    console.log('[Notification] Has ever enabled for this pet:', hasEverEnabled);
    console.log('[Notification] Permission granted:', permissionGranted);
    
    // Force notification if user has ever enabled it, even if current state is unclear
    if (!shouldEnable && !hasEverEnabled) {
      console.log('[Notification] Notifications not enabled, skipping');
      return;
    }
    
    if (Notification.permission !== 'granted') {
      console.log('[Notification] Permission not granted, attempting to restore...');
      // Try to restore permission if user has ever enabled notifications
      if (hasEverEnabled) {
        console.log('[Notification] User has previously enabled notifications, attempting to restore permission...');
        try {
          const permission = await Notification.requestPermission();
          console.log('[Notification] Permission request result:', permission);
          if (permission !== 'granted') {
            console.log('[Notification] Permission restoration failed');
            return;
          }
        } catch (error) {
          console.error('[Notification] Error requesting permission:', error);
          return;
        }
      } else {
        console.log('[Notification] Permission not granted and user has never enabled notifications, skipping');
        return;
      }
    }
    
    // Additional Firefox-specific check: if permission is default but user has enabled before
    if (Notification.permission === 'default' && hasEverEnabled) {
      console.log('[Notification] Firefox permission reset detected, forcing permission request...');
      try {
        const permission = await Notification.requestPermission();
        console.log('[Notification] Firefox permission request result:', permission);
        if (permission !== 'granted') {
          console.log('[Notification] Firefox permission request failed');
          return;
        }
      } catch (error) {
        console.error('[Notification] Error with Firefox permission request:', error);
        return;
      }
    }
    
    // Final check: if we still don't have permission but user has enabled before, try one more time
    if (Notification.permission !== 'granted' && hasEverEnabled) {
      console.log('[Notification] Final permission check failed, but user has enabled before. Trying one more time...');
      try {
        const finalPermission = await Notification.requestPermission();
        console.log('[Notification] Final permission request result:', finalPermission);
        if (finalPermission !== 'granted') {
          console.log('[Notification] All permission attempts failed');
          return;
        }
      } catch (error) {
        console.error('[Notification] Error with final permission request:', error);
        return;
      }
    }
    
    try {
      console.log('[Notification] Creating notification...');
      
      // Enhanced notification options for better visibility
      const notificationOptions = {
        body: `🎉 ${this.state.pet.name} has been checked in successfully! Click to view details.`,
        icon: '/img/android-chrome-192x192.png',
        badge: '/img/android-chrome-192x192.png',
        tag: 'pet-checkin', // Prevents duplicate notifications
        requireInteraction: true,  // Keep notification visible until user interacts
        silent: false,
        vibrate: [200, 100, 200] // Vibration pattern for mobile
      };
      
      console.log('[Notification] Notification options:', notificationOptions);
      
      const notification = new Notification('🐾 Pet Check-in Alert!', notificationOptions);
      
      console.log('[Notification] Notification created successfully');
      
      notification.onclick = function() {
        console.log('[Notification] Notification clicked');
        window.focus();
        notification.close();
      };
      
      notification.onshow = function() {
        console.log('[Notification] Notification shown');
        // Also show a console message to make it more visible
        console.log('🔔 NOTIFICATION SHOWN: Pet check-in successful!');
      };
      
      notification.onerror = function(error) {
        console.error('[Notification] Notification error:', error);
      };
      
      // Auto-close after 10 seconds (increased from 5)
      setTimeout(() => {
        console.log('[Notification] Auto-closing notification');
        notification.close();
      }, 10000);
      
      // Also show an alert as a fallback for testing
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Removed fallback alert for localhost
      }
      
    } catch (err) {
      console.error('[Notification] Error sending notification:', err);
      console.error('[Notification] Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
    }
  }

  async checkNotificationPermission() {
    console.log('[Notification] Checking notification permission...');
    
    // Get current pet info for pet-specific notifications
    const params = this.extractRouteParams();
    if (!params) {
      console.error('[Notification] Cannot check permission - no route params');
      return false;
    }
    
    const petNotificationKey = `notifications_enabled_${params.name}`;
    console.log('[Notification] Pet notification key:', petNotificationKey);
    
    // Check current permission status (don't request permission automatically)
    const permission = Notification.permission;
    console.log('[Notification] Current permission:', permission);
    
    // Check if user previously enabled notifications for THIS specific pet
    const wasEnabled = localStorage.getItem(petNotificationKey) === 'true';
    console.log('[Notification] Was previously enabled for this pet:', wasEnabled);
    
    // If permission was previously granted but is now default, try to restore it
    if (wasEnabled && permission === 'default') {
      console.log('[Notification] Permission was previously granted but is now default, attempting to restore...');
      try {
        const newPermission = await Notification.requestPermission();
        console.log('[Notification] Permission request result:', newPermission);
        if (newPermission === 'granted') {
          localStorage.setItem(petNotificationKey, 'true');
          console.log('[Notification] Permission restored successfully for pet:', params.name);
        }
      } catch (error) {
        console.error('[Notification] Error requesting permission:', error);
      }
    }
    
    // Re-check permission after potential restoration
    const finalPermission = Notification.permission;
    console.log('[Notification] Final permission after restoration attempt:', finalPermission);
    
    // Determine if notifications should be enabled for this specific pet
    const shouldEnable = finalPermission === 'granted' && wasEnabled;
    console.log('[Notification] Should enable notifications for this pet:', shouldEnable);
    
    // Update state
    this.setState({
      notificationsEnabled: shouldEnable,
      notificationStatus: shouldEnable 
        ? this.translation.translate('notification_enabled')
        : ''
    });
    
    console.log('[Notification] State updated:', {
      notificationsEnabled: shouldEnable,
      notificationStatus: this.state.notificationStatus
    });
    
    // Also update localStorage to ensure consistency
    if (shouldEnable && finalPermission === 'granted') {
      localStorage.setItem(petNotificationKey, 'true');
      console.log('[Notification] Updated localStorage to enabled for pet:', params.name);
    }
    
    return shouldEnable;
  }

  renderNotificationSection() {
    const notificationSection = document.getElementById('notification-section');
    if (notificationSection) {
      const permission = Notification.permission;
      const deniedHelp = permission === 'denied'
        ? `<div class="text-xs text-gray-500 mt-1">To enable notifications, allow them in your browser settings for this site.</div>`
        : '';
      
      let buttonText = this.translation.translate('notification_enable');
      let buttonClass = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors';
      let buttonDisabled = '';
      if (permission === 'granted') {
        if (this.state.notificationsEnabled) {
          buttonText = 'Disable notifications';
          buttonClass = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors';
        } else {
          buttonText = this.translation.translate('notification_enable');
          buttonClass = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors';
        }
      } else if (permission === 'denied') {
        buttonDisabled = 'disabled';
      }
      
      notificationSection.innerHTML = `
        <button id="notification-toggle" class="${buttonClass}" ${buttonDisabled}>
          ${buttonText}
        </button>
        <div id="notification-status" style="margin-top:8px;color:#2d7a2d;min-height:1.5em;">${this.state.notificationStatus}</div>
        ${deniedHelp}
      `;
      this.setupNotificationButton();
    }
  }

  renderContent() {
    const { pet, user, checkins, loading, error, tokenValid, checkingToken, checkinSuccessMessage } = this.state;
    
    if (loading) {
      this.renderLoading();
      return;
    }
    
    if (error) {
      this.renderError();
      return;
    }

    const t = this.translation;
    
    // Only show the missing banner if pet.status === 'missing'
    let contactInfo = user && user.phone ? user.phone : t.translate('no_contact_info');
    const safePetName = this.escapeHtml(pet.name || 'Object');
    const safeSpecies = this.escapeHtml(pet.species || t.translate('unknown'));
    const safeBreed = this.escapeHtml(pet.breed || t.translate('unknown'));
    const safeDescription = this.escapeHtml(pet.description || t.translate('no_description'));
    const safeContactInfo = this.escapeHtml(contactInfo);
    const missingBanner = pet.status === 'missing' ? `
      <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm">
              <strong>⚠️ ${safePetName} ${t.translate('pet_missing_warning')} ${safeContactInfo}.</strong>
            </p>
          </div>
        </div>
      </div>
    ` : '';
    
    const html = `
      <div class="min-h-screen bg-gray-50 py-8">
        <div class="max-w-4xl mx-auto px-4">
          ${missingBanner}
          <!-- Pet Info -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">${safePetName}</h1>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Pet Details -->
              <div>
                <h2 class="text-xl font-semibold text-gray-800 mb-4">${t.translate('pet_info_title')}</h2>
                <div class="space-y-3">
                  <div>
                    <span class="font-medium text-gray-700">${t.translate('species_label')}</span>
                    <span class="ml-2 text-gray-600">${safeSpecies}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">${t.translate('breed_label')}</span>
                    <span class="ml-2 text-gray-600">${safeBreed}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-700">${t.translate('description_label')}</span>
                    <span class="ml-2 text-gray-600">${safeDescription}</span>
                  </div>
                </div>
              </div>

              <!-- Notification Toggle -->
              <div>
                <h3 class="text-lg font-semibold text-gray-800 mb-3">${t.translate('notifications_title')}</h3>
                <p class="text-sm text-gray-600 mb-4">${t.translate('notifications_description')}</p>
                <div id="notification-section">
                  <button id="notification-toggle" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
                    ${t.translate('notification_enable')}
                  </button>
                  <div id="notification-status" style="margin-top:8px;color:#2d7a2d;min-height:1.5em;"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Token Status -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">${t.translate('token_status_title')}</h3>
            <div id="token-status" class="text-sm">
              ${checkingToken ? t.translate('checking_token') : 
                (tokenValid ? t.translate('valid_token') : t.translate('invalid_token'))}
            </div>
          </div>

          <!-- Check-in Form -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">${t.translate('checkin_form_title')} ${safePetName}s trail</h2>
            
            <form id="checkin-form" class="space-y-4">
              <div>
                <label for="location" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t.translate('location_label')}
                </label>
                <div class="flex gap-2">
                  <input type="text" id="location" name="location" required
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="${t.translate('location_placeholder')}">
                  <button type="button" id="get-location-btn" class="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300" title="Get current location">📍</button>
                </div>
              </div>
              
              <div>
                <label for="notes" class="block text-sm font-medium text-gray-700 mb-2">
                  ${t.translate('note_label')}
                </label>
                <textarea id="notes" name="notes" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="${t.translate('note_placeholder')}"></textarea>
              </div>
              
              <button type="submit" id="checkin-submit"
                      class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      ${!tokenValid ? 'disabled' : ''}>
                ${t.translate('checkin_button')}
              </button>
            </form>
            ${checkinSuccessMessage ? `<div class="mt-4 text-green-600 font-semibold">${checkinSuccessMessage}</div>` : ''}
            <div id="checkin-success-message"></div>
          </div>

          <!-- Previous Check-ins -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">${t.translate('previous_checkins_title')}</h2>
            
            <div id="checkins-list">
              ${checkins.length === 0 ? 
                `<p class="text-gray-500">${t.translate('no_checkins_yet')}</p>` :
                checkins.map(checkin => `
                  <div class="border-b border-gray-200 py-3 last:border-b-0">
                    <div class="flex justify-between items-start">
                      <div>
                        <p class="font-medium text-gray-900">${this.escapeHtml(checkin.location)}</p>
                        <p class="text-sm text-gray-600">${new Date(checkin.timestamp?.toDate ? checkin.timestamp.toDate() : checkin.timestamp).toLocaleString()}</p>
                        ${checkin.notes ? `<p class="text-sm text-gray-600 mt-1">${this.escapeHtml(checkin.notes)}</p>` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <!-- Back to Home -->
          <div class="mt-6">
            <a href="/" class="inline-flex items-center text-blue-600 hover:text-blue-800">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    `;

    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = html;
      this.attachEventListeners();
      // Autofill location with device location
      this.setLocationToDevice();
    }
  }

  renderLoading() {
    const t = this.translation;
    const html = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-gray-600">${t.translate('Loading...')}</p>
        </div>
      </div>
    `;
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = html;
    }
  }

  renderError() {
    const html = `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p class="text-gray-600">${this.state.error || 'An error occurred'}</p>
          <a href="/" class="mt-4 inline-block text-blue-600 hover:text-blue-800">Back to Home</a>
        </div>
      </div>
    `;
    
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = html;
    }
  }

  attachEventListeners() {
    // Notification toggle
    const notificationToggle = document.getElementById('notification-toggle');
    if (notificationToggle) {
      notificationToggle.addEventListener('click', () => {
        const t = this.translation;
        const isEnabled = notificationToggle.textContent.includes(t.translate('enable_notifications'));
        notificationToggle.textContent = isEnabled ? t.translate('disable_notifications') : t.translate('enable_notifications');
        notificationToggle.classList.toggle('bg-blue-500');
        notificationToggle.classList.toggle('bg-gray-500');
      });
    }

    // Check-in form
    const checkinForm = document.getElementById('checkin-form');
    if (checkinForm) {
      console.log('[EventListeners] Setting up checkin form listener');
      checkinForm.addEventListener('submit', async (e) => {
        console.log('[EventListeners] Form submitted!');
        e.preventDefault();
        console.log('[EventListeners] About to call handleCheckin...');
        await this.handleCheckin();
        console.log('[EventListeners] handleCheckin completed');
      });
    } else {
      console.error('[EventListeners] Checkin form not found!');
    }
  }

  setLocationToDevice() {
    const locationInput = document.getElementById('location');
    const getLocationBtn = document.getElementById('get-location-btn');
    if (!locationInput) return;

    function setLocation(pos) {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      locationInput.value = `${lat},${lng}`;
      locationInput.classList.remove('error');
      locationInput.placeholder = '';
      console.log('[CheckIn] Location set:', locationInput.value);
    }

    function setError(err) {
      locationInput.value = '';
      locationInput.placeholder = 'Unable to get location (GPS)';
      locationInput.classList.add('error');
      console.error('[CheckIn] Geolocation error:', err);
    }

    if (getLocationBtn) {
      // Remove previous event listeners by replacing the node
      const newBtn = getLocationBtn.cloneNode(true);
      getLocationBtn.parentNode.replaceChild(newBtn, getLocationBtn);
      newBtn.addEventListener('click', () => {
        console.log('[CheckIn] Pin button clicked');
        locationInput.value = '';
        locationInput.placeholder = 'Getting location...';
        if (navigator.geolocation) {
          let timeoutId = setTimeout(() => {
            console.warn('[CheckIn] getCurrentPosition timeout, trying watchPosition...');
            // Try watchPosition as fallback
            const watchId = navigator.geolocation.watchPosition(
              pos => {
                setLocation(pos);
                navigator.geolocation.clearWatch(watchId);
              },
              err => {
                setError('Unable to get location (watchPosition)');
                navigator.geolocation.clearWatch(watchId);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }, 10000); // 10s timeout for getCurrentPosition

          navigator.geolocation.getCurrentPosition(
            pos => {
              clearTimeout(timeoutId);
              setLocation(pos);
            },
            err => {
              clearTimeout(timeoutId);
              setError('Unable to get location (getCurrentPosition)');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          setError('Geolocation not supported');
        }
      });
    }
  }
  
  showFloatingNotification() {
    // Create a floating notification element
    const notification = document.createElement('div');
    notification.id = 'floating-notification';
    notification.innerHTML = `
      <div class="fixed top-4 right-4 bg-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-500 ease-in-out translate-x-full">
        <div class="flex items-center">
          <span class="text-2xl mr-3">🔔</span>
          <div>
            <div class="font-bold">Check-in Successful!</div>
            <div class="text-sm opacity-90">${this.state.pet.name} has been checked in</div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
            <span class="text-xl">×</span>
          </button>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.querySelector('div').style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.querySelector('div').style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 500);
      }
    }, 5000);
    
    // Also try to send the real notification (but don't depend on it)
    setTimeout(() => {
      this.sendTestNotification();
    }, 1000);
  }
}

export function renderObjectPage(userId, objectName) {
  return `
    <div class="min-h-screen bg-gradient-to-br from-pink-50 to-white py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-6">Object Profile: ${objectName}</h1>
          <p class="text-gray-600 mb-6">This page will contain object profile and tracking information.</p>
          <div class="bg-gray-100 rounded-lg p-8 text-center">
            <p class="text-gray-500">Object profile component will be integrated here</p>
            <p class="text-sm text-gray-400 mt-2">Owner: ${userId} | Object: ${objectName}</p>
          </div>
          <button onclick="window.location.href='/'" class="mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  `;
}
