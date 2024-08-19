import { db } from './firebase-setup.js';
import { getUser } from './auth.js';
import { addMarker } from './map.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js"; // Import Firestore functions

const entriesPerPage = 10; // Define the number of entries per page
let currentPage = 1; // Initialize the current page
let recordedMap; // Declare recordedMap

// Define the updateMap function
function updateMap(latitude, longitude) {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: latitude, lng: longitude },
    zoom: 8
  });
  new google.maps.Marker({
    position: { lat: latitude, lng: longitude },
    map: map,
    title: "Last known location"
  });
}

export async function fetchLastCoordinates() {
  const user = getUser();
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

export async function fetchCheckIns() {
  const user = getUser();
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

    // Initialize recordedMap if not already initialized
    if (!recordedMap) {
      recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
        center: { lat: 0, lng: 0 },
        zoom: 2
      });
    }

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
      addMarker(recordedMap, { lat: latitude, lng: longitude }, name);
    });

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }
}

// Event listeners for pagination buttons
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