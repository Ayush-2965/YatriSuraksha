import { useEffect, useRef } from 'react';

export default function MapComponent({ latitude, longitude }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.L) {
      // Load Leaflet if not already loaded
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet/dist/leaflet.js';
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else {
      initMap();
    }
    function initMap() {
      if (!mapRef.current) return;
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
        mapRef.current.innerHTML = '';
      }
      const map = window.L.map(mapRef.current).setView([latitude, longitude], 15);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      window.L.marker([latitude, longitude]).addTo(map);
    }
  }, [latitude, longitude]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  );
}
