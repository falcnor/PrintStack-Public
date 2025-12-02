/**
 * Development Tools and Debugging Utilities
 *
 * Provides development-only features for testing, debugging, and performance monitoring.
 * These utilities are only available in development environments.
 */

import { isDevelopment, getFeatureFlags, validateEnvironment } from './environment';
import { setItem, getItem, removeItem, getEnvironmentStats } from './storage';
import React from 'react';

/**
 * Development Tools Manager
 */
class DevToolsManager {
  constructor() {
    this.isEnabled = isDevelopment();
    this.featureFlags = getFeatureFlags();
    this.panels = new Map();
    this.metrics = {
      renders: 0,
      reRenders: 0,
      storageOps: 0,
      errors: 0,
      warnings: 0
    };

    if (this.isEnabled) {
      this.initializeDevTools();
    }
  }

  /**
   * Initialize development tools and UI
   */
  initializeDevTools() {
    console.log('🛠️ Initializing development tools...');

    // Create debug console
    this.createDebugConsole();

    // Add performance monitoring
    this.setupPerformanceMonitoring();

    // Add storage debugging
    this.setupStorageDebugging();

    // Add React DevTools integration
    this.setupReactDevTools();

    // Add network monitoring
    this.setupNetworkMonitoring();

    // Create floating debug panel
    this.createDebugPanel();
  }

  /**
   * Create enhanced debug console
   */
  createDebugConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    // Override console methods with enhanced logging
    console.log = (...args) => {
      originalLog(...args);
      if (this.featureFlags.consoleLogging) {
        this.addLogEntry('log', args);
      }
      this.metrics.logs = (this.metrics.logs || 0) + 1;
    };

    console.warn = (...args) => {
      originalWarn(...args);
      if (this.featureFlags.consoleLogging) {
        this.addLogEntry('warn', args);
      }
      this.metrics.warnings++;
    };

    console.error = (...args) => {
      originalError(...args);
      if (this.featureFlags.consoleLogging) {
        this.addLogEntry('error', args);
      }
      this.metrics.errors++;
    };

    // Add custom debug methods
    window.PrintStackDebug = window.PrintStackDebug || {};
    window.PrintStackDevTools = {
      getMetrics: () => this.metrics,
      getEnvInfo: () => validateEnvironment(),
      getStorageStats: () => getEnvironmentStats(),
      clearLogs: () => this.clearLogs(),
      exportLogs: () => this.exportLogs(),
      mockData: (type, data) => this.mockData(type, data),
      storageCommands: {
        set: setItem,
        get: getItem,
        remove: removeItem,
        clear: () => this.clearDevStorage(),
        stats: () => getEnvironmentStats()
      }
    };
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    if (!this.featureFlags.performanceMonitoring) return;

    // Monitor page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        const metrics = {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          renderTime: perfData.domComplete - perfData.domLoading,
          resources: performance.getEntriesByType('resource').length
        };

        console.log('⚡ Performance metrics:', metrics);
        this.addLogEntry('perf', metrics);
      }, 0);
    });

    // Monitor React render performance
    this.setupReactRenderMonitoring();
  }

  /**
   * Setup React render monitoring
   */
  setupReactRenderMonitoring() {
    // This would integrate with React DevTools Profiler
    // For now, we'll track basic render metrics without overriding React.createElement
    // to avoid breaking the React rendering system

    // Simple render counter that increments when called
    this.renderTracker = {
      renders: 0,
      track: () => {
        this.metrics.renders++;
      }
    };
  }

  /**
   * Setup storage debugging
   */
  setupStorageDebugging() {
    // Monitor all storage operations
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    const originalRemoveItem = localStorage.removeItem;

    localStorage.setItem = (key, value) => {
      if (this.featureFlags.debugMode) {
        console.log(`💾 Storage SET: ${key}`, value);
        this.metrics.storageOps++;
      }
      return originalSetItem.call(this, key, value);
    };

    localStorage.getItem = (key) => {
      const value = originalGetItem.call(this, key);
      if (this.featureFlags.debugMode) {
        console.log(`📖 Storage GET: ${key}`, value);
        this.metrics.storageOps++;
      }
      return value;
    };

    localStorage.removeItem = (key) => {
      if (this.featureFlags.debugMode) {
        console.log(`🗑️ Storage REMOVE: ${key}`);
        this.metrics.storageOps++;
      }
      return originalRemoveItem.call(this, key);
    };
  }

  /**
   * Setup React DevTools integration
   */
  setupReactDevTools() {
    // Expose React debugging information
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🔧 React DevTools detected and enhanced');

      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = (rendererID, root) => {
        this.metrics.reRenders++;
        if (this.featureFlags.debugMode) {
          console.log(`🔄 React render #${this.metrics.reRenders}`);
        }
      };
    }
  }

  /**
   * Setup network monitoring
   */
  setupNetworkMonitoring() {
    // Override fetch to monitor network requests
    const originalFetch = window.fetch;

    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0];

      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();

        if (window.devTools?.featureFlags?.debugMode) {
          console.log(`🌐 Network: ${args[0]} (${Math.round(endTime - startTime)}ms)`, response.status);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        console.error(`🌐 Network Error: ${args[0]} (${Math.round(endTime - startTime)}ms)`, error);
        throw error;
      }
    };
  }

  /**
   * Create floating debug panel
   */
  createDebugPanel() {
    // Wait for DOM to be ready before creating UI elements
    const ensureDOMReady = () => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createPanelContent);
      } else {
        createPanelContent();
      }
    };

    const createPanelContent = () => {
      try {
        // Create debug panel container
        const panel = document.createElement('div');
        panel.id = 'printstack-dev-panel';
        panel.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 300px;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 15px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 12px;
          z-index: 10000;
          max-height: 400px;
          overflow-y: auto;
          display: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;

        // Create panel content
        panel.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <h3 style="margin: 0; color: #4CAF50;">PrintStack DevTools</h3>
            <button onclick="this.parentElement.parentElement.style.display='none'" style="background: red; color: white; border: none; border-radius: 3px; cursor: pointer;">×</button>
          </div>
          <div id="debug-content"></div>
          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #555;">
            <button onclick="window.devTools.refreshPanel()" style="background: #2196F3; color: white; border: none; border-radius: 3px; margin: 2px; cursor: pointer;">Refresh</button>
            <button onclick="window.devTools.clearStorage()" style="background: #FF9800; color: white; border: none; border-radius: 3px; margin: 2px; cursor: pointer;">Clear Storage</button>
            <button onclick="window.devTools.exportData()" style="background: #9C27B0; color: white; border: none; border-radius: 3px; margin: 2px; cursor: pointer;">Export</button>
          </div>
        `;

        document.body.appendChild(panel);

        // Create toggle button
        const toggle = document.createElement('div');
        toggle.id = 'printstack-dev-toggle';
        toggle.innerHTML = '🔧';
        toggle.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
          background: #4CAF50;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;

        toggle.onclick = () => {
          const panel = document.getElementById('printstack-dev-panel');
          if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
          }
        };

        document.body.appendChild(toggle);

        // Expose panel methods
        window.devTools.refreshPanel = () => this.refreshPanel(panel);
        window.devTools.clearStorage = () => this.clearDevStorage();
        window.devTools.exportData = () => this.exportData();

        // Initial panel update
        setTimeout(() => this.refreshPanel(panel), 100);

        console.log('🛠️ DevTools UI created successfully');
      } catch (error) {
        console.warn('⚠️ Failed to create DevTools UI:', error);
      }
    };

    ensureDOMReady();
  }

  /**
   * Refresh debug panel content
   */
  refreshPanel(panel) {
    const content = panel.querySelector('#debug-content');
    const envInfo = validateEnvironment();
    const storageStats = getEnvironmentStats();

    content.innerHTML = `
      <div><strong>Environment:</strong> ${envInfo.current}</div>
      <div><strong>Namespace:</strong> ${envInfo.namespace}</div>
      <div><strong>Storage Keys:</strong> ${storageStats.keyCount}</div>
      <div><strong>Storage Size:</strong> ${storageStats.totalSizeKB}KB</div>
      <div><strong>Renders:</strong> ${this.metrics.renders}</div>
      <div><strong>Re-renders:</strong> ${this.metrics.reRenders}</div>
      <div><strong>Storage Ops:</strong> ${this.metrics.storageOps}</div>
      <div><strong>Errors:</strong> ${this.metrics.errors}</div>
      <div><strong>Warnings:</strong> ${this.metrics.warnings}</div>
    `;
  }

  /**
   * Clear development storage
   */
  clearDevStorage() {
    const stats = getEnvironmentStats();
    if (confirm(`Clear ${stats.keyCount} items from ${stats.environment} storage?`)) {
      const deletedCount = stats.keyCount;
      // Clear all keys in current environment
      stats.keys.forEach(key => removeItem(key));
      alert(`Cleared ${deletedCount} items from ${stats.environment} storage`);
      this.refreshPanel(document.getElementById('printstack-dev-panel'));
    }
  }

  /**
   * Export development data
   */
  exportData() {
    const data = {
      environment: validateEnvironment(),
      storage: getEnvironmentStats(),
      metrics: this.metrics,
      featureFlags: this.featureFlags,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printstack-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Add entry to debug log
   */
  addLogEntry(type, args) {
    this.logs = this.logs || [];
    this.logs.push({
      type,
      timestamp: Date.now(),
      args: args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      )
    });

    // Keep only last 1000 entries
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  /**
   * Clear debug logs
   */
  clearLogs() {
    this.logs = [];
    console.log('🧹 Debug logs cleared');
  }

  /**
   * Export debug logs
   */
  exportLogs() {
    const data = {
      logs: this.logs,
      metrics: this.metrics,
      environment: validateEnvironment(),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printstack-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Mock data for testing
   */
  mockData(type, data) {
    if (!this.isEnabled) {
      console.warn('Mock data not available in production');
      return;
    }

    const mockPrefix = 'mock_';
    const key = `${mockPrefix}${type}`;

    setItem(key, data);
    console.log(`🎭 Mock data set: ${type}`, data);
  }
}

// Initialize dev tools in development environment
let devTools;
if (isDevelopment()) {
  devTools = new DevToolsManager();
  window.devTools = devTools;
}

export { DevToolsManager, devTools };
export default devTools;