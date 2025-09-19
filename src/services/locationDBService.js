// IndexedDB service for offline location storage
class LocationDBService {
  constructor() {
    this.dbName = 'YatriSurakshaDB';
    this.dbVersion = 1;
    this.storeName = 'offlineLocations';
    this.maxLocations = 500; // Keep only recent 500 locations
    this.db = null;
  }

  async initDB() {
    if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
      return this.db;
    }

    // Close existing connection if it exists
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        // Verify the object store exists
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          console.error('❌ Object store not found, need to upgrade database');
          this.db.close();
          this.db = null;
          // Force database upgrade by incrementing version
          this.dbVersion += 1;
          this.initDB().then(resolve).catch(reject);
          return;
        }
        
        console.log('✅ IndexedDB opened successfully with object store:', this.storeName);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        console.log('🔄 Upgrading IndexedDB schema...');
        
        // Create object store for offline locations
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create index for timestamp to easily sort and cleanup old records
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          
          console.log('📦 Created IndexedDB object store for offline locations');
        }
      };

      request.onblocked = () => {
        console.warn('⚠️ IndexedDB upgrade blocked, please close other tabs');
      };
    });
  }

  async addLocation(locationData) {
    try {
      await this.initDB();
      
      // Double-check that the object store exists
      if (!this.db || !this.db.objectStoreNames.contains(this.storeName)) {
        console.error('❌ Database or object store not available, reinitializing...');
        this.db = null;
        await this.initDB();
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Add timestamp if not present
      const locationWithTimestamp = {
        ...locationData,
        timestamp: locationData.timestamp || new Date().toISOString(),
        createdAt: Date.now()
      };
      
      await store.add(locationWithTimestamp);
      
      // Clean up old locations to maintain size limit
      await this.cleanupOldLocations();
      
      console.log('📍 Location stored in IndexedDB');
      
    } catch (error) {
      console.error('❌ Failed to store location in IndexedDB:', error);
      throw error;
    }
  }

  async getAllLocations() {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const locations = request.result || [];
          // Sort by timestamp, newest first
          locations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          resolve(locations);
        };
        
        request.onerror = () => {
          console.error('❌ Failed to get locations from IndexedDB:', request.error);
          reject(request.error);
        };
      });
      
    } catch (error) {
      console.error('❌ Failed to retrieve locations from IndexedDB:', error);
      return [];
    }
  }

  async clearAllLocations() {
    try {
      await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.clear();
      
      console.log('🗑️ All offline locations cleared from IndexedDB');
      
    } catch (error) {
      console.error('❌ Failed to clear locations from IndexedDB:', error);
    }
  }

  async removeLocation(id) {
    try {
      await this.initDB();
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      await store.delete(id);
      
    } catch (error) {
      console.error('❌ Failed to remove location from IndexedDB:', error);
    }
  }

  async cleanupOldLocations() {
    try {
      const locations = await this.getAllLocations();
      
      if (locations.length > this.maxLocations) {
        // Sort by timestamp (oldest first) and remove excess
        locations.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const locationsToRemove = locations.slice(0, locations.length - this.maxLocations);
        
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        for (const location of locationsToRemove) {
          await store.delete(location.id);
        }
        
        console.log(`🧹 Cleaned up ${locationsToRemove.length} old locations from IndexedDB`);
      }
      
    } catch (error) {
      console.error('❌ Failed to cleanup old locations:', error);
    }
  }

  async getLocationCount() {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
    } catch (error) {
      console.error('❌ Failed to get location count:', error);
      return 0;
    }
  }

  // Migration helper: Import from localStorage
  async migrateFromLocalStorage() {
    try {
      const storedQueue = localStorage.getItem('offlineLocationQueue');
      if (storedQueue) {
        const locations = JSON.parse(storedQueue);
        
        for (const location of locations) {
          await this.addLocation(location);
        }
        
        // Clear old localStorage data
        localStorage.removeItem('offlineLocationQueue');
        
        console.log(`📦 Migrated ${locations.length} locations from localStorage to IndexedDB`);
      }
    } catch (error) {
      console.error('❌ Failed to migrate from localStorage:', error);
    }
  }
}

// Create singleton instance
const locationDBService = new LocationDBService();

export default locationDBService;