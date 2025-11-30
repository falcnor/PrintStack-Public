import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { useKeyboardNavigation, useScreenReader, useFocusTrap } from '../../hooks/useKeyboardNavigation';

import styles from './Accessibility.module.css';

/**
 * Screen reader announcement component
 * @param {Object} props - Component props
 * @param {string} props.message - Announcement message
 * @param {string} props.priority - Announcement priority ('polite' or 'assertive')
 * @param {number} props.timeout - Auto-clear timeout
 * @param {boolean} props.live - Whether to use live region
 */
const ScreenReaderAnnouncement = ({
  message = '',
  priority = 'polite',
  timeout = 5000,
  live = true
}) => {
  const announcementId = useRef(`announcement-${Date.now()}`);

  useEffect(() => {
    if (!message) return;

    const element = document.getElementById(announcementId.current);
    if (element) {
      // Clear and set new message
      element.textContent = '';

      // Force screen reader to recognize change
      setTimeout(() => {
        element.textContent = message;
      }, 50);

      // Auto-clear if enabled
      if (timeout > 0) {
        const timer = setTimeout(() => {
          element.textContent = '';
        }, timeout);

        return () => clearTimeout(timer);
      }
    }
  }, [message, timeout]);

  return (
    <div
      id={announcementId.current}
      className={styles.screenReaderAnnouncement}
      aria-live={live ? priority : 'off'}
      aria-atomic="true"
      aria-hidden={!live}
    />
  );
};

/**
 * Skip to main content link component
 * @param {Object} props - Component props
 */
const SkipLink = ({ mainContentId = 'main-content' }) => (
  <a
    href={`#${mainContentId}`}
    className={styles.skipLink}
  >
    Skip to main content
  </a>
);

/**
 * Keyboard shortcuts help component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether help modal is open
 * @param {Function} props.onClose - Close handler
 * @param {Object} props.shortcuts - Custom shortcuts to display
 */
const KeyboardHelp = ({ isOpen, onClose, shortcuts = {} }) => {
  const modalRef = useRef(null);
  const { announceNavigation, announceErrors } = useScreenReader();

  // Default shortcuts
  const defaultShortcuts = {
    Navigation: [
      { key: 'Ctrl + /', description: 'Show keyboard shortcuts help' },
      { key: 'Tab', description: 'Navigate to next element' },
      { key: 'Shift + Tab', description: 'Navigate to previous element' },
      { key: 'Escape', description: 'Close modal or cancel action' }
    ],
    Global: [
      { key: 'Ctrl + K', description: 'Focus search bar' },
      { key: 'Ctrl + N', description: 'Create new item' },
      { key: 'Ctrl + S', description: 'Save current form' },
      { key: 'Ctrl + F', description: 'Open search' },
      { key: 'Ctrl + R', description: 'Refresh data' }
    ],
    Navigation: [
      { key: 'Alt + 1', description: 'Go to Filaments section' },
      { key: 'Alt + 2', description: 'Go to Models section' },
      { key: 'Alt + 3', description: 'Go to Prints section' },
      { key: 'Alt + 4', description: 'Go to Dashboard' }
    ],
    'Table Navigation': [
      { key: 'Arrow Keys', description: 'Navigate table cells' },
      { key: 'Enter', description: 'Activate selected row' },
      { key: 'Space', description: 'Select current row' },
      { key: 'Ctrl + A', description: 'Select all rows' }
    ]
  };

  const allShortcuts = { ...defaultShortcuts, ...shortcuts };

  useFocusTrap(modalRef.current, isOpen);

  const handleClose = useCallback(() => {
    onClose();
    announceNavigation('Keyboard shortcuts help closed');
  }, [onClose, announceNavigation]);

  useEffect(() => {
    if (isOpen) {
      announceNavigation('Keyboard shortcuts help opened');
    }
  }, [isOpen, announceNavigation]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        ref={modalRef}
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
          <button
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Close keyboard shortcuts help"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.shortcutsGrid}>
            {Object.entries(allShortcuts).map(([category, items]) => (
              <div key={category} className={styles.shortcutCategory}>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <ul className={styles.shortcutList}>
                  {items.map((item, index) => (
                    <li key={index} className={styles.shortcutItem}>
                      <kbd className={styles.shortcutKey}>{item.key}</kbd>
                      <span className={styles.shortcutDescription}>{item.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={handleClose} className={styles.primaryButton}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Focus management component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {boolean} props.trapFocus - Whether to trap focus
 * @param {Function} props.onEscape - Escape key handler
 */
const FocusManager = ({ children, trapFocus = false, onEscape }) => {
  const containerRef = useRef(null);
  const [isActive, setIsActive] = useState(false);

  const { saveFocus, restoreFocus, focusFirst } = useFocusTrap(
    containerRef.current,
    trapFocus && isActive
  );

  useEffect(() => {
    if (trapFocus) {
      setIsActive(true);
      saveFocus();
      focusFirst();
    }

    return () => {
      if (trapFocus) {
        restoreFocus();
        setIsActive(false);
      }
    };
  }, [trapFocus, saveFocus, restoreFocus, focusFirst]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onEscape) {
      onEscape(e);
    }
  }, [onEscape]);

  return (
    <div
      ref={containerRef}
      className={styles.focusContainer}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

/**
 * ARIA live region component
 * @param {Object} props - Component props
 * @param {string} props.politeness - Politeness level ('polite', 'assertive', 'off')
 * @param {boolean} props.atomic - Whether updates are atomic
 * @param {boolean} props.relevant - Whether region is relevant
 */
const LiveRegion = ({ politeness = 'polite', atomic = false, relevant = true }) => (
  <div
    className={styles.liveRegion}
    aria-live={politeness}
    aria-atomic={atomic}
    aria-relevant={relevant ? 'additions text' : 'additions'}
  />
);

/**
 * Progress indicator with accessibility
 * @param {Object} props - Component props
 * @param {number} props.value - Current progress value
 * @param {number} props.max - Maximum value
 * @param {string} props.label - Accessibility label
 * @param {boolean} props.showText - Whether to show percentage text
 */
const ProgressBar = ({ value, max = 100, label, showText = true }) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={styles.progressContainer} role="progressbar" aria-valuenow={value} aria-valuemax={max} aria-valuemin={0}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showText && (
        <span className={styles.progressText}>{percentage}%</span>
      )}
      <span className={styles.screenReaderOnly}>
        {label}: {percentage}% complete
      </span>
    </div>
  );
};

/**
 * Loading spinner with accessibility
 * @param {Object} props - Component props
 * @param {string} props.label - Accessibility label
 * @param {boolean} props.isVisible - Whether spinner is visible
 */
const LoadingSpinner = ({ label = 'Loading content', isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.loadingSpinner} role="status" aria-live="polite">
      <div className={styles.spinnerIcon} aria-hidden="true" />
      <span className={styles.screenReaderOnly}>{label}</span>
    </div>
  );
};

/**
 * Accessible button with loading state
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Loading state
 * @param {string} props.loadingText - Text to show when loading
 * @param {string} props.ariaLabel - ARIA label
 */
const AccessibleButton = ({
  children,
  loading = false,
  loadingText = 'Loading...',
  ariaLabel,
  disabled,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    aria-disabled={disabled || loading}
    aria-live={loading ? 'polite' : 'off'}
    aria-label={ariaLabel || (loading ? loadingText : undefined)}
  >
    {loading ? (
      <>
        <span className={styles.buttonSpinner} aria-hidden="true" />
        <span className={styles.buttonLoadingText}>{loadingText}</span>
      </>
    ) : (
      children
    )}
  </button>
);

/**
 * Accessible form field with validation
 * @param {Object} props - Component props
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {string} props.help - Help text
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.id - Field ID
 */
const AccessibleFormField = ({
  label,
  error,
  help,
  required = false,
  id,
  children
}) => {
  const fieldId = id || `field-${Date.now()}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  return (
    <div className={styles.formField}>
      <label htmlFor={fieldId} className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.requiredIndicator} aria-label="required">*</span>}
      </label>

      {React.cloneElement(children, {
        id: fieldId,
        'aria-invalid': error ? 'true' : 'false',
        'aria-describedby': [
          error ? errorId : null,
          help ? helpId : null
        ].filter(Boolean).join(' ')
      })}

      {error && (
        <div id={errorId} className={styles.fieldError} role="alert" aria-live="polite">
          {error}
        </div>
      )}

      {help && (
        <div id={helpId} className={styles.fieldHelp}>
          {help}
        </div>
      )}
    </div>
  );
};

// PropTypes
ScreenReaderAnnouncement.propTypes = {
  message: PropTypes.string,
  priority: PropTypes.oneOf(['polite', 'assertive']),
  timeout: PropTypes.number,
  live: PropTypes.bool
};

SkipLink.propTypes = {
  mainContentId: PropTypes.string
};

KeyboardHelp.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shortcuts: PropTypes.object
};

FocusManager.propTypes = {
  children: PropTypes.node,
  trapFocus: PropTypes.bool,
  onEscape: PropTypes.func
};

LiveRegion.propTypes = {
  politeness: PropTypes.oneOf(['polite', 'assertive', 'off']),
  atomic: PropTypes.bool,
  relevant: PropTypes.bool
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  label: PropTypes.string,
  showText: PropTypes.bool
};

LoadingSpinner.propTypes = {
  label: PropTypes.string,
  isVisible: PropTypes.bool
};

AccessibleButton.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool
};

AccessibleFormField.propTypes = {
  label: PropTypes.string.isRequired,
  error: PropTypes.string,
  help: PropTypes.string,
  required: PropTypes.bool,
  id: PropTypes.string,
  children: PropTypes.node.isRequired
};

export {
  ScreenReaderAnnouncement,
  SkipLink,
  KeyboardHelp,
  FocusManager,
  LiveRegion,
  ProgressBar,
  LoadingSpinner,
  AccessibleButton,
  AccessibleFormField
};

export default {
  ScreenReaderAnnouncement,
  SkipLink,
  KeyboardHelp,
  FocusManager,
  LiveRegion,
  ProgressBar,
  LoadingSpinner,
  AccessibleButton,
  AccessibleFormField
};