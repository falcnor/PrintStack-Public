/**
 * Simple Debug Test Script
 * Attached directly to window object for easy testing
 */

console.log('🔧 Loading debug-test.js...');

// Simple environment detection for testing
const detectEnvironment = () => {
  const hostname = window.location?.hostname || 'unknown';

  if (hostname.includes('localhost') ||
      hostname.includes('127.0.0.1') ||
      hostname.includes('dev') ||
      hostname.includes('development')) {
    return 'development';
  }

  return 'production';
};

// Create a simple test function
window.PrintStackTest = {
  quickTest: () => {
    console.log('🧪 Quick Environment Test (Standalone)');
    console.log('=======================================');

    const env = detectEnvironment();
    const hostname = window.location.hostname;
    const origin = window.location.origin;

    console.log(`🌍 Current Environment: ${env}`);
    console.log(`🌐 Hostname: ${hostname}`);
    console.log(`📍 Origin: ${origin}`);
    console.log(`🗂️ Storage Namespace: printstack_${env}_`);
    console.log(`🚀 Firebase Project: printstack-${env === 'development' ? 'dev' : 'prod'}`);

    console.log('\n✅ Basic environment detection working!');
    console.log('📝 Note: Full environment utilities might have loading issues');

    return {
      environment: env,
      hostname,
      origin,
      namespace: `printstack_${env}_`
    };
  },

  debugGlobals: () => {
    console.log('🔍 Debugging Global Objects');
    console.log('=============================');

    console.log('window.PrintStackTest exists:', typeof window.PrintStackTest);
    console.log('window.location exists:', typeof window.location);
    console.log('localStorage exists:', typeof localStorage);
    console.log('document.readyState:', document.readyState);

    // Check if our other utils are available
    console.log('window.PrintStackDevTools exists:', typeof window.PrintStackDevTools);
    console.log('window.PrintStackDebug exists:', typeof window.PrintStackDebug);

    // List all window properties that start with PrintStack
    const printStackProps = Object.keys(window).filter(key => key.startsWith('PrintStack'));
    console.log('PrintStack global objects:', printStackProps);
  },

  testStorage: () => {
    console.log('🗂️ Testing Storage Operations');
    console.log('===============================');

    const env = detectEnvironment();
    const namespace = `printstack_${env}_`;

    const testKey = 'test_' + Date.now();
    const testValue = { message: 'Hello from ' + env, timestamp: Date.now() };

    try {
      localStorage.setItem(namespace + testKey, JSON.stringify(testValue));
      console.log('✅ Test value stored in namespace:', namespace);

      const retrieved = localStorage.getItem(namespace + testKey);
      const parsedRetrieved = JSON.parse(retrieved);
      console.log('✅ Test value retrieved:', parsedRetrieved);

      localStorage.removeItem(namespace + testKey);
      console.log('🧹 Test value cleaned up');

      return true;
    } catch (error) {
      console.error('❌ Storage test failed:', error);
      return false;
    }
  }
};

// Immediately notify that the test utilities are loaded
console.log('✅ PrintStackTest utilities loaded!');
console.log('💡 Try: window.PrintStackTest.quickTest()');
console.log('💡 Try: window.PrintStackTest.debugGlobals()');