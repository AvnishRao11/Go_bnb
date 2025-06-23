mapboxgl.accessToken = window.mapToken;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: window.listing.geometry.coordinates,
  zoom: 10,
});

new mapboxgl.Marker({ color: "red" })
  .setLngLat(window.listing.geometry.coordinates)
  .setPopup(
    new mapboxgl.Popup({ offset: 25 }).setHTML(`<h4>${window.listing.title}</h4><p> Exact Location will be provided after booking</p>`)
  )
  .addTo(map);
