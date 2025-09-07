import { useState, useCallback, useContext } from 'react';
import { LocationContext } from './LocationContext.context';
import { useAuth } from './useAuth';

export function LocationProvider({ children }) {
    const { user } = useAuth();
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [watchId, setWatchId] = useState(null);
    const [isTracking, setIsTracking] = useState(false);

    const sendLocationToBackend = useCallback(async (locationData) => {
        if (!user || !user.$id) {
            console.error('No user ID available');
            return;
        }

        try {
            const payload = {
                user_id: user.$id,
                latitude: locationData.coords.latitude,
                longitude: locationData.coords.longitude,
                timestamp: new Date().toISOString(),
                speed: locationData.coords.speed || 0,
                accuracy: locationData.coords.accuracy || 0
            };

            console.log('Sending location update:', payload);

            const response = await fetch('http://localhost:8000/location/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.detail || 'Failed to update location');
            }

            setError(null);
        } catch (err) {
            console.error('Error sending location:', err);
            setError(err.message);
        }
    }, [user]);

    const startTracking = useCallback(async () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        try {
            // Check for permissions first
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'denied') {
                setError('Location permission denied');
                return;
            }

            setIsTracking(true);
            const id = navigator.geolocation.watchPosition(
                (position) => {
                    console.log('New position:', position);
                    setLocation(position);
                    sendLocationToBackend(position);
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    setError(`Location error: ${err.message}`);
                    setIsTracking(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
            setWatchId(id);
        } catch (err) {
            console.error('Tracking error:', err);
            setError(err.message);
            setIsTracking(false);
        }
    }, [sendLocationToBackend]);

    const stopTracking = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsTracking(false);
        setError(null);
    }, [watchId]);

    const value = {
        location,
        error,
        isTracking,
        startTracking,
        stopTracking
    };

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
}

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
