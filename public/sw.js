// Service Worker for PrintStack application
// Provides offline capability and caching strategies with progressive enhancement

const CACHE_NAME = 'printstack-v1.0.0';
const STATIC_CACHE = 'printstack-static-v1.0.0';
const DYNAMIC_CACHE = 'printstack-dynamic-v1.0.0';
const FALLBACK_CACHE = 'printstack-fallback-v1.0.0';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/styles.css',
  // Add core application assets
  '/manifest.json',
  '/favicon.ico',
  // Progressive enhancement fallbacks
  '/offline.html',
  '/offline-fallback.js'
];

// Critical application assets that should always be available
const CRITICAL_ASSETS = [
  '/index.html',
  '/offline.html',
  '/manifest.json'
];

// Fallback responses for different content types
const FALLBACK_RESPONSES = {
  html: () => caches.match('/offline.html'),
  json: () => new Response(JSON.stringify({
    error: true,
    message: 'Offline - No cached data available',
    offline: true,
    timestamp: new Date().toISOString()
  }), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  }),
  js: () => new Response('/* Offline - Service unavailable */', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache'
    }
  }),
  css: () => new Response('/* Offline - Styles unavailable */', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/css',
      'Cache-Control': 'no-cache'
    }
  }),
  image: () => new Response('', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  })
};

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
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('[SW] Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      // Pre-populate fallback cache with essential responses
      caches.open(FALLBACK_CACHE)
        .then((cache) => {
          console.log('[SW] Preparing fallback responses');
          return Promise.all([
            cache.put('/offline-fallback.html', new Response(createOfflineHTML(), {
              headers: { 'Content-Type': 'text/html' }
            })),
            cache.put('/offline-data.json', new Response(JSON.stringify({
              filaments: [],
              models: [],
              prints: [],
              settings: {},
              offline: true
            }), {
              headers: { 'Content-Type': 'application/json' }
            }))
          ]);
        })
    ])
    .then(() => {
      console.log('[SW] Service worker installation complete');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('[SW] Failed to install service worker:', error);
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
            if (![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, FALLBACK_CACHE].includes(cacheName)) {
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

  // Default: network-first with progressive fallbacks
  event.respondWith(
    progressiveFetchWithFallbacks(request)
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
 * Progressive fetch with multiple fallback layers
 */
async function progressiveFetchWithFallbacks(request) {
  try {
    // 1. Try network first
    const networkResponse = await fetchWithTimeout(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    throw new Error(`Network response not ok: ${networkResponse.status}`);

  } catch (networkError) {
    console.log(`[SW] Network failed for: ${request.url}, trying cache`);

    try {
      // 2. Try cache
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        console.log('[SW] Serving from cache');
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('[SW] Cache access failed:', cacheError);
    }

    try {
      // 3. Try content-type specific fallbacks
      const fallbackResponse = await getContentTypeFallback(request);
      if (fallbackResponse) {
        console.log('[SW] Serving content-type fallback');
        return fallbackResponse;
      }
    } catch (fallbackError) {
      console.error('[SW] Content-type fallback failed:', fallbackError);
    }

    // 4. Final fallback - basic offline response
    console.log('[SW] All fallbacks exhausted, serving basic offline response');
    return new Response('Offline - Service temporarily unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

/**
 * Get content-type specific fallback
 */
async function getContentTypeFallback(request) {
  const url = new URL(request.url);
  const path = url.pathname.toLowerCase();

  // Determine content type from extension or Accept header
  let contentType = 'html';

  if (path.endsWith('.js')) contentType = 'js';
  else if (path.endsWith('.css')) contentType = 'css';
  else if (path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/)) contentType = 'image';
  else if (path.endsWith('.json')) contentType = 'json';
  else if (request.headers.get('Accept')?.includes('application/json')) contentType = 'json';
  else if (request.headers.get('Accept')?.includes('text/css')) contentType = 'css';
  else if (request.headers.get('Accept')?.includes('application/javascript')) contentType = 'js';

  const fallbackFunction = FALLBACK_RESPONSES[contentType];
  if (fallbackFunction) {
    return await fallbackFunction();
  }

  // Default to HTML fallback for navigation requests
  if (request.mode === 'navigate') {
    return await FALLBACK_RESPONSES.html();
  }

  return null;
}

/**
 * Create offline HTML page
 */
function createOfflineHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PrintStack - Offline</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .offline-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .offline-icon {
      font-size: 4rem;
      color: #666;
      margin-bottom: 1rem;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    .offline-message {
      color: #666;
      margin-bottom: 2rem;
    }
    .retry-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
    }
    .retry-button:hover {
      background: #0056b3;
    }
    .storage-status {
      margin-top: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 0.9rem;
    }
    @media (max-width: 600px) {
      body {
        padding: 1rem;
      }
      .offline-container {
        padding: 1rem;
      }
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="offline-icon">📱</div>
    <h1>Offline Mode</h1>
    <p class="offline-message">
      PrintStack is currently unavailable. You're viewing a limited offline version.
      Some features may not work until you reconnect to the internet.
    </p>
    <button class="retry-button" onclick="window.location.reload()">
      Try Again
    </button>

    <div class="storage-status">
      <p><strong>Local Data Status:</strong></p>
      <p id="storage-status">Checking local storage...</p>
    </div>
  </div>

  <script>
    // Check if we have local data available
    try {
      const filaments = localStorage.getItem('printstack_filaments');
      const models = localStorage.getItem('printstack_models');
      const prints = localStorage.getItem('printstack_prints');

      if (filaments || models || prints) {
        document.getElementById('storage-status').textContent =
          '✓ Local data available - You can view existing records when back online.';
      } else {
        document.getElementById('storage-status').textContent =
          'No local data found - App will be fully functional when back online.';
      }
    } catch (error) {
      document.getElementById('storage-status').textContent =
        'Unable to access local storage.';
    }

    // Periodically check for connection
    setInterval(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 30000);
  </script>
</body>
</html>`;
}

/**
 * Enhanced background sync with better error handling
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(
      handleBackgroundSync()
        .then(() => {
          console.log('[SW] Background sync completed successfully');
        })
        .catch((error) => {
          console.error('[SW] Background sync failed:', error);
        })
    );
  }
});

/**
 * Periodic cache cleanup with better error handling
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    cleanupOldCache();
  }

  if (event.data && event.data.type === 'FORCE_REFRESH') {
    forceRefreshCache();
  }
});

function cleanupOldCache() {
  caches.keys().then((cacheNames) => {
    return Promise.all(
      cacheNames.map((cacheName) => {
        // Keep only current caches
        if (![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, FALLBACK_CACHE].includes(cacheName)) {
          console.log(`[SW] Cleaning up old cache: ${cacheName}`);
          return caches.delete(cacheName);
        }
      })
    );
  });
}

async function forceRefreshCache() {
  try {
    // Clear dynamic cache
    await caches.delete(DYNAMIC_CACHE);
    console.log('[SW] Dynamic cache cleared');

    // Notify all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_REFRESHED',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[SW] Failed to refresh cache:', error);
  }
}

/**
 * Network status change detection
 */
self.addEventListener('online', () => {
  console.log('[SW] Application is online');
  // Trigger any pending sync actions
  self.registration.sync.register('background-sync');
});

self.addEventListener('offline', () => {
  console.log('[SW] Application is offline');
});

console.log('[SW] Service worker loaded with enhanced fallback mechanisms');