
import React, { useRef, useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import locationTrackingService from "../../services/locationTrackingService";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_LIBRARIES = ["places"]; // Static array to prevent reloading

export default function TourMap({ locations, tour, user }) {
  const mapRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [useCurrentAsOrigin, setUseCurrentAsOrigin] = useState(true);
  const [routePolylines, setRoutePolylines] = useState([]); // Array of decoded polylines
  const [routeError, setRouteError] = useState(null);
  const [routeInfo, setRouteInfo] = useState({ distance: null, duration: null });
  const [emergencyTriggered, setEmergencyTriggered] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);

  // Load Google Maps JS API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Emergency handler
  const handleEmergency = async () => {
    if (emergencyLoading || emergencyTriggered) return;
    
    setEmergencyLoading(true);
    try {
      if (currentLocation) {
        console.log('🚨 Triggering emergency alert');
        
        // Try using the location tracking service first
        if (locationTrackingService.isTracking) {
          await locationTrackingService.triggerEmergency(
            'Emergency assistance needed!'
            // Emergency contacts will be fetched from Appwrite by backend
          );
        } else {
          // Fallback: send emergency directly with current location
          console.log('🚨 Triggering emergency with current location:', currentLocation);
          
          const emergencyData = {
            userId: user?.$id,
            tourId: tour?.$id,
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
            timestamp: new Date().toISOString(),
            message: 'Emergency assistance needed!'
            // Emergency contacts will be fetched from Appwrite by backend
          };
          
          // Send to backend emergency endpoint
          const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
          const response = await fetch(`${backendUrl}/emergency/alert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emergencyData)
          });
          
          if (!response.ok) {
            throw new Error(`Emergency request failed: ${response.status}`);
          }
        }
        
        setEmergencyTriggered(true);
        
        // Show success message
        alert('Emergency alert sent successfully! Emergency contacts and police have been notified.');
      } else {
        alert('Unable to get current location. Please ensure location access is enabled.');
      }
    } catch (error) {
      console.error('Emergency trigger failed:', error);
      alert('Failed to send emergency alert. Please try again or contact emergency services directly.');
    } finally {
      setEmergencyLoading(false);
    }
  };

  // Helper: filter only valid locations
  const validLocations = useMemo(() => {
    if (!Array.isArray(locations)) {
      console.warn('TourMap: locations is not an array:', locations);
      return [];
    }
    
    return locations.filter(loc => {
      if (!loc || typeof loc !== 'object') {
        console.warn('TourMap: Invalid location object:', loc);
        return false;
      }
      
      const lat = Number(loc.lat);
      const lng = Number(loc.lng);
      
      if (!isFinite(lat) || !isFinite(lng)) {
        console.warn('TourMap: Invalid coordinates:', { lat: loc.lat, lng: loc.lng });
        return false;
      }
      
      return true;
    }).map(loc => ({
      ...loc,
      lat: Number(loc.lat),
      lng: Number(loc.lng),
      name: String(loc.name || 'Unknown Location')
    }));
  }, [locations]);

  // Live location tracking and send to backend
  useEffect(() => {
    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(coords);
          // Send to backend
          const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
          fetch(`${backendUrl}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coords)
          }).catch(err => console.error('Failed to send location to backend:', err));
        },
        err => {
          setCurrentLocation(null);
          console.error('Geolocation error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Pick a valid center
  const defaultCenter = (useCurrentAsOrigin && currentLocation) || validLocations[0] || { lat: 20.5937, lng: 78.9629 };

  useEffect(() => {
    setRouteError(null);
  }, [locations]);

  // Helper: decode polyline5 (standard Google polyline format)
  function decodePolyline(encoded) {
    let points = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
    }
    return points;
  }


  // --- Directions API logic ---
  // Show the default route using DirectionsRenderer for visual comparison
  const [directionsResult, setDirectionsResult] = useState(null);
  useEffect(() => {
    if (!isLoaded) return;
    let origin = null;
    let destination = null;
    let waypoints = [];
    if (useCurrentAsOrigin && currentLocation && validLocations.length > 0) {
      origin = currentLocation;
      destination = validLocations[validLocations.length - 1];
      waypoints = validLocations.slice(0, -1).map(loc => ({ location: loc }));
    } else if (validLocations.length >= 2) {
      origin = validLocations[0];
      destination = validLocations[validLocations.length - 1];
      waypoints = validLocations.slice(1, -1).map(loc => ({ location: loc }));
    }
    if (!origin || !destination) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false
      },
      (result, status) => {
        if (status === "OK") {
          setDirectionsResult(result);
        } else {
          setDirectionsResult(null);
        }
      }
    );
  }, [validLocations, currentLocation, useCurrentAsOrigin, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    let points = [];
    if (useCurrentAsOrigin && currentLocation && validLocations.length > 0) {
      points = [currentLocation, ...validLocations];
    } else if (validLocations.length >= 2) {
      points = validLocations;
    }
    if (points.length < 2) return;

    // Log the route points for debugging
    console.log('Route points (order):', points);

    const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${GOOGLE_MAPS_API_KEY}`;
    // Helper to convert {lat, lng} to {latitude, longitude}
    const toLatLng = (p) => ({ latitude: p.lat, longitude: p.lng });
    const body = {
      origin: { location: { latLng: toLatLng(points[0]) } },
      destination: { location: { latLng: toLatLng(points[points.length - 1]) } },
      intermediates: points.slice(1, -1).map(p => ({ location: { latLng: toLatLng(p) } })),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false, // for debugging, use false
      routeModifiers: { avoidTolls: false, avoidHighways: false, avoidFerries: false },
      languageCode: "en-US",
      units: "METRIC"
    };
    console.log('API body:', JSON.stringify(body, null, 2));
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline"
      },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => {
        console.log('Routes API response:', data);
        if (data.routes && data.routes.length > 0) {
          // Decode all alternative polylines
          const polylines = data.routes.map(r => decodePolyline(r.polyline.encodedPolyline));
          setRoutePolylines(polylines);
          setRouteError(null);
          setRouteInfo({
            distance: data.routes[0].distanceMeters,
            duration: data.routes[0].duration
          });
        } else if (data.error) {
          setRoutePolylines([]);
          setRouteError(data.error.message || "No route found");
          setRouteInfo({ distance: null, duration: null });
        } else {
          setRoutePolylines([]);
          setRouteError("No route found");
          setRouteInfo({ distance: null, duration: null });
        }
      })
      .catch((err) => {
        console.error('Routes API fetch error:', err);
        setRoutePolylines([]);
        setRouteError("Failed to fetch route");
        setRouteInfo({ distance: null, duration: null });
      });
  }, [validLocations, currentLocation, useCurrentAsOrigin, isLoaded]);




  // Imperatively draw polyline using Google Maps JS API
  useEffect(() => {
    let polylineObjs = [];
    if (window.google && mapRef.current && routePolylines && routePolylines.length > 0) {
      // Draw all polylines, use different color for each
      const colors = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#0288d1'];
      routePolylines.forEach((poly, idx) => {
        const polylineObj = new window.google.maps.Polyline({
          path: poly,
          strokeColor: colors[idx % colors.length],
          strokeWeight: 4,
          strokeOpacity: 0.7,
          map: mapRef.current
        });
        polylineObjs.push(polylineObj);
      });
      // Fit map bounds to first polyline
      const bounds = new window.google.maps.LatLngBounds();
      routePolylines[0].forEach(point => bounds.extend(point));
      mapRef.current.fitBounds(bounds);
    }
    return () => {
      polylineObjs.forEach(obj => obj.setMap(null));
    };
  }, [routePolylines, isLoaded]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="relative h-screen">
      <GoogleMap
        mapContainerStyle={{
          width: "100%",
          height: "100%",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        }}
        center={defaultCenter}
        zoom={12}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: false,
          styles: [
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#7c93a3" }],
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "all",
              elementType: "labels.icon",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.fill",
              stylers: [{ color: "#f7f7f7" }],
            },
            {
              featureType: "administrative",
              elementType: "geometry.stroke",
              stylers: [{ color: "#d7d7d7" }],
            },
            {
              featureType: "landscape",
              elementType: "geometry",
              stylers: [{ color: "#f7f7f7" }],
            },
            {
              featureType: "poi",
              elementType: "geometry",
              stylers: [{ color: "#e6e6e6" }],
            },
            {
              featureType: "road",
              elementType: "geometry.fill",
              stylers: [{ color: "#ffffff" }],
            },
            {
              featureType: "road",
              elementType: "geometry.stroke",
              stylers: [{ color: "#d7d7d7" }],
            },
            {
              featureType: "transit",
              elementType: "geometry",
              stylers: [{ color: "#e6e6e6" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#c4d7e4" }],
            },
          ],
        }}
      >
        {/* Markers and Polylines */}
        {directionsResult &&
          directionsResult.routes &&
          directionsResult.routes.length > 0 &&
          directionsResult.routes.map((route, idx) => (
            <DirectionsRenderer
              key={idx}
              directions={{ ...directionsResult, routes: [route] }}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: "#8A2BE2",
                  strokeWeight: 6,
                  strokeOpacity: 0.8,
                },
              }}
            />
          ))}
        {validLocations.map((loc, idx) => (
          <Marker
            key={idx}
            position={{ lat: loc.lat, lng: loc.lng }}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#8A2BE2",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
          />
        ))}
        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 4,
            }}
          />
        )}
      </GoogleMap>

      {/* Floating UI Panels */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="bg-white rounded-full shadow-lg p-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useCurrentAsOrigin}
              onChange={(e) => setUseCurrentAsOrigin(e.target.checked)}
              disabled={!currentLocation}
              className="sr-only"
            />
            <span
              className={`w-10 h-5 rounded-full transition-colors duration-300 ${
                useCurrentAsOrigin ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`block w-4 h-4 m-0.5 bg-white rounded-full transform transition-transform duration-300 ${
                  useCurrentAsOrigin ? "translate-x-5" : ""
                }`}
              ></span>
            </span>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Use Current Location
            </span>
          </label>
        </div>
        <button
          onClick={handleEmergency}
          disabled={emergencyLoading || emergencyTriggered || !currentLocation}
          className={`py-3 px-5 rounded-full font-bold text-white transition-all duration-300 shadow-lg flex items-center ${
            emergencyTriggered
              ? "bg-green-500"
              : emergencyLoading
              ? "bg-yellow-500 animate-pulse"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <svg
            className="w-6 h-6 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {emergencyTriggered
            ? "Alert Sent"
            : emergencyLoading
            ? "Sending..."
            : "Emergency"}
        </button>
      </div>

      {routeInfo.distance && routeInfo.duration && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            {(routeInfo.distance / 1000).toFixed(1)} km
          </h3>
          <p className="text-lg text-gray-600">
            Estimated duration:{" "}
            {(() => {
              if (routeInfo.duration.startsWith("PT")) {
                const h = (routeInfo.duration.match(/(\d+)H/) || [])[1] || 0;
                const m = (routeInfo.duration.match(/(\d+)M/) || [])[1] || 0;
                return `${h > 0 ? h + "h " : ""}${m}m`;
              } else {
                const sec = parseInt(routeInfo.duration.replace(/\D/g, ""), 10);
                const h = Math.floor(sec / 3600);
                const m = Math.floor((sec % 3600) / 60);
                return `${h > 0 ? h + "h " : ""}${m}m`;
              }
            })()}
          </p>
        </div>
      )}

      {routeError && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 text-red-700 p-4 rounded-2xl shadow-lg text-center">
          <p className="font-bold">Could not find a route.</p>
          <p>{routeError}</p>
        </div>
      )}
    </div>
  );
}


