import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { errorLogger, ErrorSeverity } from '../../utils/errorHandling';
import styles from './ErrorNotification.module.css';

/**
 * Error Notification Component
 * Displays real-time error notifications to users
 */
const ErrorNotification = ({
  visible = true,
  maxNotifications = 3,
  showDetails = false,
  autoHideDelay = 5000,
  position = 'top-right',
  onClearAll,
  onErrorClick
}) => {
  const [notifications, setNotifications] = useState([]);
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    if (!visible) return;

    // Subscribe to error logger updates
    const checkForNewErrors = () => {
      const recentErrors = errorLogger.getErrors().slice(0, maxNotifications);
      setNotifications(recentErrors.map(error => ({
        ...error,
        id: error.id,
        visible: true,
        autoHideTimer: error.severity === ErrorSeverity.LOW ? autoHideDelay : null
      })));
    };

    // Check immediately and set up interval
    checkForNewErrors();
    const interval = setInterval(checkForNewErrors, 1000);

    return () => clearInterval(interval);
  }, [visible, maxNotifications, autoHideDelay]);

  const handleErrorClick = (error) => {
    if (onErrorClick) {
      onErrorClick(error);
    }
    setShowDetailedView(true);
  };

  const handleDismiss = (errorId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === errorId ? { ...notif, visible: false } : notif
      )
    );
  };

  const handleDismissAll = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, visible: false })));
    if (onClearAll) {
      onClearAll();
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '🚨';
      case ErrorSeverity.HIGH:
        return '❌';
      case ErrorSeverity.MEDIUM:
        return '⚠️';
      case ErrorSeverity.LOW:
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getSeverityClassName = (severity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return styles.critical;
      case ErrorSeverity.HIGH:
        return styles.high;
      case ErrorSeverity.MEDIUM:
        return styles.medium;
      case ErrorSeverity.LOW:
        return styles.low;
      default:
        return styles.default;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const visibleNotifications = notifications.filter(n => n.visible);

  if (!visible || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.notificationContainer} ${styles[position]}`}>
      {/* Notification List */}
      <div className={styles.notificationList}>
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`${styles.notification} ${getSeverityClassName(notification.severity)}`}
            onClick={() => handleErrorClick(notification)}
            role="alert"
            aria-live={notification.severity === ErrorSeverity.CRITICAL || notification.severity === ErrorSeverity.HIGH ? 'assertive' : 'polite'}
          >
            <div className={styles.notificationHeader}>
              <span className={styles.notificationIcon}>
                {getSeverityIcon(notification.severity)}
              </span>
              <span className={styles.notificationCategory}>
                {notification.category?.replace('_', ' ')?.toUpperCase() || 'ERROR'}
              </span>
              <button
                className={styles.dismissBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss(notification.id);
                }}
                aria-label={`Dismiss ${notification.id} error`}
              >
                ✕
              </button>
            </div>

            <div className={styles.notificationContent}>
              <div className={styles.notificationMessage}>
                {notification.message}
              </div>

              {notification.context && (
                <div className={styles.notificationContext}>
                  Component: {notification.context.componentName || 'Unknown'}
                </div>
              )}

              <div className={styles.notificationTime}>
                {formatTime(notification.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Dismiss All Button */}
        {visibleNotifications.length > 1 && (
          <button
            className={styles.dismissAllBtn}
            onClick={handleDismissAll}
          >
            Dismiss All ({visibleNotifications.length})
          </button>
        )}
      </div>

      {/* Detailed Error View Modal */}
      {showDetailedView && (
        <div className={styles.detailModal}>
          <div className={styles.detailModalContent}>
            <div className={styles.detailModalHeader}>
              <h3>Error Details</h3>
              <button
                className={styles.closeModalBtn}
                onClick={() => setShowDetailedView(false)}
              >
                ✕
              </button>
            </div>

            {/* Error List */}
            <div className={styles.errorList}>
              {notifications.slice(0, 10).map((error) => (
                <div key={error.id} className={styles.errorDetail}>
                  <div className={styles.errorDetailHeader}>
                    <span className={styles.errorCategory}>
                      {getSeverityIcon(error.severity)} {error.category?.toUpperCase()}
                    </span>
                    <span className={styles.errorTime}>
                      {formatTime(error.timestamp)}
                    </span>
                  </div>

                  <div className={styles.errorMessage}>
                    <strong>{error.message}</strong>
                  </div>

                  {error.details && (
                    <div className={styles.errorDetails}>
                      <h4>Details:</h4>
                      <pre>{JSON.stringify(error.details, null, 2)}</pre>
                    </div>
                  )}

                  {error.context && (
                    <div className={styles.errorContext}>
                      <h4>Context:</h4>
                      <pre>{JSON.stringify(error.context, null, 2)}</pre>
                    </div>
                  )}

                  {error.stack && (
                    <div className={styles.errorStack}>
                      <h4>Stack Trace:</h4>
                      <pre>{error.stack}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.detailModalActions}>
              <button
                className={styles.exportBtn}
                onClick={() => {
                  const errorData = JSON.stringify(notifications.slice(0, 10), null, 2);
                  const blob = new Blob([errorData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `error-log-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export Error Log
              </button>

              <button
                className={styles.clearLogBtn}
                onClick={() => {
                  errorLogger.clearLog();
                  setNotifications([]);
                  setShowDetailedView(false);
                }}
              >
                Clear Error Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ErrorNotification.propTypes = {
  visible: PropTypes.bool,
  maxNotifications: PropTypes.number,
  showDetails: PropTypes.bool,
  autoHideDelay: PropTypes.number,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  onClearAll: PropTypes.func,
  onErrorClick: PropTypes.func
};

export default ErrorNotification;