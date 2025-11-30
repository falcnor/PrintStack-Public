import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import styles from './PageTransition.module.css';

/**
 * Page transition component with configurable animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to transition
 * @param {string} props.animationType - Type of animation ('fade', 'slide', 'scale', 'flip')
 * @param {string} props.direction - Direction for slide animations ('left', 'right', 'up', 'down')
 * @param {number} props.duration - Animation duration in milliseconds
 * @param {number} props.delay - Animation delay in milliseconds
 * @param {boolean} props.triggerAnimation - Whether animation should trigger
 * @param {Function} props.onAnimationStart - Callback when animation starts
 * @param {Function} props.onAnimationEnd - Callback when animation ends
 * @param {boolean} props.staggerChildren - Whether to stagger child animations
 * @param {number} props.staggerDelay - Delay between children animations
 */
const PageTransition = ({
  children,
  animationType = 'fade',
  direction = 'right',
  duration = 300,
  delay = 0,
  triggerAnimation = true,
  onAnimationStart,
  onAnimationEnd,
  staggerChildren = false,
  staggerDelay = 50
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      setIsAnimating(true);
      setIsVisible(false);

      // Trigger reflow and start animation
      const timeout = setTimeout(() => {
        setIsVisible(true);
        onAnimationStart?.();
      }, delay);

      const endTimeout = setTimeout(() => {
        setIsAnimating(false);
        onAnimationEnd?.();
      }, delay + duration);

      return () => {
        clearTimeout(timeout);
        clearTimeout(endTimeout);
      };
    }
  }, [triggerAnimation, delay, duration, onAnimationStart, onAnimationEnd]);

  const getAnimationClass = () => {
    if (!triggerAnimation) return '';

    const baseClass = styles.pageTransition;
    const animationClass = styles[animationType];
    const directionClass = animationType === 'slide' ? styles[direction] : '';
    const visibilityClass = isVisible ? styles.visible : '';
    const animatingClass = isAnimating ? styles.animating : '';

    return [baseClass, animationClass, directionClass, visibilityClass, animatingClass]
      .filter(Boolean)
      .join(' ');
  };

  const getChildStyle = (index) => {
    if (!staggerChildren) return {};

    return {
      transitionDelay: isVisible ? `${delay + index * staggerDelay}ms` : '0ms'
    };
  };

  const renderChildrenWithStagger = () => {
    const childArray = React.Children.toArray(children);

    return childArray.map((child, index) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          key: child.key || `child-${index}`,
          style: {
            ...child.props.style,
            ...getChildStyle(index)
          },
          className: [
            child.props.className || '',
            styles.staggerChild
          ].filter(Boolean).join(' ')
        });
      }
      return child;
    });
  };

  return (
    <div
      className={getAnimationClass()}
      style={{
        '--duration': `${duration}ms`,
        '--delay': `${delay}ms`
      }}
    >
      {staggerChildren ? renderChildrenWithStagger() : children}
    </div>
  );
};

/**
 * Entrance animation component for list items
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to animate
 * @param {number} props.index - Index in list for stagger animation
 * @param {string} props.animationType - Type of entrance animation
 * @param {number} props.delay - Base delay
 * @param {number} props.staggerDelay - Delay between items
 */
const EntranceAnimation = ({
  children,
  index = 0,
  animationType = 'slideUp',
  delay = 0,
  staggerDelay = 100,
  triggerAnimation = true
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      const timeout = setTimeout(() => {
        setIsVisible(true);
      }, delay + index * staggerDelay);

      return () => clearTimeout(timeout);
    }
  }, [triggerAnimation, delay, index, staggerDelay]);

  const animationClass = [
    styles.entranceAnimation,
    styles[animationType],
    isVisible ? styles.visible : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={animationClass} style={{ transitionDelay: `${delay + index * staggerDelay}ms` }}>
      {children}
    </div>
  );
};

/**
 * Cross-fade transition for switching between content
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Current content
 * @param {boolean} props.switchContent - Whether to trigger content switch
 * @param {number} props.duration - Cross-fade duration
 */
const CrossFade = ({ children, switchContent, duration = 300 }) => {
  const [currentContent, setCurrentContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (switchContent && children !== currentContent) {
      setIsTransitioning(true);

      const timeout = setTimeout(() => {
        setCurrentContent(children);
        setIsTransitioning(false);
      }, duration / 2); // Switch at halfway point

      return () => clearTimeout(timeout);
    }
  }, [switchContent, children, currentContent, duration]);

  return (
    <div className={styles.crossFade}>
      <div
        className={`${styles.contentLayer} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}
        style={{ transitionDuration: `${duration}ms` }}
      >
        {currentContent}
      </div>
    </div>
  );
};

/**
 * Route transition component for page navigation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.pathname - Current route path
 * @param {boolean} props.isTransitioning - Whether route is transitioning
 */
const RouteTransition = ({ children, pathname, isTransitioning }) => {
  return (
    <PageTransition
      triggerAnimation={!isTransitioning}
      animationType="slide"
      direction="left"
      duration={400}
      onAnimationEnd={() => {
        // Could integrate with router transition events
      }}
    >
      {children}
    </PageTransition>
  );
};

/**
 * Loading state transition component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to show
 * @param {boolean} props.loading - Whether in loading state
 * @param {React.ReactNode} props.loadingContent - Content to show during loading
 */
const LoadingTransition = ({ children, loading, loadingContent }) => {
  return (
    <CrossFade
      switchContent={loading}
      duration={200}
    >
      {loading ? loadingContent : children}
    </CrossFade>
  );
};

// PropTypes
PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  animationType: PropTypes.oneOf(['fade', 'slide', 'scale', 'flip']),
  direction: PropTypes.oneOf(['left', 'right', 'up', 'down']),
  duration: PropTypes.number,
  delay: PropTypes.number,
  triggerAnimation: PropTypes.bool,
  onAnimationStart: PropTypes.func,
  onAnimationEnd: PropTypes.func,
  staggerChildren: PropTypes.bool,
  staggerDelay: PropTypes.number
};

EntranceAnimation.propTypes = {
  children: PropTypes.node.isRequired,
  index: PropTypes.number,
  animationType: PropTypes.string,
  delay: PropTypes.number,
  staggerDelay: PropTypes.number,
  triggerAnimation: PropTypes.bool
};

CrossFade.propTypes = {
  children: PropTypes.node.isRequired,
  switchContent: PropTypes.bool,
  duration: PropTypes.number
};

RouteTransition.propTypes = {
  children: PropTypes.node.isRequired,
  pathname: PropTypes.string,
  isTransitioning: PropTypes.bool
};

LoadingTransition.propTypes = {
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  loadingContent: PropTypes.node
};

export {
  PageTransition,
  EntranceAnimation,
  CrossFade,
  RouteTransition,
  LoadingTransition
};

export default PageTransition;