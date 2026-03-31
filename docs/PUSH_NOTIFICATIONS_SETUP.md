# 🔔 Multi-User Push Notifications Setup Guide

## ✅ **Current Implementation Status**

### **Completed Features**
- ✅ **Multi-User Notifications**: Each user gets notifications only for their pets
- ✅ **Service Worker**: Background notification handling with user/pet routing
- ✅ **Notification Preferences**: Per-user/pet notification settings
- ✅ **Quiet Hours**: Respect user's sleep schedule
- ✅ **FCM Integration**: Firebase Cloud Messaging with VAPID key
- ✅ **Foreground Handling**: Notifications when app is open
- ✅ **Background Handling**: Notifications when app is closed
- ✅ **Click Routing**: Notifications open correct user/pet URL

### **Architecture Overview**
```javascript
// Multi-user notification structure
const notificationSystem = {
  // Per-pet notification tokens
  fcmTokens: {
    collection: 'fcm_tokens',
    documentId: `${userId}_${petId}`,
    structure: {
      userId: 'string',
      petId: 'string',
      token: 'string',
      deviceInfo: 'object',
      permissions: 'object'
    }
  },
  
  // Notification preferences per user/pet
  notificationPreferences: {
    collection: 'notification_preferences',
    documentId: `${userId}_${petId}`,
    structure: {
      userId: 'string',
      petId: 'string',
      preferences: {
        checkins: 'boolean',
        daily: 'boolean',
        weekly: 'boolean',
        emergency: 'boolean'
      },
      quietHours: {
        start: 'string',    // "22:00"
        end: 'string',      // "08:00"
        timezone: 'string'  // "Europe/Copenhagen"
      }
    }
  }
};
```

## 🚀 **Setup Instructions**

### **1. Firebase VAPID Key Configuration**

#### **Get VAPID Key from Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`tracker-6a648`)
3. Go to **Project Settings** → **Cloud Messaging**
4. Generate a new **Web Push certificate** (VAPID key)
5. Copy the key

#### **Update VAPID Key in Code**
Replace the VAPID key in `js/lib/firebase_config.js`:
```javascript
export const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_HERE';
```

### **2. Service Worker Configuration**

#### **Update Service Worker Path**
The service worker is already configured for multi-user support:
```javascript
// firebase-messaging-sw.js
messaging.onBackgroundMessage((payload) => {
  const { userId, petId, petName } = payload.data || {};
  
  const notificationTitle = `Ny ${petName || 'Pet'} Check-in! 🐱`;
  const notificationOptions = {
    data: {
      userId,
      petId,
      petName,
      url: `/${userId}/${petName}/`
    }
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### **3. Multi-User Notification Integration**

#### **Initialize Notifications for User/Pet**
```javascript
// In your app initialization
import { FirebaseMessaging } from './features/notifications/firebase_messaging.js';
import { NotificationPreferences } from './features/notifications/notification_preferences.js';

class MultiUserApp {
  async initializeNotifications(userId, petId) {
    const { app, db, VAPID_KEY } = await import('./lib/firebase_config.js');
    
    // Initialize Firebase messaging
    this.notificationSystem = new FirebaseMessaging(app, db, VAPID_KEY, userId, petId);
    await this.notificationSystem.initialize();
    await this.notificationSystem.requestPermission();
    
    // Initialize notification preferences
    this.notificationPreferences = new NotificationPreferences(db, userId, petId);
  }
}
```

#### **Set Up Notification Preferences**
```javascript
// Configure notification preferences
const prefs = await this.notificationPreferences.getPreferences();

// Update preferences
await this.notificationPreferences.updatePreferences({
  preferences: {
    checkins: true,
    daily: false,
    weekly: false,
    emergency: true
  },
  quietHours: {
    start: "22:00",
    end: "08:00",
    timezone: "Europe/Copenhagen"
  }
});
```

### **4. Server-Side Notification Sending**

#### **Cloud Functions for Firebase**
Create `functions/notifications.js`:
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendCheckinNotification = functions.firestore
  .document('checkins/{checkinId}')
  .onCreate(async (snap, context) => {
    const checkinData = snap.data();
    const { userId, petId, petName } = checkinData;
    
    // Get notification preferences
    const prefsDoc = await admin.firestore()
      .collection('notification_preferences')
      .doc(`${userId}_${petId}`)
      .get();
    
    if (!prefsDoc.exists || !prefsDoc.data().preferences.checkins) {
      return null; // Notifications disabled
    }
    
    // Check quiet hours
    const prefs = prefsDoc.data();
    const isQuiet = await checkQuietHours(prefs.quietHours);
    if (isQuiet) {
      return null; // Quiet hours
    }
    
    // Get FCM tokens
    const tokensSnapshot = await admin.firestore()
      .collection('fcm_tokens')
      .where('userId', '==', userId)
      .where('petId', '==', petId)
      .get();
    
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
    
    if (tokens.length === 0) {
      return null; // No tokens found
    }
    
    // Send notification
    const message = {
      notification: {
        title: `Ny ${petName} Check-in! 🐱`,
        body: 'Nogen har lige checket ind!'
      },
      data: {
        userId,
        petId,
        petName,
        checkinId: context.params.checkinId
      },
      tokens: tokens
    };
    
    return admin.messaging().sendMulticast(message);
  });
```

### **5. Testing Push Notifications**

#### **Local Testing**
1. **Start Firebase Emulator**:
   ```bash
   firebase emulators:start --only firestore,functions
   ```

2. **Test Notification Flow**:
   - Create a check-in in Firestore
   - Verify Cloud Function triggers
   - Check notification delivery

#### **Production Testing**
1. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

2. **Test on Mobile Device**:
   - Install PWA on phone
   - Allow notifications
   - Lock screen
   - Create check-in
   - Verify notification appears

## 📱 **Mobile Installation**

### **Android**
1. Open Chrome
2. Navigate to your app
3. Tap menu → "Add to Home Screen"
4. Open from home screen
5. Allow notifications when prompted

### **iOS**
1. Open Safari
2. Navigate to your app
3. Tap share → "Add to Home Screen"
4. Open from home screen
5. Allow notifications when prompted

## 🔧 **Configuration Options**

### **Notification Types**
```javascript
const notificationTypes = {
  checkins: {
    title: 'Ny Check-in! 🐱',
    body: 'Nogen har lige checket ind!',
    icon: '/img/emoji-cat-192x192.png'
  },
  daily: {
    title: 'Daglig Oversigt 📊',
    body: 'Se dagens check-ins',
    icon: '/img/emoji-cat-192x192.png'
  },
  weekly: {
    title: 'Ugens Oversigt 📈',
    body: 'Se ugens aktivitet',
    icon: '/img/emoji-cat-192x192.png'
  },
  emergency: {
    title: 'VIGTIGT! ⚠️',
    body: 'Hurtig handling påkrævet',
    icon: '/img/emoji-cat-192x192.png'
  }
};
```

### **Quiet Hours Configuration**
```javascript
const quietHoursConfig = {
  default: {
    start: "22:00",
    end: "08:00",
    timezone: "Europe/Copenhagen"
  },
  weekend: {
    start: "23:00",
    end: "09:00",
    timezone: "Europe/Copenhagen"
  },
  custom: {
    start: "21:00",
    end: "07:00",
    timezone: "Europe/Copenhagen"
  }
};
```

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Notifications Not Working**
1. **Check VAPID Key**: Verify key is correct in `firebase_config.js`
2. **Service Worker**: Ensure service worker is registered
3. **Permissions**: Check browser notification permissions
4. **FCM Token**: Verify token is saved to Firestore

#### **Background Notifications Not Working**
1. **Service Worker**: Check service worker registration
2. **Cloud Functions**: Verify functions are deployed
3. **Firestore Rules**: Check security rules allow function access
4. **Token Storage**: Ensure FCM tokens are saved correctly

#### **Multi-User Issues**
1. **User Context**: Verify userId and petId are passed correctly
2. **Preferences**: Check notification preferences are set
3. **Quiet Hours**: Verify quiet hours logic
4. **Token Filtering**: Ensure tokens are filtered by user/pet

### **Debug Commands**
```javascript
// Check notification support
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('Notifications:', 'Notification' in window);
console.log('Permission:', Notification.permission);

// Check FCM token
const token = await getToken(messaging, { vapidKey: VAPID_KEY });
console.log('FCM Token:', token);

// Check notification preferences
const prefs = await notificationPreferences.getPreferences();
console.log('Preferences:', prefs);
```

## 📞 **Support**

For issues with the notification system:
1. Check the [Firebase Console](https://console.firebase.google.com/) for FCM delivery reports
2. Review Cloud Function logs in Firebase Console
3. Check browser console for JavaScript errors
4. Verify Firestore security rules allow proper access

---

**Last Updated:** July 2025  
**Version:** 2.0.0 (Multi-User Release)  
**Status:** Production Ready 