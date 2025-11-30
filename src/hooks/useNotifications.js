import { useState, useCallback, useEffect, useRef } from 'react';

import { generateId } from '../utils/dataUtils.js';

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Custom hook for notification management
 * @param {number} maxNotifications - Maximum number of notifications to keep
 * @param {number} defaultDuration - Default auto-dismiss duration in milliseconds
 * @returns {Object} Notification utilities and state
 */
export const useNotifications = (maxNotifications = 5, defaultDuration = 5000) => {
  const [notifications, setNotifications] = useState([]);
  const notificationRefs = useRef(new Map());

  /**
   * Add a notification
   */
  const notify = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const {
      duration = defaultDuration,
      autoDismiss = true,
      persistent = false,
      action = null,
      title = null,
      icon = null
    } = options;

    const notification = {
      id: generateId(),
      message,
      type,
      title,
      icon,
      action,
      persistent,
      autoDismiss,
      timestamp: new Date(),
      duration
    };

    setNotifications(prev => {
      const updated = [...prev, notification];

      // Limit notifications to maxNotifications
      if (updated.length > maxNotifications) {
        return updated.slice(-maxNotifications);
      }

      return updated;
    });

    // Set auto-dismiss
    if (autoDismiss && duration > 0) {
      const timeoutId = setTimeout(() => {
        dismiss(notification.id);
      }, duration);

      notificationRefs.current.set(notification.id, timeoutId);
    }

    return notification.id;
  }, [defaultDuration, maxNotifications]);

  /**
   * Dismiss a notification
   */
  const dismiss = useCallback((id) => {
    // Clear auto-dismiss timeout
    const timeoutId = notificationRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationRefs.current.delete(id);
    }

    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Dismiss all notifications
   */
  const dismissAll = useCallback(() => {
    // Clear all timeouts
    notificationRefs.current.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    notificationRefs.current.clear();

    setNotifications([]);
  }, []);

  /**
   * Dismiss notifications by type
   */
  const dismissByType = useCallback((type) => {
    setNotifications(prev => {
      return prev.filter(notification => {
        if (notification.type === type) {
          const timeoutId = notificationRefs.current.get(notification.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            notificationRefs.current.delete(notification.id);
          }
          return false;
        }
        return true;
      });
    });
  }, []);

  /**
   * Convenience methods for different notification types
   */
  const success = useCallback((message, options = {}) => {
    return notify(message, NOTIFICATION_TYPES.SUCCESS, options);
  }, [notify]);

  const error = useCallback((message, options = {}) => {
    return notify(message, NOTIFICATION_TYPES.ERROR, { ...options, persistent: true, autoDismiss: false });
  }, [notify]);

  const warning = useCallback((message, options = {}) => {
    return notify(message, NOTIFICATION_TYPES.WARNING, options);
  }, [notify]);

  const info = useCallback((message, options = {}) => {
    return notify(message, NOTIFICATION_TYPES.INFO, options);
  }, [notify]);

  /**
   * Clear timeouts on unmount
   */
  useEffect(() => {
    return () => {
      notificationRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      notificationRefs.current.clear();
    };
  }, []);

  /**
   * Get notification count by type
   */
  const getCountByType = useCallback((type) => {
    return notifications.filter(notification => notification.type === type).length;
  }, [notifications]);

  /**
   * Check if there are any notifications
   */
  const hasNotifications = notifications.length > 0;

  /**
   * Get most recent notification
   */
  const getLastNotification = () => {
    return notifications[notifications.length - 1] || null;
  };

  /**
   * Pause/resume auto-dismiss for a notification
   */
  const pauseAutoDismiss = useCallback((id) => {
    const timeoutId = notificationRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      notificationRefs.current.delete(id);
    }
  }, []);

  const resumeAutoDismiss = useCallback((id, duration = defaultDuration) => {
    if (notificationRefs.current.has(id)) return;

    const timeoutId = setTimeout(() => {
      dismiss(id);
    }, duration);

    notificationRefs.current.set(id, timeoutId);
  }, [defaultDuration, dismiss]);

  return {
    // State
    notifications,
    hasNotifications,

    // Actions
    notify,
    dismiss,
    dismissAll,
    dismissByType,

    // Convenience methods
    success,
    error,
    warning,
    info,

    // Utilities
    getCountByType,
    getLastNotification,
    pauseAutoDismiss,
    resumeAutoDismiss
  };
};

/**
 * Hook for toast notifications (simplified version)
 */
export const useToast = () => {
  const { notifications, notify, dismiss, success, error, warning, info } = useNotifications(3, 3000);

  return {
    toasts: notifications,
    toast: notify,
    dismiss,
    success,
    error,
    warning,
    info,
    hasToasts: notifications.length > 0
  };
};