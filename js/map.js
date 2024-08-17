// map.js
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

function addMarker(mapInstance, position, title) {
  if (!(mapInstance instanceof google.maps.Map)) {
    console.error('Invalid map instance');
    return;
  }

  new google.maps.Marker({
    map: mapInstance,
    position: position,
    title: title
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

// Ensure functions are globally accessible
window.initMap = initMap;
window.addMarker = addMarker;
window.updateMap = updateMap;