import { useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useLocation } from '../context/LocationContext';

export default function LocationTracker() {
    const { user } = useAuth();
    const { 
        location, 
        error, 
        isTracking, 
        startTracking, 
        stopTracking 
    } = useLocation();

    // Start tracking when component mounts and user is available
    useEffect(() => {
        if (user && !isTracking) {
            startTracking();
        }
        return () => {
            if (isTracking) {
                stopTracking();
            }
        };
    }, [user, isTracking, startTracking, stopTracking]);

    if (!user) {
        return null; // Don't render anything if user is not logged in
    }

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg max-w-md w-full md:w-auto">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Location Tracking</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                        isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                        {isTracking ? 'Active' : 'Inactive'}
                    </span>
                </div>
                {location && (
                    <div className="text-sm space-y-2 bg-gray-50 p-3 rounded">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-gray-500">Latitude</p>
                                <p className="font-medium">{location.coords.latitude.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Longitude</p>
                                <p className="font-medium">{location.coords.longitude.toFixed(6)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Accuracy</p>
                                <p className="font-medium">{location.coords.accuracy.toFixed(2)}m</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Speed</p>
                                <p className="font-medium">
                                    {location.coords.speed 
                                        ? `${(location.coords.speed * 3.6).toFixed(2)} km/h`
                                        : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Last updated: {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mt-2">
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
