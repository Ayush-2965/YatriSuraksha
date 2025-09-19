import React, { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import TourMap from "../components/map/TourMap";
import locationTrackingService from "../services/locationTrackingService";

export default function TourView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trackingInitialized = useRef(false);
  // Expecting tour data to be passed via location.state
  const tour = location.state?.tour;

  // Initialize location tracking when component mounts
  useEffect(() => {
    if (tour && user && !trackingInitialized.current) {
      const initializeTracking = async () => {
        try {
          console.log('🎯 Initializing location tracking for tour:', tour.$id, 'user:', user.$id);
          
          // Request location permission first
          if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
          }
          
          // Check and request permission
          try {
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(
                () => resolve(),
                (error) => {
                  if (error.code === error.PERMISSION_DENIED) {
                    alert('Location access is required for emergency features and real-time tracking. Please enable location access in your browser settings.');
                  }
                  reject(error);
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            });
            
            // If permission granted, start tracking
            await locationTrackingService.startTracking(tour.$id, user.$id);
            trackingInitialized.current = true;
            console.log('✅ Location tracking started successfully');
          } catch (permissionError) {
            console.warn('⚠️ Location permission not granted:', permissionError);
            // Continue without location tracking but emergency features will be limited
          }
          
        } catch (error) {
          console.error('❌ Failed to start location tracking:', error);
        }
      };
      
      initializeTracking();
    }

    // Cleanup: only stop tracking on actual navigation away
    return () => {
      // We'll handle cleanup in a separate useEffect for unmount
    };
  }, [tour, user]);

  // Handle cleanup only when component unmounts
  useEffect(() => {
    return () => {
      if (trackingInitialized.current && locationTrackingService.isTracking) {
        locationTrackingService.stopTracking();
        console.log('🛑 Location tracking stopped on unmount');
      }
    };
  }, []);

  if (!tour) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl text-red-600 mb-4">No tour data found.</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center">
      <div className="w-full max-w-4xl mt-8">
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">Tour: {tour.$id || tour.name}</h1>
        <div className="mb-4 text-gray-700">
          <div><b>Start Date:</b> {tour.startDate}</div>
          <div><b>End Date:</b> {tour.endDate}</div>
          {tour.touristId && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <b className="text-blue-800">Tourist ID:</b> 
              <span className="ml-2 font-mono text-blue-900 bg-blue-100 px-2 py-1 rounded">
                {tour.touristId}
              </span>
            </div>
          )}
        </div>
        <TourMap 
          locations={tour.locations || []} 
          tour={tour} 
          user={user} 
        />
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Waypoints:</h2>
          <ol className="list-decimal ml-6">
            {(tour.locations || []).map((loc, idx) => (
              <li key={idx}>{loc.name} ({loc.lat}, {loc.lng})</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
