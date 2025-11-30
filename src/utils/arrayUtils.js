/**
 * Array manipulation and processing utilities
 */

/**
 * Remove duplicates from array
 * @param {Array} array - Array to deduplicate
 * @param {string|function} key - Optional key for object comparison or custom compare function
 * @returns {Array} Array with duplicates removed
 */
export const removeDuplicates = (array, key = null) => {
  if (!Array.isArray(array)) return [];

  if (!key) {
    return [...new Set(array)];
  }

  if (typeof key === 'function') {
    const seen = new Set();
    return array.filter(item => {
      const compareKey = key(item);
      if (seen.has(compareKey)) {
        return false;
      }
      seen.add(compareKey);
      return true;
    });
  }

  const seen = new Set();
  return array.filter(item => {
    if (!item || item[key] === undefined) return false;
    const compareKey = item[key];
    if (seen.has(compareKey)) {
      return false;
    }
    seen.add(compareKey);
    return true;
  });
};

/**
 * Paginate array into pages
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number (1-based)
 * @param {number} pageSize - Items per page
 * @returns {Object} Paginated result with items and metadata
 */
export const paginate = (array, page = 1, pageSize = 10) => {
  if (!Array.isArray(array)) {
    return { items: [], currentPage: 1, totalPages: 0, totalItems: 0 };
  }

  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = array.slice(startIndex, endIndex);

  return {
    items,
    currentPage: page,
    totalPages,
    totalItems,
    pageSize,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Filter array with multiple criteria
 * @param {Array} array - Array to filter
 * @param {Object} filters - Object with filter criteria
 * @param {Object} options - Filtering options
 * @returns {Array} Filtered array
 */
export const filterBy = (array, filters, options = {}) => {
  if (!Array.isArray(array) || !filters) return array;

  const { caseSensitive = true, exactMatch = false, operator = 'AND' } = options;

  return array.filter(item => {
    const results = Object.entries(filters).map(([key, value]) => {
      const itemValue = getNestedProperty(item, key);

      if (value === null || value === undefined) return true;
      if (itemValue === null || itemValue === undefined) return false;

      if (typeof value === 'string' && typeof itemValue === 'string') {
        const itemStr = caseSensitive ? itemValue : itemValue.toLowerCase();
        const filterStr = caseSensitive ? value : value.toLowerCase();

        return exactMatch ? itemStr === filterStr : itemStr.includes(filterStr);
      }

      if (Array.isArray(value)) {
        return value.includes(itemValue);
      }

      if (typeof value === 'function') {
        return value(itemValue);
      }

      return itemValue === value;
    });

    return operator === 'OR' ? results.some(Boolean) : results.every(Boolean);
  });
};

/**
 * Join arrays without duplicates
 * @param {...Array} arrays - Arrays to join
 * @returns {Array} Joined array with unique items
 */
export const joinUnique = (...arrays) => {
  return removeDuplicates(arrays.flat());
};

/**
 * Split array into chunks of specified size
 * @param {Array} array - Array to split
 * @param {number} chunkSize - Size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
export const chunk = (array, chunkSize = 10) => {
  if (!Array.isArray(array) || chunkSize <= 0) return [];

  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Find item by nested property value
 * @param {Array} array - Array to search
 * @param {string} path - Dot notation path
 * @param {*} value - Value to match
 * @returns {*} Found item or undefined
 */
export const findBy = (array, path, value) => {
  if (!Array.isArray(array)) return undefined;

  return array.find(item => getNestedProperty(item, path) === value);
};

/**
 * Update item in array by property
 * @param {Array} array - Array to update
 * @param {string|function} identifier - Property name or function to identify item
 * @param {*} identifierValue - Value to match (if using property name)
 * @param {Object|function} updates - Updates to apply or update function
 * @returns {Array} Updated array
 */
export const updateItem = (array, identifier, identifierValue, updates) => {
  if (!Array.isArray(array)) return array;

  return array.map(item => {
    let shouldUpdate = false;

    if (typeof identifier === 'function') {
      shouldUpdate = identifier(item);
    } else if (typeof identifier === 'string') {
      shouldUpdate = getNestedProperty(item, identifier) === identifierValue;
    }

    if (shouldUpdate) {
      return typeof updates === 'function' ? updates(item) : { ...item, ...updates };
    }

    return item;
  });
};

/**
 * Remove item from array by property
 * @param {Array} array - Array to modify
 * @param {string|function} identifier - Property name or function to identify item
 * @param {*} identifierValue - Value to match (if using property name)
 * @returns {Array} Modified array
 */
export const removeItem = (array, identifier, identifierValue) => {
  if (!Array.isArray(array)) return array;

  return array.filter(item => {
    if (typeof identifier === 'function') {
      return !identifier(item);
    } else if (typeof identifier === 'string') {
      return getNestedProperty(item, identifier) !== identifierValue;
    }
    return true;
  });
};

/**
 * Move item from one position to another in array
 * @param {Array} array - Array to modify
 * @param {number} fromIndex - Current index
 * @param {number} toIndex - New index
 * @returns {Array} Modified array
 */
export const moveItem = (array, fromIndex, toIndex) => {
  if (!Array.isArray(array)) return array;

  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Get random sample from array
 * @param {Array} array - Array to sample from
 * @param {number} count - Number of items to sample
 * @returns {Array} Random sample
 */
export const sample = (array, count = 1) => {
  if (!Array.isArray(array) || count < 1) return [];

  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

// Helper function
function getNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}