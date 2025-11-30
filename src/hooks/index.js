/**
 * Central export point for all custom hooks
 * This makes importing hooks easier and provides a single entry point
 */

// Existing hooks
export {
  useLocalStorage,
  useAppData,
  useSettings
} from './useLocalStorage.js';

export {
  useModels
} from './useModels.js';

export {
  usePrints
} from './usePrints.js';

// New custom hooks
export {
  useForm,
  useSimpleForm
} from './useForm.js';

export {
  useDebounce,
  useDebouncedCallback,
  useDebouncedSearch,
  useDebouncedApi
} from './useDebounce.js';

export {
  useFilters,
  useSearch,
  useAdvancedFilters
} from './useFilters.js';

export {
  usePagination,
  useInfiniteScroll
} from './usePagination.js';

export {
  useNotifications,
  useToast,
  NOTIFICATION_TYPES
} from './useNotifications.js';

// Performance and UX hooks
export {
  useOptimisticUpdate,
  useFormWithOptimism
} from './useOptimisticUpdate.js';

export {
  useLoadingStates,
  useProgressiveLoading,
  useSkeletonAnimation,
  useLoadingWithSkeleton
} from './useLoadingStates.js';

export {
  useAnimations,
  usePageTransitions,
  useMicroInteractions
} from './useAnimations.js';

export {
  useAdvancedSearch,
  useRealTimeSearch
} from './useAdvancedSearch.js';

export {
  useKeyboardNavigation,
  useScreenReader,
  useFocusTrap,
  useTableNavigation
} from './useKeyboardNavigation.js';

export {
  useServiceWorker,
  useOfflineDetection
} from './useServiceWorker.js';

export {
  useLazyLoading,
  useMultiLazyLoading,
  useIntersectionLazyLoad,
  useLazyCache
} from './useLazyLoading.js';

export {
  useImageOptimization,
  useImageLoading
} from './useImageOptimization.js';