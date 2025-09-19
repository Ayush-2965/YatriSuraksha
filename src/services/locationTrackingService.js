// Live Location Tracking Service for PWA with Native Support
import locationDBService from './locationDBService.js';
import nativeLocationService from './nativeLocationService.js';

class LocationTrackingService {
  constructor() {
    this.isTracking = false;
    this.trackingInterval = null;
    this.currentTourId = null;
    this.currentUserId = null;
    this.lastKnownLocation = null;
    this.socket = null;
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    this.updateInterval = parseInt(import.meta.env.VITE_LOCATION_UPDATE_INTERVAL) || 30000; // 30 seconds
    this.isNative = nativeLocationService.isNativePlatform();
    
    // Initialize services
    this.initializeIndexedDB();
    this.initializeSocket();
    this.initializeNativeServices();
    
    // Register service worker for web fallback
    if (!this.isNative) {
      this.registerServiceWorker();
    }
  }

  async initializeNativeServices() {
    if (this.isNative) {
      try {
        // Set up native location service callbacks
        nativeLocationService.setLocationUpdateListener((position) => {
          this.handleNativeLocationUpdate(position);
        });
        
        nativeLocationService.setErrorListener((error) => {
          console.error('❌ Native location error:', error);
        });
        
        console.log('📱 Native location services configured');
      } catch (error) {
        console.error('❌ Failed to initialize native services:', error);
      }
    }
  }

  handleNativeLocationUpdate(position) {
    if (!this.isTracking) return;

    const locationData = {
      userId: this.currentUserId,
      tourId: this.currentTourId,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: new Date(position.timestamp).toISOString()
    };

    this.lastKnownLocation = locationData;
    this.processLocationUpdate(locationData);
  }

  async processLocationUpdate(locationData) {
    try {
      // Send to backend
      await this.sendLocationUpdate(locationData);
      
      // Send via socket for real-time updates
      if (this.socket && this.socket.connected) {
        this.socket.emit('location-update', {
          tourId: this.currentTourId,
          location: locationData
        });
      }
    } catch (error) {
      console.error('❌ Error processing location update:', error);
      
      // Store in IndexedDB if network error
      try {
        await locationDBService.addLocation(locationData);
        console.log('📦 Location stored offline in IndexedDB');
      } catch (dbError) {
        console.error('❌ Failed to store location offline:', dbError);
      }
    }
  }

  async initializeIndexedDB() {
    try {
      await locationDBService.initDB();
      // Migrate from localStorage if needed
      await locationDBService.migrateFromLocalStorage();
      console.log('📦 IndexedDB initialized for offline location storage');
    } catch (error) {
      console.error('❌ Failed to initialize IndexedDB:', error);
    }
  }
  
  async initializeSocket() {
    if (typeof window !== 'undefined' && window.io) {
      this.socket = window.io(this.backendUrl);
      
      this.socket.on('connect', () => {
        console.log('📡 Connected to location tracking server');
        this.syncOfflineLocations();
      });
      
      this.socket.on('disconnect', () => {
        console.log('📡 Disconnected from location tracking server');
      });
      
      this.socket.on('emergency-response', (data) => {
        console.log('👮 Received emergency response:', data);
        this.handleEmergencyResponse(data);
      });
    }
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('🔧 Service Worker registered for background location tracking');
        
        // Listen for background sync events
        if ('sync' in window.ServiceWorkerRegistration.prototype) {
          await registration.sync.register('location-sync');
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }
  
  async startTracking(tourId, userId) {
    if (this.isTracking) {
      console.log('⚠️ Location tracking already active');
      return;
    }
    
    this.currentTourId = tourId;
    this.currentUserId = userId;
    
    try {
      // Request location permissions
      const permission = await this.requestLocationPermission();
      if (permission !== 'granted') {
        throw new Error('Location permission denied');
      }
      
      // Start tracking
      this.isTracking = true;
      
      // Join tour tracking room
      if (this.socket) {
        this.socket.emit('join-tour-tracking', { tourId, userId });
      }
      
      // Start location updates (native or web)
      if (this.isNative) {
        await this.startNativeLocationUpdates();
      } else {
        this.startLocationUpdates();
      }
      
      // Notify backend to start tracking
      await this.notifyBackendStartTracking();
      
      // Store in localStorage for persistence
      this.saveTrackingState();
      
      console.log(`🎯 ${this.isNative ? 'Native' : 'Web'} location tracking started for tour ${tourId}`);
      
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      this.isTracking = false;
      throw error;
    }
  }
  
  async startNativeLocationUpdates() {
    try {
      const result = await nativeLocationService.startTracking({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });
      
      console.log('📱 Native location tracking started:', result);
    } catch (error) {
      console.error('❌ Failed to start native location tracking:', error);
      // Fallback to web tracking
      this.startLocationUpdates();
    }
  }

  async stopTracking() {
    if (!this.isTracking) {
      return;
    }
    
    this.isTracking = false;
    
    // Stop native or web tracking
    if (this.isNative) {
      await nativeLocationService.stopTracking();
    } else {
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }
    }
    
    // Notify backend to stop tracking
    if (this.currentTourId) {
      await this.notifyBackendStopTracking();
      
      // Emit tour completion to socket
      if (this.socket) {
        this.socket.emit('tour-completed', { tourId: this.currentTourId });
      }
    }
    
    // Clear tracking state
    this.clearTrackingState();
    
    console.log('🛑 Location tracking stopped');
  }
  
  async requestLocationPermission() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        throw new Error('Location permission denied');
      }
      
      if (permission.state === 'prompt') {
        // Request permission by attempting to get location
        await this.getCurrentLocation();
      }
      
      return permission.state;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      throw error;
    }
  }
  
  async getCurrentLocation() {
    if (this.isNative) {
      try {
        return await nativeLocationService.getCurrentPosition();
      } catch (error) {
        console.error('❌ Native location failed, falling back to web:', error);
      }
    }
    
    // Web fallback
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout for high accuracy
          maximumAge: 30000 // Reduced cache age for more frequent updates
        }
      );
    });
  }
  
  startLocationUpdates() {
    // Clear any existing interval
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    
    // Get initial location
    this.updateLocation();
    
    // Set up periodic updates
    this.trackingInterval = setInterval(() => {
      this.updateLocation();
    }, this.updateInterval);
  }
  
  async updateLocation() {
    if (!this.isTracking) return;
    
    try {
      const position = await this.getCurrentLocation();
      const locationData = {
        userId: this.currentUserId,
        tourId: this.currentTourId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        timestamp: new Date().toISOString()
      };
      
      this.lastKnownLocation = locationData;
      
      // Send to backend
      await this.sendLocationUpdate(locationData);
      
      // Send via socket for real-time updates
      if (this.socket && this.socket.connected) {
        this.socket.emit('location-update', {
          tourId: this.currentTourId,
          location: locationData
        });
      }
      
    } catch (error) {
      console.error('❌ Error updating location:', error);
      
      // Store in IndexedDB if network error
      if (this.lastKnownLocation) {
        try {
          await locationDBService.addLocation(this.lastKnownLocation);
          console.log('📦 Location stored offline in IndexedDB');
        } catch (dbError) {
          console.error('❌ Failed to store location offline:', dbError);
        }
      }
    }
  }
  
  async sendLocationUpdate(locationData) {
    try {
      const response = await fetch(`${this.backendUrl}/api/v1/location/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📍 Location updated successfully:', result.locationId);
      
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
      
      // Add to IndexedDB for offline sync
      try {
        await locationDBService.addLocation(locationData);
        console.log('📦 Location queued offline in IndexedDB');
      } catch (dbError) {
        console.error('❌ Failed to queue location offline:', dbError);
      }
      
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('location-sync');
      }
    }
  }
  
  async notifyBackendStartTracking() {
    try {
      await fetch(`${this.backendUrl}/api/v1/location/start-tracking/${this.currentTourId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.currentUserId })
      });
    } catch (error) {
      console.error('Failed to notify backend of tracking start:', error);
    }
  }
  
  async notifyBackendStopTracking() {
    try {
      await fetch(`${this.backendUrl}/api/v1/location/stop-tracking/${this.currentTourId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Failed to notify backend of tracking stop:', error);
    }
  }
  
  async syncOfflineLocations() {
    try {
      const offlineLocations = await locationDBService.getAllLocations();
      
      if (offlineLocations.length === 0) return;
      
      console.log(`📤 Syncing ${offlineLocations.length} offline locations from IndexedDB`);
      
      let syncedCount = 0;
      
      for (const locationData of offlineLocations) {
        try {
          // Remove IndexedDB specific fields before sending
          const { id, createdAt: _createdAt, ...cleanLocationData } = locationData;
          
          await this.sendLocationUpdate(cleanLocationData);
          
          // Remove successfully synced location from IndexedDB
          await locationDBService.removeLocation(id);
          syncedCount++;
          
        } catch (error) {
          console.error('Failed to sync offline location:', error);
          // Keep the location in IndexedDB for retry later
        }
      }
      
      console.log(`✅ Successfully synced ${syncedCount} of ${offlineLocations.length} offline locations`);
      
    } catch (error) {
      console.error('❌ Failed to sync offline locations from IndexedDB:', error);
    }
  }
  
  async triggerEmergency(message = 'Emergency assistance needed!') {
    if (!this.isTracking || !this.lastKnownLocation) {
      throw new Error('Cannot trigger emergency: No active location tracking');
    }
    
    try {
      const emergencyData = {
        userId: this.currentUserId,
        tourId: this.currentTourId,
        latitude: this.lastKnownLocation.latitude,
        longitude: this.lastKnownLocation.longitude,
        message
        // Emergency contacts will be fetched from Appwrite by backend
      };
      
      // Send emergency alert to backend
      const response = await fetch(`${this.backendUrl}/api/v1/emergency/alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emergencyData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send emergency alert: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Send via socket for immediate notification
      if (this.socket && this.socket.connected) {
        this.socket.emit('emergency-alert', {
          tourId: this.currentTourId,
          location: this.lastKnownLocation,
          message
        });
      }
      
      console.log('🚨 Emergency alert sent:', result.emergencyId);
      return result;
      
    } catch (error) {
      console.error('❌ Failed to trigger emergency:', error);
      throw error;
    }
  }
  
  handleEmergencyResponse(responseData) {
    // Handle emergency response from police
    const event = new CustomEvent('emergency-response', {
      detail: responseData
    });
    window.dispatchEvent(event);
  }
  
  saveTrackingState() {
    localStorage.setItem('locationTracking', JSON.stringify({
      isTracking: this.isTracking,
      tourId: this.currentTourId,
      userId: this.currentUserId,
      startedAt: new Date().toISOString()
    }));
  }
  
  clearTrackingState() {
    localStorage.removeItem('locationTracking');
    this.currentTourId = null;
    this.currentUserId = null;
  }

  async loadOfflineQueue() {
    // Migration handled in initializeIndexedDB
    // This method kept for compatibility
  }

  async restoreTrackingState() {
    try {
      const stored = localStorage.getItem('locationTracking');
      if (stored) {
        const state = JSON.parse(stored);
        if (state.isTracking && state.tourId && state.userId) {
          console.log('🔄 Restoring location tracking state');
          await this.startTracking(state.tourId, state.userId);
        }
      }
    } catch (error) {
      console.error('Failed to restore tracking state:', error);
    }
  }

  async getTrackingStatus() {
    const offlineCount = await locationDBService.getLocationCount();
    
    return {
      isTracking: this.isTracking,
      tourId: this.currentTourId,
      userId: this.currentUserId,
      lastLocation: this.lastKnownLocation,
      offlineQueueSize: offlineCount
    };
  }
}

// Create singleton instance
const locationTrackingService = new LocationTrackingService();

// Auto-restore tracking state on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // IndexedDB initialization and migration handled in constructor
    locationTrackingService.restoreTrackingState();
  });
}

export default locationTrackingService;