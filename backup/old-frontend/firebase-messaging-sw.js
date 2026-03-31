// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "tracker-6a648.firebaseapp.com",
  projectId: "tracker-6a648",
  storageBucket: "tracker-6a648.appspot.com",
  messagingSenderId: "789878332530",
  appId: "1:789878332530:web:9bd999d86df0fe9caef6eb",
  measurementId: "G-XMHHKFJ9QW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages with multi-user support
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  // Extract user and pet information from payload
  const { userId, petId, petName } = payload.data || {};
  
  const notificationTitle = payload.notification?.title || 
    `Ny ${petName || 'Pet'} Check-in! 🐱`;
  const notificationOptions = {
    body: payload.notification?.body || 'Nogen har lige checket ind!',
    icon: '/img/emoji-cat-192x192.png',
    badge: '/img/emoji-cat-192x192.png',
    tag: userId && petId ? `checkin-${userId}-${petId}` : 'freddy-checkin-background',
    requireInteraction: false,
    silent: false,
    data: {
      userId,
      petId,
      petName,
      url: userId && petName ? `/${userId}/${petName}/` : '/',
      ...payload.data
    }
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click with multi-user routing
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Extract URL from notification data
  const url = event.notification.data?.url || '/';
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow(url)
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
}); 