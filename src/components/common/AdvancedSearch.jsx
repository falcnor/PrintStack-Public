import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import { useAdvancedSearch, useRealTimeSearch } from '../../hooks/useAdvancedSearch';
import { CrossFade } from './PageTransition';

import styles from './AdvancedSearch.module.css';

/**
 * Advanced search component with filters and suggestions
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to search
 * @param {Array} props.searchFields - Fields to search in
 * @param {Function} props.onResultsChange - Callback when results change
 * @param {Object} props.filterOptions - Available filter options
 * @param {boolean} props.showSuggestions - Whether to show suggestions
 * @param {boolean} props.showHistory - Whether to show search history
 * @param {boolean} props.realTimeSearch - Whether to use real-time search
 * @param {Object} props.config - Additional search configuration
 */
const AdvancedSearch = ({
  data = [],
  searchFields = [],
  onResultsChange,
  filterOptions = {},
  showSuggestions = true,
  showHistory = true,
  realTimeSearch = false,
  config = {}
}) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedResults, setDebouncedResults] = useState([]);

  const searchHook = realTimeSearch
    ? useRealTimeSearch(data, { searchFields, ...config })
    : useAdvancedSearch(data, { searchFields, showSuggestions, ...config });

  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    suggestions,
    loading,
    updateFilter,
    removeFilter,
    filters,
    clearAll,
    sortByField,
    setSortByField,
    sortOrder,
    setSortOrder,
    searchHistory,
    loadFromHistory,
    getActiveFilters,
    hasActiveSearch
  } = searchHook;

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchTerm(suggestion);
    setIsFocused(false);
  }, [setSearchTerm]);

  /**
   * Handle history item click
   */
  const handleHistoryItemClick = useCallback((term) => {
    loadFromHistory(term);
    setIsFocused(false);
  }, [loadFromHistory]);

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((field, value, operator = 'equals') => {
    updateFilter(field, value, operator);
  }, [updateFilter]);

  /**
   * Clear specific filter
   */
  const handleClearFilter = useCallback((field) => {
    removeFilter(field);
  }, [removeFilter]);

  /**
   * Clear all
   */
  const handleClearAll = useCallback(() => {
    clearAll();
    setIsFocused(false);
  }, [clearAll]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && isFocused) {
      setIsFocused(false);
    }
  }, [isFocused]);

  /**
   * Update results externally
   */
  useEffect(() => {
    if (onResultsChange) {
      const timeout = setTimeout(() => {
        setDebouncedResults(searchResults);
        onResultsChange(searchResults, {
          searchTerm,
          filters: getActiveFilters(),
          sortBy: sortByField,
          sortOrder
        });
      }, 300); // Debounce result updates

      return () => clearTimeout(timeout);
    }
  }, [searchResults, onResultsChange, searchTerm, getActiveFilters, sortByField, sortOrder]);

  const activeFilters = getActiveFilters();
  const showSuggestionDropdown = isFocused && (suggestions.length > 0 || (showHistory && searchHistory.length > 0));

  return (
    <div className={styles.advancedSearch}>
      {/* Main search input */}
      <div className={styles.searchInputContainer}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className={styles.searchInput}
            aria-label="Search"
            aria-expanded={showSuggestionDropdown}
            aria-autocomplete="list"
          />

          {loading && <div className={styles.loadingSpinner} />}

          {(searchTerm || activeFilters.length > 0) && (
            <button
              onClick={handleClearAll}
              className={styles.clearButton}
              aria-label="Clear search and filters"
            >
              ×
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <CrossFade switchContent={showSuggestionDropdown} duration={200}>
          {showSuggestionDropdown ? (
            <div className={styles.suggestionsDropdown}>
              {suggestions.length > 0 && (
                <div className={styles.suggestionsSection}>
                  <div className={styles.sectionTitle}>Suggestions</div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`suggestion-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={styles.suggestionItem}
                      role="option"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {showHistory && searchHistory.length > 0 && suggestions.length === 0 && (
                <div className={styles.historySection}>
                  <div className={styles.sectionTitle}>Recent Searches</div>
                  {searchHistory.map((term, index) => (
                    <button
                      key={`history-${index}`}
                      onClick={() => handleHistoryItemClick(term)}
                      className={styles.historyItem}
                      role="option"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </CrossFade>
      </div>

      {/* Filter controls */}
      {Object.keys(filterOptions).length > 0 && (
        <div className={styles.filtersContainer}>
          <div className={styles.filtersHeader}>
            <span className={styles.filtersTitle}>Filters</span>
            <button
              onClick={() => {
                Object.keys(filterOptions).forEach(field => {
                  const filter = activeFilters.find(f => f.field === field);
                  if (filter) {
                    handleClearFilter(filter.field);
                  }
                });
              }}
              className={styles.clearFiltersButton}
              disabled={activeFilters.length === 0}
            >
              Clear All
            </button>
          </div>

          <div className={styles.filterControls}>
            {Object.entries(filterOptions).map(([field, options]) => {
              const activeFilter = activeFilters.find(f => f.field === field);

              return (
                <div key={field} className={styles.filterGroup}>
                  <label className={styles.filterLabel}>
                    {options.label || field}
                  </label>

                  {options.type === 'select' && (
                    <select
                      value={activeFilter?.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleFilterChange(field, value, options.operator);
                        } else {
                          handleClearFilter(field);
                        }
                      }}
                      className={styles.filterSelect}
                    >
                      <option value="">All {options.label || field}</option>
                      {options.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {options.type === 'multiselect' && (
                    <div className={styles.multiselectContainer}>
                      {options.options.map((option) => {
                        const isActive = activeFilter?.value?.includes(option.value);

                        return (
                          <label key={option.value} className={styles.checkboxOption}>
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => {
                                const currentValue = activeFilter?.value || [];
                                const newValue = e.target.checked
                                  ? [...currentValue, option.value]
                                  : currentValue.filter(v => v !== option.value);

                                if (newValue.length > 0) {
                                  handleFilterChange(field, newValue, 'in');
                                } else {
                                  handleClearFilter(field);
                                }
                              }}
                            />
                            {option.label}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {options.type === 'range' && (
                    <div className={styles.rangeContainer}>
                      <input
                        type="range"
                        min={options.min}
                        max={options.max}
                        step={options.step}
                        value={activeFilter?.value || options.min}
                        onChange={(e) => {
                          handleFilterChange(field, Number(e.target.value), options.operator);
                        }}
                        className={styles.rangeInput}
                      />
                      <span className={styles.rangeValue}>
                        {activeFilter?.value || options.min}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className={styles.activeFilters}>
          <span className={styles.activeFiltersLabel}>Active Filters:</span>
          {activeFilters.map((filter) => (
            <span key={filter.field} className={styles.activeFilter}>
              {filter.field}: {String(filter.value)}
              <button
                onClick={() => handleClearFilter(filter.field)}
                className={styles.removeFilter}
                aria-label={`Remove ${filter.field} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Sort controls */}
      <div className={styles.sortControls}>
        <label className={styles.sortLabel}>Sort by:</label>
        <select
          value={sortByField || 'relevance'}
          onChange={(e) => setSortByField(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="relevance">Relevance</option>
          {searchFields.map((field) => (
            <option key={field} value={field}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className={styles.sortOrderButton}
          aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Search stats */}
      {hasActiveSearch && (
        <div className={styles.searchStats}>
          Found {searchResults.length} results
          {activeFilters.length > 0 && ` with ${activeFilters.length} filter${activeFilters.length > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
};

// PropTypes
AdvancedSearch.propTypes = {
  data: PropTypes.array,
  searchFields: PropTypes.array.isRequired,
  onResultsChange: PropTypes.func,
  filterOptions: PropTypes.object,
  showSuggestions: PropTypes.bool,
  showHistory: PropTypes.bool,
  realTimeSearch: PropTypes.bool,
  config: PropTypes.object
};

export default AdvancedSearch;