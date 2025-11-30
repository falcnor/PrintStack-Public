/**
 * Central export point for all utility functions
 * This makes importing utilities easier and provides a single entry point
 */

// Data utilities (existing comprehensive functions)
export {
  generateId,
  formatCurrency,
  formatWeight,
  calculateFilamentPercentage,
  calculateCostPerGram,
  calculatePrintTime,
  formatPrintDuration,
  validateFilament,
  validateModel,
  validatePrint,
  calculateStats,
  exportToJSON,
  importFromJSON
} from './dataUtils.js';

// Formatting utilities
export {
  formatDate,
  formatFileSize,
  formatPercentage,
  truncateText,
  pluralize,
  formatColor
} from './formatters.js';

// Constants
export {
  MATERIAL_TYPES,
  PRINT_STATUS,
  QUALITY_RATINGS,
  MODEL_CATEGORIES,
  COLOR_PRESETS,
  STORAGE_KEYS,
  UI_CONSTANTS,
  PAGINATION,
  VALIDATION_RULES
} from './constants.js';

// Helper functions
export {
  debounce,
  deepClone,
  getNestedProperty,
  isEmpty,
  range,
  shuffle,
  groupBy,
  sortBy,
  uniqueValues,
  hexToRgb,
  getContrastColor
} from './helpers.js';

// Validation utilities
export {
  validateFileType,
  validateFileSize,
  validateColor,
  validateEmail,
  validateUrl,
  validatePhone,
  validateDateRange,
  validatePassword,
  validateNumber,
  validateSchema
} from './validation.js';

// Array utilities
export {
  removeDuplicates,
  paginate,
  filterBy,
  joinUnique,
  chunk,
  findBy,
  updateItem,
  removeItem,
  moveItem,
  sample
} from './arrayUtils.js';

// Re-export migration utilities if needed
export { FilamentMigration } from './filamentMigration.js';