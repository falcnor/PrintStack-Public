import React, { useMemo, useEffect } from 'react';

/**
 * Custom hook for handling table pagination
 * @param {Array} data - Array of data to paginate
 * @param {number} pageSize - Number of items per page
 * @returns {Object} Pagination state and handlers
 */
export const useTablePagination = (data, pageSize = 25) => {
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      totalItems,
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages
    };
  }, [data.length, currentPage, pageSize]);

  const paginatedData = useMemo(() => {
    return data.slice(paginationInfo.startIndex, paginationInfo.endIndex);
  }, [data, paginationInfo.startIndex, paginationInfo.endIndex]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= paginationInfo.totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(paginationInfo.totalPages);
  const goToNextPage = () => handlePageChange(currentPage + 1);
  const goToPrevPage = () => handlePageChange(currentPage - 1);

  // Reset to page 1 when data changes significantly
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const getVisiblePages = () => {
    const { currentPage, totalPages } = paginationInfo;
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = currentPage - Math.floor(maxVisible / 2);
    let end = start + maxVisible - 1;

    if (start < 1) {
      start = 1;
      end = maxVisible;
    }

    if (end > totalPages) {
      end = totalPages;
      start = totalPages - maxVisible + 1;
    }

    return Array.from({ length: maxVisible }, (_, i) => start + i);
  };

  return {
    paginatedData,
    paginationInfo,
    handlePageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    getVisiblePages
  };
};