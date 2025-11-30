import { useState, useMemo, useCallback } from 'react';

import { paginate } from '../utils/arrayUtils.js';
import { PAGINATION } from '../utils/constants.js';

/**
 * Custom hook for pagination functionality
 * @param {Array} data - Array of items to paginate
 * @param {number} initialPageSize - Initial page size
 * @param {Object} options - Additional options
 * @returns {Object} Pagination utilities and state
 */
export const usePagination = (data = [], initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE, options = {}) => {
  const { maxButtons = 5, showFirstLast = true, showPrevNext = true } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationData = useMemo(() => {
    return paginate(data, currentPage, pageSize);
  }, [data, currentPage, pageSize]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page) => {
    const validPage = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(validPage);
  }, [paginationData.totalPages]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [paginationData.hasNextPage, currentPage, goToPage]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (paginationData.hasPrevPage) {
      goToPage(currentPage - 1);
    }
  }, [paginationData.hasPrevPage, currentPage, goToPage]);

  /**
   * Go to first page
   */
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  /**
   * Go to last page
   */
  const lastPage = useCallback(() => {
    goToPage(paginationData.totalPages);
  }, [goToPage, paginationData.totalPages]);

  /**
   * Change page size
   */
  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
    setPageSize(initialPageSize);
  }, [initialPageSize]);

  /**
   * Generate page numbers for pagination controls
   */
  const pageNumbers = useMemo(() => {
    const { totalPages } = paginationData;
    if (totalPages <= 1) return [];

    const numbers = [];
    const start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);

    // Adjust start if we're near the end
    const adjustedStart = Math.max(1, end - maxButtons + 1);

    for (let i = adjustedStart; i <= end; i++) {
      numbers.push(i);
    }

    return numbers;
  }, [paginationData.totalPages, currentPage, maxButtons]);

  /**
   * Check if page number should be shown
   */
  const shouldShowPage = useCallback((pageNum) => {
    return pageNumbers.includes(pageNum);
  }, [pageNumbers]);

  /**
   * Get visible pages (first, last, with ellipsis if needed)
   */
  const getVisiblePages = useCallback(() => {
    const pages = pageNumbers;
    const { totalPages } = paginationData;

    if (totalPages <= 1) return [];

    const visible = [];

    // First page
    if (showFirstLast && !shouldShowPage(1) && totalPages > maxButtons) {
      visible.push(1);
      if (!shouldShowPage(2)) {
        visible.push('...');
      }
    }

    // Middle pages
    pages.forEach(page => visible.push(page));

    // Last page
    if (showFirstLast && !shouldShowPage(totalPages) && totalPages > maxButtons) {
      if (!shouldShowPage(totalPages - 1)) {
        visible.push('...');
      }
      visible.push(totalPages);
    }

    return visible;
  }, [pageNumbers, paginationData.totalPages, maxButtons, showFirstLast, shouldShowPage]);

  /**
   * Get pagination info string
   */
  const getInfo = useCallback(() => {
    const { totalItems } = paginationData;
    if (totalItems === 0) return 'No items';

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return `${start}-${end} of ${totalItems} items`;
  }, [paginationData.totalItems, currentPage, pageSize]);

  /**
   * Jump to page by item index
   */
  const goToItemPage = useCallback((itemIndex) => {
    const pageNumber = Math.ceil((itemIndex + 1) / pageSize);
    goToPage(pageNumber);
  }, [goToPage, pageSize]);

  /**
   * Get total pages count
   */
  const totalPagesCount = paginationData.totalPages;

  /**
   * Check if pagination is needed
   */
  const needsPagination = paginationData.totalPages > 1;

  /**
   * Get page size options
   */
  const pageSizeOptions = PAGINATION.PAGE_SIZE_OPTIONS;

  return {
    // Data
    items: paginationData.items,
    currentPage,
    pageSize,
    totalPages: paginationData.totalPages,
    totalItems: paginationData.totalItems,

    // State indicators
    hasNextPage: paginationData.hasNextPage,
    hasPrevPage: paginationData.hasPrevPage,
    needsPagination,

    // Navigation
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    goToItemPage,

    // Configuration
    changePageSize,
    reset,
    pageSizeOptions,

    // Display helpers
    pageNumbers,
    getVisiblePages,
    shouldShowPage,
    getInfo
  };
};

/**
 * Hook for infinite scroll pagination
 * @param {Function} fetchMore - Function to fetch more data
 * @param {Object} options - Configuration options
 * @returns {Object} Infinite scroll utilities
 */
export const useInfiniteScroll = (fetchMore, options = {}) => {
  const {
    threshold = 0.8,
    pageSize = 20,
    initialPage = 1
  } = options;

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);

  const loadMore = useCallback(async() => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMore(page, pageSize);
      setHasMore(result.hasMore !== false);
      setPage(prev => prev + 1);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, pageSize, loading, hasMore]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLoading(false);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  const observerOptions = useMemo(() => ({
    root: null,
    rootMargin: '0px',
    threshold
  }), [threshold]);

  return {
    loading,
    hasMore,
    error,
    loadMore,
    reset,
    page: page - 1, // Zero-based page index
    observerOptions
  };
};