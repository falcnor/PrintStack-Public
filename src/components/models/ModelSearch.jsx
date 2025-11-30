import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';

import { useFilters, useDebounce } from '../../hooks/index.js';
import AdvancedFilters from '../common/AdvancedFilters.jsx';
import SearchInput from '../common/SearchInput.jsx';

import styles from './ModelSearch.module.css';

/**
 * Model search component with filtering and sorting capabilities
 * @param {Object} props - Component props
 * @param {Array} props.models - Array of model objects
 * @param {Function} props.onFilteredResults - Callback for filtered results
 * @param {Function} props.onSearchChange - Callback for search changes
 * @param {Object} props.initialFilters - Initial filter values
 * @param {boolean} props.showAdvanced - Whether to show advanced filters
 * @param {boolean} props.showSortOptions - Whether to show sort options
 * @param {boolean} props.compact - Whether to use compact styling
 */
const ModelSearch = ({
  models = [],
  onFilteredResults,
  onSearchChange,
  initialFilters = {},
  showAdvanced = true,
  showSortOptions = true,
  compact = false
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(
    initialFilters.searchQuery || ''
  );

  // Debounce search query to prevent excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sort options for models
  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'category', label: 'Category' },
    { value: 'difficulty', label: 'Difficulty' },
    { value: 'printTime', label: 'Print Time' },
    { value: 'created', label: 'Date Created' },
    { value: 'updated', label: 'Date Updated' },
    { value: 'requirementCount', label: 'Requirements' }
  ];

  // Filter configuration
  const filterConfig = {
    search: debouncedSearchQuery,
    category: initialFilters.category || '',
    difficulty: initialFilters.difficulty || '',
    canPrint: initialFilters.canPrint || '',
    minPrintTime: initialFilters.minPrintTime || '',
    maxPrintTime: initialFilters.maxPrintTime || '',
    hasRequirements: initialFilters.hasRequirements || '',
    sortBy: initialFilters.sortBy || 'name'
  };

  // Use custom hook for filtering
  const {
    filteredData,
    setFilter,
    hasActiveFilters,
    getStats
  } = useFilters(models, filterConfig, {
    debounceDelay: 0, // Already debounced at search level
    caseSensitive: false
  });

  // Get available options for dropdowns
  const availableCategories = [...new Set(models.map(model => model.category).filter(Boolean))];
  const availableDifficulties = [...new Set(models.map(model => model.difficulty).filter(Boolean))];

  // Handle filter changes
  const handleFilterChange = (filters) => {
    Object.entries(filters).forEach(([key, value]) => {
      setFilter(key, value);
    });
  };

  // Handle search changes
  const handleSearchChange = (event) => {
    const { value } = event.target;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Handle filter changes from dropdowns
  const handleSpecificFilterChange = (filterName) => (value) => {
    setFilter(filterName, value);
  };

  // Update filtered results when they change
  useEffect(() => {
    if (onFilteredResults) {
      onFilteredResults(filteredData);
    }
  }, [filteredData, onFilteredResults]);

  // Handle advanced filters toggle
  const handleAdvancedToggle = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    const resetConfig = {
      category: '',
      difficulty: '',
      canPrint: '',
      minPrintTime: '',
      maxPrintTime: '',
      hasRequirements: '',
      sortBy: 'name'
    };
    handleFilterChange(resetConfig);
    setShowAdvancedFilters(false);
  };

  const stats = getStats();

  return (
    <div className={`${styles.modelSearch} ${compact ? styles.compact : ''}`}>
      {/* Search Input */}
      <div className={styles.searchSection}>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search models by name, category, or description..."
          className={styles.searchInput}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Quick Filters Row */}
      <div className={styles.quickFilters}>
        {showSortOptions && (
          <div className={styles.sortDropdown}>
            <label className={styles.quickLabel}>Sort:</label>
            <select
              value={filterConfig.sortBy}
              onChange={(e) => handleSpecificFilterChange('sortBy')(e.target.value)}
              className={styles.sortSelect}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick category filter */}
        <div className={styles.quickDropdown}>
          <label className={styles.quickLabel}>Category:</label>
          <select
            value={filterConfig.category}
            onChange={(e) => handleSpecificFilterChange('category')(e.target.value)}
            className={styles.quickSelect}
          >
            <option value="">All Categories</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <AdvancedFilters
          filters={{
            category: filterConfig.category,
            difficulty: filterConfig.difficulty,
            canPrint: filterConfig.canPrint,
            minPrintTime: filterConfig.minPrintTime,
            maxPrintTime: filterConfig.maxPrintTime,
            hasRequirements: filterConfig.hasRequirements,
            sortBy: filterConfig.sortBy
          }}
          onFilterChange={handleFilterChange}
          availableCategories={availableCategories}
          availableDifficulties={availableDifficulties}
          sortOptions={sortOptions}
          isVisible={showAdvancedFilters}
          onToggle={handleAdvancedToggle}
          onReset={handleResetFilters}
          showPriceRange={false}
          showTimeRange={true}
          compact={compact}
        />
      )}

      {/* Results Summary */}
      <div className={styles.resultsSummary}>
        <span className={styles.resultCount}>
          Showing {stats.filteredItems} of {stats.totalItems} models
        </span>
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className={styles.clearFilters}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};

ModelSearch.propTypes = {
  models: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      category: PropTypes.string,
      difficulty: PropTypes.string,
      printTime: PropTypes.number,
      requirements: PropTypes.array,
      createdAt: PropTypes.string,
      updatedAt: PropTypes.string
    })
  ).isRequired,
  onFilteredResults: PropTypes.func,
  onSearchChange: PropTypes.func,
  initialFilters: PropTypes.object,
  showAdvanced: PropTypes.bool,
  showSortOptions: PropTypes.bool,
  compact: PropTypes.bool
};

export default ModelSearch;