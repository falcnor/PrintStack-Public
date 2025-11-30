/**
 * Performance Monitoring Utilities
 * Provides real-time performance monitoring and metrics collection
 */

/**
 * Performance Metrics Collector
 */
export class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      enableConsoleLog: true,
      enableNavigationTiming: true,
      enableResourceTiming: true,
      enableUserTiming: true,
      enableLongTaskDetection: true,
      longTaskThreshold: 50, // milliseconds
      collectInterval: 5000, // milliseconds
      maxHistorySize: 100,
      ...options
    };

    this.metrics = {
      navigation: null,
      resources: [],
      userTiming: [],
      longTasks: [],
      vitals: {},
      custom: new Map()
    };

    this.observers = [];
    this.isCollecting = false;
    this.timingMarks = new Map();
    this.customMetrics = new Map();

    this.initializeMonitoring();
  }

  initializeMonitoring() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') {
      console.warn('Performance monitoring not available in this environment');
      return;
    }

    try {
      this.collectInitialMetrics();
      this.setupObservers();
      this.startCollection();
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  collectInitialMetrics() {
    // Navigation timing
    if (this.options.enableNavigationTiming && performance.getEntriesByType('navigation').length > 0) {
      this.metrics.navigation = this.processNavigationTiming(performance.getEntriesByType('navigation')[0]);
    }

    // Resources already loaded
    if (this.options.enableResourceTiming) {
      this.metrics.resources = performance.getEntriesByType('resource')
        .map(entry => this.processResourceTiming(entry))
        .filter(Boolean);
    }

    // User timing marks
    if (this.options.enableUserTiming) {
      this.metrics.userTiming = performance.getEntriesByType('measure')
        .map(entry => this.processUserTiming(entry));
    }

    // Collect Web Vitals if available
    this.collectWebVitals();
  }

  setupObservers() {
    // Performance Observer API
    if ('PerformanceObserver' in window) {
      // Long task detection
      if (this.options.enableLongTaskDetection) {
        try {
          const longTaskObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
              this.metrics.longTasks.push({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                timestamp: Date.now()
              });
            });
          });
          longTaskObserver.observe({ entryTypes: ['longtask'] });
          this.observers.push(longTaskObserver);
        } catch (error) {
          console.warn('Long task observation not supported:', error);
        }
      }

      // Resource timing observer
      if (this.options.enableResourceTiming) {
        try {
          const resourceObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
              this.metrics.resources.push(this.processResourceTiming(entry));
            });
          });
          resourceObserver.observe({ entryTypes: ['resource'] });
          this.observers.push(resourceObserver);
        } catch (error) {
          console.warn('Resource timing observation not supported:', error);
        }
      }

      // Navigation timing observer
      if (this.options.enableNavigationTiming) {
        try {
          const navigationObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
              if (entry.entryType === 'navigation') {
                this.metrics.navigation = this.processNavigationTiming(entry);
              }
            });
          });
          navigationObserver.observe({ entryTypes: ['navigation'] });
          this.observers.push(navigationObserver);
        } catch (error) {
          console.warn('Navigation timing observation not supported:', error);
        }
      }

      // User timing observer
      if (this.options.enableUserTiming) {
        try {
          const userTimingObserver = new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
              if (entry.entryType === 'measure') {
                this.metrics.userTiming.push(this.processUserTiming(entry));
              }
            });
          });
          userTimingObserver.observe({ entryTypes: ['measure'] });
          this.observers.push(userTimingObserver);
        } catch (error) {
          console.warn('User timing observation not supported:', error);
        }
      }
    }
  }

  startCollection() {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, this.options.collectInterval);
  }

  stopCollection() {
    this.isCollecting = false;
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  collectMetrics() {
    try {
      // Update Web Vitals
      this.collectWebVitals();

      // Clean up old metrics to prevent memory leaks
      this.cleanupOldMetrics();

      if (this.options.enableConsoleLog) {
        this.logKeyMetrics();
      }
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  processNavigationTiming(navigationEntry) {
    return {
      dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
      tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
      ssl: navigationEntry.secureConnectionStart > 0 ? navigationEntry.connectEnd - navigationEntry.secureConnectionStart : 0,
      ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
      download: navigationEntry.responseEnd - navigationEntry.responseStart,
      domProcessing: navigationEntry.domContentLoadedEventStart - navigationEntry.responseEnd,
      loadEvent: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
      totalTime: navigationEntry.loadEventEnd - navigationEntry.navigationStart,
      paint: this.getPaintMetrics()
    };
  }

  processResourceTiming(resourceEntry) {
    // Filter out non-useful resources
    if (!resourceEntry.name || resourceEntry.name === 'about:blank') {
      return null;
    }

    const resourceType = this.getResourceType(resourceEntry.name);
    const isThirdParty = this.isThirdPartyResource(resourceEntry.name);

    return {
      name: resourceEntry.name,
      type: resourceType,
      isThirdParty,
      duration: resourceEntry.duration,
      size: resourceEntry.transferSize || 0,
      gzipSize: resourceEntry.encodedBodySize || 0,
      cached: resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize > 0,
      startTime: resourceEntry.startTime,
      responseEnd: resourceEntry.responseEnd,
      timestamp: Date.now()
    };
  }

  processUserTiming(userTimingEntry) {
    return {
      name: userTimingEntry.name,
      duration: userTimingEntry.duration,
      startTime: userTimingEntry.startTime,
      timestamp: Date.now()
    };
  }

  getPaintMetrics() {
    if (typeof performance === 'undefined') return {};

    const paintEntries = performance.getEntriesByType('paint');
    const paint = {};

    paintEntries.forEach(entry => {
      paint[entry.name] = entry.startTime;
    });

    return paint;
  }

  getResourceType(url) {
    const extension = url.split('.').pop()?.split('?')[0];
    const typeMap = {
      'js': 'script',
      'css': 'stylesheet',
      'png': 'image',
      'jpg': 'image',
      'jpeg': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'avif': 'image',
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'eot': 'font',
      'mp3': 'audio',
      'mp4': 'video',
      'webm': 'video'
    };

    return typeMap[extension] || 'other';
  }

  isThirdPartyResource(url) {
    try {
      const resourceUrl = new URL(url);
      const currentPageUrl = new URL(window.location.href);
      return resourceUrl.hostname !== currentPageUrl.hostname;
    } catch {
      return false;
    }
  }

  collectWebVitals() {
    // Largest Contentful Paint (LCP)
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.vitals.lcp = {
            value: lastEntry.startTime,
            element: lastEntry.element ? lastEntry.element.tagName : 'unknown',
            url: lastEntry.url || 'unknown',
            timestamp: Date.now()
          };
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        // LCP not supported
      }

      try {
        // First Input Delay (FID) would need a different approach
        // This is a simplified version
        const fidObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach(entry => {
            if (entry.entryType === 'first-input') {
              this.metrics.vitals.fid = {
                value: entry.processingStart - entry.startTime,
                timestamp: Date.now()
              };
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        // FID not supported
      }
    }
  }

  cleanupOldMetrics() {
    const maxAge = Date.now() - (5 * 60 * 1000); // 5 minutes

    // Clean up old resources
    this.metrics.resources = this.metrics.resources.filter(
      resource => resource.timestamp > maxAge
    );

    // Clean up old user timing
    this.metrics.userTiming = this.metrics.userTiming.filter(
      timing => timing.timestamp > maxAge
    );

    // Clean up old long tasks
    this.metrics.longTasks = this.metrics.longTasks.filter(
      task => task.timestamp > maxAge
    );

    // Limit array sizes
    const maxArraySize = this.options.maxHistorySize;
    if (this.metrics.resources.length > maxArraySize) {
      this.metrics.resources = this.metrics.resources.slice(-maxArraySize);
    }
    if (this.metrics.userTiming.length > maxArraySize) {
      this.metrics.userTiming = this.metrics.userTiming.slice(-maxArraySize);
    }
    if (this.metrics.longTasks.length > maxArraySize) {
      this.metrics.longTasks = this.metrics.longTasks.slice(-maxArraySize);
    }
  }

  logKeyMetrics() {
    const { navigation, vitals, resources, longTasks } = this.metrics;

    if (navigation) {
      console.log('📊 Navigation Timing:', {
        total: `${navigation.totalTime.toFixed(0)}ms`,
        ttfb: `${navigation.ttfb.toFixed(0)}ms`,
        dom: `${navigation.domProcessing.toFixed(0)}ms`
      });
    }

    if (vitals.lcp) {
      const lcpStatus = vitals.lcp.value < 2500 ? 'good' : vitals.lcp.value < 4000 ? 'needs improvement' : 'poor';
      console.log(`🖼️ LCP: ${vitals.lcp.value.toFixed(0)}ms (${lcpStatus})`);
    }

    if (vitals.fid) {
      const fidStatus = vitals.fid.value < 100 ? 'good' : vitals.fid.value < 300 ? 'needs improvement' : 'poor';
      console.log(`⚡ FID: ${vitals.fid.value.toFixed(0)}ms (${fidStatus})`);
    }

    const slowResources = resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      console.log(`⚠️ ${slowResources.length} slow resources detected`);
    }

    const recentLongTasks = longTasks.filter(t => Date.now() - t.timestamp < 30000);
    if (recentLongTasks.length > 0) {
      console.log(`🐌 ${recentLongTasks.length} long tasks in last 30s`);
    }
  }

  // API methods
  mark(name) {
    if (typeof performance !== 'undefined') {
      performance.mark(name);
      this.timingMarks.set(name, performance.now());
    }
  }

  measure(name, startMark, endMark) {
    if (typeof performance !== 'undefined') {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn(`Failed to measure ${name}:`, error);
      }
    }
  }

  recordCustomMetric(name, value, unit = 'ms') {
    this.customMetrics.set(name, {
      value,
      unit,
      timestamp: Date.now()
    });
  }

  startTimer(name) {
    this.mark(`${name}-start`);
  }

  endTimer(name) {
    this.mark(`${name}-end`);
    this.measure(name, `${name}-start`, `${name}-end`);
  }

  getAllMetrics() {
    return {
      ...this.metrics,
      custom: Object.fromEntries(this.customMetrics),
      collectedAt: Date.now()
    };
  }

  getPerformanceReport() {
    const metrics = this.getAllMetrics();
    const report = {
      summary: {},
      details: metrics,
      recommendations: [],
      score: 0
    };

    // Generate summary
    if (metrics.navigation) {
      report.summary.navigation = {
        totalTime: metrics.navigation.totalTime,
        ttfb: metrics.navigation.ttfb,
        download: metrics.navigation.download
      };
    }

    if (metrics.resources.length > 0) {
      const totalResources = metrics.resources.length;
      const slowResources = metrics.resources.filter(r => r.duration > 1000);
      const cachedResources = metrics.resources.filter(r => r.cached);
      const thirdPartyResources = metrics.resources.filter(r => r.isThirdParty);

      report.summary.resources = {
        total: totalResources,
        slow: slowResources.length,
        cached: cachedResources.length,
        thirdParty: thirdPartyResources.length,
        averageLoadTime: metrics.resources.reduce((sum, r) => sum + r.duration, 0) / totalResources
      };
    }

    if (metrics.longTasks.length > 0) {
      report.summary.longTasks = {
        total: metrics.longTasks.length,
        averageDuration: metrics.longTasks.reduce((sum, t) => sum + t.duration, 0) / metrics.longTasks.length,
        maxDuration: Math.max(...metrics.longTasks.map(t => t.duration))
      };
    }

    // Web Vitals summary
    report.summary.vitals = metrics.vitals;

    // Generate recommendations
    report.recommendations = this.generateRecommendations(metrics);

    // Calculate performance score (0-100)
    report.score = this.calculatePerformanceScore(report.summary);

    return report;
  }

  generateRecommendations(metrics) {
    const recommendations = [];

    // Navigation timing recommendations
    if (metrics.navigation) {
      if (metrics.navigation.ttfb > 600) {
        recommendations.push({
          priority: 'high',
          category: 'server',
          issue: 'Slow Time to First Byte',
          solution: 'Optimize server response time or use CDN',
          threshold: 'TTFB > 600ms'
        });
      }

      if (metrics.navigation.totalTime > 3000) {
        recommendations.push({
          priority: 'medium',
          category: 'general',
          issue: 'Slow page load time',
          solution: 'Optimize resources and implement lazy loading',
          threshold: 'Total load time > 3000ms'
        });
      }
    }

    // Resource timing recommendations
    if (metrics.resources.length > 0) {
      const slowResources = metrics.resources.filter(r => r.duration > 1000);
      if (slowResources.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'resources',
          issue: `${slowResources.length} slow resources detected`,
          solution: 'Optimize resource loading or implement caching'
        });
      }

      const uncachedResources = metrics.resources.filter(r => !r.cached && r.type !== 'navigation');
      if (uncachedResources.length > 10) {
        recommendations.push({
          priority: 'low',
          category: 'caching',
          issue: 'Many resources not cached',
          solution: 'Implement proper caching headers'
        });
      }
    }

    // Long task recommendations
    if (metrics.longTasks.length > 0) {
      const averageLongTask = metrics.longTasks.reduce((sum, t) => sum + t.duration, 0) / metrics.longTasks.length;
      if (averageLongTask > 100) {
        recommendations.push({
          priority: 'high',
          category: 'javascript',
          issue: 'Long tasks blocking main thread',
          solution: 'Break up long tasks and implement Web Workers',
          threshold: 'Average long task > 100ms'
        });
      }
    }

    // Web Vitals recommendations
    if (metrics.vitals.lcp && metrics.vitals.lcp.value > 2500) {
      recommendations.push({
        priority: 'medium',
        category: 'rendering',
        issue: 'Slow Largest Contentful Paint',
        solution: 'Optimize critical resources and render path',
        threshold: 'LCP > 2.5s'
      });
    }

    if (metrics.vitals.fid && metrics.vitals.fid.value > 100) {
      recommendations.push({
        priority: 'high',
        category: 'interactivity',
        issue: 'Poor First Input Delay',
        solution: 'Reduce JavaScript execution time and optimize main thread',
        threshold: 'FID > 100ms'
      });
    }

    return recommendations;
  }

  calculatePerformanceScore(summary) {
    let score = 100;

    // Navigation score (0-40 points)
    if (summary.navigation) {
      if (summary.navigation.ttfb > 600) score -= 15;
      else if (summary.navigation.ttfb > 400) score -= 8;
      else if (summary.navigation.ttfb > 200) score -= 3;

      if (summary.navigation.totalTime > 3000) score -= 25;
      else if (summary.navigation.totalTime > 2000) score -= 15;
      else if (summary.navigation.totalTime > 1000) score -= 5;
    }

    // Resource score (0-20 points)
    if (summary.resources) {
      const slowPercentage = (summary.resources.slow / summary.resources.total) * 100;
      if (slowPercentage > 30) score -= 20;
      else if (slowPercentage > 20) score -= 15;
      else if (slowPercentage > 10) score -= 10;
      else if (slowPercentage > 5) score -= 5;
    }

    // Long tasks score (0-20 points)
    if (summary.longTasks) {
      if (summary.longTasks.total > 10) score -= 20;
      else if (summary.longTasks.total > 5) score -= 15;
      else if (summary.longTasks.total > 2) score -= 10;
      else if (summary.longTasks.total > 0) score -= 5;
    }

    // Web Vitals score (0-20 points)
    if (summary.vitals?.lcp) {
      if (summary.vitals.lcp.value > 4000) score -= 15;
      else if (summary.vitals.lcp.value > 2500) score -= 8;
      else if (summary.vitals.lcp.value > 1000) score -= 3;
    }

    if (summary.vitals?.fid) {
      if (summary.vitals.fid.value > 300) score -= 10;
      else if (summary.vitals.fid.value > 100) score -= 5;
    }

    return Math.max(0, Math.round(score));
  }

  exportMetrics(format = 'json') {
    const report = this.getPerformanceReport();

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'summary':
        return `Performance Score: ${report.score}/100\nIssues: ${report.recommendations.length}`;
      default:
        return report;
    }
  }

  cleanup() {
    this.stopCollection();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = {
      navigation: null,
      resources: [],
      userTiming: [],
      longTasks: [],
      vitals: {},
      custom: new Map()
    };
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

// Convenience functions
export const getPerformanceReport = () => globalPerformanceMonitor.getPerformanceReport();
export const getPerformanceScore = () => globalPerformanceMonitor.getPerformanceReport().score;

export default {
  PerformanceMonitor,
  globalPerformanceMonitor,
  getPerformanceReport,
  getPerformanceScore
};