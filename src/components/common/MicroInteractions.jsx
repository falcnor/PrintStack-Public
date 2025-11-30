import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

import { useMicroInteractions } from '../../hooks/useAnimations';

import styles from './MicroInteractions.module.css';

/**
 * Ripple effect component for button clicks
 * @param {Object} props - Component props
 * @param {boolean} props.active - Whether ripple is active
 * @param {number} props.x - Click X position
 * @param {number} props.y - Click Y position
 * @param {number} props.size - Ripple size
 */
const RippleEffect = ({ active, x, y, size }) => {
  if (!active) return null;

  return (
    <span
      className={styles.ripple}
      style={{
        left: x,
        top: y,
        width: size,
        height: size
      }}
    />
  );
};

/**
 * Enhanced button with micro-interactions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.variant - Button variant ('primary', 'secondary', 'danger', 'ghost')
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.enableRipple - Enable ripple effect
 * @param {string} props.size - Button size ('small', 'medium', 'large')
 */
const EnhancedButton = ({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  enableRipple = true,
  size = 'medium',
  ...props
}) => {
  const buttonRef = useRef(null);
  const [ripples, setRipples] = useState([]);
  const [isPressed, setIsPressed] = useState(false);

  const { triggerInteraction } = useMicroInteractions({
    enableVisualFeedback: true
  });

  const handleClick = useCallback((e) => {
    if (loading || disabled) return;

    // Add ripple effect
    if (enableRipple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;

      const ripple = {
        id: Date.now(),
        x: x - size / 2,
        y: y - size / 2,
        size
      };

      setRipples(prev => [...prev, ripple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 600);
    }

    // Trigger interaction feedback
    triggerInteraction('press');

    // Call original click handler
    if (onClick) {
      onClick(e);
    }
  }, [loading, disabled, onClick, enableRipple, triggerInteraction]);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => setIsPressed(false);

  const buttonClass = [
    styles.enhancedButton,
    styles[variant],
    styles[size],
    loading && styles.loading,
    disabled && styles.disabled,
    isPressed && styles.pressed
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={buttonRef}
      className={buttonClass}
      disabled={disabled || loading}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span className={styles.buttonContent}>
        {loading && <span className={styles.buttonSpinner} aria-hidden="true" />}
        {children}
      </span>
      {enableRipple && ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          active={true}
          x={ripple.x}
          y={ripple.y}
          size={ripple.size}
        />
      ))}
    </button>
  );
};

/**
 * Interactive card component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} props.hoverable - Enable hover effects
 * @param {boolean} props.clickable - Make card clickable
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.selected - Selected state
 * @param {string} props.variant - Card variant
 */
const InteractiveCard = ({
  children,
  hoverable = true,
  clickable = false,
  onClick,
  selected = false,
  variant = 'default',
  ...props
}) => {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback((e) => {
    if (clickable && onClick) {
      onClick(e);
    }
  }, [clickable, onClick]);

  const handleMouseDown = () => setIsPressed(true);
  const handleMouseUp = () => setIsPressed(false);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };
  const handleMouseEnter = () => setIsHovered(true);

  const cardClass = [
    styles.interactiveCard,
    styles[variant],
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    selected && styles.selected,
    isHovered && styles.hovered,
    isPressed && styles.pressed
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cardRef}
      className={cardClass}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={clickable ? 'button' : 'article'}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Animated counter component
 * @param {Object} props - Component props
 * @param {number} props.value - Target value
 * @param {number} props.duration - Animation duration
 * @param {string} props.prefix - Value prefix
 * @param {string} props.suffix - Value suffix
 * @param {boolean} props.animate - Whether to animate
 */
const AnimatedCounter = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
  animate = true
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (!animate || previousValueRef.current === value) {
      setDisplayValue(value);
      return;
    }

    const startValue = previousValueRef.current;
    const difference = value - startValue;
    const startTime = Date.now();

    const animateValue = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (difference * easeOutQuart);

      setDisplayValue(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      } else {
        previousValueRef.current = value;
      }
    };

    requestAnimationFrame(animateValue);
  }, [value, duration, animate]);

  return (
    <span className={styles.animatedCounter}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
};

/**
 * Success/feedback notification component
 * @param {Object} props - Component props
 * @param {string} props.type - Notification type ('success', 'error', 'warning', 'info')
 * @param {string} props.message - Notification message
 * @param {boolean} props.visible - Whether notification is visible
 * @param {Function} props.onClose - Close handler
 * @param {number} props.autoClose - Auto close time in ms
 */
const FeedbackNotification = ({
  type = 'info',
  message,
  visible = true,
  onClose,
  autoClose = 5000
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsVisible(visible);

    if (visible && autoClose > 0) {
      timeoutRef.current = setTimeout(() => {
        handleClose();
      }, autoClose);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, autoClose]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Auto-hide after animation
  useEffect(() => {
    if (!isVisible) {
      const removeTimeout = setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 300);

      return () => clearTimeout(removeTimeout);
    }
  }, [isVisible, onClose]);

  if (!visible) return null;

  const notificationClass = [
    styles.notification,
    styles[type],
    isVisible ? styles.visible : styles.hidden
  ].filter(Boolean).join(' ');

  return (
    <div
      className={notificationClass}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.notificationIcon} aria-hidden="true">
        {type === 'success' && '✓'}
        {type === 'error' && '✕'}
        {type === 'warning' && '⚠'}
        {type === 'info' && 'ℹ'}
      </div>
      <div className={styles.notificationMessage}>
        {message}
      </div>
      {onClose && (
        <button
          onClick={handleClose}
          className={styles.notificationClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};

/**
 * Progress ring component
 * @param {Object} props - Component props
 * @param {number} props.progress - Progress value (0-100)
 * @param {number} props.size - Ring size in pixels
 * @param {number} props.strokeWidth - Stroke width
 * @param {string} props.strokeColor - Stroke color
 * @param {boolean} props.showPercentage - Show percentage text
 */
const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  strokeColor = '#007bff',
  showPercentage = true
}) => {
  const normalizedRadius = (size - strokeWidth) / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressRing} style={{ width: size, height: size }}>
      <svg
        height={size}
        width={size}
        className={styles.progressRingSvg}
      >
        <circle
          stroke="#e9ecef"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={strokeColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.35s' }}
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className={styles.progressRingCircle}
        />
      </svg>
      {showPercentage && (
        <div className={styles.progressRingText}>
          {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};

/**
 * Loading dots animation
 * @param {Object} props - Component props
 * @param {number} props.dots - Number of dots
 * @param {number} props.size - Dot size
 * @param {string} props.color - Dot color
 */
const LoadingDots = ({ dots = 3, size = 8, color = '#007bff' }) => (
  <div className={styles.loadingDots}>
    {Array.from({ length: dots }, (_, index) => (
      <div
        key={index}
        className={styles.loadingDot}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          animationDelay: `${index * 0.16}s`
        }}
      />
    ))}
  </div>
);

/**
 * Morphing icon component
 * @param {Object} props - Component props
 * @param {boolean} props.active - Active state
 * @param {React.ReactNode} props.inactiveIcon - Icon when inactive
 * @param {React.ReactNode} props.activeIcon - Icon when active
 * @param {string} props.size - Icon size
 */
const MorphingIcon = ({
  active,
  inactiveIcon,
  activeIcon,
  size = '24px'
}) => (
  <div
    className={styles.morphingIcon}
    style={{ width: size, height: size }}
  >
    <div className={`${styles.iconLayer} ${styles.inactive} ${active ? styles.hidden : styles.visible}`}>
      {inactiveIcon}
    </div>
    <div className={`${styles.iconLayer} ${styles.active} ${active ? styles.visible : styles.hidden}`}>
      {activeIcon}
    </div>
  </div>
);

// PropTypes
EnhancedButton.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  enableRipple: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

InteractiveCard.propTypes = {
  children: PropTypes.node,
  hoverable: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
  selected: PropTypes.bool,
  variant: PropTypes.string
};

AnimatedCounter.propTypes = {
  value: PropTypes.number.isRequired,
  duration: PropTypes.number,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  animate: PropTypes.bool
};

FeedbackNotification.propTypes = {
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  message: PropTypes.string,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  autoClose: PropTypes.number
};

ProgressRing.propTypes = {
  progress: PropTypes.number.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  strokeColor: PropTypes.string,
  showPercentage: PropTypes.bool
};

LoadingDots.propTypes = {
  dots: PropTypes.number,
  size: PropTypes.number,
  color: PropTypes.string
};

MorphingIcon.propTypes = {
  active: PropTypes.bool,
  inactiveIcon: PropTypes.node,
  activeIcon: PropTypes.node,
  size: PropTypes.string
};

export {
  EnhancedButton,
  InteractiveCard,
  AnimatedCounter,
  FeedbackNotification,
  ProgressRing,
  LoadingDots,
  MorphingIcon
};

export default {
  EnhancedButton,
  InteractiveCard,
  AnimatedCounter,
  FeedbackNotification,
  ProgressRing,
  LoadingDots,
  MorphingIcon
};