import { db, auth, onAuthStateChanged } from './firebase-setup.js';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, doc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Function to get URL parameter
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Function to validate token
async function validateToken(token) {
  try {
    const tokenDoc = await getDoc(doc(db, 'tokens', token));
    if (tokenDoc.exists()) {
      const data = tokenDoc.data();
      const currentTime = Date.now();
      const contentElement = document.getElementById('content');
      if (!contentElement) {
        console.error("Element with ID 'content' not found.");
        return;
      }
      if (!data.used && data.expiry > currentTime) {
        // Token is valid
        contentElement.innerHTML = '<h1>Access Granted</h1><form><!-- Your form here --></form>';
      } else {
        // Token is expired or already used
        contentElement.innerHTML = '<h1>Error: Invalid or Expired Token</h1>';
      }
    } else {
      // Token does not exist
      document.getElementById('content').innerHTML = '<h1>Error: Invalid Token</h1>';
    }
  } catch (error) {
    console.error("Error validating token:", error);
    document.getElementById('content').innerHTML = '<h1>Error: Unable to Validate Token</h1>';
  }
}

// Get token from URL and validate it
window.onload = () => {
  const token = getUrlParameter('token');
  if (token) {
    validateToken(token);
  } else {
    document.getElementById('content').innerHTML = '<h1>Error: No Token Provided</h1>';
  }
};

let user = null;
let marker;
let currentPage = 1;
const entriesPerPage = 20;
window.recordedMarkers = [];

const MAP_ID = '8bac4e61a05fc3c2'; // Replace with your valid Map ID

function initMaps() {
  initMap();
  initRecordedMap();
}

function initMap() {
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 55.6606892, lng: 12.5225537 },
    zoom: 10,
    mapId: MAP_ID
  });
}

function initRecordedMap() {
  window.recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
    center: { lat: 55.6606892, lng: 12.5225537 },
    zoom: 10,
    mapId: MAP_ID
  });
}

window.initMaps = initMaps; // Expose initMaps to the global scope
window.initRecordedMap = initRecordedMap; // Expose initRecordedMap to the global scope

function updateMap(latitude, longitude) {
  const position = { lat: latitude, lng: longitude };
  if (window.map) {
    if (window.marker) {
      window.marker.position = position;
    } else {
      window.marker = new google.maps.marker.AdvancedMarkerElement({
        position: position,
        map: window.map
      });
    }
    window.map.setCenter(position);
    window.map.setZoom(15);
  } else {
    console.error("Map is not initialized.");
  }
}

function addAdvancedMarker(latitude, longitude, title) {
  const position = { lat: latitude, lng: longitude };
  if (window.recordedMap) {
    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: position,
      map: window.recordedMap,
      title: title
    });
    window.recordedMarkers.push(marker);
  } else {
    console.error("Recorded map is not initialized.");
  }
}

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

    const docs = querySnapshot.docs;
    const totalPages = Math.ceil(docs.length / entriesPerPage);
    const start = (currentPage - 1) * entriesPerPage;
    const end = start + entriesPerPage;
    const currentDocs = docs.slice(start, end);

    // Clear existing markers
    if (window.recordedMarkers) {
      window.recordedMarkers.forEach(marker => marker.map = null);
    }
    window.recordedMarkers = [];

    currentDocs.forEach((doc) => {
      const { name, latitude, longitude, timestamp } = doc.data();
      const date = timestamp.toDate();
      const day = date.toLocaleString('en-US', { weekday: 'long' });
      const formattedDate = `${date.getDate()} of ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const row = document.createElement('tr');
      row.setAttribute('data-lat', latitude);
      row.setAttribute('data-lng', longitude);
      row.className = 'hover:bg-gray-100 cursor-pointer'; // Add hover effect and cursor pointer

      const nameCell = document.createElement('td');
      nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-bold cursor-pointer';
      nameCell.textContent = name || 'undefined';
      row.appendChild(nameCell);

      const latitudeCell = document.createElement('td');
      latitudeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      latitudeCell.textContent = latitude || 'undefined';
      row.appendChild(latitudeCell);

      const longitudeCell = document.createElement('td');
      longitudeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      longitudeCell.textContent = longitude || 'undefined';
      row.appendChild(longitudeCell);

      const dateCell = document.createElement('td');
      dateCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      dateCell.textContent = `${day} ${formattedDate}`;
      row.appendChild(dateCell);

      const timeCell = document.createElement('td');
      timeCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-500';
      timeCell.textContent = time;
      row.appendChild(timeCell);

      checkInsList.appendChild(row);

      // Add marker to the recorded map using AdvancedMarkerElement
      addAdvancedMarker(latitude, longitude, name);

      // Add click event listener to zoom in on the marker
      row.addEventListener('click', () => {
        window.recordedMap.setCenter({ lat: latitude, lng: longitude });
        window.recordedMap.setZoom(18); // Tighter zoom level
      });
    });

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }
}

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

document.getElementById('checkInTab').addEventListener('click', () => {
  document.getElementById('recordedCheckInsContent').classList.add('hidden');
  document.getElementById('checkInContent').classList.remove('hidden');
  
  // Update tab styles
  document.getElementById('checkInTab').classList.add('text-blue-600', 'border-blue-600');
  document.getElementById('checkInTab').classList.remove('text-gray-600', 'border-gray-200');
  document.getElementById('recordedCheckInsTab').classList.add('text-gray-600', 'border-gray-200');
  document.getElementById('recordedCheckInsTab').classList.remove('text-blue-600', 'border-blue-600');
});

document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
  document.getElementById('checkInContent').classList.add('hidden');
  document.getElementById('recordedCheckInsContent').classList.remove('hidden');
  
  // Initialize the recorded map and fetch check-ins
  initRecordedMap();
  fetchCheckIns();
  
  // Update tab styles
  document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
  document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600', 'border-gray-200');
  document.getElementById('checkInTab').classList.add('text-gray-600', 'border-gray-200');
  document.getElementById('checkInTab').classList.remove('text-blue-600', 'border-blue-600');
});