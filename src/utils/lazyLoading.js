import React, { lazy, ComponentType, Suspense, useState, useEffect } from 'react';

/**
 * Lazy load components with error boundary and loading fallback
 * @param {() => Promise<{default: ComponentType<any>}>} importFunc - Dynamic import function
 * @param {ComponentType} fallback - Custom fallback component
 * @returns {ComponentType} Lazy loaded component
 */
export const lazyLoad = (
  importFunc,
  fallback = null
) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <Suspense
      fallback={fallback || <div className="loading-fallback">Loading...</div>}
    >
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Create a lazy loaded component with custom loading component
 * @param {() => Promise<{default: ComponentType<any>}>} importFunc - Dynamic import function
 * @param {React.ComponentType} LoadingComponent - Custom loading component
 * @param {React.ComponentType} ErrorComponent - Custom error component
 * @returns {ComponentType} Lazy loaded component with error handling
 */
export const lazyLoadWithError = (
  importFunc,
  LoadingComponent,
  ErrorComponent
) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <Suspense fallback={<LoadingComponent />}>
      <ErrorBoundary ErrorComponent={ErrorComponent}>
        <LazyComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Simple error boundary for lazy loaded components
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const ErrorComponent = this.props.ErrorComponent || DefaultErrorComponent;
      return <ErrorComponent error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error component
 */
const DefaultErrorComponent = ({ error }) => (
  <div className="lazy-load-error">
    <h3>Failed to load component</h3>
    <p>Please refresh the page and try again.</p>
    {process.env.NODE_ENV === 'development' && (
      <details>
        <summary>Error details</summary>
        <pre>{error?.message}</pre>
      </details>
    )}
  </div>
);

/**
 * Preload a component for faster navigation
 * @param {() => Promise<{default: ComponentType<any>}>} importFunc - Dynamic import function
 * @returns {Promise<void>} Preload promise
 */
export const preloadComponent = (importFunc) => {
  return importFunc();
};

/**
 * Create lazy loaded routes array
 * @param {Array} routes - Routes configuration
 * @returns {Array} Routes with lazy loaded components
 */
export const createLazyRoutes = (routes) => {
  return routes.map(route => ({
    ...route,
    component: lazyLoad(route.component)
  }));
};

/**
 * Progressive loading utility - load components in priority order
 */
export class ProgressiveLoader {
  constructor() {
    this.queue = [];
    this.loading = false;
  }

  /**
   * Add component to loading queue
   * @param {string} priority - Priority level ('high', 'medium', 'low')
   * @param {() => Promise<{default: ComponentType<any>}>} importFunc - Dynamic import function
   * @param {string} name - Component name for identification
   */
  add(priority, importFunc, name) {
    this.queue.push({ priority, importFunc, name, loaded: false });
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Start progressive loading
   */
  async start() {
    if (this.loading) return;
    this.loading = true;

    for (const item of this.queue) {
      if (item.loaded) continue;

      try {
        // Wait a bit between loads to not block the main thread
        await new Promise(resolve => setTimeout(resolve, 100));
        await item.importFunc();
        item.loaded = true;
        console.log(`Progressively loaded: ${item.name}`);
      } catch (error) {
        console.error(`Failed to load ${item.name}:`, error);
      }
    }

    this.loading = false;
  }

  /**
   * Get loading progress
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    const loaded = this.queue.filter(item => item.loaded).length;
    return this.queue.length > 0 ? (loaded / this.queue.length) * 100 : 0;
  }
}

// Global progressive loader instance
export const globalLoader = new ProgressiveLoader();

/**
 * Intersection Observer based lazy loading for components
 * @param {() => Promise<{default: ComponentType<any>}>} importFunc - Dynamic import function
 * @param {Element} triggerElement - Element to observe
 * @param {React.ComponentType} fallback - Fallback component
 * @returns {ComponentType} Lazy loaded component
 */
export const intersectionLazyLoad = (
  importFunc,
  triggerElement,
  fallback = null
) => {
  const [LazyComponent, setLazyComponent] = useState(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!triggerElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !LazyComponent) {
          setIsIntersecting(true);
          importFunc().then((module) => {
            setLazyComponent(() => module.default);
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(triggerElement);

    return () => {
      observer.disconnect();
    };
  }, [triggerElement, LazyComponent, importFunc]);

  if (LazyComponent) {
    return <LazyComponent />;
  }

  return fallback || <div className="lazy-fallback">Loading...</div>;
};

export default {
  lazyLoad,
  lazyLoadWithError,
  preloadComponent,
  createLazyRoutes,
  ProgressiveLoader,
  globalLoader,
  intersectionLazyLoad
};