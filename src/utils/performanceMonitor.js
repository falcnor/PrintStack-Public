/**
 * Performance Monitoring and Analytics System
 * Provides comprehensive performance tracking, metrics collection, and analysis
 */

/**
 * Core Performance Monitor Class
 */
export class PerformanceMonitor {
  constructor(config = {}) {
    this.config = {
      sampleRate: config.sampleRate || 1.0, // 100% sampling by default
      enableNavigationTiming: config.enableNavigationTiming !== false,
      enableResourceTiming: config.enableResourceTiming !== false,
      enableUserTiming: config.enableUserTiming !== false,
      enableMemoryTracking: config.enableMemoryTracking !== false,
      enableErrorTracking: config.enableErrorTracking !== false,
      maxBufferSize: config.maxBufferSize || 1000,
      aggregationInterval: config.aggregationInterval || 60000, // 1 minute
      ...config
    };

    this.metrics = {
      navigation: [],
      resources: [],
      userInteractions: [],
      vitals: {},
      errors: [],
      memory: [],
      custom: {}
    };

    this.buffer = [];
    this.isTracking = false;
    this.aggregationTimer = null;
    this.observers = [];

    // Performance thresholds for warnings
    this.thresholds = {
      FCP: 1800, // First Contentful Paint
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1,  // Cumulative Layout Shift
      TTFB: 600, // Time to First Byte
      interactionTime: 200 // User interaction response time
    };

    this.initializeTracking();
  }

  /**
   * Initialize performance tracking
   */
  initializeTracking() {
    if (typeof window === 'undefined') return;

    // Start tracking navigation timing
    if (this.config.enableNavigationTiming) {
      this.trackNavigationTiming();
    }

    // Start tracking resource timing
    if (this.config.enableResourceTiming) {
      this.trackResourceTiming();
    }

    // Start tracking user interactions
    this.trackUserInteractions();

    // Start tracking memory usage
    if (this.config.enableMemoryTracking && 'memory' in performance) {
      this.trackMemoryUsage();
    }

    // Start tracking errors
    if (this.config.enableErrorTracking) {
      this.trackErrors();
    }

    // Start aggregation timer
    this.startAggregation();

    this.isTracking = true;
  }

  /**
   * Track Navigation Timing API metrics
   */
  trackNavigationTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navigationMetrics = {
            type: 'navigation',
            timestamp: Date.now(),
            url: window.location.href,
            metrics: {
              // Core Web Vitals
              dns: entry.domainLookupEnd - entry.domainLookupStart,
              tcp: entry.connectEnd - entry.connectStart,
              ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
              ttfb: entry.responseStart - entry.requestStart,
              domInteractive: entry.domInteractive - entry.navigationStart,
              domComplete: entry.domComplete - entry.navigationStart,
              loadEvent: entry.loadEventEnd - entry.loadEventStart,
              // Navigation timing
              redirect: entry.redirectEnd - entry.redirectStart,
              unload: entry.unloadEnd - entry.unloadStart,
              // Page load metrics
              pageLoadTime: entry.loadEventEnd - entry.navigationStart,
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart
            }
          };

          this.addMetric('navigation', navigationMetrics);

          // Check performance thresholds
          this.checkThresholds(navigationMetrics.metrics);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Navigation timing observer not supported:', error);
    }
  }

  /**
   * Track Resource Timing API metrics
   */
  trackResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceMetrics = {
            type: 'resource',
            timestamp: Date.now(),
            name: entry.name,
            url: entry.name,
            metrics: {
              transferSize: entry.transferSize || 0,
              encodedBodySize: entry.encodedBodySize || 0,
              decodedBodySize: entry.decodedBodySize || 0,
              duration: entry.duration,
              startTime: entry.startTime,
              responseEnd: entry.responseEnd,
              initiatorType: entry.initiatorType,
              // HTTP timing
              dns: entry.domainLookupEnd - entry.domainLookupStart,
              tcp: entry.connectEnd - entry.connectStart,
              ssl: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
              ttfb: entry.responseStart - entry.requestStart,
              download: entry.responseEnd - entry.responseStart
            }
          };

          this.addMetric('resources', resourceMetrics);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observer not supported:', error);
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteractions() {
    const interactionHandlers = {
      click: (event) => this.recordInteraction('click', event),
      keydown: (event) => this.recordInteraction('keydown', event),
      scroll: (event) => this.recordInteraction('scroll', event, { passive: true }),
      touchstart: (event) => this.recordInteraction('touchstart', event, { passive: true })
    };

    Object.entries(interactionHandlers).forEach(([eventType, handler]) => {
      const options = eventType === 'scroll' || eventType === 'touchstart' ? { passive: true } : false;
      window.addEventListener(eventType, handler, options);
    });
  }

  /**
   * Record a user interaction
   */
  recordInteraction(type, event, options = {}) {
    if (!this.shouldSample()) return;

    const interaction = {
      type: 'userInteraction',
      timestamp: Date.now(),
      interactionType: type,
      target: event.target ? event.target.tagName.toLowerCase() : 'unknown',
      targetSelector: this.generateSelector(event.target),
      coordinates: {
        x: event.clientX || 0,
        y: event.clientY || 0
      },
      responseTime: 0, // Will be updated when interaction completes
      ...options
    };

    this.addMetric('userInteractions', interaction);
  }

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals() {
    // First Contentful Paint (FCP)
    this.trackWebVital('FCP', (entry) => entry.startTime);

    // Largest Contentful Paint (LCP)
    this.trackWebVital('LCP', (entry) => entry.startTime, false);

    // First Input Delay (FID)
    this.trackWebVital('FID', (entry) => entry.processingStart - entry.startTime, false);

    // Cumulative Layout Shift (CLS)
    this.trackWebVital('CLS', (entry) => {
      if (!entry.hadRecentInput) {
        return entry.value;
      }
      return 0;
    }, false, true);

    // Time to First Byte (TTFB)
    this.trackTTFB();
  }

  /**
   * Track individual web vital
   */
  trackWebVital(name, getValue, observeOnce = true, accumulate = false) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const value = getValue(entry);

          if (value !== undefined && value !== null) {
            if (accumulate && this.metrics.vitals[name]) {
              this.metrics.vitals[name] += value;
            } else {
              this.metrics.vitals[name] = value;
            }

            this.addMetric('vitals', {
              type: 'webVital',
              timestamp: Date.now(),
              name,
              value,
              url: window.location.href
            });

            // Check threshold
            if (this.thresholds[name] && value > this.thresholds[name]) {
              console.warn(`Performance warning: ${name} (${Math.round(value)}) exceeds threshold (${this.thresholds[name]})`);
            }
          }

          if (observeOnce) {
            observer.disconnect();
          }
        });
      });

      if (name === 'FCP' || name === 'LCP') {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } else if (name === 'FID') {
        observer.observe({ entryTypes: ['first-input'] });
      } else if (name === 'CLS') {
        observer.observe({ entryTypes: ['layout-shift'] });
      }

      this.observers.push(observer);
    } catch (error) {
      console.warn(`Web vital ${name} tracking not supported:`, error);
    }
  }

  /**
   * Track Time to First Byte
   */
  trackTTFB() {
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      this.metrics.vitals.TTFB = ttfb;

      this.addMetric('vitals', {
        type: 'webVital',
        timestamp: Date.now(),
        name: 'TTFB',
        value: ttfb,
        url: window.location.href
      });
    }
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage() {
    const collectMemoryData = () => {
      if ('memory' in performance) {
        const memory = performance.memory;

        const memoryMetrics = {
          type: 'memory',
          timestamp: Date.now(),
          metrics: {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit
          }
        };

        this.addMetric('memory', memoryMetrics);
      }
    };

    // Collect memory data every 30 seconds
    setInterval(collectMemoryData, 30000);
    collectMemoryData(); // Collect immediately
  }

  /**
   * Track errors and exceptions
   */
  trackErrors() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.addMetric('errors', {
        type: 'javascriptError',
        timestamp: Date.now(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addMetric('errors', {
        type: 'unhandledRejection',
        timestamp: Date.now(),
        reason: event.reason,
        stack: event.reason?.stack,
        url: window.location.href
      });
    });
  }

  /**
   * Add metric to collection
   */
  addMetric(category, metric) {
    if (!this.shouldSample()) return;

    if (this.metrics[category]) {
      this.metrics[category].push(metric);
    } else {
      this.metrics.custom[category] = this.metrics.custom[category] || [];
      this.metrics.custom[category].push(metric);
    }

    // Add to buffer for aggregation
    this.buffer.push({
      category,
      metric,
      timestamp: Date.now()
    });

    // Limit metric array sizes
    const maxItems = this.config.maxBufferSize;
    if (this.metrics[category] && this.metrics[category].length > maxItems) {
      this.metrics[category] = this.metrics[category].slice(-maxItems);
    }
  }

  /**
   * Check if this event should be sampled
   */
  shouldSample() {
    return Math.random() <= this.config.sampleRate;
  }

  /**
   * Check performance thresholds
   */
  checkThresholds(metrics) {
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      if (metrics[metric] && metrics[metric] > threshold) {
        console.warn(`Performance threshold exceeded: ${metric} (${metrics[metric]}ms > ${threshold}ms)`);

        this.addMetric('warnings', {
          type: 'thresholdWarning',
          timestamp: Date.now(),
          metric,
          value: metrics[metric],
          threshold
        });
      }
    });
  }

  /**
   * Generate CSS selector for element
   */
  generateSelector(element) {
    if (!element) return '';

    const selector = [];

    // ID
    if (element.id) {
      selector.push(`#${element.id}`);
    }

    // Classes
    if (element.className) {
      const classes = element.className.split(' ').filter(Boolean);
      selector.push(...classes.map(cls => `.${cls}`));
    }

    // Tag name
    selector.push(element.tagName.toLowerCase());

    return selector.join('');
  }

  /**
   * Start aggregation timer
   */
  startAggregation() {
    this.aggregationTimer = setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }

  /**
   * Aggregate collected metrics
   */
  aggregateMetrics() {
    const aggregated = {};

    Object.entries(this.metrics).forEach(([category, metricArray]) => {
      if (category === 'vitals' || typeof metricArray !== 'object' || !Array.isArray(metricArray)) {
        return;
      }

      const aggregatedData = this.aggregateCategory(metricArray);
      if (Object.keys(aggregatedData).length > 0) {
        aggregated[category] = aggregatedData;
      }
    });

    if (Object.keys(aggregated).length > 0) {
      this.addMetric('aggregated', {
        type: 'aggregation',
        timestamp: Date.now(),
        interval: this.config.aggregationInterval,
        data: aggregated
      });
    }

    // Clear buffer
    this.buffer = [];
  }

  /**
   * Aggregate metrics for a category
   */
  aggregateCategory(metrics) {
    if (metrics.length === 0) return {};

    const aggregated = {
      count: metrics.length,
      timestamp: Date.now()
    };

    // Calculate numeric aggregations
    const numericFields = new Set();

    metrics.forEach(metric => {
      if (metric.metrics) {
        Object.keys(metric.metrics).forEach(key => {
          if (typeof metric.metrics[key] === 'number') {
            numericFields.add(key);
          }
        });
      }
    });

    numericFields.forEach(field => {
      const values = metrics
        .map(m => m.metrics?.[field])
        .filter(v => typeof v === 'number' && !isNaN(v));

      if (values.length > 0) {
        aggregated[field] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          median: this.calculateMedian(values),
          p90: this.calculatePercentile(values, 90),
          p95: this.calculatePercentile(values, 95)
        };
      }
    });

    return aggregated;
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get performance summary
   */
  getSummary() {
    return {
      timestamp: Date.now(),
      sampleRate: this.config.sampleRate,
      isTracking: this.isTracking,
      vitals: this.metrics.vitals,
      errorCount: this.metrics.errors.length,
      memoryUsage: this.getLatestMemoryUsage(),
      bundleAnalysis: this.analyzeBundlePerformance(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get latest memory usage
   */
  getLatestMemoryUsage() {
    const memoryMetrics = this.metrics.memory;
    if (memoryMetrics.length === 0) return null;

    return memoryMetrics[memoryMetrics.length - 1].metrics;
  }

  /**
   * Analyze bundle performance
   */
  analyzeBundlePerformance() {
    const resourceMetrics = this.metrics.resources.filter(r =>
      r.name.includes('.js') || r.name.includes('.css')
    );

    if (resourceMetrics.length === 0) return null;

    const totalSize = resourceMetrics.reduce((sum, r) => sum + (r.metrics.transferSize || 0), 0);
    const avgLoadTime = resourceMetrics.reduce((sum, r) => sum + r.metrics.duration, 0) / resourceMetrics.length;

    return {
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      avgLoadTime: Math.round(avgLoadTime),
      resourceCount: resourceMetrics.length
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const vitals = this.metrics.vitals;

    // Check Core Web Vitals
    if (vitals.FCP > this.thresholds.FCP) {
      recommendations.push({
        type: 'fcp',
        severity: 'high',
        message: `First Contentful Paint (${Math.round(vitals.FCP)}ms) is slow. Optimize server response and critical resources.`
      });
    }

    if (vitals.LCP > this.thresholds.LCP) {
      recommendations.push({
        type: 'lcp',
        severity: 'high',
        message: `Largest Contentful Paint (${Math.round(vitals.LCP)}ms) is slow. Optimize images, font loading, and render-blocking resources.`
      });
    }

    if (vitals.FID > this.thresholds.FID) {
      recommendations.push({
        type: 'fid',
        severity: 'medium',
        message: `First Input Delay (${Math.round(vitals.FID)}ms) is high. Reduce JavaScript execution time and main thread work.`
      });
    }

    if (vitals.CLS > this.thresholds.CLS) {
      recommendations.push({
        type: 'cls',
        severity: 'medium',
        message: `Cumulative Layout Shift (${vitals.CLS.toFixed(2)}) is high. Ensure proper image dimensions and avoid layout shifts.`
      });
    }

    // Check error rate
    const recentErrors = this.metrics.errors.filter(e => Date.now() - e.timestamp < 300000); // Last 5 minutes
    if (recentErrors.length > 5) {
      recommendations.push({
        type: 'errors',
        severity: 'high',
        message: `${recentErrors.length} errors in the last 5 minutes. Check error logs and fix critical issues.`
      });
    }

    // Check memory usage
    const memoryUsage = this.getLatestMemoryUsage();
    if (memoryUsage && memoryUsage.usedJSHeapSize > memoryUsage.jsHeapSizeLimit * 0.8) {
      recommendations.push({
        type: 'memory',
        severity: 'medium',
        message: `Memory usage is high (${Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)}MB). Check for memory leaks.`
      });
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Export all metrics
   */
  exportMetrics() {
    return {
      config: this.config,
      thresholds: this.thresholds,
      metrics: this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Stop tracking and cleanup
   */
  stop() {
    this.isTracking = false;

    // Disconnect all observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });

    // Clear aggregation timer
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }

    this.observers = [];
  }
}

/**
 * Initialize global performance monitoring
 * @param {Object} config - Configuration options
 * @returns {PerformanceMonitor} Monitor instance
 */
export const initializePerformanceMonitoring = (config = {}) => {
  const monitor = new PerformanceMonitor(config);
  monitor.trackCoreWebVitals();

  // Make monitor globally available for debugging
  if (typeof window !== 'undefined') {
    window.__performanceMonitor = monitor;
  }

  return monitor;
};

/**
 * Simple API for performance tracking
 */
export const trackPerformance = {
  /**
   * Start timing an operation
   * @param {string} name - Operation name
   * @returns {Function} Function to call when operation completes
   */
  startTiming: (name) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (window.__performanceMonitor) {
        window.__performanceMonitor.addMetric('custom', {
          type: 'customTiming',
          timestamp: Date.now(),
          name,
          duration
        });
      }

      return duration;
    };
  },

  /**
   * Mark a performance point
   * @param {string} name - Mark name
   */
  mark: (name) => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },

  /**
   * Measure time between marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure: (name, startMark, endMark) => {
    if ('performance' in window && 'measure' in performance) {
      performance.measure(name, startMark, endMark);

      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0 && window.__performanceMonitor) {
        const lastMeasure = measures[measures.length - 1];

        window.__performanceMonitor.addMetric('custom', {
          type: 'customMeasure',
          timestamp: Date.now(),
          name,
          duration: lastMeasure.duration,
          startMark,
          endMark
        });
      }
    }
  },

  /**
   * Log custom metric
   * @param {string} name - Metric name
   * @param {any} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  logMetric: (name, value, metadata = {}) => {
    if (window.__performanceMonitor) {
      window.__performanceMonitor.addMetric('custom', {
        type: 'customMetric',
        timestamp: Date.now(),
        name,
        value,
        metadata
      });
    }
  }
};

export default {
  PerformanceMonitor,
  initializePerformanceMonitoring,
  trackPerformance
};