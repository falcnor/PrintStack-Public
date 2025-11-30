/**
 * Bundle Analysis and Optimization Utilities
 * Provides tools to monitor, analyze, and optimize bundle sizes
 */

/**
 * Calculate estimated bundle size from import manifest
 * @param {Object} manifest - Vite build manifest
 * @returns {Object} Bundle analysis data
 */
export const analyzeBundleSize = (manifest) => {
  if (!manifest) {
    return {
      totalSize: 0,
      chunks: [],
      dependencies: {},
      recommendations: []
    };
  }

  const chunks = [];
  const dependencies = {};
  let totalSize = 0;

  Object.entries(manifest).forEach(([name, info]) => {
    const size = estimateFileSize(info.file);
    totalSize += size;

    chunks.push({
      name,
      file: info.file,
      size,
      type: getChunkType(name, info.file),
      isEntry: info.isEntry,
      isDynamic: info.isDynamicEntry,
      imports: info.imports || []
    });

    // Analyze dependencies
    if (info.imports) {
      info.imports.forEach(dep => {
        if (!dependencies[dep]) {
          dependencies[dep] = { count: 0, size: 0 };
        }
        dependencies[dep].count++;
      });
    }
  });

  const recommendations = generateRecommendations(chunks, totalSize);

  return {
    totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    chunks: chunks.sort((a, b) => b.size - a.size),
    dependencies,
    recommendations
  };
};

/**
 * Estimate file size based on content type and typical compression ratios
 * @param {string} filename - File name
 * @returns {number} Estimated size in bytes
 */
const estimateFileSize = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();

  // Base sizes for different file types (rough estimates)
  const baseSizes = {
    'js': 15000,    // ~15KB average JS chunk
    'css': 5000,    // ~5KB average CSS chunk
    'woff2': 20000, // ~20KB average font
    'png': 10000,   // ~10KB average image
    'jpg': 8000,    // ~8KB average JPEG
    'svg': 2000,    // ~2KB average SVG
    'html': 3000,   // ~3KB average HTML
    'json': 1000    // ~1KB average JSON
  };

  const baseSize = baseSizes[extension] || 5000;

  // Add variation based on file patterns
  if (filename.includes('vendor')) {
    return baseSize * 2; // Vendor chunks are usually larger
  } else if (filename.includes('feature')) {
    return baseSize * 1.5; // Feature chunks
  } else if (filename.includes('common')) {
    return baseSize * 1.2; // Common chunks
  }

  return baseSize;
};

/**
 * Determine chunk type based on file patterns
 * @param {string} name - Chunk name
 * @param {string} file - File path
 * @returns {string} Chunk type
 */
const getChunkType = (name, file) => {
  if (name === 'main' || file.includes('index')) return 'entry';
  if (name.includes('vendor') || file.includes('node_modules')) return 'vendor';
  if (name.includes('feature')) return 'feature';
  if (name.includes('common')) return 'common';
  if (name.includes('style') || file.endsWith('.css')) return 'style';
  if (name.includes('asset')) return 'asset';
  return 'module';
};

/**
 * Generate optimization recommendations based on analysis
 * @param {Array} chunks - Chunks array
 * @param {number} totalSize - Total bundle size
 * @returns {Array} Recommendations array
 */
const generateRecommendations = (chunks, totalSize) => {
  const recommendations = [];
  const totalSizeMB = totalSize / (1024 * 1024);

  // Size-based recommendations
  if (totalSizeMB > 2) {
    recommendations.push({
      type: 'warning',
      message: `Bundle size is ${(totalSizeMB).toFixed(2)}MB. Consider lazy loading more routes and components.`,
      priority: 'high'
    });
  } else if (totalSizeMB > 1) {
    recommendations.push({
      type: 'info',
      message: `Bundle size is ${(totalSizeMB).toFixed(2)}MB. You're doing well, but there's room for optimization.`,
      priority: 'medium'
    });
  }

  // Chunk-specific recommendations
  chunks.forEach(chunk => {
    const sizeMB = chunk.size / (1024 * 1024);

    if (sizeMB > 0.5) {
      recommendations.push({
        type: 'warning',
        message: `Large chunk "${chunk.name}" is ${sizeMB.toFixed(2)}MB. Consider splitting it further.`,
        priority: 'high',
        chunk: chunk.name
      });
    }

    // Check for vendor chunks that could be optimized
    if (chunk.type === 'vendor' && sizeMB > 0.3) {
      recommendations.push({
        type: 'info',
        message: `Consider tree-shaking or finding lighter alternatives for "${chunk.name}"`,
        priority: 'medium',
        chunk: chunk.name
      });
    }
  });

  // Dynamic import recommendations
  const dynamicChunks = chunks.filter(chunk => chunk.isDynamic);
  if (dynamicChunks.length < chunks.length * 0.5) {
    recommendations.push({
      type: 'info',
      message: 'Consider implementing more dynamic imports for better code splitting',
      priority: 'low'
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
};

/**
 * Performance metrics collection
 */
export class PerformanceMetrics {
  constructor() {
    this.metrics = {
      navigation: [],
      loadTimes: {},
      bundleSizes: {},
      memoryUsage: []
    };
  }

  /**
   * Record navigation performance
   * @param {string} route - Current route
   * @param {number} loadTime - Load time in milliseconds
   */
  recordNavigation(route, loadTime) {
    const timestamp = Date.now();
    this.metrics.navigation.push({
      route,
      loadTime,
      timestamp
    });

    // Keep only last 50 navigation records
    if (this.metrics.navigation.length > 50) {
      this.metrics.navigation = this.metrics.navigation.slice(-50);
    }
  }

  /**
   * Record component load time
   * @param {string} component - Component name
   * @param {number} loadTime - Load time in milliseconds
   */
  recordComponentLoad(component, loadTime) {
    if (!this.metrics.loadTimes[component]) {
      this.metrics.loadTimes[component] = [];
    }

    this.metrics.loadTimes[component].push({
      time: loadTime,
      timestamp: Date.now()
    });

    // Keep only last 10 records per component
    if (this.metrics.loadTimes[component].length > 10) {
      this.metrics.loadTimes[component] = this.metrics.loadTimes[component].slice(-10);
    }
  }

  /**
   * Record bundle size
   * @param {string} chunkName - Chunk name
   * @param {number} size - Size in bytes
   */
  recordBundleSize(chunkName, size) {
    this.metrics.bundleSizes[chunkName] = {
      size,
      timestamp: Date.now()
    };
  }

  /**
   * Record memory usage
   */
  recordMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.metrics.memoryUsage.push({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      });

      // Keep only last 20 memory records
      if (this.metrics.memoryUsage.length > 20) {
        this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-20);
      }
    }
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const avgLoadTime = this.calculateAverageLoadTime();
    const slowestComponents = this.getSlowestComponents();
    const memoryTrend = this.getMemoryTrend();

    return {
      totalNavigations: this.metrics.navigation.length,
      averageLoadTime: avgLoadTime,
      slowestComponents,
      memoryTrend,
      bundleCount: Object.keys(this.metrics.bundleSizes).length
    };
  }

  /**
   * Calculate average load time
   * @returns {number} Average load time in milliseconds
   */
  calculateAverageLoadTime() {
    const allLoadTimes = [
      ...this.metrics.navigation.map(nav => nav.loadTime),
      ...Object.values(this.metrics.loadTimes).flat().map(comp => comp.time)
    ];

    if (allLoadTimes.length === 0) return 0;

    const sum = allLoadTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / allLoadTimes.length);
  }

  /**
   * Get slowest components
   * @returns {Array} Array of slowest components
   */
  getSlowestComponents() {
    const componentAvgs = {};

    Object.entries(this.metrics.loadTimes).forEach(([component, loadTimes]) => {
      const avgTime = loadTimes.reduce((sum, lt) => sum + lt.time, 0) / loadTimes.length;
      componentAvgs[component] = Math.round(avgTime);
    });

    return Object.entries(componentAvgs)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([component, avgTime]) => ({ component, avgTime }));
  }

  /**
   * Get memory usage trend
   * @returns {Object} Memory trend data
   */
  getMemoryTrend() {
    if (this.metrics.memoryUsage.length < 2) return null;

    const recent = this.metrics.memoryUsage.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const avg = recent.reduce((sum, mem) => sum + mem.usedJSHeapSize, 0) / recent.length;

    const trend = last.usedJSHeapSize > first.usedJSHeapSize ? 'increasing' : 'decreasing';
    const change = ((last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize) * 100;

    return {
      trend,
      changePercent: Math.round(change),
      current: last.usedJSHeapSize,
      average: Math.round(avg),
      limit: last.jsHeapSizeLimit
    };
  }

  /**
   * Export metrics for analysis
   * @returns {Object} All metrics
   */
  export() {
    return {
      ...this.metrics,
      summary: this.getSummary(),
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = {
      navigation: [],
      loadTimes: {},
      bundleSizes: {},
      memoryUsage: []
    };
  }
}

// Global performance metrics instance
export const globalMetrics = new PerformanceMetrics();

/**
 * Initialize performance monitoring
 * @returns {Function} Cleanup function
 */
export const initializePerformanceMonitoring = () => {
  // Start monitoring navigation timing
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const loadTime = entry.loadEventEnd - entry.loadEventStart;
        globalMetrics.recordNavigation(window.location.pathname, loadTime);
      }
    });
  });

  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (error) {
    console.warn('Performance Observer not supported:', error);
  }

  // Record memory usage every 30 seconds
  const memoryInterval = setInterval(() => {
    globalMetrics.recordMemoryUsage();
  }, 30000);

  // Record initial memory usage
  globalMetrics.recordMemoryUsage();

  return () => {
    observer?.disconnect?.();
    clearInterval(memoryInterval);
  };
};

export default {
  analyzeBundleSize,
  PerformanceMetrics,
  globalMetrics,
  initializePerformanceMonitoring
};