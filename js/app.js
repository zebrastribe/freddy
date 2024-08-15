import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let user = null;
let map;
let marker;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
  } else {
    console.error("User is not authenticated");
  }
});

document.getElementById('clickButton').addEventListener('click', async () => {
  if (user) {
<<<<<<< HEAD
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await addDoc(collection(db, "clicks"), {
            timestamp: serverTimestamp(),
            userId: user.uid,
            latitude: latitude,
            longitude: longitude
          });
          console.log("Document successfully written with GPS coordinates!");
          updateMap(latitude, longitude);
        } catch (error) {
          console.error("Error writing document: ", error);
        }
      }, (error) => {
        console.error("Error getting geolocation: ", error);
=======
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await addDoc(collection(db, "clicks"), {
            timestamp: serverTimestamp(),
            userId: user.uid,
            latitude: latitude,
            longitude: longitude
          });
          console.log("Document successfully written with GPS coordinates!");
        } catch (error) {
          console.error("Error writing document: ", error);
        }
      }, (error) => {
        console.error("Error getting geolocation: ", error);
>>>>>>> 7f6fa0b599393c7327de7428b1a2b852e299c952
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  } else {
    console.error("User is not authenticated, cannot add document");
  }
});

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 2
  });
}

function updateMap(latitude, longitude) {
  const position = { lat: latitude, lng: longitude };
  if (marker) {
    marker.setPosition(position);
  } else {
    marker = new google.maps.Marker({
      position: position,
      map: map
    });
  }
  map.setCenter(position);
  map.setZoom(15);
}

// Expose initMap to the global scope
window.initMap = initMap;