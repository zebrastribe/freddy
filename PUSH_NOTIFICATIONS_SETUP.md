# 🔥 Push Notifications Setup Guide

## Current Status
✅ **Browser notifications** - Work when browser is open  
✅ **Real-time detection** - Firebase Firestore listeners  
✅ **Service worker** - Background notification handling  
🔄 **FCM setup** - Partially implemented (needs VAPID key)  

## 🚀 To Enable True Push Notifications (Locked Screen)

### 1. Get Firebase VAPID Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`tracker-6a648`)
3. Go to **Project Settings** → **Cloud Messaging**
4. Generate a new **Web Push certificate** (VAPID key)
5. Copy the key

### 2. Update VAPID Key
Replace `'YOUR_VAPID_KEY_HERE'` in `js/firebase-setup.js`:
```javascript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_ACTUAL_VAPID_KEY_HERE'
});
```

### 3. Set Up Server-Side Notifications
You have two options:

#### Option A: Firebase Cloud Functions (Recommended)
Create a Cloud Function that:
1. Listens to new check-ins in Firestore
2. Sends push notifications via FCM
3. Works even when phone is locked

#### Option B: Simple Server
Create a simple server that:
1. Monitors the `notification_requests` collection
2. Sends FCM messages using Firebase Admin SDK

### 4. Test Push Notifications
1. Install the PWA on your phone
2. Allow notifications
3. Lock your phone screen
4. Have someone check in
5. You should get a notification even with locked screen!

## 📱 Mobile Installation
1. **Android:** Chrome → Menu → "Add to Home Screen"
2. **iOS:** Safari → Share → "Add to Home Screen"
3. Open the PWA from home screen
4. Allow notifications when prompted

## 🔧 Current Features
- ✅ Real-time check-in detection
- ✅ Browser notifications (foreground)
- ✅ Service worker for background notifications
- ✅ FCM token management
- ✅ Notification click handling

## 🎯 Next Steps
1. Get VAPID key from Firebase Console
2. Update the key in `firebase-setup.js`
3. Set up Cloud Functions for server-side notifications
4. Test on mobile device with locked screen

## 📞 Support
If you need help setting up the VAPID key or Cloud Functions, let me know! 