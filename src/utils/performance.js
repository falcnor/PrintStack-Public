/**
 * Performance Monitoring using Web Vitals
 *
 * This utility provides comprehensive performance monitoring for the PrintStack application,
 * tracking key metrics using the Web Vitals library and providing actionable insights.
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance metrics storage
let performanceMetrics = {
  lcp: null, // Largest Contentful Paint
  fid: null, // First Input Delay
  cls: null, // Cumulative Layout Shift
  fcp: null, // First Contentful Paint
  ttfb: null, // Time to First Byte
  custom: {} // Custom metrics
};

// Performance threshold configurations
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // 2.5s good, 4s poor
  FID: { good: 100, poor: 300 },        // 100ms good, 300ms poor
  CLS: { good: 0.1, poor: 0.25 },       // 0.1 good, 0.25 poor
  FCP: { good: 1800, poor: 3000 },      // 1.8s good, 3s poor
  TTFB: { good: 800, poor: 1800 }       // 800ms good, 1.8s poor
};

// Performance monitoring state
let isMonitoring = false;
let monitoringInterval = null;
let observers = [];

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  if (isMonitoring) {
    console.warn('Performance monitoring already initialized');
    return;
  }

  console.log('🚀 Initializing performance monitoring...');
  isMonitoring = true;

  // Disable in development to avoid noise
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Performance monitoring disabled in development mode');
    return;
  }

  // Collect core Web Vitals
  collectWebVitals();

  // Initialize custom metrics
  initCustomMetrics();

  // Start periodic monitoring
  startPeriodicMonitoring();

  // Setup navigation timing observers
  setupNavigationObserver();

  // Setup resource monitoring
  setupResourceObserver();

  console.log('✅ Performance monitoring initialized');
}

/**
 * Collect Web Vitals metrics
 */
function collectWebVitals() {
  try {
    // Largest Contentful Paint
    getCLS((metric) => {
      performanceMetrics.cls = metric;
      evaluateMetric('CLS', metric);
    });

    // First Input Delay
    getFID((metric) => {
      performanceMetrics.fid = metric;
      evaluateMetric('FID', metric);
    });

    // First Contentful Paint
    getFCP((metric) => {
      performanceMetrics.fcp = metric;
      evaluateMetric('FCP', metric);
    });

    // Largest Contentful Paint
    getLCP((metric) => {
      performanceMetrics.lcp = metric;
      evaluateMetric('LCP', metric);
    });

    // Time to First Byte
    getTTFB((metric) => {
      performanceMetrics.ttfb = metric;
      evaluateMetric('TTFB', metric);
    });

  } catch (error) {
    console.error('Error collecting Web Vitals:', error);
  }
}

/**
 * Evaluate a metric against thresholds
 */
function evaluateMetric(metricName, metric) {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName];
  if (!thresholds) return;

  let rating = 'good';
  if (metric.value >= thresholds.poor) {
    rating = 'poor';
  } else if (metric.value >= thresholds.good) {
    rating = 'needs-improvement';
  }

  metric.rating = rating;
  metric.thresholds = thresholds;

  console.log(`📊 ${metricName}: ${metric.value} (${rating})`);

  // Store for analytics
  storeMetric(metricName, metric);

  // Emit event for other listeners
  window.dispatchEvent(new CustomEvent('performance-metric', {
    detail: { name: metricName, metric }
  }));
}

/**
 * Store metric in localStorage for analytics
 */
function storeMetric(name, metric) {
  try {
    const key = `performance_${name.toLowerCase()}`;
    const data = {
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date().toISOString(),
      id: metric.id,
      navigationType: getNavigationType()
    };

    localStorage.setItem(key, JSON.stringify(data));

    // Keep only last 10 measurements per metric
    updateMetricHistory(key, data);

  } catch (error) {
    console.warn('Failed to store performance metric:', error);
  }
}

/**
 * Update metric history (keep last 10 measurements)
 */
function updateMetricHistory(baseKey, newData) {
  try {
    const historyKey = `${baseKey}_history`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

    history.push(newData);

    // Keep only last 10 measurements
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to update metric history:', error);
  }
}

/**
 * Initialize custom metrics
 */
function initCustomMetrics() {
  // Track React app initialization time
  measureReactInitTime();

  // Track database operations
  measureDatabaseOperations();

  // Track user interaction responsiveness
  measureInteractionResponsiveness();
}

/**
 * Measure React application initialization time
 */
function measureReactInitTime() {
  const startTime = performance.now();

  // Listen for React app mount
  const observer = new MutationObserver((mutations) => {
    const hasAppContent = mutations.some(mutation => {
      return Array.from(mutation.addedNodes).some(node => {
        return node.nodeType === 1 && node.querySelector && node.querySelector('[data-testid="app"]');
      });
    });

    if (hasAppContent) {
      const endTime = performance.now();
      const initTime = endTime - startTime;

      performanceMetrics.custom.reactInit = {
        name: 'React Initialization',
        value: initTime,
        rating: initTime < 1000 ? 'good' : initTime < 2000 ? 'needs-improvement' : 'poor'
      };

      console.log(`⚛️ React init time: ${initTime.toFixed(2)}ms`);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Measure database operation performance
 */
function measureDatabaseOperations() {
  // Hook into localStorage operations if needed
  const originalSetItem = localStorage.setItem;
  const originalGetItem = localStorage.getItem;

  localStorage.setItem = function(key, value) {
    const start = performance.now();
    const result = originalSetItem.call(this, key, value);
    const end = performance.now();

    if (key.startsWith('printstack_')) {
      recordDatabaseOperation('setItem', end - start);
    }

    return result;
  };

  localStorage.getItem = function(key) {
    const start = performance.now();
    const result = originalGetItem.call(this, key);
    const end = performance.now();

    if (key.startsWith('printstack_')) {
      recordDatabaseOperation('getItem', end - start);
    }

    return result;
  };
}

/**
 * Record database operation metrics
 */
function recordDatabaseOperation(operation, duration) {
  const key = `db_${operation}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');

  history.push({
    duration,
    timestamp: new Date().toISOString()
  });

  // Keep last 100 operations
  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Measure interaction responsiveness
 */
function measureInteractionResponsiveness() {
  let lastInteractionTime = 0;

  document.addEventListener('click', (event) => {
    const now = performance.now();
    const timeSinceLastInteraction = now - lastInteractionTime;

    if (timeSinceLastInteraction > 100) { // Track significant delays
      performanceMetrics.custom.interactionDelay = {
        name: 'Interaction Delay',
        value: timeSinceLastInteraction,
        rating: timeSinceLastInteraction < 200 ? 'good' : 'poor'
      };
    }

    lastInteractionTime = now;
  });
}

/**
 * Setup navigation timing observer
 */
function setupNavigationObserver() {
  if ('navigation' in performance) {
    const navEntry = performance.getEntriesByType('navigation')[0];

    if (navEntry) {
      const navigationMetrics = {
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
        loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
        domInteractive: navEntry.domInteractive - navEntry.navigationStart
      };

      performanceMetrics.custom.navigation = navigationMetrics;
      console.log('🧭 Navigation timing:', navigationMetrics);
    }
  }
}

/**
 * Setup resource monitoring
 */
function setupResourceObserver() {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach(entry => {
        if (entry.duration > 1000) { // Track slow resources (>1s)
          console.warn(`🐌 Slow resource detected:`, {
            name: entry.name,
            duration: entry.duration,
            type: entry.initiatorType
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    observers.push(observer);
  }
}

/**
 * Start periodic performance monitoring
 */
function startPeriodicMonitoring() {
  monitoringInterval = setInterval(() => {
    checkPerformanceHealth();
  }, 30000); // Every 30 seconds
}

/**
 * Check overall performance health
 */
function checkPerformanceHealth() {
  const metrics = Object.values(performanceMetrics).filter(metric => metric && metric.rating);
  const poorMetrics = metrics.filter(metric => metric.rating === 'poor');
  const needsImprovement = metrics.filter(metric => metric.rating === 'needs-improvement');

  if (poorMetrics.length > 0) {
    console.warn('⚠️ Performance issues detected:', poorMetrics.map(m => m.name || m.key));
    triggerPerformanceAlert(poorMetrics);
  }

  if (needsImprovement.length > 0) {
    console.info('💡 Performance could be improved:', needsImprovement.map(m => m.name || m.key));
  }
}

/**
 * Trigger performance alert for developers
 */
function triggerPerformanceAlert(poorMetrics) {
  // In production, this might send to monitoring service
  window.dispatchEvent(new CustomEvent('performance-alert', {
    detail: { metrics: poorMetrics, timestamp: new Date().toISOString() }
  }));
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
  return { ...performanceMetrics };
}

/**
 * Get performance report
 */
export function getPerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    metrics: performanceMetrics,
    environment: process.env.NODE_ENV,
    userAgent: navigator.userAgent,
    url: window.location.href,
    memory: getMemoryInfo(),
    connection: getConnectionInfo(),
    recommendations: generateRecommendations()
  };

  return report;
}

/**
 * Get memory information if available
 */
function getMemoryInfo() {
  if ('memory' in performance) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit
    };
  }
  return null;
}

/**
 * Get connection information
 */
function getConnectionInfo() {
  if ('connection' in navigator) {
    const conn = navigator.connection;
    return {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    };
  }
  return null;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations() {
  const recommendations = [];

  if (performanceMetrics.lcp?.rating === 'poor') {
    recommendations.push('Optimize largest contentful paint (images, fonts, critical resources)');
  }

  if (performanceMetrics.fid?.rating === 'poor') {
    recommendations.push('Reduce JavaScript execution time and main thread work');
  }

  if (performanceMetrics.cls?.rating === 'poor') {
    recommendations.push('Ensure proper image dimensions and avoid ad/content shifts');
  }

  if (performanceMetrics.ttfb?.rating === 'poor') {
    recommendations.push('Optimize server response time and enable caching');
  }

  return recommendations;
}

/**
 * Get navigation type
 */
function getNavigationType() {
  if ('navigation' in performance) {
    const navEntry = performance.getEntriesByType('navigation')[0];
    return navEntry.type;
  }
  return 'unknown';
}

/**
 * Export performance data for analytics
 */
export function exportPerformanceData() {
  const data = {
    metrics: performanceMetrics,
    report: getPerformanceReport(),
    history: getPerformanceHistory()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get performance history from localStorage
 */
function getPerformanceHistory() {
  const history = {};

  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('performance_') && key.endsWith('_history')) {
      history[key] = JSON.parse(localStorage.getItem(key) || '[]');
    }
  });

  return history;
}

/**
 * Stop performance monitoring
 */
export function stopPerformanceMonitoring() {
  if (!isMonitoring) return;

  isMonitoring = false;

  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }

  observers.forEach(observer => observer.disconnect());
  observers = [];

  console.log('⏹️ Performance monitoring stopped');
}

/**
 * Cleanup performance monitoring
 */
export function cleanup() {
  stopPerformanceMonitoring();
  localStorage.clear();
}

// Auto-initialize in production
if (process.env.NODE_ENV === 'production') {
  initPerformanceMonitoring();
}

// Export for manual testing in development
if (process.env.NODE_ENV === 'development') {
  window.PrintStackPerformance = {
    init: initPerformanceMonitoring,
    stop: stopPerformanceMonitoring,
    getMetrics: getPerformanceMetrics,
    getReport: getPerformanceReport,
    export: exportPerformanceData,
    cleanup
  };
}