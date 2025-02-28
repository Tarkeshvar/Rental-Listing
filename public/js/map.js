// Ensure maplibregl is initialized correctly
const map = new maplibregl.Map({
  container: "map",
  style: `https://maps.geoapify.com/v1/styles/osm-carto/style.json?apiKey=${mapKey}`,
  center: listing.geometry.coordinates, // Make sure this is [lng, lat]
  zoom: 10,
});

// Add navigation controls
map.addControl(new maplibregl.NavigationControl());

// Geoapify Icon URL for Airbnb-style home marker
const iconUrl = `https://api.geoapify.com/v1/icon/?type=material&color=%2300FFFF&icon=home&size=large&apiKey=${mapKey}`;

// Function to Create a Custom Marker
function createCustomMarker(iconUrl) {
  const markerElement = document.createElement("div");
  markerElement.style.width = "40px";
  markerElement.style.height = "40px";
  markerElement.style.backgroundImage = `url(${iconUrl})`;
  markerElement.style.backgroundSize = "contain";
  markerElement.style.backgroundRepeat = "no-repeat";
  return markerElement;
}

// **Attach Custom Marker to Map**
const marker = new maplibregl.Marker({ element: createCustomMarker(iconUrl) })
  .setLngLat(listing.geometry.coordinates) // Ensure this is in [lng, lat] format
  .addTo(map);

const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
    <div class="map-popup">
      <h4>${listing.title}</h4>
      <p>Exact location will be provided after booking.</p>
    </div>
  `);

marker.setPopup(popup);
