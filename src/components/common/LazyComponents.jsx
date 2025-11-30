import React from 'react';
import PropTypes from 'prop-types';
import styles from './LazyComponents.module.css';

/**
 * Loading spinner for lazy loaded components
 */
export const LazySpinner = ({ message = 'Loading...', size = 'medium' }) => {
  return (
    <div className={`${styles.lazySpinner} ${styles[size]}`}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

LazySpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

/**
 * Skeleton loader for lazy components
 */
export const LazySkeleton = ({
  type = 'card',
  lines = 3,
  showAvatar = false,
  showImage = false
}) => {
  return (
    <div className={`${styles.lazySkeleton} ${styles[type]}`}>
      {showAvatar && <div className={styles.avatar}></div>}
      {showImage && <div className={styles.image}></div>}
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className={styles.line} style={{ width: `${Math.random() * 40 + 60}%` }}></div>
      ))}
    </div>
  );
};

LazySkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'list', 'form', 'table']),
  lines: PropTypes.number,
  showAvatar: PropTypes.bool,
  showImage: PropTypes.bool
};

/**
 * Error component for failed lazy loads
 */
export const LazyError = ({ error, onRetry, componentName }) => {
  return (
    <div className={styles.lazyError}>
      <div className={styles.errorIcon}>⚠️</div>
      <h3>Failed to Load{componentName && ` ${componentName}`}</h3>
      <p>Sorry, we couldn't load this component. Please try again.</p>

      {process.env.NODE_ENV === 'development' && error && (
        <details className={styles.errorDetails}>
          <summary>Error Details</summary>
          <pre>{error.message}</pre>
        </details>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className={styles.retryButton}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

LazyError.propTypes = {
  error: PropTypes.object,
  onRetry: PropTypes.func,
  componentName: PropTypes.string
};

/**
 * Progressive loading indicator
 */
export const ProgressiveLoader = ({ progress, isLoading }) => {
  return (
    <div className={styles.progressiveLoader}>
      {isLoading && (
        <>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className={styles.progressText}>
            Loading components... {Math.round(progress)}%
          </span>
        </>
      )}
    </div>
  );
};

ProgressiveLoader.propTypes = {
  progress: PropTypes.number,
  isLoading: PropTypes.bool
};

/**
 * Wrapper component for lazy loaded features
 */
export const LazyFeature = ({
  children,
  loadingMessage = 'Loading feature...',
  errorComponent = null,
  fallback = null
}) => {
  return (
    <div className={styles.lazyFeature}>
      {children}
    </div>
  );
};

LazyFeature.propTypes = {
  children: PropTypes.node,
  loadingMessage: PropTypes.string,
  errorComponent: PropTypes.element,
  fallback: PropTypes.element
};

/**
 * Route-level loading component
 */
export const RouteLoader = ({ routeName }) => {
  return (
    <div className={styles.routeLoader}>
      <div className={styles.routeLoaderContent}>
        <div className={`${styles.spinner} ${styles.large}`}></div>
        <h2>Loading {routeName}</h2>
        <p>Please wait while we prepare your content...</p>
      </div>
    </div>
  );
};

RouteLoader.propTypes = {
  routeName: PropTypes.string.isRequired
};

/**
 * Component loader with retry functionality
 */
export const RetryableLoader = ({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  fallback
}) => {
  const [retryCount, setRetryCount] = React.useState(0);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRetry = React.useCallback(() => {
    if (retryCount < maxRetries) {
      setIsLoading(true);
      setHasError(false);
      setRetryCount(prev => prev + 1);

      setTimeout(() => {
        setIsLoading(false);
        window.location.reload(); // Force reload to retry the lazy load
      }, retryDelay);
    }
  }, [retryCount, maxRetries, retryDelay]);

  React.useEffect(() => {
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    // Listen for unhandled promise rejections (lazy load failures)
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <LazyError
        error={new Error('Component failed to load')}
        onRetry={handleRetry}
        componentName=""
      />
    );
  }

  if (isLoading) {
    return <LazySpinner message="Retrying..." />;
  }

  return (
    <>
      {children}
      {fallback && retryCount > 0 && !hasError && (
        <div className={styles.retryIndicator}>
          Attempt {retryCount + 1} of {maxRetries}
        </div>
      )}
    </>
  );
};

RetryableLoader.propTypes = {
  children: PropTypes.node.isRequired,
  maxRetries: PropTypes.number,
  retryDelay: PropTypes.number,
  fallback: PropTypes.node
};

export default {
  LazySpinner,
  LazySkeleton,
  LazyError,
  ProgressiveLoader,
  LazyFeature,
  RouteLoader,
  RetryableLoader
};