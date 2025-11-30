import { useState, useMemo, useCallback } from 'react';

import { filterBy, removeDuplicates, groupBy, sortBy } from '../utils/arrayUtils.js';

import { useDebounce } from './useDebounce.js';

/**
 * Custom hook for data filtering and searching
 * @param {Array} data - Array of data to filter
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options
 * @returns {Object} Filter utilities and state
 */
export const useFilters = (data = [], initialFilters = {}, options = {}) => {
  const {
    debounceDelay = 300,
    caseSensitive = false,
    exactMatch = false,
    operator = 'AND'
  } = options;

  const [filters, setFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const debouncedActiveFilters = useDebounce(activeFilters, debounceDelay);

  /**
   * Update filter values
   */
  const setFilter = useCallback((key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Set multiple filters at once
   */
  const setMultipleFilters = useCallback((newFilters) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Remove a single filter
   */
  const removeFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  /**
   * Apply sorting
   */
  const sortData = useCallback((dataArray, key, direction = 'asc') => {
    if (!key) return dataArray;
    return sortBy(dataArray, key, direction === 'asc');
  }, []);

  /**
   * Set sorting configuration
   */
  const setSorting = useCallback((key, direction = null) => {
    setSortConfig(prev => ({
      key,
      direction: direction || (prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc')
    }));
  }, []);

  /**
   * Memoized filtered and sorted data
   */
  const filteredData = useMemo(() => {
    let result = data;

    // Apply filters
    if (Object.keys(debouncedActiveFilters).length > 0) {
      result = filterBy(result, debouncedActiveFilters, {
        caseSensitive,
        exactMatch,
        operator
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      result = sortData(result, sortConfig.key, sortConfig.direction);
    }

    return result;
  }, [data, debouncedActiveFilters, sortConfig, caseSensitive, exactMatch, operator, sortData]);

  /**
   * Get unique values for a specific field (useful for filter dropdowns)
   */
  const getUniqueValues = useCallback((field) => {
    return removeDuplicates(data.map(item => item[field]), value => value);
  }, [data]);

  /**
   * Get grouped data by field
   */
  const getGroupedData = useCallback((field) => {
    return groupBy(filteredData, field);
  }, [filteredData]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Object.keys(debouncedActiveFilters).length > 0;

  /**
   * Get filter summary
   */
  const getFilterSummary = useCallback(() => {
    return Object.entries(debouncedActiveFilters).map(([key, value]) => ({
      key,
      value,
      display: Array.isArray(value) ? `${value.length} selected` : value
    }));
  }, [debouncedActiveFilters]);

  /**
   * Get filter statistics
   */
  const getStats = useCallback(() => {
    return {
      totalItems: data.length,
      filteredItems: filteredData.length,
      activeFiltersCount: Object.keys(debouncedActiveFilters).length,
      hasActiveFilters,
      filterPercentage: data.length > 0 ? Math.round((filteredData.length / data.length) * 100) : 0
    };
  }, [data.length, filteredData.length, debouncedActiveFilters, hasActiveFilters]);

  return {
    // State
    filters,
    activeFilters: debouncedActiveFilters,
    sortConfig,
    filteredData,

    // Actions
    setFilter,
    setMultipleFilters,
    removeFilter,
    clearFilters,
    setSorting,

    // Utilities
    getUniqueValues,
    getGroupedData,
    getFilterSummary,
    getStats,

    // Computed
    hasActiveFilters
  };
};

/**
 * Hook for search functionality
 * @param {Array} data - Data to search
 * @param {string} searchField - Field to search in (or array of fields)
 * @param {Object} options - Search options
 * @returns {Object} Search utilities and state
 */
export const useSearch = (data, searchField, options = {}) => {
  const {
    debounceDelay = 300,
    caseSensitive = false,
    exactMatch = false
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  const searchResults = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data;

    const searchTermLower = caseSensitive ? debouncedSearchTerm : debouncedSearchTerm.toLowerCase();
    const searchFields = Array.isArray(searchField) ? searchField : [searchField];

    return data.filter(item => {
      return searchFields.some(field => {
        const fieldValue = item[field];
        if (!fieldValue) return false;

        const valueStr = caseSensitive ? String(fieldValue) : String(fieldValue).toLowerCase();

        if (exactMatch) {
          return valueStr === searchTermLower;
        } else {
          return valueStr.includes(searchTermLower);
        }
      });
    });
  }, [data, debouncedSearchTerm, searchField, caseSensitive, exactMatch]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    clearSearch,
    hasSearchTerm: searchTerm.trim().length > 0,
    resultCount: searchResults.length
  };
};

/**
 * Hook for advanced filtering with multiple filter types
 */
export const useAdvancedFilters = (data = [], filterConfig = {}) => {
  const [filters, setFilters] = useState({});
  const [activeCount, setActiveCount] = useState(0);

  const { filteredData, hasActiveFilters, getStats } = useFilters(data, filters);

  // Update active count when filters change
  useState(() => {
    setActiveCount(Object.keys(filters).length);
  }, [filters]);

  /**
   * Set filter by type
   */
  const setFilterByType = useCallback((type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  }, []);

  /**
   * Quick filter presets
   */
  const applyPreset = useCallback((preset) => {
    setFilters(filterConfig[preset] || {});
  }, [filterConfig]);

  /**
   * Get active filters by type
   */
  const getFiltersByType = useCallback((type) => {
    return Object.keys(filters).filter(key => key.startsWith(`${type}_`));
  }, [filters]);

  return {
    filters,
    activeCount,
    filteredData,
    hasActiveFilters,
    setFilterByType,
    setFilters,
    clearFilters: () => setFilters({}),
    applyPreset,
    getFiltersByType,
    getStats
  };
};