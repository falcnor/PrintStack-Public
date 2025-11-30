import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDebounce, useDebouncedCallback } from './useDebounce';

/**
 * Advanced search hook with multiple filtering options
 * @param {Array} data - Data to search/filter
 * @param {Object} config - Search configuration
 * @returns {Object} Advanced search utilities
 */
export const useAdvancedSearch = (data = [], config = {}) => {
  const {
    searchFields = [],
    minSearchLength = 2,
    debounceDelay = 300,
    caseSensitive = false,
    fuzzySearch = false,
    sortBy = 'relevance',
    showSuggestions = true,
    maxSuggestions = 5
  } = config;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortByField, setSortByField] = useState(sortBy);
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const debouncedSearchTerm = useDebounce(searchTerm, debounceDelay);

  /**
   * Generate fuzzy search regex
   * @param {string} term - Search term
   * @returns {RegExp} Fuzzy search regex
   */
  const generateFuzzyRegex = useCallback((term) => {
    if (!term || term.length < minSearchLength) return null;

    let pattern = term.toLowerCase().split('').join('.*');
    const flags = caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }, [minSearchLength, caseSensitive]);

  /**
   * Search function with fuzzy matching
   * @param {Array} items - Items to search
   * @param {string} term - Search term
   * @returns {Array} Search results
   */
  const searchItems = useCallback((items, term) => {
    if (!term || term.length < minSearchLength) {
      return items;
    }

    const regex = fuzzySearch ? generateFuzzyRegex(term) : null;
    const searchTermLower = caseSensitive ? term : term.toLowerCase();

    return items.map((item, index) => {
      let relevanceScore = 0;
      let matches = [];

      for (const field of searchFields) {
        const fieldValue = item[field];
        if (typeof fieldValue !== 'string') continue;

        const fieldValueLower = caseSensitive ? fieldValue : fieldValue.toLowerCase();

        // Exact match
        if (fieldValueLower === searchTermLower) {
          relevanceScore += 100;
          matches.push({ field, type: 'exact', value: fieldValue });
        }
        // Starts with
        else if (fieldValueLower.startsWith(searchTermLower)) {
          relevanceScore += 50;
          matches.push({ field, type: 'startsWith', value: fieldValue });
        }
        // Contains
        else if (fieldValueLower.includes(searchTermLower)) {
          relevanceScore += 25;
          matches.push({ field, type: 'contains', value: fieldValue });
        }
        // Fuzzy match
        else if (fuzzySearch && regex && regex.test(fieldValueLower)) {
          const matchValue = fieldValue.match(regex) ? fieldValue.match(regex)[0] : '';
          relevanceScore += 10;
          matches.push({ field, type: 'fuzzy', value: matchValue });
        }
      }

      return {
        ...item,
        _searchIndex: index,
        _relevanceScore: relevanceScore,
        _searchMatches: matches
      };
    }).filter(item => item._relevanceScore > 0);
  }, [searchFields, minSearchLength, caseSensitive, fuzzySearch, generateFuzzyRegex]);

  /**
   * Filter items based on active filters
   * @param {Array} items - Items to filter
   * @returns {Array} Filtered items
   */
  const applyFilters = useCallback((items) => {
    return items.filter(item => {
      return Object.entries(filters).every(([key, filterConfig]) => {
        const itemValue = item[key];
        const { value, operator = 'equals', type = 'string' } = filterConfig;

        switch (operator) {
          case 'equals':
            return itemValue === value;
          case 'notEquals':
            return itemValue !== value;
          case 'contains':
            return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          case 'notContains':
            return !String(itemValue).toLowerCase().includes(String(value).toLowerCase());
          case 'greaterThan':
            return Number(itemValue) > Number(value);
          case 'lessThan':
            return Number(itemValue) < Number(value);
          case 'greaterThanOrEqual':
            return Number(itemValue) >= Number(value);
          case 'lessThanOrEqual':
            return Number(itemValue) <= Number(value);
          case 'in':
            return Array.isArray(value) && value.includes(itemValue);
          case 'notIn':
            return Array.isArray(value) && !value.includes(itemValue);
          case 'dateRange':
            if (Array.isArray(value) && value.length === 2) {
              const itemDate = new Date(itemValue);
              return itemDate >= new Date(value[0]) && itemDate <= new Date(value[1]);
            }
            return false;
          default:
            return true;
        }
      });
    });
  }, [filters]);

  /**
   * Sort items based on configuration
   * @param {Array} items - Items to sort
   * @returns {Array} Sorted items
   */
  const applySorting = useCallback((items) => {
    if (!sortByField) return items;

    return [...items].sort((a, b) => {
      let aVal, bVal;

      if (sortByField === 'relevance') {
        aVal = a._relevanceScore || 0;
        bVal = b._relevanceScore || 0;
      } else {
        aVal = a[sortByField];
        bVal = b[sortByField];
      }

      // Handle null/undefined values
      if (aVal === null || aVal === undefined) return sortOrder === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortOrder === 'asc' ? -1 : 1;

      // Type-specific comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const comparison = aStr.localeCompare(bStr);

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortByField, sortOrder]);

  /**
   * Get search suggestions based on current term
   * @param {string} term - Current search term
   * @returns {Array} Search suggestions
   */
  const getSuggestions = useCallback((term) => {
    if (!showSuggestions || !term || term.length < 2) {
      return [];
    }

    const suggestions = new Set();
    const termLower = term.toLowerCase();

    data.forEach(item => {
      searchFields.forEach(field => {
        const fieldValue = item[field];
        if (typeof fieldValue === 'string') {
          const words = fieldValue.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.includes(termLower) && word !== termLower) {
              suggestions.add(word);
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, maxSuggestions);
  }, [data, searchFields, showSuggestions, maxSuggestions]);

  /**
   * Update search term
   */
  const updateSearchTerm = useCallback((term) => {
    setLoading(true);
    setSearchTerm(term);
  }, []);

  /**
   * Update filter
   */
  const updateFilter = useCallback((field, value, operator = 'equals', type = 'string') => {
    setFilters(prev => ({
      ...prev,
      [field]: { value, operator, type }
    }));
  }, []);

  /**
   * Remove filter
   */
  const removeFilter = useCallback((field) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[field];
      return newFilters;
    });
  }, []);

  /**
   * Clear all filters and search
   */
  const clearAll = useCallback(() => {
    setSearchTerm('');
    setFilters({});
    setLoading(false);
  }, []);

  /**
   * Save search to history
   */
  const saveToHistory = useCallback(() => {
    if (!searchTerm.trim()) return;

    setSearchHistory(prev => {
      const history = prev.filter(item => item !== searchTerm);
      return [searchTerm, ...history].slice(0, 10); // Keep last 10 searches
    });
  }, [searchTerm]);

  /**
   * Load search from history
   */
  const loadFromHistory = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Main search and filtering logic
  const searchResults = useMemo(() => {
    let results = data;

    // Apply search
    if (debouncedSearchTerm) {
      results = searchItems(results, debouncedSearchTerm);
    }

    // Apply filters
    if (Object.keys(filters).length > 0) {
      results = applyFilters(results);
    }

    // Apply sorting
    results = applySorting(results);

    return results;
  }, [data, debouncedSearchTerm, filters, searchItems, applyFilters, applySorting]);

  // Get suggestions based on current search
  const suggestions = useMemo(() => {
    return getSuggestions(searchTerm);
  }, [searchTerm, getSuggestions]);

  // Loading state management
  useEffect(() => {
    if (debouncedSearchTerm === searchTerm) {
      setLoading(false);
    }
  }, [debouncedSearchTerm, searchTerm]);

  // Save to history when search completes
  useEffect(() => {
    if (!loading && debouncedSearchTerm && debouncedSearchTerm.length >= minSearchLength) {
      saveToHistory();
    }
  }, [loading, debouncedSearchTerm, minSearchLength, saveToHistory]);

  return {
    // Results
    searchResults,
    suggestions,
    totalCount: data.length,
    filteredCount: searchResults.length,
    hasResults: searchResults.length > 0,
    hasFilters: Object.keys(filters).length > 0,

    // Search state
    searchTerm,
    filters,
    loading,
    sortByField,
    sortOrder,

    // Search management
    updateSearchTerm,
    updateFilter,
    removeFilter,
    clearAll,
    setSortByField,
    setSortOrder,

    // History
    searchHistory,
    loadFromHistory,

    // Utilities
    getActiveFilters: () => Object.entries(filters).map(([field, config]) => ({ field, ...config })),
    hasActiveSearch: () => searchTerm.trim().length >= minSearchLength,
    getSearchStats: () => ({
      searchedTerm: debouncedSearchTerm,
      resultsFound: searchResults.length,
      filtersApplied: Object.keys(filters).length
    })
  };
};

/**
 * Hook for real-time search with instant feedback
 * @param {Array} data - Data to search
 * @param {Object} config - Configuration
 * @returns {Object} Real-time search utilities
 */
export const useRealTimeSearch = (data = [], config = {}) => {
  const {
    searchFields = [],
    instantResults = true,
    highlightMatches = true,
    maxResults = 50
  } = config;

  const [searchTerm, setSearchTerm] = useState('');
  const [instantResultsState, setInstantResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  /**
   * Search for items with instant feedback
   */
  const performInstantSearch = useCallback((term) => {
    if (!term || term.length < 1) {
      setInstantResults([]);
      return;
    }

    const termLower = term.toLowerCase();
    const results = data
      .filter(item => {
        return searchFields.some(field => {
          const fieldValue = item[field];
          return typeof fieldValue === 'string' &&
                 fieldValue.toLowerCase().includes(termLower);
        });
      })
      .map(item => {
        const highlightedItem = { ...item };

        if (highlightMatches) {
          searchFields.forEach(field => {
            const fieldValue = item[field];
            if (typeof fieldValue === 'string') {
              const regex = new RegExp(`(${term})`, 'gi');
              highlightedItem[`${field}_highlighted`] =
                fieldValue.replace(regex, '<mark>$1</mark>');
            }
          });
        }

        return highlightedItem;
      })
      .slice(0, maxResults);

    setInstantResults(results);
  }, [data, searchFields, highlightMatches, maxResults]);

  /**
   * Handle search term change
   */
  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (instantResults) {
      performInstantSearch(term);
    }

    // Set typing to false after delay
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500);
  }, [instantResults, performInstantSearch]);

  return {
    searchTerm,
    setSearchTerm: handleSearchChange,
    instantResults: instantResultsState,
    isTyping,
    clearSearch: () => handleSearchChange('')
  };
};

export default {
  useAdvancedSearch,
  useRealTimeSearch
};