import PropTypes from 'prop-types';
import React, { useState, useMemo } from 'react';

import { useTablePagination } from '../../hooks/useTablePagination.js';
import { useTableSort } from '../../hooks/useTableSort.js';
import {
  formatCurrency,
  formatWeight,
  calculateFilamentPercentage,
  calculateCostPerGram
} from '../../utils/dataUtils.js';
import Pagination from '../common/Pagination.jsx';
import TableSkeleton from '../common/TableSkeleton.jsx';

import styles from './FilamentTable.module.css';

/**
 * Filament table component with sorting, pagination, and virtualization
 * @param {Object} props - Component props
 * @param {Array} props.filaments - Array of filament objects
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {boolean} props.loading - Loading state
 * @param {number} props.pageSize - Page size for pagination
 */
const FilamentTable = ({
  filaments,
  onEdit,
  onDelete,
  loading = false,
  pageSize = 25
}) => {
  const [virtualizedRows, setVirtualizedRows] = useState(50);

  // Use custom hooks for sorting and pagination
  const { sortedData, handleSort, getSortIndicator } = useTableSort(
    filaments,
    { key: 'name', direction: 'ascending' }
  );

  const {
    paginatedData,
    paginationInfo,
    handlePageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPrevPage,
    getVisiblePages
  } = useTablePagination(sortedData, pageSize);

  // Determine if we should use virtualization
  const totalItems = sortedData.length;
  const useVirtualization = totalItems > virtualizedRows;

  // Get display data based on virtualization/sorting
  const displayFilaments = useMemo(() => {
    if (useVirtualization) {
      return sortedData.slice(0, virtualizedRows);
    }
    return paginatedData;
  }, [sortedData, paginatedData, useVirtualization, virtualizedRows]);

  const getRemainingPercentage = (filament) => {
    if (!filament.weight || !filament.remainingWeight) return null;
    return calculateFilamentPercentage(
      filament.remainingWeight,
      filament.weight
    );
  };

  const getRemainingColor = (percentage) => {
    if (percentage === null) return 'var(--text-muted)';
    if (percentage > 50) return 'var(--success-color)';
    if (percentage > 20) return 'var(--warning-color)';
    return 'var(--error-color)';
  };

  const getFilamentColor = (colorName) => {
    const colorMap = {
      black: '#000000',
      white: '#FFFFFF',
      red: '#FF0000',
      blue: '#0000FF',
      green: '#00FF00',
      yellow: '#FFFF00',
      orange: '#FFA500',
      purple: '#800080',
      pink: '#FFC0CB',
      brown: '#8B4513',
      gray: '#808080',
      grey: '#808080',
      silver: '#C0C0C0',
      gold: '#FFD700',
      translucent: '#E8E8E8',
      clear: '#F8F8F8'
    };

    const lowerColor = colorName.toLowerCase();
    return colorMap[lowerColor] || '#CCCCCC';
  };

  const getVisibleRange = () => {
    if (useVirtualization) {
      return {
        start: 1,
        end: Math.min(virtualizedRows, totalItems),
        total: totalItems
      };
    }
    const start = paginationInfo.startIndex + 1;
    const end = Math.min(paginationInfo.endIndex, totalItems);
    return { start, end, total: totalItems };
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={7} />;
  }

  if (filaments.length === 0) {
    return null; // Let parent component handle empty state
  }

  const visibleRange = getVisibleRange();

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableInfo}>
        <span className={styles.itemCount}>
          Showing {visibleRange.start}-{visibleRange.end} of{' '}
          {visibleRange.total} filaments
        </span>
        {useVirtualization && (
          <span className={styles.virtualizationNotice}>
            (Virtualization enabled - first {virtualizedRows} items)
          </span>
        )}
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('name')}
              scope="col"
            >
              Name{getSortIndicator('name')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('material')}
              scope="col"
            >
              Material{getSortIndicator('material')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('color')}
              scope="col"
            >
              Color{getSortIndicator('color')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('weight')}
              scope="col"
            >
              Weight{getSortIndicator('weight')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('remainingWeight')}
              scope="col"
            >
              Remaining{getSortIndicator('remainingWeight')}
            </th>
            <th
              className={styles.sortableHeader}
              onClick={() => handleSort('cost')}
              scope="col"
            >
              Cost{getSortIndicator('cost')}
            </th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayFilaments.map(filament => {
            const percentage = getRemainingPercentage(filament);
            const costPerGram = calculateCostPerGram(
              filament.cost,
              filament.weight
            );

            return (
              <tr key={filament.id} className={styles.row}>
                <td className={styles.nameCell}>
                  <div className={styles.filamentName}>
                    {filament.color && (
                      <span
                        className={styles.colorSwatch}
                        style={{
                          backgroundColor: getFilamentColor(filament.color)
                        }}
                        title={filament.color}
                        aria-label={`Color: ${filament.color}`}
                      ></span>
                    )}
                    <span>{filament.name}</span>
                  </div>
                </td>
                <td>{filament.material}</td>
                <td>{filament.color || '-'}</td>
                <td>{filament.weight ? formatWeight(filament.weight) : '-'}</td>
                <td>
                  <div className={styles.remainingContainer}>
                    <span className={styles.remainingWeight}>
                      {filament.remainingWeight
                        ? formatWeight(filament.remainingWeight)
                        : '-'}
                    </span>
                    {percentage !== null && (
                      <span
                        className={styles.percentage}
                        style={{ color: getRemainingColor(percentage) }}
                      >
                        {percentage}%
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.costContainer}>
                    {filament.cost ? formatCurrency(filament.cost) : '-'}
                    {costPerGram > 0 && (
                      <span className={styles.costPerGram}>
                        ({formatCurrency(costPerGram)}/g)
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit(filament)}
                      className={styles.editButton}
                      aria-label={`Edit ${filament.name}`}
                      title="Edit filament"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDelete(filament.id)}
                      className={styles.deleteButton}
                      aria-label={`Delete ${filament.name}`}
                      title="Delete filament"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {!useVirtualization && (
        <Pagination
          paginationInfo={paginationInfo}
          onPageChange={handlePageChange}
          goToFirstPage={goToFirstPage}
          goToLastPage={goToLastPage}
          goToNextPage={goToNextPage}
          goToPrevPage={goToPrevPage}
          getVisiblePages={getVisiblePages}
        />
      )}

      {/* Performance Notice for Virtualization */}
      {useVirtualization && (
        <div className={styles.performanceNotice}>
          <span>
            ⚡ Performance mode: Showing first {virtualizedRows} items
          </span>
          <button
            onClick={() => setVirtualizedRows(prev => prev + 50)}
            className={styles.loadMoreButton}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

FilamentTable.propTypes = {
  filaments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      material: PropTypes.string.isRequired,
      color: PropTypes.string,
      weight: PropTypes.number,
      remainingWeight: PropTypes.number,
      cost: PropTypes.number
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  pageSize: PropTypes.number
};

export default FilamentTable;