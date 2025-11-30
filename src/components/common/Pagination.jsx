import PropTypes from 'prop-types';
import React, { memo } from 'react';

import styles from './Pagination.module.css';

/**
 * Pagination component for table navigation
 * @param {Object} props - Component props
 * @param {Object} props.paginationInfo - Pagination information from useTablePagination hook
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.goToFirstPage - Go to first page handler
 * @param {Function} props.goToLastPage - Go to last page handler
 * @param {Function} props.goToNextPage - Go to next page handler
 * @param {Function} props.goToPrevPage - Go to previous page handler
 * @param {Function} props.getVisiblePages - Get visible page numbers handler
 */
const Pagination = ({
  paginationInfo,
  onPageChange,
  goToFirstPage,
  goToLastPage,
  goToNextPage,
  goToPrevPage,
  getVisiblePages
}) => {
  const {
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage
  } = paginationInfo;

  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages();

  return (
    <div className={styles.pagination}>
      <div className={styles.paginationInfo}>
        Page {currentPage} of {totalPages}
      </div>

      <div className={styles.paginationControls}>
        <button
          onClick={goToFirstPage}
          disabled={isFirstPage}
          className={styles.paginationButton}
          aria-label="First page"
        >
          ⏮️ First
        </button>

        <button
          onClick={goToPrevPage}
          disabled={isFirstPage}
          className={styles.paginationButton}
          aria-label="Previous page"
        >
          ◀️ Previous
        </button>

        <div className={styles.pageNumbers}>
          {visiblePages.map(pageNum => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`${styles.pageNumber} ${
                currentPage === pageNum ? styles.activePage : ''
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          onClick={goToNextPage}
          disabled={isLastPage}
          className={styles.paginationButton}
          aria-label="Next page"
        >
          Next ▶️
        </button>

        <button
          onClick={goToLastPage}
          disabled={isLastPage}
          className={styles.paginationButton}
          aria-label="Last page"
        >
          Last ⏭️
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  paginationInfo: PropTypes.shape({
    totalItems: PropTypes.number.isRequired,
    totalPages: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    startIndex: PropTypes.number.isRequired,
    endIndex: PropTypes.number.isRequired,
    hasNextPage: PropTypes.bool.isRequired,
    hasPrevPage: PropTypes.bool.isRequired,
    isFirstPage: PropTypes.bool.isRequired,
    isLastPage: PropTypes.bool.isRequired
  }).isRequired,
  onPageChange: PropTypes.func.isRequired,
  goToFirstPage: PropTypes.func.isRequired,
  goToLastPage: PropTypes.func.isRequired,
  goToNextPage: PropTypes.func.isRequired,
  goToPrevPage: PropTypes.func.isRequired,
  getVisiblePages: PropTypes.func.isRequired
};

export default memo(Pagination);