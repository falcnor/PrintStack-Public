/**
 * Safe Storage Operations with Comprehensive Error Handling
 * Wraps LocalStorage operations with error handling, recovery, and fallbacks
 */

import { handleStorageError, ErrorRecovery, FallbackDataProvider, errorLogger } from './errorHandling';

/**
 * Storage Error Classes
 */
export class StorageError extends Error {
  constructor(message, operation, key, originalError = null) {
    super(message);
    this.name = 'StorageError';
    this.operation = operation;
    this.key = key;
    this.originalError = originalError;
  }
}

export class StorageQuotaError extends StorageError {
  constructor(operation, key, originalError = null) {
    super('Storage quota exceeded', operation, key, originalError);
    this.name = 'StorageQuotaError';
  }
}

export class StorageAccessError extends StorageError {
  constructor(operation, key, originalError = null) {
    super('Storage access denied', operation, key, originalError);
    this.name = 'StorageAccessError';
  }
}

/**
 * Safe Storage Class
 */
class SafeStorage {
  constructor() {
    this.fallbackStorage = new Map();
    this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds cache
  }

  /**
   * Check if LocalStorage is available
   */
  checkLocalStorageAvailability() {
    if (typeof Storage === 'undefined') {
      return false;
    }

    try {
      const testKey = '__printstack_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      errorLogger.log({
        message: 'LocalStorage not available',
        category: 'storage',
        severity: 'high',
        originalError: error
      });
      return false;
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(key) {
    return `storage_cache_${key}`;
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Set item with comprehensive error handling
   */
  async setItem(key, value, options = {}) {
    const {
      useCache = true,
      fallbackToMemory = true,
      compress = false,
      version = 1
    } = options;

    const operation = 'setItem';
    const startTime = performance.now();

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(key);
        if (this.isCacheValid(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          if (cached.value === value) {
            return cached; // Return cached result
          }
        }
      }

      const serializedValue = this.serializeValue(value, { compress, version });

      if (this.isLocalStorageAvailable) {
        try {
          localStorage.setItem(key, serializedValue);
        } catch (localStorageError) {
          // Handle LocalStorage specific errors
          if (this.isQuotaExceededError(localStorageError)) {
            throw new StorageQuotaError(operation, key, localStorageError);
          } else if (this.isAccessDeniedError(localStorageError)) {
            throw new StorageAccessError(operation, key, localStorageError);
          } else {
            throw new StorageError(
              `Failed to set item in LocalStorage: ${localStorageError.message}`,
              operation,
              key,
              localStorageError
            );
          }
        }
      } else {
        // Fallback to memory storage
        if (!fallbackToMemory) {
          throw new StorageError(
            'LocalStorage not available and fallback disabled',
            operation,
            key
          );
        }
        this.fallbackStorage.set(key, serializedValue);
      }

      // Update cache
      if (useCache) {
        const cacheKey = this.getCacheKey(key);
        this.cache.set(cacheKey, {
          value,
          timestamp: Date.now()
        });
      }

      const duration = performance.now() - startTime;
      return {
        success: true,
        key,
        value,
        storedLocation: this.isLocalStorageAvailable ? 'localStorage' : 'memory',
        duration,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorData = handleStorageError(error, operation, { key, value, options });

      // Try recovery strategies
      if (fallbackToMemory) {
        try {
          const recoveryAttempt = await this.recoverySetItem(key, value, error);
          if (recoveryAttempt.success) {
            return recoveryAttempt;
          }
        } catch (recoveryError) {
          errorLogger.log({
            message: 'Storage recovery failed',
            category: 'storage',
            severity: 'high',
            originalError: recoveryError
          });
        }
      }

      // Re-throw the original error with context
      throw error;
    }
  }

  /**
   * Get item with comprehensive error handling
   */
  async getItem(key, options = {}) {
    const {
      useCache = true,
      fallbackToMemory = true,
      defaultValue = null,
      required = false
    } = options;

    const operation = 'getItem';
    const startTime = performance.now();

    try {
      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(key);
        if (this.isCacheValid(cacheKey)) {
          const cached = this.cache.get(cacheKey);
          return {
            ...cached.data,
            fromCache: true,
            cacheHit: true
          };
        }
      }

      let serializedValue = null;
      let storageLocation = 'unknown';

      if (this.isLocalStorageAvailable) {
        try {
          serializedValue = localStorage.getItem(key);
          storageLocation = 'localStorage';
        } catch (localStorageError) {
          throw new StorageError(
            `Failed to get item from LocalStorage: ${localStorageError.message}`,
            operation,
            key,
            localStorageError
          );
        }
      } else if (fallbackToMemory) {
        serializedValue = this.fallbackStorage.get(key);
        storageLocation = 'memory';
      }

      if (serializedValue === null) {
        if (required) {
          throw new StorageError(`Required item not found: ${key}`, operation, key);
        }

        const result = {
          success: true,
          key,
          value: defaultValue,
          exists: false,
          storageLocation: 'none',
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };

        // Update cache
        if (useCache) {
          const cacheKey = this.getCacheKey(key);
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }

        return result;
      }

      const value = this.deserializeValue(serializedValue);
      const duration = performance.now() - startTime;

      const result = {
        success: true,
        key,
        value,
        exists: true,
        storageLocation,
        duration,
        fromCache: false,
        cacheHit: false,
        timestamp: new Date().toISOString()
      };

      // Update cache
      if (useCache) {
        const cacheKey = this.getCacheKey(key);
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;

    } catch (error) {
      const errorData = handleStorageError(error, operation, { key, options });

      // Try recovery with fallback data if appropriate
      if (this.canUseFallbackData(key)) {
        const fallbackValue = this.getFallbackData(key);
        return {
          success: true,
          key,
          value: fallbackValue,
          exists: false,
          storageLocation: 'fallback',
          isFallback: true,
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      throw error;
    }
  }

  /**
   * Remove item with comprehensive error handling
   */
  async removeItem(key, options = {}) {
    const {
      useCache = true,
      fallbackToMemory = true
    } = options;

    const operation = 'removeItem';
    const startTime = performance.now();

    try {
      let removedFrom = [];

      if (this.isLocalStorageAvailable) {
        try {
          localStorage.removeItem(key);
          removedFrom.push('localStorage');
        } catch (localStorageError) {
          throw new StorageError(
            `Failed to remove item from LocalStorage: ${localStorageError.message}`,
            operation,
            key,
            localStorageError
          );
        }
      }

      if (fallbackToMemory) {
        this.fallbackStorage.delete(key);
        removedFrom.push('memory');
      }

      // Clear cache
      if (useCache) {
        const cacheKey = this.getCacheKey(key);
        this.cache.delete(cacheKey);
      }

      return {
        success: true,
        key,
        removedFrom,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorData = handleStorageError(error, operation, { key, options });
      throw error;
    }
  }

  /**
   * Clear all storage with comprehensive error handling
   */
  async clear(options = {}) {
    const {
      preserveKeys = [],
      useBackup = true
    } = options;

    const operation = 'clear';
    const startTime = performance.now();

    try {
      // Backup preserved keys
      const backup = {};
      if (useBackup && preserveKeys.length > 0) {
        for (const key of preserveKeys) {
          try {
            const result = await this.getItem(key, { useCache: false });
            if (result.exists) {
              backup[key] = result.value;
            }
          } catch (error) {
            errorLogger.log({
              message: `Failed to backup key ${key} during clear`,
              category: 'storage',
              severity: 'medium',
              originalError: error
            });
          }
        }
      }

      let clearedFrom = [];

      if (this.isLocalStorageAvailable) {
        try {
          localStorage.clear();
          clearedFrom.push('localStorage');
        } catch (localStorageError) {
          throw new StorageError(
            `Failed to clear LocalStorage: ${localStorageError.message}`,
            operation,
            null,
            localStorageError
          );
        }
      }

      this.fallbackStorage.clear();
      clearedFrom.push('memory');

      // Clear all cache
      this.cache.clear();

      // Restore preserved keys
      if (useBackup && preserveKeys.length > 0) {
        for (const [key, value] of Object.entries(backup)) {
          try {
            await this.setItem(key, value, { useCache: false });
          } catch (error) {
            errorLogger.log({
              message: `Failed to restore key ${key} after clear`,
              category: 'storage',
              severity: 'medium',
              originalError: error
            });
          }
        }
      }

      return {
        success: true,
        clearedFrom,
        preservedKeys: Object.keys(backup),
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const errorData = handleStorageError(error, operation, { options });
      throw error;
    }
  }

  /**
   * Get storage information
   */
  async getStorageInfo() {
    try {
      let localStorageInfo = {};
      let localStorageAvailable = false;

      if (this.isLocalStorageAvailable) {
        try {
          const testKey = '__printstack_storage_check__';
          localStorage.setItem(testKey, 'test');
          localStorage.removeItem(testKey);

          let totalSize = 0;
          let itemCount = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              totalSize += localStorage[key].length + key.length;
              itemCount++;
            }
          }

          localStorageInfo = {
            available: true,
            itemCount,
            totalBytes: totalSize,
            totalKB: Math.round(totalSize / 1024 * 100) / 100,
            totalMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
          };
          localStorageAvailable = true;
        } catch (error) {
          localStorageInfo = {
            available: false,
            error: error.message
          };
        }
      }

      return {
        localStorage: localStorageInfo,
        fallbackStorage: {
          available: true,
          itemCount: this.fallbackStorage.size
        },
        cache: {
          itemCount: this.cache.size,
          timeout: this.cacheTimeout
        },
        localStorageAvailable
      };

    } catch (error) {
      handleStorageError(error, 'getStorageInfo');
      return {
        error: error.message,
        available: false
      };
    }
  }

  /**
   * Recovery methods
   */
  async recoverySetItem(key, value, originalError) {
    return ErrorRecovery.retryWithBackoff(async () => {
      // Try memory storage first
      this.fallbackStorage.set(key, this.serializeValue(value));
      return {
        success: true,
        key,
        value,
        storedLocation: 'memory',
        isRecovery: true,
        timestamp: new Date().toISOString()
      };
    }, 3, 1000);
  }

  /**
   * Helper methods
   */
  isQuotaExceededError(error) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      (error.code === 22 && error.name === 'Error') ||
      error.message.toLowerCase().includes('quota')
    );
  }

  isAccessDeniedError(error) {
    return (
      error.name === 'SecurityError' ||
      error.message.toLowerCase().includes('access denied') ||
      error.message.toLowerCase().includes('permission denied')
    );
  }

  canUseFallbackData(key) {
    return key.includes('printstack_');
  }

  getFallbackData(key) {
    const fallbackData = {
      'printstack_filaments': FallbackDataProvider.getEmptyFilamentData(),
      'printstack_models': FallbackDataProvider.getEmptyModelData(),
      'printstack_prints': FallbackDataProvider.getEmptyPrintData(),
      'printstack_statistics': FallbackDataProvider.getEmptyStatistics(),
      'printstack_settings': FallbackDataProvider.getDefaultPreferences()
    };

    return fallbackData[key] || null;
  }

  serializeValue(value, options = {}) {
    const { compress = false, version = 1 } = options;

    const data = {
      version,
      timestamp: Date.now(),
      data: value
    };

    const serialized = JSON.stringify(data);

    if (compress && serialized.length > 1000) {
      // In a real implementation, you might use a compression library here
      // For now, just return the serialized string
      return serialized;
    }

    return serialized;
  }

  deserializeValue(serializedValue) {
    try {
      const parsed = JSON.parse(serializedValue);

      // Handle versioned data
      if (parsed.version) {
        return parsed.data;
      }

      // Handle legacy data (without versioning)
      return parsed;
    } catch (error) {
      // If JSON parsing fails, return the raw value
      return serializedValue;
    }
  }

  /**
   * Batch operations
   */
  async setItems(items, options = {}) {
    const results = [];
    let hasError = false;

    for (const [key, value] of Object.entries(items)) {
      try {
        const result = await this.setItem(key, value, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          key,
          error: error.message
        });
        hasError = true;
      }
    }

    return {
      success: !hasError,
      results,
      total: items.length,
      failed: results.filter(r => !r.success).length
    };
  }

  async getItems(keys, options = {}) {
    const results = [];
    let hasError = false;

    for (const key of keys) {
      try {
        const result = await this.getItem(key, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          key,
          error: error.message
        });
        hasError = true;
      }
    }

    return {
      success: !hasError,
      results,
      total: keys.length,
      failed: results.filter(r => !r.success).length
    };
  }
}

// Create singleton instance
export const safeStorage = new SafeStorage();

// Export utility functions for easier usage
export const setItem = (key, value, options) => safeStorage.setItem(key, value, options);
export const getItem = (key, options) => safeStorage.getItem(key, options);
export const removeItem = (key, options) => safeStorage.removeItem(key, options);
export const clear = (options) => safeStorage.clear(options);
export const getStorageInfo = () => safeStorage.getStorageInfo();

export default safeStorage;