import { useEffect, useRef, useCallback } from 'react';
import { globalAnnouncer, ScreenReaderAnnouncer } from '../utils/screenReaderAnnouncements';

/**
 * Custom Hook for Screen Reader Announcements
 * Integrates with React component lifecycles and state changes
 */
export const useAnnouncements = (options = {}) => {
  const {
    componentId,
    enabled = true,
    announceMount = false,
    announceUnmount = false,
    announceStateChanges = true,
    customRegion = 'polite'
  } = options;

  const announcerRef = useRef(null);
  const previousStateRef = useRef({});
  const componentStateRef = useRef(new Map());

  // Initialize announcer if custom region is requested
  useEffect(() => {
    if (customRegion !== 'polite' && customRegion !== 'assertive' && customRegion !== 'critical') {
      announcerRef.current = new ScreenReaderAnnouncer();
      announcerRef.current.createLiveRegion({
        id: customRegion,
        politeness: 'polite',
        priority: 1,
        description: `Custom announcements for ${componentId || 'component'}`
      });
    }

    return () => {
      if (announcerRef.current) {
        announcerRef.current.cleanup();
      }
    };
  }, [customRegion, componentId]);

  // Announce component lifecycle events
  useEffect(() => {
    if (enabled && announceMount && componentId) {
      const message = `${componentId} component loaded`;
      (announcerRef.current || globalAnnouncer)?.announce(message, {
        region: customRegion,
        type: 'component_lifecycle'
      });
    }
  }, [enabled, announceMount, componentId, customRegion]);

  useEffect(() => {
    return () => {
      if (enabled && announceUnmount && componentId) {
        const message = `${componentId} component unloaded`;
        (announcerRef.current || globalAnnouncer)?.announce(message, {
          region: customRegion,
          type: 'component_lifecycle'
        });
      }
    };
  }, [enabled, announceUnmount, componentId, customRegion]);

  // Generic announcement function
  const announce = useCallback((message, announceOptions = {}) => {
    if (!enabled) return;

    const finalOptions = {
      region: customRegion,
      context: { componentId, ...announceOptions.context },
      ...announceOptions
    };

    (announcerRef.current || globalAnnouncer)?.announce(message, finalOptions);
  }, [enabled, customRegion, componentId]);

  // State change announcement
  const announceStateChange = useCallback((stateName, newValue, previousValue = null) => {
    if (!enabled || !announceStateChanges || !componentId) return;

    const prevValue = previousValue !== null ? previousValue : previousStateRef.current[stateName];

    // Only announce if value actually changed
    if (prevValue !== newValue) {
      const message = `${componentId} ${stateName} changed from ${prevValue || 'null'} to ${newValue}`;

      announce(message, {
        type: 'state_change',
        context: {
          stateName,
          previousValue: prevValue,
          newValue
        }
      });

      previousStateRef.current[stateName] = prevValue;
    }
  }, [enabled, announceStateChanges, componentId, announce]);

  // Automatic state tracking
  const trackState = useCallback((stateName, stateValue, options = {}) => {
    if (!enabled) return;

    const { announceOnChange = true, customFormatter = null } = options;
    const previousValue = componentStateRef.current.get(stateName);

    if (announceOnChange && previousValue !== stateValue) {
      let message;

      if (customFormatter) {
        message = customFormatter(stateValue, previousValue, stateName, componentId);
      } else {
        message = customFormatter || `${componentId} ${stateName} changed to ${stateValue}`;
      }

      announce(message, {
        type: 'state_change',
        context: {
          stateName,
          previousValue,
          newValue: stateValue
        }
      });
    }

    componentStateRef.current.set(stateName, stateValue);
  }, [enabled, announce, componentId]);

  // List change announcements
  const announceListChange = useCallback((action, itemType, index, itemName = null) => {
    if (!enabled || !componentId) return;

    const message = itemName
      ? `${itemName} ${action} ${itemType} list at position ${index + 1}`
      : `Item ${action} ${itemType} list at position ${index + 1}`;

    announce(message, {
      type: 'list_change',
      context: {
        action,
        itemType,
        index,
        itemName
      }
    });
  }, [enabled, announce, componentId]);

  // Data operation announcements
  const announceDataOperation = useCallback((operation, itemType, count, success = true) => {
    if (!enabled || !componentId) return;

    const suffix = success ? 'successfully' : 'failed';
    const message = `${count} ${itemType} ${operation} ${suffix}`;

    announce(message, {
      priority: !success ? 3 : 1,
      region: !success ? 'assertive' : customRegion,
      type: success ? 'data_operation' : 'error',
      context: {
        operation,
        itemType,
        count,
        success
      }
    });
  }, [enabled, announce, componentId, customRegion]);

  // Form validation announcements
  const announceFormValidation = useCallback((fieldName, validationMessage, isError = true) => {
    if (!enabled || !componentId) return;

    const message = isError
      ? `Form error in ${fieldName}: ${validationMessage}`
      : `${fieldName} is valid: ${validationMessage}`;

    announce(message, {
      region: isError ? 'assertive' : 'polite',
      priority: isError ? 2 : 1,
      type: isError ? 'form_error' : 'form_success',
      context: {
        fieldName,
        validationMessage,
        isError
      }
    });
  }, [enabled, announce, componentId]);

  // Navigation announcements
  const announceNavigation = useCallback((destination, description = null) => {
    if (!enabled) return;

    let message = `Navigated to ${destination}`;
    if (description) {
      message += `, ${description}`;
    }

    announce(message, {
      region: 'navigation',
      type: 'navigation',
      unique: true,
      context: {
        destination,
        description
      }
    });
  }, [enabled, announce]);

  // Progress announcements
  const announceProgress = useCallback((current, total, description = 'Process') => {
    if (!enabled || !componentId) return;

    const percentage = Math.round((current / total) * 100);
    const message = `${description}: ${current} of ${total} complete, ${percentage}%`;

    // Only announce significant milestones
    if (percentage % 5 === 0 || current === total) {
      announce(message, {
        region: 'status',
        type: 'progress',
        unique: true,
        context: {
          current,
          total,
          percentage,
          description
        }
      });
    }
  }, [enabled, announce, componentId]);

  // Error announcements
  const announceError = useCallback((error, context = null) => {
    if (!enabled) return;

    const message = context
      ? `Error in ${context}: ${error}`
      : `Error: ${error}`;

    announce(message, {
      region: 'assertive',
      priority: 3,
      type: 'error',
      context: {
        error,
        context
      }
    });
  }, [enabled, announce]);

  // Success announcements
  const announceSuccess = useCallback((message, context = null) => {
    if (!enabled) return;

    const fullMessage = context
      ? `${context}: ${message}`
      : message;

    announce(fullMessage, {
      type: 'success',
      context: {
        message,
        context
      }
    });
  }, [enabled, announce]);

  // Get component statistics
  const getStats = useCallback(() => {
    return {
      componentId,
      trackedStates: Array.from(componentStateRef.current.keys()),
      previousStates: { ...previousStateRef.current },
      announcerActive: enabled
    };
  }, [componentId, enabled]);

  return {
    // Core announcement function
    announce,

    // Specialized announcements
    announceStateChange,
    announceListChange,
    announceDataOperation,
    announceFormValidation,
    announceNavigation,
    announceProgress,
    announceError,
    announceSuccess,

    // State tracking
    trackState,

    // Utilities
    getStats,

    // Direct access to announcer (if needed)
    announcer: announcerRef.current || globalAnnouncer
  };
};

/**
 * Hook for automatic list announcements
 */
export const useListAnnouncements = (listName, items, options = {}) => {
  const { announceListChange, announceDataOperation } = useAnnouncements({
    componentId: listName,
    ...options
  });

  const prevItemsRef = useRef([]);

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const currentItems = items || [];

    // Detect added items
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i];
      const wasPresent = prevItems.some(item =>
        getItemId(item) === getItemId(currentItem)
      );

      if (!wasPresent) {
        announceListChange('added', listName, i, getItemName(currentItem));
      }
    }

    // Detect removed items
    for (let i = 0; i < prevItems.length; i++) {
      const prevItem = prevItems[i];
      const isStillPresent = currentItems.some(item =>
        getItemId(item) === getItemId(prevItem)
      );

      if (!isStillPresent) {
        announceListChange('removed', listName, i, getItemName(prevItem));
      }
    }

    prevItemsRef.current = [...currentItems];
  }, [items, listName, announceListChange]);

  const getItemId = (item) => {
    return item?.id || item?.uuid || JSON.stringify(item);
  };

  const getItemName = (item) => {
    return item?.name || item?.title || item?.label || getItemId(item);
  };
};

/**
 * Hook for form announcements
 */
export const useFormAnnouncements = (formId, options = {}) => {
  const { announceFormValidation, announceSuccess, announceError } = useAnnouncements({
    componentId: `${formId}-form`,
    ...options
  });

  const announceFieldValidation = useCallback((fieldName, isValid, message) => {
    announceFormValidation(fieldName, message, !isValid);
  }, [announceFormValidation]);

  const announceFormSubmit = useCallback((success, message) => {
    if (success) {
      announceSuccess(message || 'Form submitted successfully', 'Form submission');
    } else {
      announceError(message || 'Form submission failed', 'Form submission');
    }
  }, [announceSuccess, announceError]);

  const announceFormReset = useCallback(() => {
    announceSuccess('Form reset successfully', 'Form action');
  }, [announceSuccess]);

  return {
    announceFieldValidation,
    announceFormSubmit,
    announceFormReset
  };
};

/**
 * Hook for async operation announcements
 */
export const useAsyncAnnouncements = (operationId, options = {}) => {
  const { announceProgress, announceSuccess, announceError } = useAnnouncements({
    componentId: `${operationId}-operation`,
    ...options
  });

  const announceOperationStart = useCallback((description, totalSteps = null) => {
    announceProgress(0, totalSteps || 1, description || 'Operation started');
  }, [announceProgress]);

  const announceOperationStep = useCallback((current, total, description) => {
    announceProgress(current, total, description);
  }, [announceProgress]);

  const announceOperationComplete = useCallback((success, message, result = null) => {
    if (success) {
      announceSuccess(
        message || 'Operation completed successfully',
        result ? `Found ${result.length || result} items` : null
      );
    } else {
      announceError(message || 'Operation failed');
    }
  }, [announceSuccess, announceError]);

  return {
    announceOperationStart,
    announceOperationStep,
    announceOperationComplete
  };
};

export default {
  useAnnouncements,
  useListAnnouncements,
  useFormAnnouncements,
  useAsyncAnnouncements
};