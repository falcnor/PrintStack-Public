import { lazy } from 'react';

/**
 * Lazy loading utility for components
 * Helps with code splitting and initial load time optimization
 */

// Lazy load heavy components
export const LazyFilamentImportExport = lazy(() =>
  import('../components/filament/FilamentImportExport.jsx')
);

export const LazyQualityRating = lazy(() =>
  import('../components/prints/QualityRating.jsx')
);

export const LazyRequirementMapping = lazy(() =>
  import('../components/models/RequirementMapping.jsx')
);

export const LazyMaterialTypes = lazy(() =>
  import('../components/filament/MaterialTypes.jsx')
);

// Helper function for loading components with fallback
export const createLazyComponent = (importFunc, fallback = null) => {
  return lazy(importFunc);
};

// Preload important components for better UX
export const preloadComponents = () => {
  import('../components/filament/FilamentTable.jsx');
  import('../components/models/ModelTable.jsx');
  import('../components/prints/PrintHistory.jsx');
};