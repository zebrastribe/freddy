let map;
let recordedMap;
let marker;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 0, lng: 0 },
    zoom: 2
  });

  recordedMap = new google.maps.Map(document.getElementById('recordedMap'), {
    center: { lat: 0, lng: 0 },
    zoom: 2
  });
}

function addMarker(map, position, title) {
  new google.maps.Marker({
    map: map,
    position: position,
    title: title
  });
}

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
      addMarker(recordedMap, { lat: latitude, lng: longitude }, name);
    });

    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }
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

document.addEventListener('DOMContentLoaded', () => {
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

  document.getElementById('recordedCheckInsTab').addEventListener('click', () => {
    document.getElementById('checkInContent').classList.add('hidden');
    document.getElementById('recordedCheckInsContent').classList.remove('hidden');
    document.getElementById('recordedCheckInsTab').classList.add('text-blue-600', 'border-blue-600');
    document.getElementById('recordedCheckInsTab').classList.remove('text-gray-600');
    document.getElementById('checkInTab').classList.add('text-gray-600');
    document.getElementById('checkInTab').classList.remove('text-blue-600', 'border-blue-600');

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
});

let user = null;
let currentPage = 1;
const entriesPerPage = 10;

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