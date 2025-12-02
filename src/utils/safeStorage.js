/**
 * Safe Storage Operations with Comprehensive Error Handling
 * Wraps LocalStorage operations with error handling, recovery, and fallbacks
 * Supports environment-specific namespacing for dev/prod isolation
 */

import { handleStorageError, ErrorRecovery, FallbackDataProvider, errorLogger } from './errorHandling';

/**
 * Environment Detection and Namespace Management
 */
class EnvironmentManager {
  constructor() {
    this.environment = this.detectEnvironment();
    this.namespace = this.getNamespace();
  }

  detectEnvironment() {
    // Check various environment indicators
    if (typeof window !== 'undefined') {
      // Check if we're in development mode via Vite
      if (window.__ENV__ === 'development') {
        return 'development';
      }

      // Check hostname
      const hostname = window.location?.hostname;
      if (hostname) {
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
          return 'development';
        }
        if (hostname.includes('staging') || hostname.includes('test')) {
          return 'staging';
        }
      }

      // Check for debug flags
      if (window.location?.search?.includes('debug=true')) {
        return 'development';
      }
    }

    // Default to production for safety
    return 'production';
  }

  getNamespace() {
    const env = this.environment;
    const namespaceMap = {
      'development': 'printstack_dev',
      'staging': 'printstack_staging',
      'production': 'printstack_prod'
    };

    return namespaceMap[env] || 'printstack_prod';
  }

  getNamespacedKey(key) {
    // If key already has a namespace prefix, don't double-prefix
    if (key.startsWith('printstack_dev_') ||
        key.startsWith('printstack_staging_') ||
        key.startsWith('printstack_prod_')) {
      return key;
    }

    // If key already has legacy printstack_ prefix, replace it
    if (key.startsWith('printstack_')) {
      const baseKey = key.replace('printstack_', '');
      return `${this.namespace}_${baseKey}`;
    }

    // Add namespace to non-prefixed keys
    return `${this.namespace}_${key}`;
  }

  stripNamespace(key) {
    const patterns = [
      /^printstack_dev_/,
      /^printstack_staging_/,
      /^printstack_prod_/
    ];

    for (const pattern of patterns) {
      if (pattern.test(key)) {
        return key.replace(pattern, '');
      }
    }

    return key;
  }

  getEnvironment() {
    return this.environment;
  }

  getNamespaceInfo() {
    return {
      environment: this.environment,
      namespace: this.namespace,
      isDevelopment: this.environment === 'development',
      isProduction: this.environment === 'production',
      isStaging: this.environment === 'staging'
    };
  }
}

// Create singleton environment manager
export const environmentManager = new EnvironmentManager();

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
    this.envManager = environmentManager;
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
      version = 1,
      skipNamespace = false
    } = options;

    const operation = 'setItem';
    const startTime = performance.now();

    try {
      // Apply namespace unless explicitly skipped
      const namespacedKey = skipNamespace ? key : this.envManager.getNamespacedKey(key);

      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(namespacedKey);
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
          localStorage.setItem(namespacedKey, serializedValue);
        } catch (localStorageError) {
          // Handle LocalStorage specific errors
          if (this.isQuotaExceededError(localStorageError)) {
            throw new StorageQuotaError(operation, namespacedKey, localStorageError);
          } else if (this.isAccessDeniedError(localStorageError)) {
            throw new StorageAccessError(operation, namespacedKey, localStorageError);
          } else {
            throw new StorageError(
              `Failed to set item in LocalStorage: ${localStorageError.message}`,
              operation,
              namespacedKey,
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
            namespacedKey
          );
        }
        this.fallbackStorage.set(namespacedKey, serializedValue);
      }

      // Update cache
      if (useCache) {
        const cacheKey = this.getCacheKey(namespacedKey);
        this.cache.set(cacheKey, {
          value,
          timestamp: Date.now()
        });
      }

      const duration = performance.now() - startTime;
      return {
        success: true,
        key: namespacedKey,
        originalKey: key,
        value,
        storedLocation: this.isLocalStorageAvailable ? 'localStorage' : 'memory',
        duration,
        timestamp: new Date().toISOString(),
        namespace: this.envManager.getNamespaceInfo()
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
      required = false,
      skipNamespace = false
    } = options;

    const operation = 'getItem';
    const startTime = performance.now();

    try {
      // Apply namespace unless explicitly skipped
      const namespacedKey = skipNamespace ? key : this.envManager.getNamespacedKey(key);

      // Check cache first
      if (useCache) {
        const cacheKey = this.getCacheKey(namespacedKey);
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
          serializedValue = localStorage.getItem(namespacedKey);
          storageLocation = 'localStorage';
        } catch (localStorageError) {
          throw new StorageError(
            `Failed to get item from LocalStorage: ${localStorageError.message}`,
            operation,
            namespacedKey,
            localStorageError
          );
        }
      } else if (fallbackToMemory) {
        serializedValue = this.fallbackStorage.get(namespacedKey);
        storageLocation = 'memory';
      }

      if (serializedValue === null) {
        if (required) {
          throw new StorageError(`Required item not found: ${namespacedKey}`, operation, namespacedKey);
        }

        const result = {
          success: true,
          key: namespacedKey,
          originalKey: key,
          value: defaultValue,
          exists: false,
          storageLocation: 'none',
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          namespace: this.envManager.getNamespaceInfo()
        };

        // Update cache
        if (useCache) {
          const cacheKey = this.getCacheKey(namespacedKey);
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
        key: namespacedKey,
        originalKey: key,
        value,
        exists: true,
        storageLocation,
        duration,
        fromCache: false,
        cacheHit: false,
        timestamp: new Date().toISOString(),
        namespace: this.envManager.getNamespaceInfo()
      };

      // Update cache
      if (useCache) {
        const cacheKey = this.getCacheKey(namespacedKey);
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
      fallbackToMemory = true,
      skipNamespace = false
    } = options;

    const operation = 'removeItem';
    const startTime = performance.now();

    try {
      // Apply namespace unless explicitly skipped
      const namespacedKey = skipNamespace ? key : this.envManager.getNamespacedKey(key);
      let removedFrom = [];

      if (this.isLocalStorageAvailable) {
        try {
          localStorage.removeItem(namespacedKey);
          removedFrom.push('localStorage');
        } catch (localStorageError) {
          throw new StorageError(
            `Failed to remove item from LocalStorage: ${localStorageError.message}`,
            operation,
            namespacedKey,
            localStorageError
          );
        }
      }

      if (fallbackToMemory) {
        this.fallbackStorage.delete(namespacedKey);
        removedFrom.push('memory');
      }

      // Clear cache
      if (useCache) {
        const cacheKey = this.getCacheKey(namespacedKey);
        this.cache.delete(cacheKey);
      }

      return {
        success: true,
        key: namespacedKey,
        originalKey: key,
        removedFrom,
        duration: performance.now() - startTime,
        timestamp: new Date().toISOString(),
        namespace: this.envManager.getNamespaceInfo()
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

/**
 * Migration Utilities for Environment Namespacing
 */
export class StorageMigrationManager {
  constructor(safeStorageInstance) {
    this.storage = safeStorageInstance;
    this.envManager = environmentManager;
  }

  async migrateLegacyData() {
    const legacyKeys = [
      'printstack_filaments',
      'printstack_models',
      'printstack_prints',
      'printstack_settings',
      'printstack_statistics',
      'printstack_categories',
      'printstack_custom_materials',
      'filaments',
      'models',
      'prints',
      'modelCategories'
    ];

    const migrationResults = {
      migrated: [],
      failed: [],
      skipped: []
    };

    for (const legacyKey of legacyKeys) {
      try {
        // Get legacy data without applying namespace
        const result = await this.storage.getItem(legacyKey, {
          skipNamespace: true,
          useCache: false
        });

        if (result.exists) {
          // Get the namespace for current environment
          const namespacedKey = this.envManager.getNamespacedKey(legacyKey);

          // Check if namespaced version already exists
          const existingResult = await this.storage.getItem(legacyKey, {
            useCache: false
          });

          if (!existingResult.exists) {
            // Migrate data to namespaced key
            await this.storage.setItem(legacyKey, result.value, {
              useCache: false
            });

            // Remove legacy key
            await this.storage.removeItem(legacyKey, {
              skipNamespace: true,
              useCache: false
            });

            migrationResults.migrated.push({
              from: legacyKey,
              to: namespacedKey,
              valueSize: JSON.stringify(result.value).length
            });
          } else {
            migrationResults.skipped.push({
              key: legacyKey,
              reason: 'Namespaced version already exists'
            });
          }
        } else {
          migrationResults.skipped.push({
            key: legacyKey,
            reason: 'No legacy data found'
          });
        }
      } catch (error) {
        migrationResults.failed.push({
          key: legacyKey,
          error: error.message
        });
      }
    }

    return {
      success: migrationResults.failed.length === 0,
      results: migrationResults,
      namespace: this.envManager.getNamespaceInfo()
    };
  }

  async cleanupLegacyData() {
    const legacyKeys = [
      'printstack_filaments',
      'printstack_models',
      'printstack_prints',
      'printstack_settings',
      'printstack_statistics',
      'printstack_categories',
      'printstack_custom_materials',
      'filaments',
      'models',
      'prints',
      'modelCategories'
    ];

    const cleanupResults = {
      removed: [],
      failed: [],
      notFound: []
    };

    for (const legacyKey of legacyKeys) {
      try {
        const result = await this.storage.getItem(legacyKey, {
          skipNamespace: true,
          useCache: false
        });

        if (result.exists) {
          await this.storage.removeItem(legacyKey, {
            skipNamespace: true,
            useCache: false
          });
          cleanupResults.removed.push(legacyKey);
        } else {
          cleanupResults.notFound.push(legacyKey);
        }
      } catch (error) {
        cleanupResults.failed.push({
          key: legacyKey,
          error: error.message
        });
      }
    }

    return {
      success: cleanupResults.failed.length === 0,
      results: cleanupResults
    };
  }
}

// Create migration manager instance
export const migrationManager = new StorageMigrationManager(safeStorage);

// Export utility functions for easier usage
export const setItem = (key, value, options) => safeStorage.setItem(key, value, options);
export const getItem = (key, options) => safeStorage.getItem(key, options);
export const removeItem = (key, options) => safeStorage.removeItem(key, options);
export const clear = (options) => safeStorage.clear(options);
export const getStorageInfo = () => safeStorage.getStorageInfo();
export const migrateLegacyData = () => migrationManager.migrateLegacyData();
export const cleanupLegacyData = () => migrationManager.cleanupLegacyData();

export default safeStorage;