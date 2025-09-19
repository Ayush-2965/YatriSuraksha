// Background Location Service for YatriSuraksha
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';

class BackgroundLocationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.isTracking = false;
    this.watchId = null;
    this.backgroundGeolocation = null;
    this.onLocationUpdate = null;
    this.onError = null;
    
    // Initialize background service for native platforms
    if (this.isNative) {
      this.initializeBackgroundService();
    }
  }

  async initializeBackgroundService() {
    try {
      // Only load background geolocation on native platforms to avoid Vite build issues
      if (this.isNative) {
        try {
          // Use string concatenation to avoid static analysis
          const packageName = '@capacitor-community/' + 'background-geolocation';
          const backgroundGeolocationModule = await import(/* @vite-ignore */ packageName);
          this.backgroundGeolocation = backgroundGeolocationModule.BackgroundGeolocation;
          
          // Request permissions
          await this.requestPermissions();
        } catch (importError) {
          console.warn('Background geolocation not available in web environment:', importError.message);
          this.isNative = false; // Fallback to web mode
          return;
        }
        
        console.log('🔄 Background location service initialized');
      } else {
        console.log('🌐 Web platform detected, using standard geolocation');
      }
    } catch (error) {
      console.error('❌ Failed to initialize background location:', error);
      // Fallback to standard geolocation
      this.backgroundGeolocation = null;
    }
  }

  async requestPermissions() {
    try {
      if (this.isNative && this.backgroundGeolocation) {
        // Request background location permissions for native
        const result = await this.backgroundGeolocation.requestPermissions({
          permissions: ['location', 'background-location']
        });
        
        if (result.location === 'granted') {
          console.log('✅ Background location permission granted');
          return true;
        } else {
          console.warn('⚠️ Background location permission denied, using foreground only');
        }
      } else {
        // Request standard location permission for web
        const permission = await Geolocation.requestPermissions();
        if (permission.location === 'granted') {
          console.log('✅ Location permission granted');
          return true;
        }
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
    }
    return false;
  }

  async startTracking(onLocationUpdate, onError) {
    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;

    try {
      if (this.isNative && this.backgroundGeolocation) {
        await this.startBackgroundTracking();
      } else {
        await this.startForegroundTracking();
      }
      
      this.isTracking = true;
      console.log('🛰️ Location tracking started');
    } catch (error) {
      console.error('❌ Failed to start tracking:', error);
      if (this.onError) this.onError(error);
    }
  }

  async startBackgroundTracking() {
    const options = {
      backgroundMessage: 'YatriSuraksha is tracking your location for safety.',
      enableHighAccuracy: true,
      requestPermissions: true,
      stale: false,
      distanceFilter: 10 // meters
    };

    // Add location watcher
    this.watchId = await this.backgroundGeolocation.addWatcher(
      options,
      (location) => {
        if (location && this.onLocationUpdate) {
          this.onLocationUpdate({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: Date.now(),
            source: 'background'
          });
        }
      }
    );

    console.log('🔄 Background location tracking active');
  }

  async startForegroundTracking() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000
    };

    this.watchId = await Geolocation.watchPosition(options, (position, error) => {
      if (error) {
        console.error('❌ Location error:', error);
        if (this.onError) this.onError(error);
        return;
      }

      if (position && this.onLocationUpdate) {
        this.onLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          source: 'foreground'
        });
      }
    });

    console.log('🔄 Foreground location tracking active');
  }

  async stopTracking() {
    try {
      if (this.watchId) {
        if (this.isNative && this.backgroundGeolocation) {
          await this.backgroundGeolocation.removeWatcher({ id: this.watchId });
        } else {
          await Geolocation.clearWatch({ id: this.watchId });
        }
        this.watchId = null;
      }

      this.isTracking = false;
      console.log('🛑 Location tracking stopped');
    } catch (error) {
      console.error('❌ Failed to stop tracking:', error);
    }
  }

  async getCurrentLocation() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
        source: 'current'
      };
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      throw error;
    }
  }

  // Setup app state listeners for background/foreground transitions
  setupAppStateListeners() {
    if (!this.isNative) return;

    App.addListener('appStateChange', ({ isActive }) => {
      console.log('📱 App state changed:', isActive ? 'active' : 'background');
      
      if (!isActive && this.isTracking && this.backgroundGeolocation) {
        // App went to background, background service should continue
        console.log('🔄 App in background, location tracking continues');
      } else if (isActive && this.isTracking) {
        // App became active, continue tracking
        console.log('🔄 App active, location tracking continues');
      }
    });
  }

  getTrackingStatus() {
    return {
      isTracking: this.isTracking,
      isNative: this.isNative,
      hasBackgroundSupport: !!this.backgroundGeolocation,
      watchId: this.watchId
    };
  }
}

// Export singleton instance
export const backgroundLocationService = new BackgroundLocationService();
export default backgroundLocationService;