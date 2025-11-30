import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing Service Worker functionality
 * @param {Object} config - Configuration object
 * @returns {Object} Service Worker utilities
 */
export const useServiceWorker = (config = {}) => {
  const {
    swPath = '/sw.js',
    enableBackgroundSync = true,
    enableNotifications = false,
    cacheStrategy = 'network-first'
  } = config;

  const [registration, setRegistration] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Check Service Worker support
  useEffect(() => {
    const supported = 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      registerServiceWorker();
    }

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Register Service Worker
   */
  const registerServiceWorker = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      });

      console.log('[SW-Hook] Service Worker registered:', reg);
      setRegistration(reg);
      setIsInstalled(true);

      // Handle updates
      reg.addEventListener('updatefound', () => {
        console.log('[SW-Hook] New Service Worker found');
        const newWorker = reg.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW-Hook] New Service Worker waiting');
            setWaitingWorker(newWorker);
          }
        });
      });

      // Listen for controlling changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW-Hook] Controller changed, reloading page');
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW-Hook] Service Worker registration failed:', error);
      setIsInstalled(false);
    }
  }, [swPath]);

  /**
   * Skip waiting and activate new Service Worker
   */
  const activateUpdate = useCallback(() => {
    if (waitingWorker) {
      console.log('[SW-Hook] Activating new Service Worker');
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  /**
   * Unregister Service Worker
   */
  const unregister = useCallback(async () => {
    if (registration) {
      await registration.unregister();
      setRegistration(null);
      setIsInstalled(false);
      console.log('[SW-Hook] Service Worker unregistered');
    }
  }, [registration]);

  /**
   * Manual cache cleanup
   */
  const cleanupCache = useCallback(() => {
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'CACHE_CLEANUP'
      });
    }
  }, [registration]);

  /**
   * Show notification
   */
  const showNotification = useCallback(async (title, options = {}) => {
    if (!enableNotifications) {
      console.warn('[SW-Hook] Notifications are disabled');
      return false;
    }

    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          return false;
        }
      }

      if (Notification.permission !== 'granted') {
        console.warn('[SW-Hook] Notification permission not granted');
        return false;
      }

      // Show notification via Service Worker
      if (registration && registration.active) {
        await registration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });
        return true;
      }

      // Fallback to direct Notification API
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      return true;

    } catch (error) {
      console.error('[SW-Hook] Failed to show notification:', error);
      return false;
    }
  }, [enableNotifications, registration]);

  /**
   * Queue action for offline handling
   */
  const queueAction = useCallback((action) => {
    const queuedAction = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...action
    };

    setOfflineQueue(prev => [...prev, queuedAction]);

    // Store in IndexedDB for persistence
    storeQueuedAction(queuedAction);

    console.log('[SW-Hook] Action queued for offline:', queuedAction.id);
    return queuedAction.id;
  }, []);

  /**
   * Process offline queue when online
   */
  const processOfflineQueue = useCallback(() => {
    if (offlineQueue.length === 0) return;

    console.log(`[SW-Hook] Processing ${offlineQueue.length} offline actions`);

    // Trigger background sync if supported
    if (enableBackgroundSync && registration && registration.sync) {
      registration.sync.register('background-sync');
    } else {
      // Fallback: process queue directly
      processQueueDirectly();
    }
  }, [offlineQueue, enableBackgroundSync, registration]);

  /**
   * Store queued action in IndexedDB
   */
  const storeQueuedAction = useCallback((action) => {
    try {
      const request = indexedDB.open('PrintStackOfflineDB', 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('actions')) {
          db.createObjectStore('actions', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['actions'], 'readwrite');
        const store = transaction.objectStore('actions');
        store.add(action);
      };

      request.onerror = (error) => {
        console.error('[SW-Hook] Failed to store queued action:', error);
      };
    } catch (error) {
      console.error('[SW-Hook] IndexedDB error:', error);
    }
  }, []);

  /**
   * Process queue directly (fallback)
   */
  const processQueueDirectly = useCallback(async () => {
    const actions = await getQueuedActionsFromDB();

    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });

        if (response.ok) {
          await removeQueuedActionFromDB(action.id);
          console.log('[SW-Hook] Action processed successfully:', action.id);
        } else {
          console.error('[SW-Hook] Action processing failed:', action.id, response.status);
        }
      } catch (error) {
        console.error('[SW-Hook] Action processing error:', action.id, error);
      }
    }

    // Update local queue
    setOfflineQueue([]);
  }, []);

  /**
   * Get queued actions from IndexedDB
   */
  const getQueuedActionsFromDB = useCallback(() => {
    return new Promise((resolve) => {
      try {
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
      } catch (error) {
        console.error('[SW-Hook] Failed to get queued actions:', error);
        resolve([]);
      }
    });
  }, []);

  /**
   * Remove queued action from IndexedDB
   */
  const removeQueuedActionFromDB = useCallback((actionId) => {
    return new Promise((resolve, reject) => {
      try {
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
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  /**
   * Cache a resource
   */
  const cacheResource = useCallback(async (url, options = {}) => {
    if (!isOnline || !registration) return false;

    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put(url, response.clone());
        console.log('[SW-Hook] Resource cached:', url);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SW-Hook] Failed to cache resource:', error);
      return false;
    }
  }, [isOnline, registration]);

  /**
   * Get cached resource
   */
  const getCachedResource = useCallback(async (url) => {
    try {
      const response = await caches.match(url);
      if (response) {
        console.log('[SW-Hook] Resource served from cache:', url);
        return response;
      }
      return null;
    } catch (error) {
      console.error('[SW-Hook] Failed to get cached resource:', error);
      return null;
    }
  }, []);

  const DYNAMIC_CACHE = 'printstack-dynamic-v1.0.0';

  return {
    // State
    isSupported,
    isInstalled,
    isOnline,
    registration,
    waitingWorker,
    offlineQueue,

    // Registration management
    register: registerServiceWorker,
    unregister,
    activateUpdate,

    // Cache management
    cleanupCache,
    cacheResource,
    getCachedResource,

    // Notifications
    showNotification,

    // Offline management
    queueAction,
    processOfflineQueue,

    // Utilities
    hasUpdate: !!waitingWorker,
    supportsNotifications: 'Notification' in window && enableNotifications,
    supportsBackgroundSync: 'serviceWorker' in navigator && 'sync' in registration,
    cacheStrategy
  };
};

/**
 * Hook for offline detection
 * @returns {Object} Offline detection utilities
 */
export const useOfflineDetection = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineTime,
    timeSinceLastChange: Date.now() - lastOnlineTime
  };
};

export default {
  useServiceWorker,
  useOfflineDetection
};