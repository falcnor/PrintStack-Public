import PropTypes from 'prop-types';
import React from 'react';

import styles from './AdvancedFilters.module.css';
import FilterDropdown from './FilterDropdown.jsx';
import SearchInput from './SearchInput.jsx';


/**
 * Advanced filters panel component
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Filter change handler
 * @param {Array} props.availableCategories - Available category options
 * @param {Array} props.availableDifficulties - Available difficulty options
 * @param {Array} props.sortOptions - Available sort options
 * @param {boolean} props.isVisible - Whether the advanced filters are visible
 * @param {Function} props.onToggle - Toggle visibility handler
 * @param {Function} props.onReset - Reset filters handler
 * @param {boolean} props.showPriceRange - Whether to show price range filters
 * @param {boolean} props.showTimeRange - Whether to show time range filters
 * @param {boolean} props.compact - Whether to use compact styling
 */
const AdvancedFilters = ({
  filters = {},
  onFilterChange,
  availableCategories = [],
  availableDifficulties = [],
  sortOptions = [],
  isVisible = false,
  onToggle,
  onReset,
  showPriceRange = true,
  showTimeRange = true,
  compact = false
}) => {
  const handleFilterChange = (filterName) => (value) => {
    onFilterChange({
      ...filters,
      [filterName]: value
    });
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      difficulty: '',
      canPrint: '',
      minPrice: '',
      maxPrice: '',
      minPrintTime: '',
      maxPrintTime: '',
      hasRequirements: '',
      sortBy: 'name'
    };
    onFilterChange(resetFilters);
    if (onReset) {
      onReset();
    }
  };

  const hasActiveFilters = Object.values(filters).some(value =>
    value !== '' && value !== undefined && value !== null
  );

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className={`${styles.toggleButton} ${compact ? styles.compact : ''}`}
      >
        ⚙️ Advanced Filters
      </button>
    );
  }

  return (
    <div className={`${styles.advancedFilters} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Advanced Filters</h3>
        <button
          onClick={onToggle}
          className={styles.closeButton}
          aria-label="Close filters"
        >
          ×
        </button>
      </div>

      <div className={styles.filtersGrid}>
        {/* Category Filter */}
        <FilterDropdown
          value={filters.category || ''}
          options={[
            { value: '', label: 'All Categories' },
            ...availableCategories.map(cat => ({ value: cat, label: cat }))
          ]}
          onChange={handleFilterChange('category')}
          label="Category"
          placeholder="Select category"
        />

        {/* Difficulty Filter */}
        <FilterDropdown
          value={filters.difficulty || ''}
          options={[
            { value: '', label: 'All Difficulties' },
            ...availableDifficulties.map(diff => ({ value: diff, label: diff }))
          ]}
          onChange={handleFilterChange('difficulty')}
          label="Difficulty"
          placeholder="Select difficulty"
        />

        {/* Printable Status Filter */}
        <FilterDropdown
          value={filters.canPrint || ''}
          options={[
            { value: '', label: 'All Files' },
            { value: 'true', label: 'Can Print' },
            { value: 'false', label: 'Cannot Print' }
          ]}
          onChange={handleFilterChange('canPrint')}
          label="Printable"
          placeholder="All files"
        />

        {/* Requirements Filter */}
        <FilterDropdown
          value={filters.hasRequirements || ''}
          options={[
            { value: '', label: 'All Models' },
            { value: 'true', label: 'Has Requirements' },
            { value: 'false', label: 'No Requirements' }
          ]}
          onChange={handleFilterChange('hasRequirements')}
          label="Requirements"
          placeholder="All models"
        />

        {/* Price Range (if enabled) */}
        {showPriceRange && (
          <>
            <div className={styles.rangeFilter}>
              <label className={styles.label}>Min Price ($)</label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice')(e.target.value)}
                placeholder="0"
                className={styles.rangeInput}
                min="0"
                step="0.01"
              />
            </div>
            <div className={styles.rangeFilter}>
              <label className={styles.label}>Max Price ($)</label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice')(e.target.value)}
                placeholder="1000"
                className={styles.rangeInput}
                min="0"
                step="0.01"
              />
            </div>
          </>
        )}

        {/* Print Time Range (if enabled) */}
        {showTimeRange && (
          <>
            <div className={styles.rangeFilter}>
              <label className={styles.label}>Min Print Time (hrs)</label>
              <input
                type="number"
                value={filters.minPrintTime || ''}
                onChange={(e) => handleFilterChange('minPrintTime')(e.target.value)}
                placeholder="0"
                className={styles.rangeInput}
                min="0"
                step="0.5"
              />
            </div>
            <div className={styles.rangeFilter}>
              <label className={styles.label}>Max Print Time (hrs)</label>
              <input
                type="number"
                value={filters.maxPrintTime || ''}
                onChange={(e) => handleFilterChange('maxPrintTime')(e.target.value)}
                placeholder="24"
                className={styles.rangeInput}
                min="0"
                step="0.5"
              />
            </div>
          </>
        )}

        {/* Sort Options */}
        <FilterDropdown
          value={filters.sortBy || 'name'}
          options={sortOptions}
          onChange={handleFilterChange('sortBy')}
          label="Sort By"
          placeholder="Sort by"
        />
      </div>

      <div className={styles.actions}>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className={styles.resetButton}
          >
            Reset All Filters
          </button>
        )}
        <button
          onClick={onToggle}
          className={styles.applyButton}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

AdvancedFilters.propTypes = {
  filters: PropTypes.object,
  onFilterChange: PropTypes.func.isRequired,
  availableCategories: PropTypes.array,
  availableDifficulties: PropTypes.array,
  sortOptions: PropTypes.array,
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
  onReset: PropTypes.func,
  showPriceRange: PropTypes.bool,
  showTimeRange: PropTypes.bool,
  compact: PropTypes.bool
};

export default AdvancedFilters;