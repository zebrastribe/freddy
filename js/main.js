function initMap(lat, lng) {
  var map = L.map('map').setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.marker([lat, lng]).addTo(map)
    .bindPopup('You are here.')
    .openPopup();
}

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    function(position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      console.log("Latitude: " + lat);
      console.log("Longitude: " + lng);
      initMap(lat, lng);
    },
    function(error) {
      console.error("Error Code = " + error.code + " - " + error.message);
    }
  );
} else {
  console.log("Geolocation is not supported by this browser.");
}
