/**
 * Environment-Specific Storage Utility
 *
 * Provides localStorage operations with environment-specific namespacing
 * to ensure complete data isolation between development and production environments.
 */

import { getEnvironment, getLocalStorageNamespace, isDevelopment } from './environment';

/**
 * Enhanced Storage Manager with Environment Isolation
 */
class StorageManager {
  constructor() {
    this.environment = getEnvironment();
    this.namespace = getLocalStorageNamespace();

    // Initialize storage check
    this.isAvailable = this.checkStorageAvailability();
    this.fallbackStorage = this.isAvailable ? null : new MemoryStorage();
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available and functional
   */
  checkStorageAvailability() {
    try {
      const testKey = '__printstack_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('localStorage not available:', error.message);
      return false;
    }
  }

  /**
   * Get the underlying storage instance
   * @returns {Storage} localStorage or fallback storage
   */
  getStorage() {
    return this.isAvailable ? localStorage : this.fallbackStorage;
  }

  /**
   * Convert a key to environment-specific namespaced key
   * @param {string} key - Original key
   * @returns {string} Namespaced key
   */
  getNamespacedKey(key) {
    // If key already has an environment namespace, don't double-prefix
    if (key.startsWith('printstack_development_') ||
        key.startsWith('printstack_production_')) {
      return key;
    }

    // If key has legacy printstack_ prefix, replace with environment namespace
    if (key.startsWith('printstack_')) {
      const baseKey = key.replace('printstack_', '');
      return `${this.namespace}${baseKey}`;
    }

    // Add environment namespace to non-prefixed keys
    return `${this.namespace}${key}`;
  }

  /**
   * Remove environment namespace from key
   * @param {string} namespacedKey - Namespaced key
   * @returns {string} Original key
   */
  stripNamespace(namespacedKey) {
    const patterns = [
      /^printstack_development_/,
      /^printstack_production_/,
      /^printstack_dev_/,
      /^printstack_prod_/
    ];

    for (const pattern of patterns) {
      if (pattern.test(namespacedKey)) {
        return namespacedKey.replace(pattern, '');
      }
    }

    return namespacedKey;
  }

  /**
   * Set a value in storage with environment namespacing
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success state
   */
  setItem(key, value) {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const serializedValue = JSON.stringify(value);

      this.getStorage().setItem(namespacedKey, serializedValue);

      // Log in development mode
      if (isDevelopment()) {
        console.log(`📦 Stored: ${key} → ${namespacedKey}`, { value, namespace: this.namespace });
      }

      return true;
    } catch (error) {
      console.error(`Failed to store item: ${key}`, error);
      return false;
    }
  }

  /**
   * Get a value from storage with environment namespacing
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} Stored value or default
   */
  getItem(key, defaultValue = null) {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      const serializedValue = this.getStorage().getItem(namespacedKey);

      if (serializedValue === null) {
        return defaultValue;
      }

      const value = JSON.parse(serializedValue);

      // Log in development mode
      if (isDevelopment()) {
        console.log(`📖 Retrieved: ${key} ← ${namespacedKey}`, { value, namespace: this.namespace });
      }

      return value;
    } catch (error) {
      console.error(`Failed to retrieve item: ${key}`, error);
      return defaultValue;
    }
  }

  /**
   * Remove an item from storage
   * @param {string} key - Storage key
   * @returns {boolean} Success state
   */
  removeItem(key) {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      this.getStorage().removeItem(namespacedKey);

      // Log in development mode
      if (isDevelopment()) {
        console.log(`🗑️ Removed: ${key} → ${namespacedKey}`, { namespace: this.namespace });
      }

      return true;
    } catch (error) {
      console.error(`Failed to remove item: ${key}`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  hasItem(key) {
    try {
      const namespacedKey = this.getNamespacedKey(key);
      return this.getStorage().getItem(namespacedKey) !== null;
    } catch (error) {
      console.error(`Failed to check item: ${key}`, error);
      return false;
    }
  }

  /**
   * Clear all items from current environment namespace
   * @returns {boolean} Success state
   */
  clearEnvironment() {
    try {
      const storage = this.getStorage();
      const keysToRemove = [];

      // Find all keys with current environment namespace
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.namespace)) {
          keysToRemove.push(key);
        }
      }

      // Remove all namespaced keys
      keysToRemove.forEach(key => storage.removeItem(key));

      console.log(`🧹 Cleared ${keysToRemove.length} items from ${this.environment} environment`);
      return true;
    } catch (error) {
      console.error(`Failed to clear environment: ${this.environment}`, error);
      return false;
    }
  }

  /**
   * Get all keys in current environment namespace
   * @returns {string[]} Array of keys (without namespace prefix)
   */
  getEnvironmentKeys() {
    try {
      const storage = this.getStorage();
      const keys = [];

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.namespace)) {
          keys.push(this.stripNamespace(key));
        }
      }

      return keys;
    } catch (error) {
      console.error(`Failed to get environment keys`, error);
      return [];
    }
  }

  /**
   * Get storage usage statistics for current environment
   * @returns {Object} Usage statistics
   */
  getEnvironmentStats() {
    try {
      const storage = this.getStorage();
      const keys = [];
      let totalSize = 0;

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith(this.namespace)) {
          const value = storage.getItem(key);
          keys.push(this.stripNamespace(key));
          totalSize += (key.length + (value?.length || 0)) * 2; // UTF-16 bytes
        }
      }

      return {
        environment: this.environment,
        namespace: this.namespace,
        keyCount: keys.length,
        keys,
        totalSizeBytes: totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      };
    } catch (error) {
      console.error(`Failed to get environment stats`, error);
      return {
        environment: this.environment,
        namespace: this.namespace,
        keyCount: 0,
        keys: [],
        totalSizeBytes: 0,
        totalSizeKB: 0,
      };
    }
  }

  /**
   * Migrate data from legacy namespace to current environment namespace
   * @returns {Object} Migration results
   */
  migrateFromLegacy() {
    try {
      const storage = this.getStorage();
      const migrationResults = {
        migrated: [],
        skipped: [],
        errors: []
      };

      // Find legacy printstack_ keys
      for (let i = 0; i < storage.length; i++) {
        const legacyKey = storage.key(i);
        if (legacyKey && legacyKey.startsWith('printstack_') && !legacyKey.includes('_dev_') && !legacyKey.includes('_prod_')) {
          try {
            const value = storage.getItem(legacyKey);
            const baseKey = legacyKey.replace('printstack_', '');
            const newKey = this.getNamespacedKey(baseKey);

            // Migrate to environment namespace
            storage.setItem(newKey, value);

            // Remove legacy key
            storage.removeItem(legacyKey);

            migrationResults.migrated.push({
              from: legacyKey,
              to: newKey
            });
          } catch (error) {
            migrationResults.errors.push({
              key: legacyKey,
              error: error.message
            });
          }
        }
      }

      if (migrationResults.migrated.length > 0) {
        console.log(`🔄 Migrated ${migrationResults.migrated.length} keys to ${this.environment} namespace`, migrationResults);
      }

      return migrationResults;
    } catch (error) {
      console.error(`Migration failed`, error);
      return { migrated: [], skipped: [], errors: [{ key: 'migration', error: error.message }] };
    }
  }
}

/**
 * In-memory fallback storage for when localStorage is unavailable
 */
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  setItem(key, value) {
    this.data.set(key, value);
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  removeItem(key) {
    this.data.delete(key);
  }

  key(index) {
    const keys = Array.from(this.data.keys());
    return keys[index] || null;
  }

  get length() {
    return this.data.size;
  }

  clear() {
    this.data.clear();
  }
}

// Create and export singleton instance
const storageManager = new StorageManager();

// Export utility functions for direct use
export const setItem = (key, value) => storageManager.setItem(key, value);
export const getItem = (key, defaultValue) => storageManager.getItem(key, defaultValue);
export const removeItem = (key) => storageManager.removeItem(key);
export const hasItem = (key) => storageManager.hasItem(key);
export const clearEnvironment = () => storageManager.clearEnvironment();
export const getEnvironmentKeys = () => storageManager.getEnvironmentKeys();
export const getEnvironmentStats = () => storageManager.getEnvironmentStats();
export const migrateFromLegacy = () => storageManager.migrateFromLegacy();

// Export the manager for advanced usage
export { storageManager };

export default {
  setItem,
  getItem,
  removeItem,
  hasItem,
  clearEnvironment,
  getEnvironmentKeys,
  getEnvironmentStats,
  migrateFromLegacy,
  manager: storageManager,
};