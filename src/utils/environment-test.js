/**
 * Environment Detection Test Suite
 *
 * Tests environment detection logic to ensure it works correctly
 * across different URL patterns and deployment scenarios.
 */

import {
  getEnvironment,
  getFirebaseConfig,
  isDevelopment,
  isProduction,
  getLocalStorageNamespace,
  getSiteUrl,
  getFeatureFlags,
  validateEnvironment
} from './environment';

/**
 * Mock window.location for testing different environments
 */
const mockWindowLocation = (hostname, origin, href) => {
  const originalLocation = window.location;

  Object.defineProperty(window, 'location', {
    value: {
      hostname: hostname || location.hostname,
      origin: origin || location.origin,
      href: href || location.href
    },
    writable: true,
    configurable: true
  });

  return () => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  };
};

/**
 * Test Environment Detection
 */
export class EnvironmentTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

 /**
   * Add a test case
   */
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Run all tests
   */
  async runTests() {
    console.log('🧪 Running Environment Detection Tests...\n');

    for (const test of this.tests) {
      try {
        await test.testFn();
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.error(`❌ ${test.name}: ${error.message}`);
        this.failed++;
      }
    }

    this.printSummary();
    return this.failed === 0;
  }

  /**
   * Print test results summary
   */
  printSummary() {
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
  }

  /**
   * Test development environment detection
   */
  testDevelopmentEnvironments() {
    const testCases = [
      {
        name: 'localhost',
        hostname: 'localhost',
        expected: 'development'
      },
      {
        name: '127.0.0.1',
        hostname: '127.0.0.1',
        expected: 'development'
      },
      {
        name: 'dev subdomain',
        hostname: 'dev.printstack-app.com',
        expected: 'development'
      },
      {
        name: 'dev in hostname',
        hostname: 'printstack-dev.web.app',
        expected: 'development'
      },
      {
        name: 'development subdomain',
        hostname: 'development.printstack-app.com',
        expected: 'development'
      },
      {
        name: 'staging subdomain',
        hostname: 'staging.printstack-app.com',
        expected: 'development'
      },
      {
        name: 'localhost with port',
        hostname: 'localhost:3000',
        expected: 'development'
      },
      {
        name: '.local domain',
        hostname: 'app.local',
        expected: 'development'
      }
    ];

    testCases.forEach(testCase => {
      this.addTest(`Detect development: ${testCase.name}`, () => {
        const restoreLocation = mockWindowLocation(testCase.hostname);

        try {
          const actual = getEnvironment();
          if (actual !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${actual}`);
          }
        } finally {
          restoreLocation();
        }
      });
    });
  }

  /**
   * Test production environment detection
   */
  testProductionEnvironments() {
    const testCases = [
      {
        name: 'Firebase dev URL',
        hostname: 'printstack-dev.web.app',
        expected: 'development'
      },
      {
        name: 'Firebase dev auth URL',
        hostname: 'printstack-dev.firebaseapp.com',
        expected: 'development'
      },
      {
        name: 'Firebase production URL',
        hostname: 'printstack-prod.web.app',
        expected: 'production'
      },
      {
        name: 'Firebase production auth URL',
        hostname: 'printstack-prod.firebaseapp.com',
        expected: 'production'
      },
      {
        name: 'Custom production domain',
        hostname: 'app.printstack-app.com',
        expected: 'production'
      },
      {
        name: 'Root custom domain',
        hostname: 'printstack-app.com',
        expected: 'production'
      },
      {
        name: 'Unknown domain',
        hostname: 'unknown-site.com',
        expected: 'production'
      }
    ];

    testCases.forEach(testCase => {
      this.addTest(`Detect production: ${testCase.name}`, () => {
        const restoreLocation = mockWindowLocation(testCase.hostname);

        try {
          const actual = getEnvironment();
          if (actual !== testCase.expected) {
            throw new Error(`Expected ${testCase.expected}, got ${actual}`);
          }
        } finally {
          restoreLocation();
        }
      });
    });
  }

  /**
   * Test Firebase configuration
   */
  testFirebaseConfig() {
    this.addTest('Firebase config for development', () => {
      const restoreLocation = mockWindowLocation('localhost');

      try {
        const config = getFirebaseConfig();
        if (config.projectId !== 'printstack-dev') {
          throw new Error(`Expected printstack-dev project, got ${config.projectId}`);
        }
        if (!config.siteUrl.includes('printstack-dev.web.app')) {
          throw new Error(`Invalid development site URL: ${config.siteUrl}`);
        }
      } finally {
        restoreLocation();
      }
    });

    this.addTest('Firebase config for production', () => {
      const restoreLocation = mockWindowLocation('printstack-prod.web.app');

      try {
        const config = getFirebaseConfig();
        if (config.projectId !== 'printstack-prod') {
          throw new Error(`Expected printstack-prod project, got ${config.projectId}`);
        }
        if (!config.siteUrl.includes('printstack-prod.web.app')) {
          throw new Error(`Invalid production site URL: ${config.siteUrl}`);
        }
      } finally {
        restoreLocation();
      }
    });
  }

  /**
   * Test localStorage namespacing
   */
  testStorageNamespacing() {
    this.addTest('Development storage namespace', () => {
      const restoreLocation = mockWindowLocation('localhost');

      try {
        const namespace = getLocalStorageNamespace();
        if (!namespace.includes('development')) {
          throw new Error(`Expected development namespace, got ${namespace}`);
        }
      } finally {
        restoreLocation();
      }
    });

    this.addTest('Production storage namespace', () => {
      const restoreLocation = mockWindowLocation('printstack-prod.web.app');

      try {
        const namespace = getLocalStorageNamespace();
        if (!namespace.includes('production')) {
          throw new Error(`Expected production namespace, got ${namespace}`);
        }
      } finally {
        restoreLocation();
      }
    });
  }

  /**
   * Test feature flags
   */
  testFeatureFlags() {
    this.addTest('Development feature flags', () => {
      const restoreLocation = mockWindowLocation('localhost');

      try {
        const flags = getFeatureFlags();
        if (!flags.debugMode) {
          throw new Error('Debug mode should be enabled in development');
        }
        if (!flags.consoleLogging) {
          throw new Error('Console logging should be enabled in development');
        }
        if (flags.analyticsEnabled) {
          throw new Error('Analytics should be disabled in development');
        }
      } finally {
        restoreLocation();
      }
    });

    this.addTest('Production feature flags', () => {
      const restoreLocation = mockWindowLocation('printstack-prod.web.app');

      try {
        const flags = getFeatureFlags();
        if (flags.debugMode) {
          throw new Error('Debug mode should be disabled in production');
        }
        if (flags.consoleLogging) {
          throw new Error('Console logging should be disabled in production');
        }
        if (!flags.analyticsEnabled) {
          throw new Error('Analytics should be enabled in production');
        }
      } finally {
        restoreLocation();
      }
    });
  }

  /**
   * Test environment validation
   */
  testEnvironmentValidation() {
    this.addTest('Environment validation returns complete info', () => {
      const validation = validateEnvironment();

      const requiredProps = [
        'current', 'config', 'namespace', 'siteUrl',
        'featureFlags', 'hostname', 'origin'
      ];

      for (const prop of requiredProps) {
        if (!(prop in validation)) {
          throw new Error(`Missing property in validation: ${prop}`);
        }
      }
    });
  }

  /**
   * Run comprehensive environment isolation test
   */
  testEnvironmentIsolation() {
    this.addTest('Environment data isolation', () => {
      // Test development
      const devRestore = mockWindowLocation('localhost');
      try {
        const devNamespace = getLocalStorageNamespace();
        const devConfig = getFirebaseConfig();

        // Test production
        const prodRestore = mockWindowLocation('printstack-prod.web.app');
        try {
          const prodNamespace = getLocalStorageNamespace();
          const prodConfig = getFirebaseConfig();

          // Verify isolation
          if (devNamespace === prodNamespace) {
            throw new Error('Namespaces should be different between environments');
          }

          if (devConfig.projectId === prodConfig.projectId) {
            throw new Error('Firebase projects should be different between environments');
          }
        } finally {
          prodRestore();
        }
      } finally {
        devRestore();
      }
    });
  }

  /**
   * Initialize and run all tests
   */
  initialize() {
    this.testDevelopmentEnvironments();
    this.testProductionEnvironments();
    this.testFirebaseConfig();
    this.testStorageNamespacing();
    this.testFeatureFlags();
    this.testEnvironmentValidation();
    this.testEnvironmentIsolation();
  }
}

/**
 * Run quick environment detection test
 */
export const quickEnvironmentTest = async () => {
  console.log('🔍 Quick Environment Detection Test');
  console.log('================================');

  const validation = validateEnvironment();

  console.log('🌍 Current Environment:', validation.current);
  console.log('📊 Namespace:', validation.namespace);
  console.log('🌐 Site URL:', validation.siteUrl);
  console.log('🚀 Feature Flags:', validation.featureFlags);

  // Test basic helpers
  console.log('\n🧪 Helper Functions:');
  console.log('isDevelopment():', isDevelopment());
  console.log('isProduction():', isProduction());

  // Test configuration
  const config = getFirebaseConfig();
  console.log('\n⚙️ Firebase Configuration:');
  console.log('Project ID:', config.projectId);
  console.log('Debug Mode:', config.debug);

  return validation;
};

/**
 * Run comprehensive test suite
 */
export const runEnvironmentTests = async () => {
  const testSuite = new EnvironmentTestSuite();
  testSuite.initialize();
  return await testSuite.runTests();
};

// Auto-expose testing functions in development
if (isDevelopment()) {
  window.PrintStackTest = {
    quickTest: quickEnvironmentTest,
    fullTest: runEnvironmentTests,
    EnvironmentTestSuite
  };

  console.log('🧪 Environment testing utilities available at window.PrintStackTest');
}

export default { quickEnvironmentTest, runEnvironmentTests, EnvironmentTestSuite };