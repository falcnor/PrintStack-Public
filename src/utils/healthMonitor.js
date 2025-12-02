/**
 * Client-Side Health Monitoring for PrintStack
 *
 * This utility monitors application health from the client side and provides
 * real-time diagnostics and automatic error recovery capabilities.
 */

// Health monitoring state
let healthStatus = {
  overall: 'healthy',
  checks: {},
  metrics: {},
  lastCheck: new Date().toISOString()
};

// Health check configurations
const HEALTH_CHECKS = {
  storage: {
    name: 'LocalStorage Access',
    check: checkLocalStorage,
    interval: 30000, // 30 seconds
    timeout: 5000
  },
  memory: {
    name: 'Memory Usage',
    check: checkMemoryUsage,
    interval: 60000, // 1 minute
    timeout: 2000
  },
  connectivity: {
    name: 'Network Connectivity',
    check: checkConnectivity,
    interval: 120000, // 2 minutes
    timeout: 10000
  },
  performance: {
    name: 'Performance Metrics',
    check: checkPerformance,
    interval: 300000, // 5 minutes
    timeout: 5000
  },
  serviceWorker: {
    name: 'Service Worker Status',
    check: checkServiceWorker,
    interval: 60000, // 1 minute
    timeout: 3000
  }
};

// Monitoring intervals
let monitoringIntervals = {};
let isMonitoring = false;

/**
 * Initialize health monitoring
 */
export function initHealthMonitoring() {
  if (isMonitoring) {
    console.warn('Health monitoring already initialized');
    return;
  }

  console.log('🏥 Initializing client-side health monitoring...');
  isMonitoring = true;

  // Run initial health checks
  runHealthChecks();

  // Start periodic monitoring
  startPeriodicMonitoring();

  // Setup event listeners for real-time monitoring
  setupEventListeners();

  console.log('✅ Health monitoring initialized');
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.log('🔍 Running comprehensive health checks...');

  const promises = Object.entries(HEALTH_CHECKS).map(async ([key, config]) => {
    try {
      const result = await Promise.race([
        config.check(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
        )
      ]);

      healthStatus.checks[key] = {
        ...result,
        name: config.name,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      healthStatus.checks[key] = {
        status: 'unhealthy',
        name: config.name,
        error: error.message,
        lastChecked: new Date().toISOString()
      };

      console.warn(`⚠️ Health check failed: ${config.name} - ${error.message}`);
    }
  });

  await Promise.all(promises);

  // Update overall health status
  updateOverallHealth();

  // Emit health status event
  window.dispatchEvent(new CustomEvent('health-status-changed', {
    detail: healthStatus
  }));

  healthStatus.lastCheck = new Date().toISOString();
}

/**
 * Start periodic health monitoring
 */
function startPeriodicMonitoring() {
  Object.entries(HEALTH_CHECKS).forEach(([key, config]) => {
    monitoringIntervals[key] = setInterval(async () => {
      try {
        const result = await Promise.race([
          config.check(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
          )
        ]);

        const previousStatus = healthStatus.checks[key]?.status;
        const currentStatus = result.status;

        healthStatus.checks[key] = {
          ...result,
          name: config.name,
          lastChecked: new Date().toISOString()
        };

        // Log status changes
        if (previousStatus && previousStatus !== currentStatus) {
          console.log(`🏥 Health status changed: ${config.name} ${previousStatus} → ${currentStatus}`);

          window.dispatchEvent(new CustomEvent('health-check-changed', {
            detail: {
              check: key,
              name: config.name,
              previousStatus,
              currentStatus,
              result
            }
          }));
        }

      } catch (error) {
        healthStatus.checks[key] = {
          status: 'unhealthy',
          name: config.name,
          error: error.message,
          lastChecked: new Date().toISOString()
        };

        console.warn(`⚠️ Scheduled health check failed: ${config.name} - ${error.message}`);
      }

      updateOverallHealth();
    }, config.interval);
  });
}

/**
 * Update overall health status
 */
function updateOverallHealth() {
  const checks = Object.values(healthStatus.checks);
  const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
  const degradedChecks = checks.filter(check => check.status === 'degraded');

  if (unhealthyChecks.length > 0) {
    healthStatus.overall = 'unhealthy';
  } else if (degradedChecks.length > 0) {
    healthStatus.overall = 'degraded';
  } else {
    healthStatus.overall = 'healthy';
  }
}

/**
 * Check LocalStorage functionality
 */
function checkLocalStorage() {
  try {
    const testKey = 'printstack_health_test';
    const testValue = `health_check_${Date.now()}`;

    // Test write
    localStorage.setItem(testKey, testValue);

    // Test read
    const readValue = localStorage.getItem(testKey);

    // Test delete
    localStorage.removeItem(testKey);

    if (readValue === testValue) {
      return {
        status: 'healthy',
        message: 'LocalStorage is working correctly'
      };
    } else {
      return {
        status: 'degraded',
        message: 'LocalStorage read/write test failed'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'LocalStorage is not available',
      error: error.message
    };
  }
}

/**
 * Check memory usage
 */
function checkMemoryUsage() {
  if ('memory' in performance) {
    const memory = performance.memory;
    const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    const heapUtilization = memory.usedJSHeapSize / memory.totalJSHeapSize;

    let status = 'healthy';
    let message = 'Memory usage is normal';

    if (usedRatio > 0.9) {
      status = 'unhealthy';
      message = 'Memory usage critically high';
    } else if (heapUtilization > 0.8) {
      status = 'degraded';
      message = 'Memory usage high';
    }

    return {
      status,
      message,
      metrics: {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        usedRatio: usedRatio,
        heapUtilization: heapUtilization
      }
    };
  } else {
    return {
      status: 'unknown',
      message: 'Memory API not available'
    };
  }
}

/**
 * Check network connectivity
 */
async function checkConnectivity() {
  try {
    // Check if we can fetch a simple resource
    const response = await fetch('/api/health.json', {
      method: 'GET',
      cache: 'no-cache',
      timeout: 5000
    });

    if (response.ok) {
      const startTime = performance.now();
      await response.text();
      const responseTime = performance.now() - startTime;

      let status = 'healthy';
      let message = 'Network connectivity is good';

      if (responseTime > 3000) {
        status = 'degraded';
        message = 'Network response time is slow';
      }

      return {
        status,
        message,
        metrics: {
          responseTime: responseTime,
          statusCode: response.status
        }
      };
    } else {
      return {
        status: 'degraded',
        message: `Network request failed: ${response.status}`,
        metrics: {
          statusCode: response.status
        }
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Network connectivity failure',
      error: error.message
    };
  }
}

/**
 * Check performance metrics
 */
function checkPerformance() {
  try {
    const navigation = performance.getEntriesByType('navigation')[0];

    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.navigationStart;
      const domReadyTime = navigation.domContentLoadedEventEnd - navigation.navigationStart;

      let status = 'healthy';
      let message = 'Performance metrics are good';

      if (loadTime > 5000) {
        status = 'degraded';
        message = 'Page load time is slow';
      } else if (loadTime > 10000) {
        status = 'unhealthy';
        message = 'Page load time is very slow';
      }

      return {
        status,
        message,
        metrics: {
          loadTime: loadTime,
          domReadyTime: domReadyTime
        }
      };
    } else {
      return {
        status: 'unknown',
        message: 'Navigation timing not available'
      };
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Performance check failed',
      error: error.message
    };
  }
}

/**
 * Check Service Worker status
 */
async function checkServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;

      if (registration.active) {
        // Check if the service worker is responding
        const controller = navigator.serviceWorker.controller;

        return {
          status: 'healthy',
          message: 'Service Worker is active and responding',
          metrics: {
            scope: registration.scope,
            hasController: !!controller
          }
        };
      } else {
        return {
          status: 'degraded',
          message: 'Service Worker is registered but not active'
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Service Worker registration failed',
        error: error.message
      };
    }
  } else {
    return {
      status: 'unknown',
      message: 'Service Worker not supported'
    };
  }
}

/**
 * Setup event listeners for real-time monitoring
 */
function setupEventListeners() {
  // Monitor memory pressure
  if ('memory' in performance) {
    setInterval(() => {
      const memory = performance.memory;
      const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (usedRatio > 0.85) {
        console.warn('🚨 High memory usage detected:', {
          used: memory.usedJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          ratio: usedRatio
        });

        window.dispatchEvent(new CustomEvent('memory-pressure', {
          detail: { usedRatio, memory }
        }));
      }
    }, 10000); // Check every 10 seconds
  }

  // Monitor network status
    window.addEventListener('online', () => {
    console.log('🌐 Network connection restored');
    healthStatus.checks.connectivity = {
      status: 'healthy',
      name: 'Network Connectivity',
      message: 'Connection restored',
      lastChecked: new Date().toISOString()
    };
    updateOverallHealth();
  });

  window.addEventListener('offline', () => {
    console.warn('📡 Network connection lost');
    healthStatus.checks.connectivity = {
      status: 'unhealthy',
      name: 'Network Connectivity',
      message: 'Connection lost',
      lastChecked: new Date().toISOString()
    };
    updateOverallHealth();
  });
}

/**
 * Get current health status
 */
export function getHealthStatus() {
  return { ...healthStatus };
}

/**
 * Get health report
 */
export function getHealthReport() {
  const report = {
    timestamp: new Date().toISOString(),
    status: healthStatus.overall,
    checks: healthStatus.checks,
    environment: navigator.onLine ? 'online' : 'offline',
    userAgent: navigator.userAgent,
    url: window.location.href,
    recommendations: generateHealthRecommendations()
  };

  return report;
}

/**
 * Generate health recommendations
 */
function generateHealthRecommendations() {
  const recommendations = [];

  Object.entries(healthStatus.checks).forEach(([key, check]) => {
    if (check.status === 'unhealthy') {
      switch (key) {
        case 'storage':
          recommendations.push('Check browser settings and enable LocalStorage');
          break;
        case 'memory':
          recommendations.push('Close unused browser tabs or restart the browser');
          break;
        case 'connectivity':
          recommendations.push('Check your internet connection');
          break;
        case 'performance':
          recommendations.push('Clear browser cache or check for background processes');
          break;
        case 'serviceWorker':
          recommendations.push('Update the application or clear service worker cache');
          break;
      }
    } else if (check.status === 'degraded') {
      switch (key) {
        case 'memory':
          recommendations.push('Monitor memory usage and close unused tabs');
          break;
        case 'connectivity':
          recommendations.push('Check network speed or switch to a better connection');
          break;
        case 'performance':
          recommendations.push('Consider optimizing page resources');
          break;
      }
    }
  });

  return recommendations;
}

/**
 * Export health data
 */
export function exportHealthData() {
  const data = {
    health: healthStatus,
    report: getHealthReport(),
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring() {
  if (!isMonitoring) return;

  Object.values(monitoringIntervals).forEach(interval => {
    clearInterval(interval);
  });

  monitoringIntervals = {};
  isMonitoring = false;

  console.log('⏹️ Health monitoring stopped');
}

/**
 * Cleanup health monitoring
 */
export function cleanup() {
  stopHealthMonitoring();
}

// Auto-initialize
if (process?.env?.NODE_ENV === 'production') {
  // Auto-initialize in production after a short delay
  setTimeout(initHealthMonitoring, 2000);
}

// Export for development testing
if (process?.env?.NODE_ENV === 'development') {
  window.PrintStackHealth = {
    init: initHealthMonitoring,
    stop: stopHealthMonitoring,
    getStatus: getHealthStatus,
    getReport: getHealthReport,
    export: exportHealthData,
    cleanup
  };
}