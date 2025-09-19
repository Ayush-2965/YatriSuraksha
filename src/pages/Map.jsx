import MapComponent from '../components/MapComponent';
import { useLocation } from '../context/LocationContext';
import { FaMapMarkedAlt, FaExclamationTriangle } from 'react-icons/fa';
import LocationTracker from '../components/LocationTracker';

import { useState } from 'react';

export default function MapPage() {
  const { location } = useLocation();
  const [showAlert, setShowAlert] = useState(false);

  const handlePanic = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3500);
  };

  return (
    <div className="relative w-screen h-screen min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      {/* Map Fullscreen */}
      <div className="absolute inset-0 w-full h-full z-0">
        {location ? (
          <MapComponent latitude={location.coords.latitude} longitude={location.coords.longitude} />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <p className="text-gray-500 text-xl">Location not available</p>
          </div>
        )}
      </div>
      {/* Overlay: Title and Panic Button */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-indigo-700 mb-4 flex items-center gap-2 drop-shadow-lg"><FaMapMarkedAlt className="text-indigo-500" /> Live Map</h1>
        <button
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
          onClick={handlePanic}
        >
          <FaExclamationTriangle className="text-xl animate-pulse" /> Panic Button
        </button>
      </div>
      {/* Fake Alert Box */}
      {showAlert && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-red-400 shadow-xl rounded-xl px-8 py-6 flex flex-col items-center animate-fade-in">
          <FaExclamationTriangle className="text-4xl text-red-500 mb-2 animate-pulse" />
          <div className="text-lg font-bold text-red-700 mb-1">Emergency Alert Sent!</div>
          <div className="text-gray-700 text-center mb-2">Your current location has been sent to the police and your emergency contacts.</div>
          <div className="text-xs text-gray-400">(This is a demo alert. No real data sent.)</div>
        </div>
      )}
      {/* Overlay: LocationTracker absolute on map */}
      <div className="absolute bottom-6 right-6 z-20">
        <LocationTracker />
      </div>
    </div>
  );
}
