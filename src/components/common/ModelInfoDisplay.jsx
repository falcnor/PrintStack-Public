import PropTypes from 'prop-types';
import React, { memo } from 'react';

import styles from './ModelInfoDisplay.module.css';

/**
 * Component to display model information in forms
 * @param {Object} props - Component props
 * @param {Object} props.model - Model object to display
 * @param {Array} props.availableFilaments - Available filament options for the model
 * @param {string} props.className - Additional CSS class
 */
const ModelInfoDisplay = ({ model, availableFilaments = [], className = '' }) => {
  if (!model) {
    return null;
  }

  const canPrint = availableFilaments.every(f => f.available);

  return (
    <div className={`${styles.modelInfo} ${className}`}>
      <h4>Model Information</h4>
      <div className={styles.modelDetails}>
        <p>
          <strong>Category:</strong> {model.category}
        </p>
        <p>
          <strong>Difficulty:</strong> {model.difficulty}
        </p>
        <p>
          <strong>Estimated Time:</strong> {model.printTime}{' '}
          minutes
        </p>
        <p>
          <strong>Can Print:</strong>{' '}
          <span className={canPrint ? styles.available : styles.unavailable}>
            {canPrint ? '✓ Yes' : '✗ No, missing filament'}
          </span>
        </p>
      </div>
    </div>
  );
};

ModelInfoDisplay.propTypes = {
  model: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    difficulty: PropTypes.string,
    printTime: PropTypes.number
  }),
  availableFilaments: PropTypes.arrayOf(
    PropTypes.shape({
      filamentId: PropTypes.string.isRequired,
      available: PropTypes.bool
    })
  ).isRequired,
  className: PropTypes.string
};

export default memo(ModelInfoDisplay);