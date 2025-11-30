import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { debounce } from '../../utils/helpers';

import styles from './VirtualTable.module.css';

/**
 * Virtual scrolling table component for large datasets
 * @param {Object} props - Component props
 * @param {Array} props.data - Data to display
 * @param {Array} props.columns - Column configuration
 * @param {number} props.itemHeight - Height of each row in pixels
 * @param {number} props.visibleCount - Number of visible rows
 * @param {boolean} props.enableVirtualScroll - Enable virtual scrolling
 * @param {Function} props.onRowClick - Row click handler
 * @param {Function} props.onSelectionChange - Selection change handler
 * @param {Object} props.selection - Current selection state
 * @param {Object} props.sortConfig - Sorting configuration
 * @param {Function} props.onSort - Sort change handler
 * @param {boolean} props.enableBulkSelection - Enable bulk selection
 * @param {Object} props.style - Additional container styles
 */
const VirtualTable = ({
  data = [],
  columns = [],
  itemHeight = 50,
  visibleCount = 20,
  enableVirtualScroll = true,
  onRowClick,
  onSelectionChange,
  selection = {},
  sortConfig,
  onSort,
  enableBulkSelection = true,
  ...props
}) => {
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(visibleCount * itemHeight);
  const [selectedRows, setSelectedRows] = useState(new Set(selection.selectedRows || []));
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Calculate virtual scrolling parameters
  const totalCount = data.length;
  const totalHeight = totalCount * itemHeight;
  const startIndex = enableVirtualScroll ? Math.max(0, Math.floor(scrollTop / itemHeight) - 2) : 0;
  const endIndex = Math.min(totalCount, startIndex + visibleCount + 4);
  const visibleData = enableVirtualScroll ? data.slice(startIndex, endIndex) : data;
  const offsetY = enableVirtualScroll ? startIndex * itemHeight : 0;

  // Handle shift key for range selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update container height based on visible count
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const calculatedHeight = Math.min(visibleCount * itemHeight, rect.height);
      setContainerHeight(calculatedHeight);
    }
  }, [visibleCount, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // Debounced scroll handler for performance
  const debouncedScroll = useMemo(() => debounce(handleScroll, 16), [handleScroll]);

  // Row selection management
  const handleRowSelection = useCallback((rowIndex, isSelected, e) => {
    if (!enableBulkSelection) return;

    let newSelectedRows;
    const rowId = data[startIndex + rowIndex].id;

    if (isShiftPressed && selectedRows.size > 0) {
      // Range selection
      const lastSelectedIndex = Array.from(selectedRows)
        .map(id => data.findIndex(item => item.id === id))
        .find(index => index >= 0);

      if (lastSelectedIndex !== undefined) {
        const currentIndex = startIndex + rowIndex;
        const minIndex = Math.min(lastSelectedIndex, currentIndex);
        const maxIndex = Math.max(lastSelectedIndex, currentIndex);

        newSelectedRows = new Set(selectedRows);
        for (let i = minIndex; i <= maxIndex; i++) {
          if (isSelected) {
            newSelectedRows.add(data[i].id);
          } else {
            newSelectedRows.delete(data[i].id);
          }
        }
      } else {
        newSelectedRows = new Set(selectedRows);
        if (isSelected) {
          newSelectedRows.add(rowId);
        } else {
          newSelectedRows.delete(rowId);
        }
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle selection
      newSelectedRows = new Set(selectedRows);
      if (isSelected) {
        newSelectedRows.add(rowId);
      } else {
        newSelectedRows.delete(rowId);
      }
    } else {
      // Replace selection
      newSelectedRows = new Set(isSelected ? [rowId] : []);
    }

    setSelectedRows(newSelectedRows);
    setIsSelectAll(newSelectedRows.size === data.length);

    if (onSelectionChange) {
      onSelectionChange({
        selectedRows: Array.from(newSelectedRows),
        count: newSelectedRows.size,
        isAllSelected: newSelectedRows.size === data.length
      });
    }
  }, [data, startIndex, selectedRows, isShiftPressed, enableBulkSelection, onSelectionChange]);

  // Select all functionality
  const handleSelectAll = useCallback((isSelected) => {
    const newSelectedRows = isSelected ? new Set(data.map(item => item.id)) : new Set();
    setSelectedRows(newSelectedRows);
    setIsSelectAll(isSelected);

    if (onSelectionChange) {
      onSelectionChange({
        selectedRows: Array.from(newSelectedRows),
        count: newSelectedRows.size,
        isAllSelected: isSelected
      });
    }
  }, [data, onSelectionChange]);

  // Sort handling
  const handleSort = useCallback((columnKey) => {
    if (onSort) {
      const newDirection = sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      onSort({ key: columnKey, direction: newDirection });
    }
  }, [onSort, sortConfig]);

  // Row click handler
  const handleRowClick = useCallback((row, index, e) => {
    // Don't trigger row click if clicking on checkbox or interactive elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }

    if (onRowClick) {
      onRowClick(row, startIndex + index, e);
    }
  }, [onRowClick, startIndex]);

  // Get sort indicator
  const getSortIndicator = (columnKey) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? '▲' : '▼';
    }
    return null;
  };

  // Render table cell
  const renderCell = useCallback((row, column, columnIndex, rowIndex) => {
    const value = column.accessor(row[columnKey]);
    const cellContent = column.render ? column.render(value, row, rowIndex) : value;

    return (
      <div
        key={`${column.key || columnIndex}`}
        className={styles.cell}
        style={{ width: column.width, flex: column.flex }}
        title={typeof value === 'string' ? value : ''}
      >
        {cellContent}
      </div>
    );
  }, []);

  return (
    <div className={styles.virtualTableContainer} style={props.style}>
      {/* Header */}
      <div className={styles.tableHeader}>
        {enableBulkSelection && (
          <div className={`${styles.headerCell} ${styles.selectionColumn}`}>
            <input
              type="checkbox"
              checked={isSelectAll}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all rows"
            />
          </div>
        )}

        {columns.map((column, index) => (
          <button
            key={column.key || index}
            className={styles.headerCell}
            style={{ width: column.width, flex: column.flex }}
            onClick={() => column.sortable !== false && handleSort(column.key || Object.keys(data[0] || {})[index])}
            disabled={column.sortable === false}
          >
            <span className={styles.headerContent}>
              {column.header}
              {column.sortable !== false && getSortIndicator(column.key || Object.keys(data[0] || {})[index]) && (
                <span className={styles.sortIndicator}>
                  {getSortIndicator(column.key || Object.keys(data[0] || {})[index])}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        className={styles.tableScrollContainer}
        style={{ height: containerHeight }}
        onScroll={debouncedScroll}
      >
        {enableVirtualScroll ? (
          <div
            ref={scrollElementRef}
            className={styles.scrollContent}
            style={{ height: totalHeight }}
          >
            <div
              className={styles.visibleContent}
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              {visibleData.map((row, rowIndex) => {
                const globalRowIndex = startIndex + rowIndex;
                const isSelected = selectedRows.has(row.id);

                return (
                  <div
                    key={row.id || globalRowIndex}
                    className={`${styles.tableRow} ${isSelected ? styles.selectedRow : ''}`}
                    style={{ height: itemHeight }}
                    onClick={(e) => handleRowClick(row, rowIndex, e)}
                  >
                    {enableBulkSelection && (
                      <div className={`${styles.cell} ${styles.selectionColumn}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleRowSelection(rowIndex, e.target.checked, e)}
                          aria-label={`Select row ${globalRowIndex + 1}`}
                        />
                      </div>
                    )}

                    {columns.map((column, columnIndex) =>
                      renderCell(row, column, columnIndex, rowIndex)
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Non-virtual mode for small datasets
          <div className={styles.nonVirtualContent}>
            {visibleData.map((row, rowIndex) => {
              const isSelected = selectedRows.has(row.id);

              return (
                <div
                  key={row.id || rowIndex}
                  className={`${styles.tableRow} ${isSelected ? styles.selectedRow : ''}`}
                  style={{ height: itemHeight }}
                  onClick={(e) => handleRowClick(row, rowIndex, e)}
                >
                  {enableBulkSelection && (
                    <div className={`${styles.cell} ${styles.selectionColumn}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelection(rowIndex, e.target.checked, e)}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </div>
                  )}

                  {columns.map((column, columnIndex) =>
                    renderCell(row, column, columnIndex, rowIndex)
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with selection info */}
      {enableBulkSelection && selectedRows.size > 0 && (
        <div className={styles.tableFooter}>
          <span className={styles.selectionInfo}>
            {selectedRows.size} of {totalCount} row{selectedRows.size !== 1 ? 's' : ''} selected
          </span>
          <button
            className={styles.clearSelectionButton}
            onClick={() => handleSelectAll(false)}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for virtual scrolling table data
 * @param {Array} data - Original data
 * @param {Object} config - Configuration
 * @returns {Object} Virtual table utilities
 */
export const useVirtualTableData = (data = [], config = {}) => {
  const {
    sortConfig,
    filters,
    pageSize = 50,
    enableClientSide = true
  } = config;

  const [currentPage, setCurrentPage] = useState(1);
  const [selection, setSelection] = useState({ selectedRows: [], isAllSelected: false });

  // Apply filters and sorting
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      result = result.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (Array.isArray(value)) {
            return value.includes(item[key]);
          }
          return item[key] === value;
        });
      });
    }

    // Apply sorting
    if (sortConfig && sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle null values
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        const comparison = aVal.localeCompare(bVal);
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [data, sortConfig, filters]);

  // Pagination for client-side processing
  const paginatedData = useMemo(() => {
    if (!enableClientSide) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, enableClientSide]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  return {
    data: paginatedData,
    allData: processedData,
    totalCount: processedData.length,
    currentPage,
    totalPages,
    pageSize,
    selection,
    setSelection,
    setCurrentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToNextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
    goToPrevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1))
  };
};

// PropTypes
VirtualTable.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      accessor: PropTypes.func,
      render: PropTypes.func,
      width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      flex: PropTypes.number,
      sortable: PropTypes.bool
    })
  ).isRequired,
  itemHeight: PropTypes.number,
  visibleCount: PropTypes.number,
  enableVirtualScroll: PropTypes.bool,
  onRowClick: PropTypes.func,
  onSelectionChange: PropTypes.func,
  selection: PropTypes.object,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  }),
  onSort: PropTypes.func,
  enableBulkSelection: PropTypes.bool,
  style: PropTypes.object
};

export default VirtualTable;