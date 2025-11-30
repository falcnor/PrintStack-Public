import React, { useMemo } from 'react';

/**
 * Custom hook for handling table sorting
 * @param {Array} data - Array of data to sort
 * @param {Object} initialConfig - Initial sort configuration
 * @returns {Object} Sorting state and handlers
 */
export const useTableSort = (data, initialConfig = { key: '', direction: 'ascending' }) => {
  const [sortConfig, setSortConfig] = React.useState(initialConfig);

  const sortedData = useMemo(() => {
    const sortableData = [...data];

    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle numeric values
        const numericKeys = ['weight', 'remainingWeight', 'cost', 'printTime', 'duration'];
        if (numericKeys.includes(sortConfig.key)) {
          aValue = aValue || 0;
          bValue = bValue || 0;
        }

        // Handle string values
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const resetSort = () => {
    setSortConfig(initialConfig);
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    getSortIndicator,
    resetSort
  };
};