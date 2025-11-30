/**
 * Comprehensive Error Handling System
 * Provides centralized error handling, logging, and user feedback
 */

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Error categories
export const ErrorCategory = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  STORAGE: 'storage',
  PERFORMANCE: 'performance',
  USER_INPUT: 'user_input',
  SYSTEM: 'system',
  COMPONENT: 'component',
  DATA_MIGRATION: 'data_migration'
};

/**
 * Application Error Class
 */
export class AppError extends Error {
  constructor(message, {
    category = ErrorCategory.SYSTEM,
    severity = ErrorSeverity.MEDIUM,
    code = null,
    details = null,
    originalError = null,
    context = {}
  } = {}) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.id = this.generateErrorId();
  }

  generateErrorId() {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      details: this.details,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message
      } : null
    };
  }
}

/**
 * Error Logger Utility
 */
class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.storageKey = 'printstack_error_log';
    this.loadErrorsFromStorage();
  }

  log(error) {
    const errorData = error instanceof AppError ? error : new AppError(error.message, {
      originalError: error,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM
    });

    this.addToLog(errorData);
    this.persistToStorage();
    this.outputToConsole(errorData);

    return errorData;
  }

  addToLog(error) {
    this.errors.unshift(error);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
  }

  persistToStorage() {
    try {
      const errorLogData = {
        errors: this.errors.slice(0, 50), // Store only last 50 in storage
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(errorLogData));
    } catch (storageError) {
      console.warn('Failed to persist error log to localStorage:', storageError);
    }
  }

  loadErrorsFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const errorLogData = JSON.parse(stored);
        this.errors = errorLogData.errors || [];
      }
    } catch (error) {
      console.warn('Failed to load error log from localStorage:', error);
    }
  }

  outputToConsole(error) {
    const { severity, category, message, details, context } = error;

    const consoleMethod = severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH
      ? 'error'
      : severity === ErrorSeverity.MEDIUM
      ? 'warn'
      : 'log';

    console[consoleMethod](`[${category.toUpperCase()}] ${message}`, {
      error,
      details,
      context,
      timestamp: error.timestamp
    });
  }

  getErrors(category = null, severity = null) {
    return this.errors.filter(error => {
      if (category && error.category !== category) return false;
      if (severity && error.severity !== severity) return false;
      return true;
    });
  }

  clearLog() {
    this.errors = [];
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn('Failed to clear error log from storage:', error);
    }
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {},
      bySeverity: {},
      last24hrs: this.errors.filter(e => {
        const errorTime = new Date(e.timestamp);
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return errorTime > dayAgo;
      }).length
    };

    this.errors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

/**
 * Network Error Handler
 */
export const handleNetworkError = (error, context = {}) => {
  let category = ErrorCategory.NETWORK;
  let message = 'Network connection error';
  let severity = ErrorSeverity.MEDIUM;

  if (error.name === 'AbortError') {
    category = ErrorCategory.NETWORK;
    message = 'Request was cancelled';
    severity = ErrorSeverity.LOW;
  } else if (error.response) {
    // HTTP error response
    category = ErrorCategory.NETWORK;
    message = `Server error: ${error.response.status} ${error.response.statusText}`;
    severity = error.response.status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
  } else if (error.request) {
    // Network request made but no response
    category = ErrorCategory.NETWORK;
    message = 'No response from server';
    severity = ErrorSeverity.HIGH;
  }

  return errorLogger.log(new AppError(message, {
    category,
    severity,
    details: {
      url: context.url,
      method: context.method,
      status: error.response?.status,
      statusText: error.response?.statusText
    },
    originalError: error,
    context
  }));
};

/**
 * Storage Error Handler
 */
export const handleStorageError = (error, operation, context = {}) => {
  const message = `Storage error during ${operation}: ${error.message}`;

  return errorLogger.log(new AppError(message, {
    category: ErrorCategory.STORAGE,
    severity: ErrorSeverity.HIGH,
    code: 'STORAGE_ERROR',
    details: {
      operation,
      storageType: typeof Storage !== 'undefined' ? 'localStorage' : 'unavailable',
      available: typeof Storage !== 'undefined'
    },
    originalError: error,
    context
  }));
};

/**
 * Validation Error Handler
 */
export const handleValidationError = (error, context = {}) => {
  const message = `Validation error: ${error.message}`;

  return errorLogger.log(new AppError(message, {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
    code: 'VALIDATION_ERROR',
    details: {
      field: error.field,
      value: error.value,
      constraint: error.constraint
    },
    originalError: error,
    context
  }));
};

/**
 * Component Error Handler
 */
export const handleComponentError = (error, componentName, props = {}) => {
  const message = `Component error in ${componentName}: ${error.message}`;

  return errorLogger.log(new AppError(message, {
    category: ErrorCategory.COMPONENT,
    severity: ErrorSeverity.HIGH,
    code: 'COMPONENT_ERROR',
    details: {
      componentName,
      props: props,
      errorBoundary: true
    },
    originalError: error,
    context: { componentName }
  }));
};

/**
 * Performance Error Handler
 */
export const handlePerformanceError = (metricValue, threshold, metricName, context = {}) => {
  const message = `Performance threshold exceeded: ${metricName} (${metricValue}ms > ${threshold}ms)`;

  return errorLogger.log(new AppError(message, {
    category: ErrorCategory.PERFORMANCE,
    severity: ErrorSeverity.MEDIUM,
    code: 'PERFORMANCE_THRESHOLD',
    details: {
      metricName,
      metricValue,
      threshold,
      ratio: metricValue / threshold
    },
    context
  }));
};

/**
 * Data Migration Error Handler
 */
export const handleMigrationError = (error, migrationStep, context = {}) => {
  const message = `Data migration error at step ${migrationStep}: ${error.message}`;

  return errorLogger.log(new AppError(message, {
    category: ErrorCategory.DATA_MIGRATION,
    severity: ErrorSeverity.CRITICAL,
    code: 'MIGRATION_ERROR',
    details: {
      migrationStep,
      errorType: error.name,
      recoverable: error.recoverable || false
    },
    originalError: error,
    context: { migrationStep }
  }));
};

/**
 * Fallback Data Provider
 * Provides default fallback data when real data is unavailable
 */
export const FallbackDataProvider = {
  // Fallback filament data
  getEmptyFilamentData: () => ({
    filaments: [],
    total: 0,
    lastUpdated: null
  }),

  // Fallback model data
  getEmptyModelData: () => ({
    models: [],
    categories: [],
    total: 0,
    lastUpdated: null
  }),

  // Fallback print data
  getEmptyPrintData: () => ({
    prints: [],
    total: 0,
    successRate: 0,
    lastUpdated: null
  }),

  // Fallback statistics data
  getEmptyStatistics: () => ({
    filamentStats: { totalSpools: 0, totalWeight: 0, totalValue: 0 },
    modelStats: { totalModels: 0, printCount: 0 },
    printStats: { totalPrints: 0, successRate: 0 },
    usageStats: {},
    economicStats: { totalFilamentInvestment: 0, averageCostPerPrint: 0 },
    lastUpdated: null
  }),

  // Fallback user preferences
  getDefaultPreferences: () => ({
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
    notifications: true,
    autoSave: true
  })
};

/**
 * Error Recovery Utilities
 */
export const ErrorRecovery = {
  // Try to recover from storage errors
  recoverFromStorageError: (error) => {
    try {
      // Try to clear potentially corrupted storage
      if (typeof Storage !== 'undefined') {
        const keysToPreserve = ['printstack_user_preferences', 'printstack_settings'];
        const preservedData = {};

        keysToPreserve.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              preservedData[key] = value;
            }
          } catch (e) {
            // Ignore errors during recovery
          }
        });

        // Clear and restore
        localStorage.clear();
        Object.entries(preservedData).forEach(([key, value]) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            console.warn(`Failed to restore ${key} during recovery`);
          }
        });
      }

      return { success: true, message: 'Storage recovered successfully' };
    } catch (recoveryError) {
      return {
        success: false,
        message: 'Storage recovery failed',
        error: recoveryError
      };
    }
  },

  // Try to recover from network errors with retry
  retryWithBackoff: async (operation, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log(`Retrying operation (attempt ${attempt}/${maxRetries}) after ${delay}ms delay`);
      }
    }
  }
};

/**
 * React Error Boundary Integration
 */
export const createErrorBoundaryComponent = (errorBoundaryClass) => {
  return class extends errorBoundaryClass {
    componentDidCatch(error, errorInfo) {
      // Enhance original error boundary with our logging
      const errorData = handleComponentError(error, this.constructor.name || 'Unknown', {
        componentStack: errorInfo.componentStack
      });

      // Call original componentDidCatch if it exists
      if (super.componentDidCatch) {
        super.componentDidCatch(error, errorInfo);
      }

      // Store error for user feedback
      this.setState({ error: errorData, errorInfo });
    }
  };
};

/**
 * Global Error Handlers
 */
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught JavaScript errors
  window.addEventListener('error', (event) => {
    const errorData = errorLogger.log(new AppError(event.message, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      details: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      },
      originalError: event.error,
      context: { source: 'global_error_handler' }
    }));
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const errorData = errorLogger.log(new AppError('Unhandled promise rejection', {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.HIGH,
      details: {
        reason: event.reason?.message || event.reason,
        promise: event.promise
      },
      originalError: event.reason,
      context: { source: 'unhandled_promise_rejection' }
    }));

    // Don't prevent normal console logging
    event.preventDefault();
  });
};

// Initialize global error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}

export default {
  ErrorLogger,
  AppError,
  errorLogger,
  ErrorSeverity,
  ErrorCategory,
  handleNetworkError,
  handleStorageError,
  handleValidationError,
  handleComponentError,
  handlePerformanceError,
  handleMigrationError,
  FallbackDataProvider,
  ErrorRecovery,
  createErrorBoundaryComponent,
  setupGlobalErrorHandlers
};