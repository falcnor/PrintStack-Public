import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import { AppProviders } from './contexts/AppProviders.jsx';

// Import environment and storage utilities
import { validateEnvironment, getFeatureFlags, isDevelopment } from './utils/environment';
import { migrateFromLegacy, getEnvironmentStats } from './utils/storage';
import { initPerformanceMonitoring } from './utils/performance';
import { initHealthMonitoring } from './utils/healthMonitor';
import { initQuotaMonitoring } from './utils/quotaManagement';

// Import simple debug test utilities first
import './utils/debug-test.js';

// Import development tools (only in development mode)
if (isDevelopment()) {
  import './utils/dev-tools.js';
}

// Import global styles
import './styles/global.css';

// Initialize environment-specific configuration
console.log('🌍 Initializing PrintStack application...');

// Validate environment and log configuration
const envConfig = validateEnvironment();
console.log(`📊 Environment: ${envConfig.current}`, envConfig);

// Get feature flags for current environment
const featureFlags = getFeatureFlags();
console.log('🚩 Feature flags:', featureFlags);

// Perform environment-specific setup
if (isDevelopment()) {
  console.log('🔧 Development environment detected');

  // Migrate any legacy localStorage data
  const migration = migrateFromLegacy();
  if (migration.migrated.length > 0) {
    console.log(`🔄 Migrated ${migration.migrated.length} keys from legacy storage`);
  }

  // Log storage statistics
  const storageStats = getEnvironmentStats();
  console.log('📦 Storage statistics:', storageStats);

  // Enable development-only features
  if (featureFlags.debugMode) {
    console.log('🐛 Debug mode enabled');

    // Expose environment utilities for debugging
    window.PrintStackDebug = {
      env: envConfig,
      flags: featureFlags,
      storage: { getEnvironmentStats, migrateFromLegacy },
      performance: { initPerformanceMonitoring, getPerformanceMetrics: () => import('./utils/performance.js').then(m => m.getPerformanceMetrics()) }
    };
  }
} else {
  console.log('🚀 Production environment detected');

  // Production optimizations
  console.log('🔒 Production optimizations enabled');

  // Initialize performance monitoring in production
  initPerformanceMonitoring();

  // Initialize health monitoring in production
  initHealthMonitoring();

  // Initialize quota management in production
  initQuotaMonitoring();
}

// Error handling for uncaught errors - enhanced with environment context
window.addEventListener('error', event => {
  const errorInfo = {
    error: event.error?.message || 'Unknown error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    environment: envConfig.current,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };

  console.error('Uncaught error:', errorInfo);

  // In production, you might want to send this to an error tracking service
  if (featureFlags.errorTracking && !isDevelopment()) {
    // TODO: Add error tracking service integration
    console.log('📊 Error data would be sent to tracking service:', errorInfo);
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  const rejectionInfo = {
    reason: event.reason?.message || 'Unknown promise rejection',
    environment: envConfig.current,
    timestamp: new Date().toISOString()
  };

  console.error('Unhandled promise rejection:', rejectionInfo);

  if (featureFlags.errorTracking && !isDevelopment()) {
    console.log('📊 Promise rejection data would be sent to tracking service:', rejectionInfo);
  }
});

// Service Worker registration for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
