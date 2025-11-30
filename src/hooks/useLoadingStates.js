import { useState, useCallback, useEffect, useRef } from 'react';
import { useDebounce } from './useDebounce';

/**
 * Hook for managing loading states with skeleton fallbacks
 * @param {Object} config - Configuration object
 * @param {number} config.loadingDelay - Delay before showing loading state (ms)
 * @param {number} config.minLoadingTime - Minimum loading time to prevent flicker (ms)
 * @param {boolean} config.showSkeleton - Whether to show skeleton during loading
 * @param {string} config.skeletonType - Type of skeleton to show
 * @returns {Object} Loading state management functions and state
 */
export const useLoadingStates = (config = {}) => {
  const {
    loadingDelay = 200, // Show skeleton after 200ms to prevent flicker
    minLoadingTime = 500, // Show skeleton for at least 500ms
    showSkeleton = true,
    skeletonType = 'text'
  } = config;

  const [isLoading, setIsLoading] = useState(false);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(false);
  const loadingStartTime = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const minLoadingTimeoutRef = useRef(null);

  // Debounced loading state to prevent UI flicker
  const debouncedIsLoading = useDebounce(isLoading, loadingDelay);

  useEffect(() => {
    if (debouncedIsLoading && showSkeleton) {
      loadingTimeoutRef.current = setTimeout(() => {
        setIsSkeletonVisible(true);
      }, loadingDelay);
    } else {
      setIsSkeletonVisible(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [debouncedIsLoading, showSkeleton, loadingDelay]);

  /**
   * Start loading with minimum duration
   */
  const startLoading = useCallback(() => {
    setIsLoading(true);
    loadingStartTime.current = Date.now();

    // Ensure minimum loading time
    if (minLoadingTimeoutRef.current) {
      clearTimeout(minLoadingTimeoutRef.current);
    }

    minLoadingTimeoutRef.current = setTimeout(() => {
      // This timeout ensures the skeleton shows for at least minLoadingTime
    }, minLoadingTime);
  }, [minLoadingTime]);

  /**
   * Stop loading with minimum duration consideration
   */
  const stopLoading = useCallback(() => {
    setIsLoading(false);

    // Calculate time remaining for minimum loading requirement
    const elapsedTime = Date.now() - (loadingStartTime.current || Date.now());
    const timeRemaining = Math.max(0, minLoadingTime - elapsedTime);

    if (timeRemaining > 0) {
      // Keep loading state for remaining time
      setTimeout(() => {
        setIsSkeletonVisible(false);
      }, timeRemaining);
    }

    if (minLoadingTimeoutRef.current) {
      clearTimeout(minLoadingTimeoutRef.current);
    }
  }, [minLoadingTime]);

  /**
   * Execute async operation with loading state
   * @param {Function} asyncOperation - Async function to execute
   * @param {Object} options - Additional options
   * @returns {Promise} Operation result
   */
  const executeWithLoading = useCallback(async (asyncOperation, options = {}) => {
    const {
      showProgress = true,
      errorBoundary = true,
      onError = null
    } = options;

    if (showProgress) {
      startLoading();
    }

    try {
      const result = await asyncOperation();
      return { success: true, data: result };
    } catch (error) {
      if (onError) {
        onError(error);
      }
      throw error;
    } finally {
      if (showProgress) {
        stopLoading();
      }
    }
  }, [startLoading, stopLoading]);

  /**
   * Execute multiple operations with loading state
   * @param {Array} operations - Array of async operations
   * @param {Object} options - Additional options
   * @returns {Promise} Combined result
   */
  const executeBatchWithLoading = useCallback(async (operations, options = {}) => {
    const {
      showProgress = true,
      concurrent = false,
      onProgress = null
    } = options;

    if (showProgress) {
      startLoading();
    }

    try {
      let results;
      if (concurrent) {
        results = await Promise.all(operations.map((op, index) =>
          op().then(result => {
            if (onProgress) onProgress(index + 1, operations.length);
            return result;
          })
        ));
      } else {
        results = [];
        for (let i = 0; i < operations.length; i++) {
          const result = await operations[i]();
          results.push(result);
          if (onProgress) onProgress(i + 1, operations.length);
        }
      }

      return { success: true, data: results };
    } catch (error) {
      throw error;
    } finally {
      if (showProgress) {
        stopLoading();
      }
    }
  }, [startLoading, stopLoading]);

  return {
    // State
    isLoading,
    isSkeletonVisible,
    showLoading: isSkeletonVisible && showSkeleton,

    // Actions
    startLoading,
    stopLoading,
    executeWithLoading,
    executeBatchWithLoading,

    // Configuration
    config: {
      loadingDelay,
      minLoadingTime,
      showSkeleton,
      skeletonType
    }
  };
};

/**
 * Hook for managing progressive loading (show content progressively as it loads)
 * @param {Array} items - Items to load progressively
 * @param {Object} config - Progressive loading configuration
 * @returns {Object} Progressive loading state and functions
 */
export const useProgressiveLoading = (items = [], config = {}) => {
  const {
    batchSize = 10,
    initialLoadCount = 5,
    loadDelay = 100
  } = config;

  const [displayedItems, setDisplayedItems] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(items.length > initialLoadCount);
  const loadedCount = useRef(initialLoadCount);

  // Load initial items
  useEffect(() => {
    const initialItems = items.slice(0, initialLoadCount);
    setDisplayedItems(initialItems);
    setHasMore(items.length > initialLoadCount);
    loadedCount.current = initialLoadCount;
  }, [items, initialLoadCount]);

  /**
   * Load more items progressively
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, loadDelay));

    const nextBatch = items.slice(loadedCount.current, loadedCount.current + batchSize);

    setDisplayedItems(prev => [...prev, ...nextBatch]);
    loadedCount.current += batchSize;
    setHasMore(items.length > loadedCount.current);
    setIsLoadingMore(false);
  }, [items, batchSize,.loadDelay, isLoadingMore, hasMore]);

  /**
   * Reset progressive loading
   */
  const reset = useCallback(() => {
    const initialItems = items.slice(0, initialLoadCount);
    setDisplayedItems(initialItems);
    setHasMore(items.length > initialLoadCount);
    loadedCount.current = initialLoadCount;
    setIsLoadingMore(false);
  }, [items, initialLoadCount]);

  return {
    // State
    displayedItems,
    isLoadingMore,
    hasMore,
    totalCount: items.length,
    loadedCount: loadedCount.current,
    progressPercentage: Math.round((loadedCount.current / items.length) * 100),

    // Actions
    loadMore,
    reset
  };
};

/**
 * Hook for managing skeleton animation states
 * @param {Object} config - Animation configuration
 * @returns {Object} Animation state management
 */
export const useSkeletonAnimation = (config = {}) => {
  const {
    enableAnimation = true,
    animationType = 'shimmer', // 'shimmer', 'pulse', 'none'
    animationDuration = 1500
  } = config;

  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (enableAnimation) {
      switch (animationType) {
        case 'shimmer':
          setAnimationClass('animate shimmer');
          break;
        case 'pulse':
          setAnimationClass('animate pulse');
          break;
        case 'none':
          setAnimationClass('');
          break;
        default:
          setAnimationClass('animate');
      }
    } else {
      setAnimationClass('');
    }

    setIsAnimating(enableAnimation && animationType !== 'none');
  }, [enableAnimation, animationType]);

  return {
    animationClass,
    isAnimating,
    animationType,
    animationDuration
  };
};

/**
 * Hook for combining loading states with skeleton components
 * @param {Object} config - Combined configuration
 * @returns {Object} Enhanced loading state management with skeleton support
 */
export const useLoadingWithSkeleton = (config = {}) => {
  const {
    skeletonType = 'text',
    skeletonProps = {},
    loadingConfig = {}
  } = config;

  const loadingStates = useLoadingStates(loadingConfig);
  const skeletonAnimation = useSkeletonAnimation({
    enableAnimation: loadingConfig.showSkeleton !== false
  });

  /**
   * Get skeleton props for rendering
   */
  const getSkeletonProps = useCallback((overrideProps = {}) => {
    const defaultSkeletonProps = {
      animate: skeletonAnimation.isAnimating,
      className: skeletonAnimation.animationClass,
      ...skeletonProps,
      ...overrideProps
    };

    return defaultSkeletonProps;
  }, [skeletonAnimation.isAnimating, skeletonAnimation.animationClass, skeletonProps]);

  /**
   * Check if skeleton should be shown
   */
  const shouldShowSkeleton = useCallback(() => {
    return loadingStates.showLoading && loadingConfig.showSkeleton !== false;
  }, [loadingStates.showLoading, loadingConfig.showSkeleton]);

  return {
    // Loading states
    ...loadingStates,

    // Skeleton animation
    ...skeletonAnimation,

    // Skeleton integration
    getSkeletonProps,
    shouldShowSkeleton,
    skeletonType
  };
};

export default {
  useLoadingStates,
  useProgressiveLoading,
  useSkeletonAnimation,
  useLoadingWithSkeleton
};