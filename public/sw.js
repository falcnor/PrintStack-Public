// Service Worker for PrintStack application
// Provides offline capability and caching strategies

const CACHE_NAME = 'printstack-v1.0.0';
const STATIC_CACHE = 'printstack-static-v1.0.0';
const DYNAMIC_CACHE = 'printstack-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  // Add core application assets
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints and routes that should be cached
const CACHEABLE_ROUTES = [
  /^\/api\/filaments/,
  /^\/api\/models/,
  /^\/api\/prints/
];

// Network timeout configuration
const NETWORK_TIMEOUT = 5000;

// Service Worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Service worker activated successfully');
    })
  );
});

// Network request interception
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // Skip external requests
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Serve static assets from cache
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      serveStaticAsset(request)
    );
    return;
  }

  // Handle API requests with network-first strategy
  if (isAPIRequest(request)) {
    event.respondWith(
      handleAPIRequest(request)
    );
    return;
  }

  // Handle navigation requests with cache-first strategy
  if (isNavigationRequest(request)) {
    event.respondWith(
      handleNavigationRequest(request)
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    networkFirstWithCacheFallback(request)
  );
});

/**
 * Serve static assets from cache
 */
async function serveStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, try network and cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Error serving static asset:', error);
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Handle API requests with network-first strategy
 */
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetchWithTimeout(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`);

  } catch (error) {
    console.log(`[SW] Network failed for API request: ${request.url}, trying cache`);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving API response from cache');
      return cachedResponse;
    }

    // Return offline response for API requests
    console.log('[SW] No cached response available for API request');
    return new Response(JSON.stringify({
      error: true,
      message: 'Offline - No cached data available',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

/**
 * Handle navigation requests with cache-first strategy
 */
async function handleNavigationRequest(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network if not in cache
    const networkResponse = await fetchWithTimeout(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // Fallback to index.html for SPA routing
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }

    throw new Error('No fallback available');

  } catch (error) {
    console.error('[SW] Error handling navigation request:', error);
    return new Response('Offline - Application not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * Network-first with cache fallback strategy
 */
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetchWithTimeout(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`);

  } catch (error) {
    console.log(`[SW] Network failed, trying cache for: ${request.url}`);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache');
      return cachedResponse;
    }

    console.log('[SW] No cached version available');
    throw error;
  }
}

/**
 * Fetch with timeout
 */
function fetchWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, NETWORK_TIMEOUT);

    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Check if request is for API
 */
function isAPIRequest(request) {
  const url = new URL(request.url);
  return CACHEABLE_ROUTES.some(route => route.test(url.pathname));
}

/**
 * Check if request is for navigation
 */
function isNavigationRequest(request) {
  const url = new URL(request.url);
  return request.mode === 'navigate' || (url.origin === self.location.origin && url.pathname.includes('.'));
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event');

  if (event.tag === 'background-sync') {
    event.waitUntil(
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  try {
    // Get queued actions from IndexedDB
    const queuedActions = await getQueuedActions();

    for (const action of queuedActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });

        if (response.ok) {
          // Remove successful action from queue
          await removeQueuedAction(action.id);
          console.log('[SW] Background sync successful for action:', action.id);
        } else {
          console.error('[SW] Background sync failed for action:', action.id, response.status);
        }
      } catch (error) {
        console.error('[SW] Background sync error for action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync error:', error);
  }
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'You have new notifications',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore this new world',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/favicon.ico'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PrintStack Notification', options)
  );
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Notification already closed
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * IndexedDB helpers for offline queue management
 */
async function getQueuedActions() {
  return new Promise((resolve) => {
    const request = indexedDB.open('PrintStackOfflineDB', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => resolve([]);
    };

    request.onerror = () => resolve([]);
  });
}

async function removeQueuedAction(actionId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PrintStackOfflineDB', 1);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const deleteRequest = store.delete(actionId);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
  });
}

/**
 * Periodic cache cleanup
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    cleanupOldCache();
  }
});

function cleanupOldCache() {
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        // Keep only current caches
        if (![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE].includes(cacheName)) {
          console.log(`[SW] Cleaning up old cache: ${cacheName}`);
          return caches.delete(cacheName);
        }
      })
    );
  });
}

console.log('[SW] Service worker file loaded');