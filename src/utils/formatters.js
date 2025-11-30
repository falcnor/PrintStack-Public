/**
 * Formatting utility functions for consistent display of data across the application
 */

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Format file size to human readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
};

/**
 * Format percentage with proper handling of edge cases
 * @param {number} value - Value to format as percentage
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Pluralize words based on count
 * @param {string} word - Singular form of the word
 * @param {number} count - Count to determine pluralization
 * @param {string} pluralForm - Optional custom plural form
 * @returns {string} Pluralized word with count
 */
export const pluralize = (word, count, pluralForm = null) => {
  const plural = pluralForm || `${word}s`;
  return `${count} ${count === 1 ? word : plural}`;
};

/**
 * Format color hex value to display format
 * @param {string} hexColor - Hex color value
 * @returns {string} Formatted color string
 */
export const formatColor = (hexColor) => {
  if (!hexColor) return 'No color';
  if (hexColor.startsWith('#')) return hexColor.toUpperCase();
  return `#${hexColor.toUpperCase()}`;
};