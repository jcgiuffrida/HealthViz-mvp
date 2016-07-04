// initialize the map
var map = L.map('map', {
  center: [39.79165, -89.51111],
  zoom: 7,
  zoomControl: false
});

L.control.zoom({
  position: 'topright'
}).addTo(map);

// get map tiles
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>- <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    minZoom: 6,
    id: 'mapbox.light',
    accessToken: 'pk.eyJ1IjoiamdpdWZmcmlkYSIsImEiOiJjaW1pZnF3cXMwMDl5dXRrZ2FwbDAxOGx3In0.u5objUUR9x0mfHYy1PtYCQ'
}).addTo(map);

// style for features
var defaultStyle = {
  fillColor: '#3498db',
  color: '#fff',
  fillOpacity: 0.35,
  weight: 1, 
  opacity: 0.5,
  smoothFactor: 0.95,
};
