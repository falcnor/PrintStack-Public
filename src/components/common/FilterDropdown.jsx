import PropTypes from 'prop-types';
import React from 'react';

import styles from './FilterDropdown.module.css';

/**
 * Generic filter dropdown component for selecting filter values
 * @param {Object} props - Component props
 * @param {string} props.value - Current selected value
 * @param {Array} props.options - Array of available options
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Field label
 * @param {boolean} props.multiple - Whether multiple selections are allowed
 * @param {boolean} props.allowClear - Whether clear option is available
 * @param {string} props.className - Additional CSS class
 */
const FilterDropdown = ({
  value = '',
  options = [],
  onChange,
  placeholder = 'Select...',
  label,
  multiple = false,
  allowClear = true,
  className = ''
}) => {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  const handleClear = () => {
    onChange('');
  };

  const formatOptions = () => {
    const formattedOptions = [...options];

    // Add clear option at the beginning if allowed and value is selected
    if (allowClear && value) {
      formattedOptions.unshift({ value: '', label: placeholder || 'All' });
    }

    return formattedOptions.map(option => ({
      value: option.value,
      label: option.label || option.value
    }));
  };

  return (
    <div className={`${styles.filterDropdown} ${className}`}>
      {label && (
        <label className={styles.label} htmlFor={`filter-${label}`}>
          {label}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          id={`filter-${label}`}
          value={value}
          onChange={handleChange}
          className={styles.select}
          multiple={multiple}
          aria-label={label || placeholder}
        >
          {!value && !allowClear && (
            <option value="">
              {placeholder}
            </option>
          )}
          {formatOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label={`Clear ${label} filter`}
            title="Clear selection"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

FilterDropdown.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  multiple: PropTypes.bool,
  allowClear: PropTypes.bool,
  className: PropTypes.string
};

export default FilterDropdown;