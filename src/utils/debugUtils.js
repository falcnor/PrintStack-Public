/**
 * Debug utilities for development and production debugging
 */

// Set debug mode based on environment
const isDevelopment = import.meta.env.MODE === 'development';

/**
 * Enhanced logger with levels and environment awareness
 */
export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`ℹ️ ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    console.warn(`⚠️ ${message}`, ...args);
  },

  error: (message, ...args) => {
    console.error(`🔴 ${message}`, ...args);
  },

  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(`🐛 ${message}`, ...args);
    }
  },

  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Performance logging
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
};

/**
 * Error reporting service
 */
export class ErrorReporter {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
  }

  report(error, errorInfo = {}) {
    const errorReport = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorInfo
    };

    this.errors.unshift(errorReport);

    // Limit error history
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log the error
    logger.error('Application Error Reported:', errorReport);

    // In production, you could send this to an error tracking service
    if (!isDevelopment) {
      this.sendToErrorService(errorReport);
    }
  }

  sendToErrorService(report) {
    // Placeholder for error service integration
    // Could be Sentry, LogRocket, Bugsnag, etc.
    logger.warn('Error would be sent to error service:', report.id);
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorCount() {
    return this.errors.length;
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter();

/**
 * Performance monitoring utilities
 */
export const performance = {
  /**
   * Measure component render time
   */
  measureRender: (ComponentName) => {
    return (WrappedComponent) => {
      return (props) => {
        if (isDevelopment) {
          logger.time(`${ComponentName} render`);
          const result = WrappedComponent(props);
          logger.timeEnd(`${ComponentName} render`);
          return result;
        }
        return WrappedComponent(props);
      };
    }
  },

  /**
   * Track large render times
   */
  trackRender: (componentName, renderTime) => {
    if (renderTime > 16) { // More than one frame
      logger.warn(`Slow render detected - ${componentName}: ${renderTime}ms`);
    }
  }
};

/**
 * Development helper utilities
 */
export const devHelpers = {
  /**
   * Show current component tree depth
   */
  showComponentTree: () => {
    if (isDevelopment) {
      logger.group('Component Tree Analysis');
      const components = document.querySelectorAll('[data-react-component]');
      components.forEach((el, index) => {
        const name = el.dataset.reactComponent;
        logger.debug(`${index + 1}. ${name}`);
      });
      logger.groupEnd();
    }
  },

  /**
   * Show localStorage contents
   */
  showLocalStorage: () => {
    if (isDevelopment) {
      logger.group('LocalStorage Contents');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        logger.debug(`${key}:`, value);
      }
      logger.groupEnd();
    }
  },

  /**
   * Memory usage check
   */
  checkMemoryUsage: () => {
    if (isDevelopment && 'memory' in performance) {
      const memory = performance.memory;
      logger.group('Memory Usage');
      logger.debug(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      logger.debug(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
      logger.debug(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
      logger.groupEnd();
    }
  }
};

/**
 * Set up global error handlers
 */
export const setupErrorHandlers = () => {
  // Handle uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorReporter.report(new Error(event.reason), {
      type: 'unhandledPromiseRejection',
      promise: event.promise
    });

    event.preventDefault();
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    errorReporter.report(event.error || new Error(event.message), {
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  logger.info('Error handlers setup complete');
};

// Initialize error handlers if in browser
if (typeof window !== 'undefined') {
  setupErrorHandlers();
}