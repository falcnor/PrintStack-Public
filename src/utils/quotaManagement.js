/**
 * Quota Management and Handling for PrintStack
 *
 * This utility handles Firebase hosting quota exceeded scenarios,
 * implements graceful degradation, and provides user notifications
 * when approaching or exceeding quotas.
 */

// Quota thresholds (adjust based on your Firebase plan)
const QUOTA_THRESHOLDS = {
  // Firebase Hosting quotas (Spark plan)
  BANDWIDTH: {
    daily: 10 * 1024 * 1024 * 1024, // 10 GB per day
    monthly: 360 * 1024 * 1024 * 1024, // 360 GB per month
    warning: 0.8, // 80% warning threshold
    critical: 0.95 // 95% critical threshold
  },
  STORAGE: {
    total: 1 * 1024 * 1024 * 1024, // 1 GB total storage
    warning: 0.8, // 80% warning threshold
    critical: 0.95 // 95% critical threshold
  },
  REQUESTS: {
    requestsPerSecond: 500,
    daily: 125000, // 125k requests/day
    warning: 0.8,
    critical: 0.95
  }
};

// Local quota tracking
let quotaMetrics = {
  current: {
    bandwidth: {
      used: 0,
      daily: 0,
      monthly: 0
    },
    storage: {
      used: 0
    },
    requests: {
      count: 0,
      daily: 0,
      currentTime: Date.now()
    }
  },
  alerts: [],
  lastUpdate: Date.now()
};

// Storage keys
const QUOTA_STORAGE_KEY = 'printstack_quota_metrics';
const QUOTA_ALERTS_KEY = 'printstack_quota_alerts';

/**
 * Initialize quota monitoring
 */
export function initQuotaMonitoring() {
  console.log('📊 Initializing quota monitoring...');

  // Load existing metrics
  loadQuotaMetrics();

  // Start periodic monitoring
  startMonitoring();

  // Set up performance tracking for bandwidth estimation
  setupBandwidthTracking();

  console.log('✅ Quota monitoring initialized');
}

/**
 * Load quota metrics from localStorage
 */
function loadQuotaMetrics() {
  try {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Reset daily counters if it's a new day
      const today = new Date().toDateString();
      const lastUpdate = new Date(parsed.lastUpdate).toDateString();

      if (today !== lastUpdate) {
        parsed.current.bandwidth.daily = 0;
        parsed.current.requests.daily = 0;
      }

      quotaMetrics = parsed;
    }
  } catch (error) {
    console.warn('Failed to load quota metrics:', error);
  }
}

/**
 * Save quota metrics to localStorage
 */
function saveQuotaMetrics() {
  try {
    quotaMetrics.lastUpdate = Date.now();
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quotaMetrics));
  } catch (error) {
    console.warn('Failed to save quota metrics:', error);
  }
}

/**
 * Start monitoring quotas
 */
function startMonitoring() {
  // Check quotas every 5 minutes
  setInterval(() => {
    checkQuotaStatus();
    saveQuotaMetrics();
  }, 5 * 60 * 1000);

  // Immediate check
  checkQuotaStatus();
}

/**
 * Setup bandwidth tracking
 */
function setupBandwidthTracking() {
  // Estimate bandwidth usage from API calls and resource loading
  let totalBytes = 0;

  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        totalBytes += parseInt(contentLength, 10);
        updateBandwidthUsage(parseInt(contentLength, 10));
      }
    } catch (e) {
      // Ignore errors
    }

    // Update request count
    updateRequestCount();

    return response;
  };

  // Monitor resource loading
  if ('performance' in window && 'getEntriesByType' in performance) {
    setInterval(() => {
      const resources = performance.getEntriesByType('resource');
      const recentResources = resources.filter(r =>
        Date.now() - r.startTime < 60000 // Last minute
      );

      recentResources.forEach(resource => {
        if (resource.transferSize) {
          updateBandwidthUsage(resource.transferSize);
        }
      });
    }, 60000); // Every minute
  }
}

/**
 * Update bandwidth usage
 */
function updateBandwidthUsage(bytes) {
  quotaMetrics.current.bandwidth.used += bytes;
  quotaMetrics.current.bandwidth.daily += bytes;
  quotaMetrics.current.bandwidth.monthly += bytes;

  checkQuotaThreshold('bandwidth', quotaMetrics.current.bandwidth.daily, QUOTA_THRESHOLDS.BANDWIDTH.daily);
}

/**
 * Update request count
 */
function updateRequestCount() {
  quotaMetrics.current.requests.count++;
  quotaMetrics.current.requests.daily++;

  checkQuotaThreshold('requests', quotaMetrics.current.requests.daily, QUOTA_THRESHOLDS.REQUESTS.daily);
}

/**
 * Check quota thresholds
 */
function checkQuotaThreshold(type, used, limit) {
  const percentage = used / limit;

  if (percentage >= QUOTA_THRESHOLDS[type].critical) {
    handleQuotaExceeded(type, 'critical', percentage);
  } else if (percentage >= QUOTA_THRESHOLDS[type].warning) {
    handleQuotaExceeded(type, 'warning', percentage);
  }
}

/**
 * Handle quota exceeded scenarios
 */
function handleQuotaExceeded(type, severity, percentage) {
  const alert = {
    id: `quota_${type}_${Date.now()}`,
    type,
    severity,
    percentage: Math.round(percentage * 100),
    timestamp: new Date().toISOString(),
    message: getQuotaMessage(type, severity, percentage)
  };

  // Avoid duplicate alerts
  const existingAlert = quotaMetrics.alerts.find(a =>
    a.type === type && a.severity === severity &&
    Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 minutes
  );

  if (!existingAlert) {
    quotaMetrics.alerts.push(alert);
    logQuotaAlert(alert);

    // Emit event for UI components
    window.dispatchEvent(new CustomEvent('quota-exceeded', {
      detail: alert
    }));

    // Apply quota management strategies
    applyQuotaManagement(type, severity);
  }

  // Keep only last 20 alerts
  if (quotaMetrics.alerts.length > 20) {
    quotaMetrics.alerts = quotaMetrics.alerts.slice(-20);
  }
}

/**
 * Get quota message
 */
function getQuotaMessage(type, severity, percentage) {
  const messages = {
    bandwidth: {
      warning: `Bandwidth usage at ${Math.round(percentage * 100)}%. Consider optimizing assets or reducing data usage.`,
      critical: `Critical: Bandwidth usage at ${Math.round(percentage * 100)}%. Some features may be limited to prevent overage charges.`
    },
    storage: {
      warning: `Storage usage at ${Math.round(percentage * 100)}%. Consider cleaning up old data or optimizing storage.`,
      critical: `Critical: Storage nearly full. Some features may be limited until storage is freed.`
    },
    requests: {
      warning: `Request count at ${Math.round(percentage * 100)}% of daily limit. Consider reducing API calls.`,
      critical: `Critical: Request limit nearly reached. Some API calls may be throttled.`
    }
  };

  return messages[type][severity];
}

/**
 * Apply quota management strategies
 */
function applyQuotaManagement(type, severity) {
  const strategies = {
    bandwidth: {
      warning: enableDataSaverMode,
      critical: enableEmergencyDataSaver
    },
    storage: {
      warning: promptDataCleanup,
      critical: restrictDataStorage
    },
    requests: {
      warning: enableRequestCaching,
      critical: enableRequestThrottling
    }
  };

  const strategy = strategies[type][severity];
  if (strategy) {
    strategy();
  }
}

/**
 * Enable data saver mode
 */
function enableDataSaverMode() {
  console.log('📊 Enabling data saver mode');

  // Store preference
  localStorage.setItem('printstack_data_saver', 'true');

  // Apply data saver settings
  document.documentElement.classList.add('data-saver');

  // Emit event for components
  window.dispatchEvent(new CustomEvent('data-saver-enabled', {
    detail: { mode: 'standard' }
  }));
}

/**
 * Enable emergency data saver
 */
function enableEmergencyDataSaver() {
  console.log('🚨 Enabling emergency data saver');

  // Store preference
  localStorage.setItem('printstack_data_saver', 'emergency');

  // Apply emergency data saver settings
  document.documentElement.classList.add('data-saver-emergency');

  // Emit event for components
  window.dispatchEvent(new CustomEvent('data-saver-enabled', {
    detail: { mode: 'emergency' }
  }));

  // Show emergent notification
  showQuotaNotification({
    type: 'critical',
    title: 'Data Usage Limit Reached',
    message: 'Emergency data saving mode enabled. Some features are disabled to prevent overage charges.',
    duration: 10000
  });
}

/**
 * Prompt for data cleanup
 */
function promptDataCleanup() {
  const cleanupMessage = 'Storage usage is high. Consider cleaning up old data to maintain optimal performance.';

  showQuotaNotification({
    type: 'warning',
    title: 'Storage Space Warning',
    message: cleanupMessage,
    actions: [
      { label: 'Clean Up Data', action: 'cleanup' },
      { label: 'Later', action: 'dismiss' }
    ],
    duration: 15000
  });
}

/**
 * Restrict data storage
 */
function restrictDataStorage() {
  console.log('🚨 Restricting data storage');

  // Disable new data storage
  localStorage.setItem('printstack_storage_restricted', 'true');

  showQuotaNotification({
    type: 'critical',
    title: 'Storage Full',
    message: 'Storage space is full. New data cannot be saved until space is freed. Please delete old data.',
    duration: 20000
  });
}

/**
 * Enable request caching
 */
function enableRequestCaching() {
  console.log('📊 Enabling request caching');

  localStorage.setItem('printstack_request_caching', 'true');

  showQuotaNotification({
    type: 'warning',
    title: 'High Request Usage',
    message: 'Request caching enabled to reduce API calls. Some data may be slightly outdated.',
    duration: 8000
  });
}

/**
 * Enable request throttling
 */
function enableRequestThrottling() {
  console.log('🚨 Enabling request throttling');

  localStorage.setItem('printstack_request_throttled', 'true');

  showQuotaNotification({
    type: 'critical',
    title: 'Request Limit Reached',
    message: 'Request throttling enabled. Some features may respond slowly or be temporarily unavailable.',
    duration: 12000
  });
}

/**
 * Check overall quota status
 */
function checkQuotaStatus() {
  const status = {
    bandwidth: {
      used: quotaMetrics.current.bandwidth.daily,
      limit: QUOTA_THRESHOLDS.BANDWIDTH.daily,
      percentage: (quotaMetrics.current.bandwidth.daily / QUOTA_THRESHOLDS.BANDWIDTH.daily) * 100
    },
    storage: {
      used: estimateLocalStorageUsage(),
      limit: QUOTA_THRESHOLDS.STORAGE.total,
      percentage: (estimateLocalStorageUsage() / QUOTA_THRESHOLDS.STORAGE.total) * 100
    },
    requests: {
      used: quotaMetrics.current.requests.daily,
      limit: QUOTA_THRESHOLDS.REQUESTS.daily,
      percentage: (quotaMetrics.current.requests.daily / QUOTA_THRESHOLDS.REQUESTS.daily) * 100
    }
  };

  // Check each quota
  Object.entries(status).forEach(([type, data]) => {
    checkQuotaThreshold(type, data.used, data.limit);
  });

  return status;
}

/**
 * Estimate localStorage usage
 */
function estimateLocalStorageUsage() {
  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    return 0;
  }
}

/**
 * Log quota alert
 */
function logQuotaAlert(alert) {
  console.warn(`🚨 QUOTA ALERT [${alert.severity.toUpperCase()}]`, alert.message);

  // Store alerts
  try {
    const alerts = JSON.parse(localStorage.getItem(QUOTA_ALERTS_KEY) || '[]');
    alerts.push(alert);

    // Keep only last 50 alerts
    if (alerts.length > 50) {
      alerts.splice(0, alerts.length - 50);
    }

    localStorage.setItem(QUOTA_ALERTS_KEY, JSON.stringify(alerts));
  } catch (error) {
    console.warn('Failed to save quota alert:', error);
  }
}

/**
 * Show quota notification
 */
function showQuotaNotification(options) {
  // Create custom notification element
  const notification = document.createElement('div');
  notification.className = `quota-notification quota-${options.type}`;
  notification.innerHTML = `
    <div class="quota-notification-header">
      <h4>${options.title}</h4>
      <button class="quota-notification-close">&times;</button>
    </div>
    <div class="quota-notification-content">
      <p>${options.message}</p>
      ${options.actions ? `
        <div class="quota-notification-actions">
          ${options.actions.map(action =>
            `<button data-action="${action.action}">${action.label}</button>`
          ).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .quota-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .quota-notification.warning {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }
    .quota-notification.critical {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    .quota-notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .quota-notification-header h4 {
      margin: 0;
      font-size: 16px;
    }
    .quota-notification-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
    }
    .quota-notification-actions {
      margin-top: 12px;
      display: flex;
      gap: 8px;
    }
    .quota-notification-actions button {
      padding: 6px 12px;
      border: 1px solid;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .quota-notification.warning .quota-notification-actions button {
      background: #856404;
      color: white;
      border-color: #856404;
    }
    .quota-notification.critical .quota-notification-actions button {
      background: #721c24;
      color: white;
      border-color: #721c24;
    }
  `;

  if (!document.querySelector('#quota-notification-styles')) {
    style.id = 'quota-notification-styles';
    document.head.appendChild(style);
  }

  // Add to document
  document.body.appendChild(notification);

  // Auto-hide after duration
  const timeout = options.duration || 5000;
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, timeout);

  // Handle close button
  notification.querySelector('.quota-notification-close').addEventListener('click', () => {
    notification.remove();
  });

  // Handle action buttons
  if (options.actions) {
    notification.querySelectorAll('.quota-notification-actions button').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        handleNotificationAction(action, notification);
      });
    });
  }
}

/**
 * Handle notification actions
 */
function handleNotificationAction(action, notification) {
  switch (action) {
    case 'cleanup':
      // Trigger data cleanup
      window.dispatchEvent(new Event('data-cleanup-requested'));
      notification.remove();
      break;
    case 'dismiss':
      notification.remove();
      break;
  }
}

/**
 * Get current quota status
 */
export function getQuotaStatus() {
  return checkQuotaStatus();
}

/**
 * Get quota metrics
 */
export function getQuotaMetrics() {
  return { ...quotaMetrics };
}

/**
 * Reset quota metrics
 */
export function resetQuotaMetrics() {
  quotaMetrics = {
    current: {
      bandwidth: {
        used: 0,
        daily: 0,
        monthly: 0
      },
      storage: {
        used: estimateLocalStorageUsage()
      },
      requests: {
        count: 0,
        daily: 0,
        currentTime: Date.now()
      }
    },
    alerts: [],
    lastUpdate: Date.now()
  };

  saveQuotaMetrics();
  localStorage.removeItem(QUOTA_ALERTS_KEY);

  console.log('📊 Quota metrics reset');
}

/**
 * Export quota data for analysis
 */
export function exportQuotaData() {
  const data = {
    metrics: quotaMetrics,
    status: checkQuotaStatus(),
    thresholds: QUOTA_THRESHOLDS,
    timestamp: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `quota-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Check if data saver is enabled
 */
export function isDataSaverEnabled() {
  return localStorage.getItem('printstack_data_saver');
}

/**
 * Check if storage is restricted
 */
export function isStorageRestricted() {
  return localStorage.getItem('printstack_storage_restricted') === 'true';
}

/**
 * Check if requests are throttled
 */
export function areRequestsThrottled() {
  return localStorage.getItem('printstack_request_throttled') === 'true';
}

// Auto-initialize if not in development
if (process?.env?.NODE_ENV === 'production') {
  // Initialize after a short delay
  setTimeout(initQuotaMonitoring, 1000);
}

// Export for development testing
if (process?.env?.NODE_ENV === 'development') {
  window.PrintStackQuota = {
    init: initQuotaMonitoring,
    getStatus: getQuotaStatus,
    getMetrics: getQuotaMetrics,
    reset: resetQuotaMetrics,
    export: exportQuotaData,
    isDataSaver: isDataSaverEnabled,
    isStorageRestricted,
    areThrottled: areRequestsThrottled
  };
}