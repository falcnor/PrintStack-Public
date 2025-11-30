import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for managing lazy loading of components or modules
 * @param {() => Promise<{default: any}>} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {Object} Loading state and utilities
 */
export const useLazyLoading = (importFunc, options = {}) => {
  const {
    preloadDelay = 0, // Delay before preloading (ms)
    retryLimit = 3, // Maximum retry attempts
    retryDelay = 1000, // Delay between retries (ms)
    timeout = 10000, // Load timeout (ms)
  } = options;

  const [state, setState] = useState({
    loading: false,
    loaded: false,
    error: null,
    data: null,
    retryCount: 0
  });

  const timeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const load = useCallback(async (isRetry = false) => {
    if (state.loading && !isRetry) return state.data;
    if (state.loaded) return state.data;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Clear any existing timeouts
      clearTimeouts();

      // Set load timeout
      const loadPromise = importFunc();
      const timeoutPromise = new Promise((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`Load timeout after ${timeout}ms`));
        }, timeout);
      });

      const result = await Promise.race([loadPromise, timeoutPromise]);
      clearTimeouts();

      setState(prev => ({
        ...prev,
        loading: false,
        loaded: true,
        error: null,
        data: result.default || result,
        retryCount: 0
      }));

      return result.default || result;

    } catch (error) {
      clearTimeouts();
      console.error('Lazy loading error:', error);

      const newRetryCount = isRetry ? state.retryCount + 1 : 1;
      const shouldRetry = newRetryCount < retryLimit;

      setState(prev => ({
        ...prev,
        loading: false,
        loaded: false,
        error: error.message || 'Failed to load',
        retryCount: newRetryCount
      }));

      if (shouldRetry) {
        console.log(`Retrying load (${newRetryCount}/${retryLimit})...`);
        retryTimeoutRef.current = setTimeout(() => {
          load(true);
        }, retryDelay);
      }

      throw error;
    }
  }, [importFunc, state.loading, state.loaded, state.retryCount, timeout, retryLimit, retryDelay, clearTimeouts]);

  const preload = useCallback(() => {
    if (state.loaded || state.loading) return;

    if (preloadDelay > 0) {
      setTimeout(() => {
        load();
      }, preloadDelay);
    } else {
      load();
    }
  }, [state.loaded, state.loading, load, preloadDelay]);

  const reset = useCallback(() => {
    clearAllTimeouts();
    setState({
      loading: false,
      loaded: false,
      error: null,
      data: null,
      retryCount: 0
    });
  }, []);

  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    ...state,
    load,
    preload,
    reset,
    canRetry: state.retryCount < retryLimit,
    isFinalError: state.error && state.retryCount >= retryLimit
  };
};

/**
 * Hook for lazy loading multiple components in sequence or parallel
 * @param {Array<{name: string, importFunc: Function, priority?: string}>} imports - Array of import configurations
 * @param {Object} options - Configuration options
 * @returns {Object} Loading state and utilities
 */
export const useMultiLazyLoading = (imports, options = {}) => {
  const {
    strategy = 'parallel', // 'parallel', 'sequential', 'priority'
    preloadDelay = 0
  } = options;

  const [state, setState] = useState({
    loading: false,
    overallProgress: 0,
    components: {},
    errors: {}
  });

  const loadAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    const loadPromises = imports.map(async (importConfig) => {
      const { name, importFunc } = importConfig;

      setState(prev => ({
        ...prev,
        components: {
          ...prev.components,
          [name]: { loading: true, loaded: false, error: null }
        }
      }));

      try {
        const result = await importFunc();
        const module = result.default || result;

        setState(prev => ({
          ...prev,
          components: {
            ...prev.components,
            [name]: { loading: false, loaded: true, data: module, error: null }
          },
          overallProgress: prev.overallProgress + (100 / imports.length)
        }));

        return { name, module };

      } catch (error) {
        setState(prev => ({
          ...prev,
          components: {
            ...prev.components,
            [name]: { loading: false, loaded: false, error: error.message }
          },
          errors: { ...prev.errors, [name]: error.message },
          overallProgress: prev.overallProgress + (100 / imports.length)
        }));

        return { name, error };
      }
    });

    try {
      if (strategy === 'sequential') {
        for (const promise of loadPromises) {
          await promise;
        }
      } else {
        await Promise.all(loadPromises);
      }
    } catch (error) {
      console.error('Multi-loading error:', error);
    }

    setState(prev => ({ ...prev, loading: false }));
  }, [imports, strategy]);

  const preload = useCallback(() => {
    if (preloadDelay > 0) {
      setTimeout(() => {
        loadAll();
      }, preloadDelay);
    } else {
      loadAll();
    }
  }, [loadAll, preloadDelay]);

  const getComponent = useCallback((name) => {
    return state.components[name]?.data;
  }, [state.components]);

  const isComponentLoaded = useCallback((name) => {
    return state.components[name]?.loaded || false;
  }, [state.components]);

  const isComponentLoading = useCallback((name) => {
    return state.components[name]?.loading || false;
  }, [state.components]);

  const getComponentError = useCallback((name) => {
    return state.components[name]?.error;
  }, [state.components]);

  return {
    ...state,
    loadAll,
    preload,
    getComponent,
    isComponentLoaded,
    isComponentLoading,
    getComponentError
  };
};

/**
 * Hook for intersection-based lazy loading
 * @param {HTMLElement} element - DOM element to observe
 * @param {() => Promise<{default: any}>} importFunc - Dynamic import function
 * @param {Object} options - Intersection observer options
 * @returns {Object} Loading state
 */
export const useIntersectionLazyLoad = (element, importFunc, options = {}) => {
  const {
    root = null,
    rootMargin = '100px', // Start loading 100px before element comes into view
    threshold = 0.1
  } = options;

  const [state, setState] = useState({
    loading: false,
    loaded: false,
    error: null,
    data: null
  });

  const observerRef = useRef(null);

  useEffect(() => {
    if (!element || state.loaded) return;

    observerRef.current = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !state.loading && !state.loaded) {
          setState(prev => ({ ...prev, loading: true }));

          try {
            const result = await importFunc();
            setState(prev => ({
              ...prev,
              loading: false,
              loaded: true,
              error: null,
              data: result.default || result
            }));
          } catch (error) {
            setState(prev => ({
              ...prev,
              loading: false,
              loaded: false,
              error: error.message || 'Failed to load'
            }));
          }

          // Stop observing after load attempt
          if (observerRef.current) {
            observerRef.current.disconnect();
          }
        }
      },
      { root, rootMargin, threshold }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [element, importFunc, root, rootMargin, threshold, state.loading, state.loaded]);

  return state;
};

/**
 * Hook for caching loaded modules
 * @returns {Object} Cache utilities
 */
export const useLazyCache = () => {
  const cacheRef = useRef(new Map());

  const get = useCallback((key) => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key, value) => {
    cacheRef.current.set(key, value);
  }, []);

  const has = useCallback((key) => {
    return cacheRef.current.has(key);
  }, []);

  const remove = useCallback((key) => {
    return cacheRef.current.delete(key);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const size = useCallback(() => {
    return cacheRef.current.size;
  }, []);

  const keys = useCallback(() => {
    return Array.from(cacheRef.current.keys());
  }, []);

  return {
    get,
    set,
    has,
    remove,
    clear,
    size,
    keys
  };
};

export default {
  useLazyLoading,
  useMultiLazyLoading,
  useIntersectionLazyLoad,
  useLazyCache
};