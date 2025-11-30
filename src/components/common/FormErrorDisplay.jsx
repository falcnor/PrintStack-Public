import PropTypes from 'prop-types';
import React, { memo } from 'react';

import styles from './FormErrorDisplay.module.css';

/**
 * Component to display form validation errors
 * @param {Object} props - Component props
 * @param {Array} props.errors - Array of error messages
 * @param {string} props.className - Additional CSS class
 */
const FormErrorDisplay = ({ errors = [], className = '' }) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.errors} ${className}`}>
      {errors.map((error, index) => (
        <div key={index} className={styles.error}>
          {error}
        </div>
      ))}
    </div>
  );
};

FormErrorDisplay.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.string).isRequired,
  className: PropTypes.string
};

export default memo(FormErrorDisplay);