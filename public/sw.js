// Service Worker for PWA functionality and background location tracking
const CACHE_NAME = 'yatri-suraksha-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/manifest.json',
  '/vite.svg'
];

const API_CACHE_NAME = 'yatri-api-cache-v1';
const API_URLS = [
  '/api/v1/location',
  '/api/v1/tours',
  '/api/v1/emergency'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
      caches.open(API_CACHE_NAME).then((cache) => cache.addAll([]))
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName !== CACHE_NAME && 
              cacheName !== API_CACHE_NAME
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache authentication-related requests
  if (url.pathname.includes('/account') || 
      url.pathname.includes('/auth') ||
      url.hostname.includes('appwrite') ||
      event.request.headers.get('authorization')) {
    
    // For auth requests, always try network first
    event.respondWith(
      fetch(event.request).catch(() => {
        // If auth request fails offline, return a proper response
        return new Response(JSON.stringify({ 
          error: 'Offline - using cached authentication' 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline HTML pages
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Sync location data when back online
async function syncLocationData() {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['locationQueue'], 'readwrite');
    const store = transaction.objectStore('locationQueue');
    const locations = await store.getAll();
    
    for (const location of locations) {
      try {
        await fetch('/api/location/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(location)
        });
        
        // Remove from queue after successful sync
        await store.delete(location.id);
      } catch (error) {
        console.error('Failed to sync location:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing location data:', error);
  }
}

// IndexedDB helper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YatriSurakshaDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Location queue for offline sync
      if (!db.objectStoreNames.contains('locationQueue')) {
        const locationStore = db.createObjectStore('locationQueue', { keyPath: 'id' });
        locationStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [100, 50, 100],
      data: data.data,
      requireInteraction: data.urgent || false,
      actions: data.actions || []
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'emergency') {
    // Handle emergency action
    event.waitUntil(
      self.clients.openWindow('/emergency')
    );
  } else {
    // Default action - open app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});