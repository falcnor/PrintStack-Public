import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing animations with performance monitoring
 * @param {Object} config - Animation configuration
 * @returns {Object} Animation control functions and state
 */
export const useAnimations = (config = {}) => {
  const {
    defaultDuration = 300,
    defaultEasing = 'ease-in-out',
    respectReducedMotion = true,
    enablePerformanceMonitoring = false
  } = config;

  const [isAnimating, setIsAnimating] = useState(false);
  const [animationState, setAnimationState] = useState('idle');
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  // Check if user prefers reduced motion
  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  /**
   * Execute an animation with performance monitoring
   * @param {Function} animationFunction - Animation function to execute
   * @param {Object} options - Animation options
   * @returns {Promise} Animation result
   */
  const animate = useCallback(async (animationFunction, options = {}) => {
    const {
      duration = defaultDuration,
      onStart,
      onComplete,
      onError
    } = options;

    if (respectReducedMotion && prefersReducedMotion()) {
      // Skip animation for users who prefer reduced motion
      animationFunction({ duration: 0, skipAnimation: true });
      return;
    }

    setIsAnimating(true);
    setAnimationState('starting');

    try {
      startTimeRef.current = performance.now();
      onStart?.();

      setAnimationState('running');

      // Execute animation
      await animationFunction({ duration, easing: defaultEasing });

      // Animation complete
      setAnimationState('completed');
      onComplete?.();

    } catch (error) {
      setAnimationState('error');
      onError?.(error);
      throw error;
    } finally {
      setIsAnimating(false);

      // Reset to idle after a short delay
      setTimeout(() => {
        setAnimationState('idle');
      }, 100);
    }
  }, [defaultDuration, defaultEasing, respectReducedMotion, prefersReducedMotion]);

  /**
   * Create a delay-based animation
   * @param {number} delay - Delay before animation completes
   * @param {Function} onUpdate - Update function during delay
   * @returns {Promise} Animation promise
   */
  const createDelayAnimation = useCallback((delay, onUpdate = null) => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const frame = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / delay, 1);

        onUpdate?.(progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      animationFrameRef.current = requestAnimationFrame(frame);
    });
  }, []);

  /**
   * Animate a number from start to end value
   * @param {number} start - Start value
   * @param {number} end - End value
   * @param {number} duration - Animation duration
   * @param {Function} onUpdate - Update callback
   * @returns {Promise} Animation promise
   */
  const animateNumber = useCallback((start, end, duration = defaultDuration, onUpdate) => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const frame = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeProgress = easeInOutCubic(progress);
        const currentValue = start + (end - start) * easeProgress;

        onUpdate?.(currentValue, progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(frame);
        } else {
          resolve(currentValue);
        }
      };

      animationFrameRef.current = requestAnimationFrame(frame);
    });
  }, [defaultDuration]);

  /**
   * Animate CSS properties
   * @param {HTMLElement} element - Element to animate
   * @param {Object} properties - CSS properties to animate
   * @param {number} duration - Animation duration
   * @returns {Promise} Animation promise
   */
  const animateCSS = useCallback((element, properties, duration = defaultDuration) => {
    return new Promise((resolve) => {
      if (!element) {
        resolve();
        return;
      }

      // Apply transition
      element.style.transition = `all ${duration}ms ${defaultEasing}`;

      // Apply properties
      Object.keys(properties).forEach(key => {
        element.style[key] = properties[key];
      });

      // Listen for transition end
      const handleTransitionEnd = (e) => {
        if (e.propertyName === Object.keys(properties)[0]) {
          element.removeEventListener('transitionend', handleTransitionEnd);
          element.style.transition = '';
          resolve();
        }
      };

      element.addEventListener('transitionend', handleTransitionEnd);
    });
  }, [defaultDuration, defaultEasing]);

  /**
   * Stagger multiple animations
   * @param {Array} animations - Array of animation functions
   * @param {number} staggerDelay - Delay between each animation
   * @returns {Promise} Combined animation promise
   */
  const staggeredAnimation = useCallback(async (animations, staggerDelay = 100) => {
    for (let i = 0; i < animations.length; i++) {
      await Promise.all([
        animations[i](),
        createDelayAnimation(staggerDelay)
      ]);
    }
  }, [createDelayAnimation]);

  /**
   * Create a spring animation effect
   * @param {Object} config - Spring configuration
   * @returns {Promise} Spring animation promise
   */
  const springAnimation = useCallback((config = {}) => {
    const {
      tension = 171,
      friction = 26,
      duration = 500,
      onUpdate,
      onComplete
    } = config;

    return new Promise((resolve) => {
      const startTime = performance.now();

      const frame = (timestamp) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Spring easing function
        const springProgress = springEasing(progress, tension, friction);

        onUpdate?.(springProgress, progress);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(frame);
        } else {
          onComplete?.();
          resolve();
        }
      };

      animationFrameRef.current = requestAnimationFrame(frame);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // State
    isAnimating,
    animationState,
    prefersReducedMotion: prefersReducedMotion(),

    // Animation functions
    animate,
    animateNumber,
    animateCSS,
    staggeredAnimation,
    springAnimation,

    // Utilities
    createDelayAnimation,

    // Performance
    animationDuration: startTimeRef.current ? performance.now() - startTimeRef.current : 0
  };
};

/**
 * Easing functions
 */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function springEasing(t, tension, friction) {
  // Simplified spring simulation
  const velocity = tension * (1 - t);
  const damping = friction * t;
  return 1 - Math.cos(velocity * t) * Math.exp(-damping);
}

/**
 * Hook for managing page transition animations
 * @param {Object} config - Page transition configuration
 * @returns {Object} Page transition controls
 */
export const usePageTransitions = (config = {}) => {
  const {
    animationType = 'fade',
    duration = 300,
    direction = 'right',
    respectReducedMotion = true
  } = config;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [transitionState, setTransitionState] = useState('idle');

  const transitions = useAnimations({
    defaultDuration: duration,
    respectReducedMotion
  });

  /**
   * Navigate with page transition
   * @param {string} pageIdentifier - New page identifier
   * @param {Function} navigationCallback - Navigation callback
   */
  const navigateWithTransition = useCallback(async (pageIdentifier, navigationCallback) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTransitionState('exiting');

    try {
      // Exit animation
      await transitions.createDelayAnimation(duration / 2);

      // Execute navigation
      await navigationCallback();
      setCurrentPage(pageIdentifier);

      // Entry animation
      setTransitionState('entering');
      await transitions.createDelayAnimation(duration / 2);

      setTransitionState('completed');
    } catch (error) {
      setTransitionState('error');
      throw error;
    } finally {
      setIsTransitioning(false);
      setTimeout(() => {
        setTransitionState('idle');
      }, 100);
    }
  }, [isTransitioning, duration, transitions]);

  /**
   * Get transition classes based on state
   */
  const getTransitionClasses = useCallback(() => {
    const classes = [];

    if (animationType) {
      classes.push(`page-${animationType}`);
    }

    if (direction && animationType === 'slide') {
      classes.push(`slide-${direction}`);
    }

    if (transitionState) {
      classes.push(`transition-${transitionState}`);
    }

    if (isTransitioning) {
      classes.push('is-transitioning');
    }

    return classes.join(' ');
  }, [animationType, direction, transitionState, isTransitioning]);

  return {
    // State
    isTransitioning,
    currentPage,
    transitionState,

    // Actions
    navigateWithTransition,
    getTransitionClasses,

    // Configuration
    animationType,
    duration,
    direction
  };
};

/**
 * Hook for managing micro-interactions
 * @param {Object} config - Micro-interaction configuration
 * @returns {Object} Micro-interaction controls
 */
export const useMicroInteractions = (config = {}) => {
  const {
    enableHapticFeedback = true,
    enableSoundEffects = false,
    enableVisualFeedback = true
  } = config;

  const [interactionState, setInteractionState] = useState('idle');

  /**
   * Trigger a micro-interaction
   * @param {string} type - Interaction type
   * @param {Object} options - Interaction options
   */
  const triggerInteraction = useCallback((type, options = {}) => {
    setInteractionState(type);

    if (enableVisualFeedback) {
      // Apply visual feedback
      switch (type) {
        case 'press':
          // Add press animation
          break;
        case 'hover':
          // Add hover effect
          break;
        case 'success':
          // Add success animation
          break;
        case 'error':
          // Add error animation
          break;
      }
    }

    if (enableHapticFeedback && navigator.vibrate) {
      switch (type) {
        case 'press':
          navigator.vibrate(10);
          break;
        case 'success':
          navigator.vibrate([50, 30, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
      }
    }

    if (enableSoundEffects) {
      // Play sound effect (implementation needed)
    }

    // Reset state after animation
    setTimeout(() => {
      setInteractionState('idle');
    }, 200);
  }, [enableHapticFeedback, enableSoundEffects, enableVisualFeedback]);

  return {
    interactionState,
    triggerInteraction
  };
};

export default {
  useAnimations,
  usePageTransitions,
  useMicroInteractions
};