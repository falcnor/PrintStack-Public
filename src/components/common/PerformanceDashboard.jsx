import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from './PerformanceDashboard.module.css';

/**
 * Performance Analytics Dashboard Component
 * Shows real-time performance metrics and analytics
 */
const PerformanceDashboard = ({
  visible = false,
  onClose,
  position = 'bottom-right',
  showVitals = true,
  showMemory = true,
  showResources = true,
  showErrors = true,
  refreshInterval = 5000
}) => {
  const [metrics, setMetrics] = useState(null);
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshIntervalId, setRefreshIntervalId] = useState(null);

  const refreshMetrics = useCallback(() => {
    if (window.__performanceMonitor) {
      const summary = window.__performanceMonitor.getSummary();
      setMetrics(summary);
    }
  }, []);

  useEffect(() => {
    if (visible && isRealTime) {
      refreshMetrics();
      const intervalId = setInterval(refreshMetrics, refreshInterval);
      setRefreshIntervalId(intervalId);

      return () => {
        clearInterval(intervalId);
      };
    } else if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      setRefreshIntervalId(null);
    }
  }, [visible, isRealTime, refreshInterval, refreshMetrics, refreshIntervalId]);

  useEffect(() => {
    if (visible) {
      refreshMetrics();
    }
  }, [visible, refreshMetrics]);

  const exportMetrics = useCallback(() => {
    if (window.__performanceMonitor) {
      const data = window.__performanceMonitor.exportMetrics();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, []);

  const clearMetrics = useCallback(() => {
    if (window.__performanceMonitor) {
      window.__performanceMonitor.stop();
      window.__performanceMonitor.initializeTracking();
      refreshMetrics();
    }
  }, [refreshMetrics]);

  if (!visible || !metrics) {
    return null;
  }

  const getVitalStatus = (value, threshold) => {
    if (value <= threshold * 0.8) return 'excellent';
    if (value <= threshold) return 'good';
    return 'poor';
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`${styles.dashboard} ${styles[position]}`}>
      <div className={styles.header}>
        <h3>Performance Analytics</h3>
        <button onClick={onClose} className={styles.closeButton} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.controls}>
        <button
          onClick={() => setIsRealTime(!isRealTime)}
          className={`${styles.toggleButton} ${isRealTime ? styles.active : ''}`}
        >
          Real-time: {isRealTime ? 'ON' : 'OFF'}
        </button>
        <button onClick={refreshMetrics} className={styles.refreshButton}>
          Refresh
        </button>
        <button onClick={exportMetrics} className={styles.exportButton}>
          Export
        </button>
        <button onClick={clearMetrics} className={styles.clearButton}>
          Clear
        </button>
      </div>

      <div className={styles.content}>
        {/* Core Web Vitals */}
        {showVitals && (
          <div className={styles.section}>
            <h4>Core Web Vitals</h4>
            <div className={styles.vitalsGrid}>
              {metrics.vitals.FCP !== undefined && (
                <div className={`${styles.vitalCard} ${styles[getVitalStatus(metrics.vitals.FCP, 1800)]}`}>
                  <div className={styles.vitalName}>FCP</div>
                  <div className={styles.vitalValue}>{formatTime(metrics.vitals.FCP)}</div>
                  <div className={styles.vitalDesc}>First Contentful Paint</div>
                </div>
              )}

              {metrics.vitals.LCP !== undefined && (
                <div className={`${styles.vitalCard} ${styles[getVitalStatus(metrics.vitals.LCP, 2500)]}`}>
                  <div className={styles.vitalName}>LCP</div>
                  <div className={styles.vitalValue}>{formatTime(metrics.vitals.LCP)}</div>
                  <div className={styles.vitalDesc}>Largest Contentful Paint</div>
                </div>
              )}

              {metrics.vitals.FID !== undefined && (
                <div className={`${styles.vitalCard} ${styles[getVitalStatus(metrics.vitals.FID, 100)]}`}>
                  <div className={styles.vitalName}>FID</div>
                  <div className={styles.vitalValue}>{formatTime(metrics.vitals.FID)}</div>
                  <div className={styles.vitalDesc}>First Input Delay</div>
                </div>
              )}

              {metrics.vitals.CLS !== undefined && (
                <div className={`${styles.vitalCard} ${styles[getVitalStatus(metrics.vitals.CLS, 0.1)]}`}>
                  <div className={styles.vitalName}>CLS</div>
                  <div className={styles.vitalValue}>{metrics.vitals.CLS.toFixed(3)}</div>
                  <div className={styles.vitalDesc}>Cumulative Layout Shift</div>
                </div>
              )}

              {metrics.vitals.TTFB !== undefined && (
                <div className={`${styles.vitalCard} ${styles[getVitalStatus(metrics.vitals.TTFB, 600)]}`}>
                  <div className={styles.vitalName}>TTFB</div>
                  <div className={styles.vitalValue}>{formatTime(metrics.vitals.TTFB)}</div>
                  <div className={styles.vitalDesc}>Time to First Byte</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {showMemory && metrics.memoryUsage && (
          <div className={styles.section}>
            <h4>Memory Usage</h4>
            <div className={styles.memoryGrid}>
              <div className={styles.memoryCard}>
                <div className={styles.memoryLabel}>Used Heap</div>
                <div className={styles.memoryValue}>{formatBytes(metrics.memoryUsage.usedJSHeapSize)}</div>
                <div className={styles.memoryBar}>
                  <div
                    className={styles.memoryFill}
                    style={{
                      width: `${(metrics.memoryUsage.usedJSHeapSize / metrics.memoryUsage.jsHeapSizeLimit) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className={styles.memoryCard}>
                <div className={styles.memoryLabel}>Total Heap</div>
                <div className={styles.memoryValue}>{formatBytes(metrics.memoryUsage.totalJSHeapSize)}</div>
              </div>

              <div className={styles.memoryCard}>
                <div className={styles.memoryLabel}>Heap Limit</div>
                <div className={styles.memoryValue}>{formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bundle Analysis */}
        {showResources && metrics.bundleAnalysis && (
          <div className={styles.section}>
            <h4>Bundle Analysis</h4>
            <div className={styles.bundleGrid}>
              <div className={styles.bundleCard}>
                <div className={styles.bundleLabel}>Total Size</div>
                <div className={styles.bundleValue}>{metrics.bundleAnalysis.totalSizeKB} KB</div>
              </div>

              <div className={styles.bundleCard}>
                <div className={styles.bundleLabel}>Resources</div>
                <div className={styles.bundleValue}>{metrics.bundleAnalysis.resourceCount}</div>
              </div>

              <div className={styles.bundleCard}>
                <div className={styles.bundleLabel}>Avg Load Time</div>
                <div className={styles.bundleValue}>{formatTime(metrics.bundleAnalysis.avgLoadTime)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Recommendations */}
        {metrics.recommendations && metrics.recommendations.length > 0 && (
          <div className={styles.section}>
            <h4>Recommendations</h4>
            <div className={styles.recommendations}>
              {metrics.recommendations.map((rec, index) => (
                <div key={index} className={`${styles.recommendation} ${styles[rec.severity]}`}>
                  <div className={styles.recommendationType}>
                    {rec.type.toUpperCase()}
                  </div>
                  <div className={styles.recommendationMessage}>
                    {rec.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Summary */}
        {showErrors && (
          <div className={styles.section}>
            <h4>Error Summary</h4>
            <div className={styles.errorSummary}>
              <div className={`${styles.errorCard} ${metrics.errorCount > 0 ? styles.hasErrors : ''}`}>
                <div className={styles.errorCount}>{metrics.errorCount}</div>
                <div className={styles.errorLabel}>Errors Detected</div>
                {metrics.errorCount > 0 && (
                  <div className={styles.errorAction}>
                    Check console for details
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* General Stats */}
        <div className={styles.section}>
          <h4>Session Info</h4>
          <div className={styles.sessionStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Sample Rate:</span>
              <span className={styles.statValue}>{Math.round(metrics.sampleRate * 100)}%</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Tracking:</span>
              <span className={`styles.statValue ${metrics.isTracking ? styles.active : styles.inactive}`}>
                {metrics.isTracking ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Last Update:</span>
              <span className={styles.statValue}>{new Date(metrics.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PerformanceDashboard.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  showVitals: PropTypes.bool,
  showMemory: PropTypes.bool,
  showResources: PropTypes.bool,
  showErrors: PropTypes.bool,
  refreshInterval: PropTypes.number
};

/**
 * Performance Monitor Toggle Component
 */
export const PerformanceMonitorToggle = ({ onToggle }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = useCallback(() => {
    const newState = !isVisible;
    setIsVisible(newState);
    onToggle(newState);
  }, [isVisible, onToggle]);

  return (
    <button
      onClick={handleToggle}
      className={`${styles.performanceToggle} ${isVisible ? styles.active : ''}`}
      title="Toggle Performance Dashboard"
    >
      ⚡
    </button>
  );
};

PerformanceMonitorToggle.propTypes = {
  onToggle: PropTypes.func.isRequired
};

export {
  PerformanceMonitorToggle
};

export default PerformanceDashboard;