import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let user = null;
let marker;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
    fetchLastCoordinates(); // Fetch last coordinates when user is authenticated
  } else {
    console.error("User is not authenticated");
  }
});

document.getElementById('clickButton').addEventListener('click', async () => {
  if (user) {
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
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  } else {
    console.error("User is not authenticated, cannot add document");
  }
});

async function fetchLastCoordinates() {
  if (user) {
    const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const lastDoc = querySnapshot.docs[0];
      const { latitude, longitude } = lastDoc.data();
      updateMap(latitude, longitude);
    } else {
      console.log("No previous coordinates found.");
    }
  }
}

function updateMap(latitude, longitude) {
  const position = { lat: latitude, lng: longitude };
  if (marker) {
    marker.setPosition(position);
  } else {
    marker = new google.maps.Marker({
      position: position,
      map: window.map
    });
  }
  window.map.setCenter(position);
  window.map.setZoom(15);
}