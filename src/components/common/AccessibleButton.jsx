import React, { forwardRef, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { AriaUtils, announcer } from '../../utils/accessibility';

/**
 * Accessible Button Component
 * Provides comprehensive ARIA support and keyboard navigation
 */
const AccessibleButton = forwardRef(({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  ariaLabel,
  ariaDescribedBy,
  ariaPressed,
  ariaExpanded,
  ariaControls,
  className = '',
  tabIndex = 0,
  type = 'button',
  announcement,
  confirmAction = false,
  confirmMessage = 'Are you sure?',
  ...props
}, ref) => {
  const buttonRef = useRef(ref);
  const [isConfirming, setIsConfirming] = useState(false);

  // Generate IDs if needed
  const buttonId = props.id || AriaUtils.generateId('button');

  // Set up ARIA attributes
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Set button type if not specified
    if (type && !button.hasAttribute('type')) {
      button.setAttribute('type', type);
    }

    // Set ARIA label
    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel);
    }

    // Set ARIA described by
    if (ariaDescribedBy) {
      AriaUtils.setupRelationship(button, 'describedby', ariaDescribedBy);
    }

    // Set ARIA pressed state
    if (typeof ariaPressed === 'boolean') {
      AriaUtils.setPressed(button, ariaPressed);
    }

    // Set ARIA expanded state
    if (typeof ariaExpanded === 'boolean') {
      AriaUtils.setExpanded(button, ariaExpanded);
    }

    // Set ARIA controls
    if (ariaControls) {
      AriaUtils.setupRelationship(button, 'controls', ariaControls);
    }

    // Set disabled state
    if (disabled || loading) {
      AriaUtils.setDisabled(button, true);
      button.setAttribute('aria-busy', loading ? 'true' : 'false');
    } else {
      AriaUtils.setDisabled(button, false);
      button.removeAttribute('aria-busy');
    }

  }, [ariaLabel, ariaDescribedBy, ariaPressed, ariaExpanded, ariaControls, disabled, loading, type]);

  // Handle click events with confirmation
  const handleClick = (event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }

    if (confirmAction && !isConfirming) {
      // Show confirmation message
      setIsConfirming(true);
      announcer.announce(`Confirmation required: ${confirmMessage}`);

      // Auto-hide confirmation after 3 seconds
      setTimeout(() => {
        setIsConfirming(false);
        announcer.announce('Confirmation cancelled');
      }, 3000);

      event.preventDefault();
      return;
    }

    if (announcement) {
      announcer.announce(announcement);
    }

    // Reset confirmation state after action
    if (isConfirming) {
      setIsConfirming(false);
    }

    if (onClick) {
      onClick(event);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (event) => {
    // Handle Enter and Space for button-like behavior
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && !loading) {
      event.preventDefault();
      handleClick(event);
    }

    // Handle Escape to cancel confirmation
    if (event.key === 'Escape' && isConfirming) {
      setIsConfirming(false);
      announcer.announce('Confirmation cancelled');
    }
  };

  // Determine variant classes
  const getVariantClass = () => {
    const variants = {
      primary: 'button--primary',
      secondary: 'button--secondary',
      danger: 'button--danger',
      warning: 'button--warning',
      success: 'button--success',
      ghost: 'button--ghost',
      link: 'button--link'
    };

    return variants[variant] || variants.primary;
  };

  // Determine size classes
  const getSizeClass = () => {
    const sizes = {
      small: 'button--small',
      medium: 'button--medium',
      large: 'button--large'
    };

    return sizes[size] || sizes.medium;
  };

  // Build CSS classes
  const buttonClassName = [
    'button',
    getVariantClass(),
    getSizeClass(),
    (disabled || loading) ? 'button--disabled' : '',
    loading ? 'button--loading' : '',
    isConfirming ? 'button--confirming' : '',
    className
  ].filter(Boolean).join(' ');

  // Determine aria-label for screen readers
  const getAriaLabel = () => {
    if (isConfirming) {
      return `${ariaLabel || 'Button'}: ${confirmMessage} (Press Enter to confirm, Escape to cancel)`;
    }

    if (loading) {
      return `${ariaLabel || 'Button'}: Loading`;
    }

    if (ariaLabel) {
      return ariaLabel;
    }

    return null;
  };

  return (
    <button
      ref={buttonRef}
      id={buttonId}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-label={getAriaLabel()}
      aria-busy={loading ? 'true' : 'false'}
      tabIndex={disabled ? -1 : tabIndex}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {/* Loading indicator */}
      {loading && (
        <span
          className="button__spinner"
          aria-hidden="true"
          focusable="false"
        >
          <span className="sr-only">Loading</span>
        </span>
      )}

      {/* Confirmation indicator */}
      {isConfirming && (
        <span
          className="button__confirm-icon"
          aria-hidden="true"
          focusable="false"
          title="Press Enter to confirm"
        >
          ❗
        </span>
      )}

      {/* Button content */}
      <span className="button__content">
        {children}
      </span>

      {/* Loading text for screen readers */}
      {loading && (
        <span className="sr-only" aria-live="polite">
          Loading in progress
        </span>
      )}

      {/* Confirmation text for screen readers */}
      {isConfirming && (
        <span className="sr-only" aria-live="assertive">
          {confirmMessage} Press Enter to confirm or Escape to cancel
        </span>
      )}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

AccessibleButton.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'warning', 'success', 'ghost', 'link']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  ariaLabel: PropTypes.string,
  ariaDescribedBy: PropTypes.string,
  ariaPressed: PropTypes.bool,
  ariaExpanded: PropTypes.bool,
  ariaControls: PropTypes.string,
  className: PropTypes.string,
  tabIndex: PropTypes.number,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  announcement: PropTypes.string,
  confirmAction: PropTypes.bool,
  confirmMessage: PropTypes.string
};

export default AccessibleButton;