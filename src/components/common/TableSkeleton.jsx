import PropTypes from 'prop-types';
import React, { memo } from 'react';

import styles from './TableSkeleton.module.css';

/**
 * Loading skeleton component for tables
 * @param {Object} props - Component props
 * @param {number} props.rows - Number of skeleton rows to display
 * @param {number} props.columns - Number of skeleton columns to display
 * @param {string} props.className - Additional CSS class
 */
const TableSkeleton = ({ rows = 5, columns = 7, className = '' }) => {
  return (
    <div className={`${styles.loadingContainer} ${className}`}>
      <div className={styles.skeletonTable}>
        <div className={styles.skeletonHeader}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className={styles.skeletonCell}></div>
          ))}
        </div>
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className={styles.skeletonRow}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className={styles.skeletonCell}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

TableSkeleton.propTypes = {
  rows: PropTypes.number,
  columns: PropTypes.number,
  className: PropTypes.string
};

export default memo(TableSkeleton);