import React, { useState, useEffect, useCallback } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629
}

export default function TourMap({ tour, allTours = [], emergencyAlerts = [], isEmergencyView = false, showTrackingHistory = false }) {
  const [selectedMarker, setSelectedMarker] = useState(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [mapZoom, setMapZoom] = useState(10)
  const [infoWindowKey, setInfoWindowKey] = useState(0) // Force InfoWindow re-render

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  })

  const handleInfoWindowClose = useCallback(() => {
    console.log('InfoWindow closing...')
    setSelectedMarker(null)
    setInfoWindowKey(prev => prev + 1) // Force new InfoWindow instance
  }, [])

  const handleMarkerClick = useCallback((tourData) => {
    console.log('Marker clicked:', tourData.userId)
    setSelectedMarker(null) // Clear first
    setInfoWindowKey(prev => prev + 1) // Force new InfoWindow
    setTimeout(() => setSelectedMarker(tourData), 10)
  }, [])

  const handleEmergencyMarkerClick = useCallback((alert) => {
    console.log('Emergency marker clicked:', alert.id)
    const emergencyMarker = {
      ...alert,
      isEmergency: true,
      currentLocation: alert.location
    }
    
    setSelectedMarker(null) // Clear first
    setInfoWindowKey(prev => prev + 1) // Force new InfoWindow
    setTimeout(() => setSelectedMarker(emergencyMarker), 10)
  }, [])

  useEffect(() => {
    if (tour?.currentLocation) {
      setMapCenter(tour.currentLocation)
      setMapZoom(14)
    } else if (allTours.length > 0) {
      // Center map on all tours
      const locations = allTours
        .filter(t => t.currentLocation)
        .map(t => t.currentLocation)
      
      if (locations.length > 0) {
        const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length
        const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length
        setMapCenter({ lat: avgLat, lng: avgLng })
        setMapZoom(12)
      }
    }
  }, [tour, allTours])

  // Debug: Log when allTours data changes
  useEffect(() => {
    console.log('TourMap - Tours updated:', allTours.map(t => ({
      userId: t.userId,
      userName: t.userName,
      location: t.currentLocation,
      lastUpdate: t.lastUpdate
    })));
  }, [allTours])

  const getMarkerIcon = (tourData, isEmergency = false) => {
    if (isEmergency) {
      return {
        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
        fillColor: '#ff0000',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 1.5,
        anchor: { x: 12, y: 24 }
      }
    }

    let color = '#3b82f6' // blue default
    switch (tourData.status) {
      case 'active':
        color = '#10b981' // green
        break
      case 'emergency':
        color = '#ef4444' // red
        break
      case 'completed':
        color = '#6b7280' // gray
        break
      default:
        color = '#3b82f6' // blue
    }

    return {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1,
      anchor: { x: 12, y: 24 }
    }
  }

  const getMarkerLabel = (tourData, index) => {
    if (isEmergencyView) {
      return {
        text: '!',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white'
      }
    }

    return {
      text: tourData.userName ? tourData.userName.charAt(0).toUpperCase() : String(index + 1),
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: '12px'
    }
  }

  if (!isLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  const toursToShow = allTours.length > 0 ? allTours : (tour ? [tour] : [])

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={mapZoom}
      options={{
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true
      }}
    >
      {/* Tour markers */}
      {toursToShow
        .filter(t => t.currentLocation)
        .map((tourData, index) => (
          <Marker
            key={`${tourData.userId}-${tourData.lastUpdate || Date.now()}`}
            position={tourData.currentLocation}
            icon={getMarkerIcon(tourData)}
            label={getMarkerLabel(tourData, index)}
            onClick={() => handleMarkerClick(tourData)}
            animation={tourData.status === 'active' ? window.google.maps.Animation.BOUNCE : null}
          />
        ))}

      {/* Emergency alert markers */}
      {emergencyAlerts
        .filter(alert => alert.location)
        .map((alert) => (
          <Marker
            key={`emergency-${alert.id}`}
            position={alert.location}
            icon={getMarkerIcon(null, true)}
            label={{
              text: '!',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white'
            }}
            onClick={() => handleEmergencyMarkerClick(alert)}
            animation={alert.status === 'active' ? window.google.maps.Animation.BOUNCE : null}
          />
        ))}

      {/* Info Window */}
      {selectedMarker && (
        <InfoWindow
          key={`infowindow-${infoWindowKey}`}
          position={selectedMarker.currentLocation || selectedMarker.location}
          onCloseClick={handleInfoWindowClose}
          options={{
            pixelOffset: { width: 0, height: -10 },
            disableAutoPan: false,
            maxWidth: 300
          }}
        >
          <div className="p-4 max-w-xs bg-white rounded-lg shadow-lg border border-slate-200">
            {selectedMarker.isEmergency ? (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-red-700">Emergency Alert</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-slate-700">User:</span> {selectedMarker.userName}</p>
                  <p><span className="font-medium text-slate-700">Message:</span> {selectedMarker.message}</p>
                  <p><span className="font-medium text-slate-700">Time:</span> {new Date(selectedMarker.timestamp).toLocaleString()}</p>
                  <p><span className="font-medium text-slate-700">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedMarker.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedMarker.status}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-slate-900 mb-3">{selectedMarker.userName}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-slate-700">User ID:</span> <span className="font-mono">{selectedMarker.userId}</span></p>
                  {selectedMarker.touristId && (
                    <p><span className="font-medium text-slate-700">Tourist ID:</span> 
                      <span className="ml-2 font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded text-sm border border-blue-200">
                        {selectedMarker.touristId}
                      </span>
                    </p>
                  )}
                  <p><span className="font-medium text-slate-700">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedMarker.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                      selectedMarker.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {selectedMarker.status}
                    </span>
                  </p>
                  {selectedMarker.lastUpdate && (
                    <p><span className="font-medium text-slate-700">Last Update:</span> {new Date(selectedMarker.lastUpdate).toLocaleString()}</p>
                  )}
                  <p><span className="font-medium text-slate-700">Location:</span> <span className="font-mono">{selectedMarker.currentLocation.lat.toFixed(4)}, {selectedMarker.currentLocation.lng.toFixed(4)}</span></p>
                  
                  {selectedMarker.status === 'active' && selectedMarker.lastUpdate && (
                    <div className="mt-3">
                      <div className={`flex items-center space-x-2 text-xs px-2 py-1 rounded-full ${
                        Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 60000 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 300000
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 60000 
                            ? 'bg-emerald-500 animate-pulse' 
                            : Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 300000
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}></div>
                        <span>
                          {Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 60000 
                            ? 'Live tracking'
                            : Date.now() - new Date(selectedMarker.lastUpdate).getTime() < 300000
                            ? 'Recent update'
                            : 'No recent updates'
                          }
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}