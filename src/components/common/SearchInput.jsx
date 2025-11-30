import PropTypes from 'prop-types';
import React from 'react';

import styles from './SearchInput.module.css';

/**
 * Search input component with debouncing support
 * @param {Object} props - Component props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS class
 * @param {boolean} props.showClearButton - Whether to show clear button
 * @param {Function} props.onClear - Clear button handler
 */
const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
  showClearButton = true,
  onClear
}) => {
  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: '' } });
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`${styles.searchInput} ${className}`}>
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={styles.input}
          aria-label={placeholder}
        />
        {showClearButton && value && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

SearchInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  showClearButton: PropTypes.bool,
  onClear: PropTypes.func
};

export default SearchInput;