// Native Location Service using Capacitor plugins
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { backgroundLocationService } from './backgroundLocationService.js';

class NativeLocationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.isTracking = false;
    this.watchId = null;
    this.backgroundModeEnabled = false;
    this.onLocationUpdate = null;
    this.onError = null;
    
    // Initialize native services if running on native platform
    if (this.isNative) {
      this.initializeNativeServices();
    }
  }

  async initializeNativeServices() {
    try {
      // Request permissions first
      await this.requestAllPermissions();
      
      // Enable background mode
      await this.enableBackgroundMode();
      
      // Set up app state listeners
      this.setupAppStateListeners();
      
      console.log('🚀 Native location services initialized');
    } catch (error) {
      console.error('❌ Failed to initialize native services:', error);
    }
  }

  async requestAllPermissions() {
    try {
      // Request location permissions
      const locationPermission = await Geolocation.requestPermissions();
      console.log('📍 Location permission:', locationPermission);

      if (locationPermission.location !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Request background location permission (Android specific)
      if (this.isNative) {
        const backgroundPermission = await Geolocation.requestPermissions({
          permissions: ['location', 'coarseLocation']
        });
        console.log('🔄 Background location permission:', backgroundPermission);
      }

      return true;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      throw error;
    }
  }

  async enableBackgroundMode() {
    if (!this.isNative) return;

    try {
      // Request background location permission using standard Geolocation
      const permission = await Geolocation.requestPermissions({
        permissions: ['location', 'coarseLocation']
      });
      
      if (permission.location === 'granted') {
        console.log('🔄 Location permission granted');
        this.backgroundModeEnabled = true;
      } else {
        console.warn('⚠️ Location permission denied');
      }
    } catch (error) {
      console.error('❌ Failed to enable background mode:', error);
    }
  }

  setupAppStateListeners() {
    if (!this.isNative) return;

    // Listen for app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('📱 App state changed:', isActive ? 'active' : 'background');
      
      if (!isActive && this.isTracking) {
        // App went to background, ensure background mode is active
        this.ensureBackgroundTracking();
      }
    });

    // Listen for app resume
    App.addListener('resume', () => {
      console.log('📱 App resumed from background');
      this.syncBackgroundLocations();
    });
  }

  async ensureBackgroundTracking() {
    if (!this.backgroundModeEnabled) {
      await this.enableBackgroundMode();
    }
    
    // Request battery optimization exemption
    await this.requestBatteryOptimizationExemption();
  }

  async requestBatteryOptimizationExemption() {
    if (!this.isNative) return;

    try {
      const deviceInfo = await Device.getInfo();
      console.log('📱 Device info:', deviceInfo);

      // For Android, we'll need to use a custom plugin or show instructions
      // This is a placeholder for battery optimization handling
      await this.showBatteryOptimizationInstructions();
    } catch (error) {
      console.error('❌ Battery optimization request failed:', error);
    }
  }

  async showBatteryOptimizationInstructions() {
    // Show modal or notification to user about battery optimization
    console.log('🔋 Please disable battery optimization for YatriSuraksha in your device settings');
    
    // You can implement a modal here to guide users
    const instructions = {
      title: 'Battery Optimization',
      message: 'For reliable location tracking, please disable battery optimization for YatriSuraksha in your device settings.',
      steps: [
        'Go to Settings > Apps > YatriSuraksha',
        'Tap on Battery',
        'Select "Don\'t optimize" or "Allow background activity"'
      ]
    };

    // Store instructions for later display
    await Preferences.set({
      key: 'batteryOptimizationInstructions',
      value: JSON.stringify(instructions)
    });

    return instructions;
  }

  async startTracking(options = {}) {
    try {
      if (!this.isNative) {
        // Fallback to web geolocation
        return this.startWebTracking(options);
      }

      // Use background location service for enhanced offline support
      await backgroundLocationService.startTracking(
        (location) => {
          console.log('📍 Background location update:', location);
          if (this.onLocationUpdate) {
            // Convert to expected format
            const position = {
              coords: {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy
              },
              timestamp: location.timestamp
            };
            this.onLocationUpdate(position);
          }
        },
        (error) => {
          console.error('❌ Background location error:', error);
          if (this.onError) {
            this.onError(error);
          }
        }
      );

      this.isTracking = true;
      console.log('🛰️ Enhanced background location tracking started');
    } catch (error) {
      console.error('❌ Failed to start enhanced tracking, falling back to standard:', error);
      
      // Fallback to standard tracking
      return this.startStandardTracking(options);
    }
  }

  async startStandardTracking(options = {}) {
    try {
      // Check permissions
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        await this.requestAllPermissions();
      }

      // Enable background mode
      await this.ensureBackgroundTracking();

      // Start location watching
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        },
        (position) => {
          if (this.onLocationUpdate) {
            this.onLocationUpdate(position);
          }
        },
        (error) => {
          if (this.onError) {
            this.onError(error);
          }
        }
      );

      this.isTracking = true;
      console.log('🎯 Native location tracking started');
      
      return { success: true, watchId: this.watchId };
    } catch (error) {
      console.error('❌ Failed to start native tracking:', error);
      throw error;
    }
  }

  async startWebTracking(options = {}) {
    // Fallback to web geolocation for non-native platforms
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (this.onLocationUpdate) {
            this.onLocationUpdate(position);
          }
        },
        (error) => {
          if (this.onError) {
            this.onError(error);
          }
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
          ...options
        }
      );

      this.isTracking = true;
      resolve({ success: true, watchId: this.watchId });
    });
  }

  async stopTracking() {
    try {
      // Stop background location service first
      if (this.isNative && backgroundLocationService.getTrackingStatus().isTracking) {
        await backgroundLocationService.stopTracking();
      }

      if (this.watchId) {
        if (this.isNative) {
          await Geolocation.clearWatch({ id: this.watchId });
        } else {
          navigator.geolocation.clearWatch(this.watchId);
        }
        this.watchId = null;
      }

      this.isTracking = false;
      this.backgroundModeEnabled = false;

      console.log('🛑 Location tracking stopped');
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
    }
  }

  async getCurrentPosition() {
    try {
      if (this.isNative) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000
        });
        return position;
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 30000
            }
          );
        });
      }
    } catch (error) {
      console.error('❌ Error getting current position:', error);
      throw error;
    }
  }

  async checkPermissions() {
    try {
      if (this.isNative) {
        const permission = await Geolocation.checkPermissions();
        return permission.location === 'granted';
      }
      return true; // Web permissions are handled by browser
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return false;
    }
  }

  async syncBackgroundLocations() {
    try {
      // Get any cached background locations
      const { value } = await Preferences.get({ key: 'backgroundLocations' });
      if (value) {
        const backgroundLocations = JSON.parse(value);
        console.log(`📤 Syncing ${backgroundLocations.length} background locations`);
        
        // Process background locations here
        // This would integrate with your existing location sync logic
        
        // Clear cached locations after processing
        await Preferences.remove({ key: 'backgroundLocations' });
      }
    } catch (error) {
      console.error('❌ Error syncing background locations:', error);
    }
  }

  // Event listeners
  setLocationUpdateListener(callback) {
    this.onLocationUpdate = callback;
  }

  setErrorListener(callback) {
    this.onError = callback;
  }

  // Utility methods
  isNativePlatform() {
    return this.isNative;
  }

  isCurrentlyTracking() {
    return this.isTracking;
  }

  async getDeviceInfo() {
    if (this.isNative) {
      return await Device.getInfo();
    }
    return { platform: 'web' };
  }
}

// Create singleton instance
const nativeLocationService = new NativeLocationService();

export default nativeLocationService;