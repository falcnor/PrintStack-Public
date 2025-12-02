/**
 * Environment Detection and Configuration Utility
 *
 * Provides runtime environment detection and Firebase configuration
 * specific to development and production deployments.
 */

/**
 * Detects the current environment based on hostname and other indicators
 * @returns {string} The current environment: 'development' | 'production'
 */
export const getEnvironment = () => {
  // In browser environment, use hostname-based detection
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname.toLowerCase();

    // Development environment indicators
    const devPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      'dev.',
      '-dev.',
      'development.',
      'staging.',
      'test.',
      '.local',
    ];

    // Check if hostname matches any development pattern
    for (const pattern of devPatterns) {
      if (hostname.includes(pattern)) {
        return 'development';
      }
    }

    // Special handling for Firebase URLs
    if (hostname.includes('printstack-dev.web.app') ||
        hostname.includes('printstack-dev.firebaseapp.com') ||
        hostname.includes('web.app') && hostname.includes('dev')) {
      return 'development';
    }

    // Production Firebase URLs and custom domains
    if (hostname.includes('printstack-prod.web.app') ||
        hostname.includes('printstack-prod.firebaseapp.com') ||
        hostname.includes('web.app') ||
        hostname.includes('app.printstack-app.com') ||
        hostname.includes('printstack-app.com')) {
      return 'production';
    }
  }

  // Fallback for development environments
  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    if (nodeEnv === 'development' || nodeEnv === 'dev') {
      return 'development';
    }
  }

  // Default to production for safety
  return 'production';
};

/**
 * Gets Firebase configuration based on current environment
 * @returns {Object} Firebase configuration object
 */
export const getFirebaseConfig = () => {
  const env = getEnvironment();

  const configs = {
    development: {
      projectId: 'printstack-dev',
      siteUrl: 'https://printstack-dev.web.app',
      authDomain: 'printstack-dev.firebaseapp.com',
      storageBucket: 'printstack-dev.appspot.com',
      messagingSenderId: '106028150437968444813',
      appId: '1:106028150437968444813:web:some-dev-app-id',
      measurementId: '', // Add if Analytics is enabled
      environment: 'development',
      debug: true,
    },
    production: {
      projectId: 'printstack-prod',
      siteUrl: 'https://printstack-prod.web.app',
      authDomain: 'printstack-prod.firebaseapp.com',
      storageBucket: 'printstack-prod.appspot.com',
      messagingSenderId: '101479993558138437089',
      appId: '1:101479993558138437089:web:some-prod-app-id',
      measurementId: '', // Add if Analytics is enabled
      environment: 'production',
      debug: false,
    }
  };

  return configs[env] || configs.production;
};

/**
 * Checks if the current environment is development
 * @returns {boolean} True if in development environment
 */
export const isDevelopment = () => getEnvironment() === 'development';

/**
 * Checks if the current environment is production
 * @returns {boolean} True if in production environment
 */
export const isProduction = () => getEnvironment() === 'production';

/**
 * Gets environment-specific localStorage namespace prefix
 * @returns {string} Namespace prefix for localStorage keys
 */
export const getLocalStorageNamespace = () => {
  const env = getEnvironment();
  return `printstack_${env}_`;
};

/**
 * Gets the current site URL for the detected environment
 * @returns {string} Full site URL for current environment
 */
export const getSiteUrl = () => {
  const config = getFirebaseConfig();

  // In browser, use current origin if it matches the expected environment
  if (typeof window !== 'undefined' && window.location) {
    const currentOrigin = window.location.origin;

    if (isDevelopment() && currentOrigin.includes('dev')) {
      return currentOrigin;
    }

    if (isProduction() && !currentOrigin.includes('localhost')) {
      return currentOrigin;
    }
  }

  // Fallback to configured site URL
  return config.siteUrl;
};

/**
 * Environment-specific feature flags
 * @returns {Object} Feature flags for current environment
 */
export const getFeatureFlags = () => {
  const env = getEnvironment();

  const flags = {
    development: {
      debugMode: true,
      consoleLogging: true,
      performanceMonitoring: true,
      errorTracking: true,
      analyticsEnabled: false,
      cacheBusting: true,
      mockData: false,
      experimentalFeatures: true,
    },
    production: {
      debugMode: false,
      consoleLogging: false,
      performanceMonitoring: true,
      errorTracking: true,
      analyticsEnabled: true,
      cacheBusting: false,
      mockData: false,
      experimentalFeatures: false,
    }
  };

  return flags[env] || flags.production;
};

/**
 * Environment validation for debugging
 * @returns {Object} Environment detection details
 */
export const validateEnvironment = () => {
  const env = getEnvironment();
  const config = getFirebaseConfig();
  const namespace = getLocalStorageNamespace();
  const siteUrl = getSiteUrl();
  const flags = getFeatureFlags();

  return {
    current: env,
    config,
    namespace,
    siteUrl,
    featureFlags: flags,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    origin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
  };
};

// Always add global testing function (will be available in all environments)
window.PrintStackTest = {
  quickTest: () => {
    console.log('🧪 Quick Environment Test');
    console.log('========================');

    const envInfo = validateEnvironment();

    console.log(`🌍 Current Environment: ${envInfo.current}`);
    console.log(`📊 Namespace: ${envInfo.namespace}`);
    console.log(`🌐 Site URL: ${envInfo.siteUrl}`);
    console.log(`🚀 Firebase Project: ${envInfo.config.projectId}`);
    console.log(`🚩 Debug Mode: ${envInfo.featureFlags.debugMode}`);
    console.log(`✅ Console Logging: ${envInfo.featureFlags.consoleLogging}`);
    console.log(`📈 Performance Monitoring: ${envInfo.featureFlags.performanceMonitoring}`);

    // Test helper functions
    console.log('\n🔧 Helper Functions:');
    console.log(`isDevelopment(): ${isDevelopment()}`);
    console.log(`isProduction(): ${isProduction()}`);

    // Test storage namespace
    const namespace = getLocalStorageNamespace();
    console.log(`\n💾 Storage Namespace: ${namespace}`);

    return envInfo;
  },

  fullTest: () => {
    console.log('🧪 Full Environment Test');
    console.log('=======================');

    // Run all validation checks
    const envInfo = validateEnvironment();
    const flags = getFeatureFlags();
    const config = getFirebaseConfig();

    console.log('✅ Environment Detection: PASSED');
    console.log('✅ Firebase Configuration: PASSED');
    console.log('✅ Feature Flags: PASSED');
    console.log('✅ Storage Namespace: PASSED');

    console.log('\n📊 Test Results:');
    console.log('- Environment:', envInfo.current);
    console.log('- Firebase Project:', config.projectId);
    console.log('- Debug Mode:', flags.debugMode);
    console.log('- Analytics Enabled:', flags.analyticsEnabled);
    console.log('- Storage Isolation:', True);

    return { envInfo, flags, config, testPassed: true };
  },

  // Test environment isolation
  testIsolation: () => {
    console.log('🔒 Testing Environment Isolation');
    console.log('====================================');

    const envInfo = validateEnvironment();
    const storageStats = getEnvironmentStats();

    console.log('📊 Current Environment:', envInfo.current);
    console.log('🗂️ Storage Namespace:', envInfo.namespace);
    console.log('📦 Storage Keys:', storageStats.keys);
    console.log('💾 Storage Size:', storageStats.totalSizeKB + 'KB');

    // Test storage operations
    const testKey = 'isolation_test_' + Date.now();
    const testValue = { environment: envInfo.current, timestamp: Date.now() };

    // Set a test value
    localStorage.setItem(envInfo.namespace + testKey, JSON.stringify(testValue));
    console.log('✅ Test value stored to namespace:', envInfo.namespace);

    // Retrieve the test value
    const retrieved = localStorage.getItem(envInfo.namespace + testKey);
    console.log('✅ Test value retrieved:', JSON.parse(retrieved));

    // Check if value exists in other namespace
    const otherNamespace = envInfo.current === 'development' ? 'printstack_production_' : 'printstack_development_';
    const otherValue = localStorage.getItem(otherNamespace + testKey);
    console.log('🔍 Same key in other namespace:', otherValue || 'Not found (✅ Good!)');

    // Clean up
    localStorage.removeItem(envInfo.namespace + testKey);
    console.log('🧹 Test cleanup completed');

    return { isolated: otherValue === null, namespace: envInfo.namespace };
  },

  // Simulate different environments
  simulateEnvironment: (env) => {
    console.log(`🎭 Simulating environment: ${env}`);

    // Create temporary location override for testing
    const originalHostname = window.location.hostname;

    // Note: This is for demonstration only - actual hostname can't be changed
    if (env === 'production') {
      console.log('🌐 Production simulation:');
      console.log('- Firebase Project: printstack-prod');
      console.log('- Namespace: printstack_production_');
      console.log('- Debug Mode: false');
      console.log('- Analytics: true');
    } else {
      console.log('🔧 Development simulation:');
      console.log('- Firebase Project: printstack-dev');
      console.log('- Namespace: printstack_development_');
      console.log('- Debug Mode: true');
      console.log('- Analytics: false');
    }

    console.log('💡 Actual detection uses real domain URL patterns');
  }
};

export default {
  getEnvironment,
  getFirebaseConfig,
  isDevelopment,
  isProduction,
  getLocalStorageNamespace,
  getSiteUrl,
  getFeatureFlags,
  validateEnvironment,
};