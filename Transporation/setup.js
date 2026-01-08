
let map;
let startMarker = null;
let endMarker = null;
let startLatLng = null;
let endLatLng = null;
let routingControl = null;
let userLocation = null;
let zoomAfterRoute = false;

const destinations = [
    { name: "Central Park, New York", lat: 40.7851, lng: -73.9683 },
    { name: "Times Square, New York", lat: 40.7580, lng: -73.9855 },
    { name: "Brooklyn Bridge, New York", lat: 40.7061, lng: -73.9969 },
    { name: "Empire State Building, New York", lat: 40.7484, lng: -73.9857 }
];

function initMap() {
    const defaultCenter = [40.7128, -74.0060];
    map = L.map('map').setView(defaultCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', e => setDestination(e.latlng));
    L.control.scale().addTo(map);

    updateTime();
}

function setDestination(latlng) {
    endLatLng = latlng;

    if (endMarker) map.removeLayer(endMarker);

    endMarker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
            html: "<div style='background:#e17055;width:24px;height:24px;border-radius:50%;border:3px solid white'></div>",
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);

    document.getElementById('to').value =
        `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;

    endMarker.on('dragend', e => {
        endLatLng = e.target.getLatLng();
        document.getElementById('to').value =
            `Lat: ${endLatLng.lat.toFixed(4)}, Lng: ${endLatLng.lng.toFixed(4)}`;
        if (startLatLng) calculateRoute();
    });

    if (startLatLng) calculateRoute();
}

function setStartLocation(latlng) {
    startLatLng = latlng;

    if (startMarker) map.removeLayer(startMarker);

    startMarker = L.marker(latlng, {
        draggable: true,
        icon: L.divIcon({
            html: "<div style='background:#00b894;width:24px;height:24px;border-radius:50%;border:3px solid white'></div>",
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        })
    }).addTo(map);

    document.getElementById('from').value =
        `Lat: ${latlng.lat.toFixed(4)}, Lng: ${latlng.lng.toFixed(4)}`;

    startMarker.on('dragend', e => {
        startLatLng = e.target.getLatLng();
        document.getElementById('from').value =
            `Lat: ${startLatLng.lat.toFixed(4)}, Lng: ${startLatLng.lng.toFixed(4)}`;
        if (endLatLng) calculateRoute();
    });

    map.setView(latlng, 2);
}

function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Location not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(pos => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userLocation = latlng;
        setStartLocation(latlng);
        if (endLatLng) calculateRoute();
    });
}

function calculateRoute() {
    if (!startLatLng || !endLatLng) return;

    if (routingControl) map.removeControl(routingControl);

    routingControl = L.Routing.control({
        waypoints: [L.latLng(startLatLng), L.latLng(endLatLng)],
        createMarker: () => null,
        routeWhileDragging: false,
        lineOptions: { styles: [{ color: '#2a5bd7', weight: 5, opacity: 0.7 }] }
    });

    routingControl.once('routesfound', e => {
        if (zoomAfterRoute) {
            const bounds = e.routes[0].bounds;
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();
            const latDiff = Math.abs(northEast.lat - southWest.lat);
            const lngDiff = Math.abs(northEast.lng - southWest.lng);

            if (latDiff > 50 || lngDiff > 50) {
                map.setView([20, 0], 2);
            } else {
                map.fitBounds(bounds, { padding: [60, 60] });
            }
            zoomAfterRoute = false;
        }
    });

    routingControl.addTo(map);

    document.querySelector('.leaflet-routing-container').style.display = 'none';
    updateRouteInfo();
}

function calculateDistance(p1, p2) {
    const R = 6371;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(p1.lat * Math.PI / 180) *
        Math.cos(p2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateRouteInfo() {
    if (!startLatLng || !endLatLng) return;
    const distance = calculateDistance(startLatLng, endLatLng);
    document.getElementById('routesContainer').innerHTML =
        `<strong>Distance:</strong> ${distance.toFixed(2)} km`;
}

function updateTime() {
    document.getElementById('currentTime').textContent =
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function searchDestination() {
    const query = prompt(
        "Enter destination:\n" + destinations.map(d => d.name).join("\n")
    );
    if (!query) return;

    const dest = destinations.find(d => d.name.toLowerCase() === query.toLowerCase());
    if (!dest) {
        alert("Destination not found.");
        return;
    }

    const latlng = { lat: dest.lat, lng: dest.lng };
    setDestination(latlng);
    document.getElementById('to').value = dest.name;
    map.setView(latlng, 2);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setInterval(updateTime, 60000);

    document.getElementById('useCurrentLocation').onclick = getUserLocation;
    document.getElementById('searchDestination').onclick = searchDestination;

    document.getElementById('planRouteBtn').onclick = () => {
        if (!startLatLng || !endLatLng) {
            alert("Set start and destination first");
            return;
        }
        zoomAfterRoute = true;
        calculateRoute();
    };
});
