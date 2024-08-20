import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { logTokenFromUrl, getToken, isTokenValid, useToken } from './incoming.js';


let user = null;
let marker;
let currentPage = 1;
const entriesPerPage = 10;


// Call the function to log the token
logTokenFromUrl();

// Check if the token is valid and use it
async function processToken() {
    const valid = await isTokenValid();
    if (valid) {
        console.log('Token is valid.');
        await useToken();
    } else {
        console.log('Token is not valid.');
    }
}

// Call the function to process the token
processToken();


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
    checkInsList.innerHTML = ''; // Clear the table body

    const docs = querySnapshot.docs;
    const totalPages = Math.ceil(docs.length / entriesPerPage);
    const start = (currentPage - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const currentDocs = docs.slice(start, end);

    currentDocs.forEach((doc) => {
      const { name, latitude, longitude, timestamp } = doc.data();
      const date = timestamp.toDate();
      const day = date.toLocaleString('en-US', { weekday: 'long' });
      const formattedDate = `${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="py-2 px-4 border-b border-gray-200">${name}</td>
        <td class="py-2 px-4 border-b border-gray-200">${latitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${longitude}</td>
        <td class="py-2 px-4 border-b border-gray-200">${formattedDate}</td>
        <td class="py-2 px-4 border-b border-gray-200">${time}</td>
      `;
      checkInsList.appendChild(row);

      // Add marker to the map
      new google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: window.recordedMap,
        title: name
      });
    });

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }
}

const MAP_ID = '8bac4e61a05fc3c2'; // Replace with your valid Map ID

function initMaps() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 55.6606892, lng: 12.5225537 },
    zoom: 10,
    mapId: MAP_ID
  });

  const marker = new google.maps.Marker({
    position: { lat: 55.6606892, lng: 12.5225537 },
    map: map
  });
}

window.initMaps = initMaps; // Expose initMaps to the global scope

// Initialize the map for recorded check-ins
function initRecordedMap() {
  window.recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
    center: { lat: 0, lng: 0 },
    zoom: 2
  });
}

// Call initRecordedMap when the Recorded Check-Ins tab is clicked
document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
  document.getElementById('checkInContent').classList.add('hidden');
  document.getElementById('recordedCheckInsContent').classList.remove('hidden');
  document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
  document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600');
  document.getElementById('checkInTab').classList.add('text-gray-600');
  document.getElementById('checkInTab').classList.remove('text-blue-600', 'border-blue-600');

  // Initialize the map if it hasn't been initialized yet
  if (!window.recordedMap) {
    initRecordedMap();
  }

  // Fetch and display check-ins
  fetchCheckIns();
});

document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    fetchCheckIns();
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  currentPage++;
  fetchCheckIns();
});

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
