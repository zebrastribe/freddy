import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let user = null;
let marker;

onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    user = currentUser;
    console.log("User authenticated:", user);
    fetchLastCoordinates(); // Fetch last coordinates when user is authenticated
    fetchCheckIns(); // Fetch and display all check-ins
  } else {
    console.error("User is not authenticated");
  }
});

document.getElementById('clickButton').addEventListener('click', async () => {
  const nameInput = document.getElementById('nameInput');
  const errorMessage = document.getElementById('error-message');
  const spinner = document.getElementById('spinner');
  const successMessage = document.getElementById('success-message');

  if (nameInput.value.trim() === "") {
    errorMessage.classList.remove('hidden');
    return;
  } else {
    errorMessage.classList.add('hidden');
  }

  if (user) {
    const name = nameInput.value; // Get the value from the input field
    if (navigator.geolocation) {
      spinner.classList.remove('hidden'); // Show spinner
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await addDoc(collection(db, "clicks"), {
            timestamp: serverTimestamp(),
            userId: user.uid,
            name: name, // Include the name in the document
            latitude: latitude,
            longitude: longitude
          });
          console.log("Document successfully written with GPS coordinates and name!");
          updateMap(latitude, longitude);
          successMessage.classList.remove('hidden'); // Show success message
          nameInput.value = ""; // Clear the input field
          nameInput.disabled = true; // Disable the input field
          setTimeout(() => {
            nameInput.disabled = false; // Re-enable the input field after 15 seconds
            successMessage.classList.add('hidden'); // Hide success message
          }, 15000);
          fetchCheckIns(); // Refresh the check-ins list
        } catch (error) {
          console.error("Error writing document: ", error);
        } finally {
          spinner.classList.add('hidden'); // Hide spinner
        }
      }, (error) => {
        console.error("Error getting geolocation: ", error);
        spinner.classList.add('hidden'); // Hide spinner
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

async function fetchCheckIns() {
  if (user) {
    const q = query(collection(db, "clicks"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const checkInsList = document.getElementById('checkInsList');
    checkInsList.innerHTML = ''; // Clear the list
    querySnapshot.forEach((doc) => {
      const { name, latitude, longitude, timestamp } = doc.data();
      const listItem = document.createElement('li');
      listItem.textContent = `${name} checked in at (${latitude}, ${longitude}) on ${timestamp.toDate()}`;
      checkInsList.appendChild(listItem);
    });
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