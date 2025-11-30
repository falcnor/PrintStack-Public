/**
 * Screen Reader Announcements Configuration
 * Predefined announcements for common application events
 */

/**
 * Data operation announcements
 */
export const dataOperations = {
  // Filament operations
  filamentLoaded: (count) => `${count} filaments loaded successfully`,
  filamentAdded: (name, total) => `New filament "${name}" added. Total: ${total}`,
  filamentUpdated: (name) => `Filament "${name}" updated successfully`,
  filamentDeleted: (name, remaining) => `Filament "${name}" deleted. ${remaining} remaining`,
  filamentImported: (count) => `${count} filaments imported successfully`,
  filamentExported: (count) => `${count} filaments exported successfully`,

  // Model operations
  modelLoaded: (count) => `${count} models loaded successfully`,
  modelAdded: (name, total) => `New model "${name}" added. Total: ${total}`,
  modelUpdated: (name) => `Model "${name}" updated successfully`,
  modelDeleted: (name, remaining) => `Model "${name}" deleted. ${remaining} remaining`,
  modelImported: (count) => `${count} models imported successfully`,
  modelExported: (count) => `${count} models exported successfully`,

  // Print operations
  printLoaded: (count) => `${count} print records loaded successfully`,
  printAdded: (modelName, total) => `New print record for "${modelName}" added. Total: ${total}`,
  printUpdated: (modelName) => `Print record for "${modelName}" updated successfully`,
  printDeleted: (modelName, remaining) => `Print record for "${modelName}" deleted. ${remaining} remaining`,

  // Statistics updates
  statisticsUpdated: (category) => `${category} statistics updated`,
  inventoryValueUpdated: (value) => `Inventory value updated to ${value}`
};

/**
 * Form validation messages
 */
export const formValidation = {
  // Required field validations
  required: (fieldName) => `${fieldName} is required`,
  minLength: (fieldName, min) => `${fieldName} must be at least ${min} characters long`,
  maxLength: (fieldName, max) => `${fieldName} cannot exceed ${max} characters`,
  email: (fieldName) => `${fieldName} must be a valid email address`,
  number: (fieldName) => `${fieldName} must be a valid number`,
  positive: (fieldName) => `${fieldName} must be a positive number`,
  decimal: (fieldName) => `${fieldName} must be a valid decimal number`,

  // Specific field validations
  filamentName: {
    required: 'Filament name is required',
    minLength: 'Filament name must be at least 2 characters long',
    maxLength: 'Filament name cannot exceed 50 characters',
    unique: 'A filament with this name already exists'
  },
  filamentWeight: {
    required: 'Weight is required',
    positive: 'Weight must be a positive number',
    max: 'Weight cannot exceed 10000 grams'
  },
  filamentColor: {
    required: 'Color is required',
    format: 'Color must be a valid hex color code'
  },
  modelName: {
    required: 'Model name is required',
    minLength: 'Model name must be at least 2 characters long',
    maxLength: 'Model name cannot exceed 100 characters',
    unique: 'A model with this name already exists'
  },
  printQuality: {
    required: 'Print quality is required',
    range: 'Print quality must be between 1 and 5'
  }
};

/**
 * Navigation announcements
 */
export const navigation = {
  pageLoaded: (pageName) => `${pageName} page loaded`,
  sectionChanged: (sectionName) => `Moved to ${sectionName} section`,
  tabChanged: (tabName) => `Switched to ${tabName} tab`,
  modalOpened: (modalTitle) => `${modalTitle} dialog opened`,
  modalClosed: (modalTitle) => `${modalTitle} dialog closed`,
  menuOpened: 'Navigation menu opened',
  menuClosed: 'Navigation menu closed',

  // Specific application pages
  dashboard: 'Dashboard loaded',
  filaments: 'Filament management loaded',
  models: 'Model library loaded',
  prints: 'Print history loaded',
  statistics: 'Statistics dashboard loaded',
  settings: 'Settings page loaded'
};

/**
 * State change announcements
 */
export const stateChanges = {
  // Theme changes
  themeChanged: (themeName) => `Theme changed to ${themeName}`,
  highContrastToggled: (enabled) => `High contrast mode ${enabled ? 'enabled' : 'disabled'}`,

  // Filter and search changes
  filterApplied: (filterType, filterValue) => `${filterType} filter applied: ${filterValue}`,
  filterCleared: (filterType) => `${filterType} filter cleared`,
  searchExecuted: (query, resultCount) => `Search for "${query}" found ${resultCount} results`,
  searchCleared: 'Search cleared',

  // Sort changes
  sortChanged: (sortBy, sortOrder) => `Sorted by ${sortBy} in ${sortOrder} order`,
  sortCleared: 'Sorting cleared',

  // View changes
  viewModeChanged: (viewMode) => `View changed to ${viewMode}`,
  paginationChanged: (page, total) => `Now showing page ${page} of ${total}`,

  // Selection changes
  itemSelected: (itemType, itemName) => `${itemType} "${itemName}" selected`,
  itemDeselected: (itemType, itemName) => `${itemType} "${itemName}" deselected`,
  multipleSelected: (itemType, count) => `${count} ${itemType}s selected`,
  selectionCleared: (itemType) => `${itemType} selection cleared`
};

/**
 * Error handling announcements
 */
export const errors = {
  // Network errors
  networkError: 'Network connection error. Please check your internet connection.',
  serverError: 'Server error occurred. Please try again later.',
  timeoutError: 'Request timed out. Please try again.',

  // Data errors
  dataLoadError: (dataType) => `Failed to load ${dataType}. Please refresh the page.`,
  dataSaveError: (dataType) => `Failed to save ${dataType}. Please try again.`,
  dataDeleteError: (dataType) => `Failed to delete ${dataType}. Please try again.`,

  // Form errors
  formValidationFailed: 'Please correct the errors in the form before submitting.',
  formSubmitError: 'Form submission failed. Please try again.',

  // Permission errors
  permissionDenied: 'You do not have permission to perform this action.',
  authenticationError: 'You must be logged in to perform this action.',

  // General errors
  unknownError: 'An unexpected error occurred. Please try again.',
  notFound: (itemType) => `${itemType} not found.`,
  alreadyExists: (itemType) => `This ${itemType} already exists.`
};

/**
 * Success announcements
 */
export const successes = {
  // Data operations
  saveSuccess: (dataType, itemName) => `${dataType} "${itemName}" saved successfully.`,
  deleteSuccess: (dataType, itemName) => `${dataType} "${itemName}" deleted successfully.`,
  updateSuccess: (dataType, itemName) => `${dataType} "${itemName}" updated successfully.`,
  createSuccess: (dataType, itemName) => `New ${dataType} "${itemName}" created successfully.`,

  // Bulk operations
  bulkDeleteSuccess: (itemType, count) => `${count} ${itemType}s deleted successfully.`,
  bulkUpdateSuccess: (itemType, count) => `${count} ${itemType}s updated successfully.`,
  importSuccess: (dataType, count) => `${count} ${dataType}s imported successfully.`,
  exportSuccess: (dataType, count) => `${count} ${dataType}s exported successfully.`,

  // Form operations
  formSubmitted: 'Form submitted successfully.',
  formReset: 'Form has been reset.',
  formSaved: 'Form saved successfully.',

  // Settings operations
  settingsSaved: 'Settings saved successfully.',
  passwordChanged: 'Password changed successfully.',
  profileUpdated: 'Profile updated successfully.'
};

/**
 * Progress announcements
 */
export const progress = {
  // Data loading
  dataLoading: 'Loading data...',
  dataLoaded: 'Data loaded successfully.',

  // File operations
  fileUploading: (fileName) => `Uploading ${fileName}...`,
  fileUploaded: (fileName) => `${fileName} uploaded successfully.`,
  fileDownloading: (fileName) => `Downloading ${fileName}...`,
  fileDownloaded: (fileName) => `${fileName} downloaded successfully.`,

  // Calculations
  calculating: 'Calculating...',
  calculationComplete: 'Calculation completed.',

  // Process steps
  stepProgress: (current, total, description) => `${description}: ${current} of ${total}`,
  processComplete: (processName) => `${processName} completed successfully.`,
  processFailed: (processName, reason) => `${processName} failed: ${reason}`
};

/**
 * Accessibility announcements
 */
export const accessibility = {
  // Screen reader specific
  screenReaderEnabled: 'Screen reader mode enabled',
  screenReaderDisabled: 'Screen reader mode disabled',
  keyboardShortcutsHelp: 'Press H to view keyboard shortcuts help.',
  focusTrapActive: 'Focus is now trapped within this dialog. Press Escape to exit.',
  focusTrapReleased: 'Focus trap released.',

  // Announcemens for disabled users
  contentExpanded: 'Content expanded',
  contentCollapsed: 'Content collapsed',
  detailsRevealed: 'Additional details revealed',
  detailsHidden: 'Additional details hidden',

  // Interactive elements
  buttonPressed: (buttonLabel) => `Button ${buttonLabel} pressed`,
  linkActivated: (linkText) => `Link ${linkText} activated`,
  optionSelected: (optionText) => `Option ${optionText} selected`
};

/**
 * Helper functions for dynamic message generation
 */
export const messageBuilders = {
  /**
   * Build item-related announcement
   */
  itemAction: (action, itemType, itemName, count = 1) => {
    const singular = count === 1 ? itemName : `${itemType}s`;
    return `${action} ${count > 1 ? count : ''} ${singular}${count === 1 ? ` "${itemName}"` : ''}`;
  },

  /**
   * Build search results announcement
   */
  searchResults: (query, count, total) => {
    if (count === 0) {
      return `No results found for "${query}"`;
    } else if (count === total) {
      return `Found ${count} results for "${query}"`;
    } else {
      return `Found ${count} of ${total} results for "${query}"`;
    }
  },

  /**
   * Build statistics announcement
   */
  statisticUpdate: (statName, oldValue, newValue, unit = '') => {
    return `${statName} changed from ${oldValue}${unit} to ${newValue}${unit}`;
  },

  /**
   * Build list operation announcement
   */
  listOperation: (operation, listName, itemCount) => {
    const verbs = {
      add: 'added to',
      remove: 'removed from',
      update: 'updated in',
      move: 'moved in'
    };

    const verb = verbs[operation] || operation;
    const item = itemCount === 1 ? 'item' : 'items';
    return `${itemCount} ${item} ${verb} ${listName}`;
  },

  /**
   * Build time-based announcement
   */
  timeBased: (action, itemType, timestamp) => {
    const now = new Date();
    const actionTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - actionTime) / 60000);

    if (diffMinutes < 1) {
      return `${actionType} just ${action}`;
    } else if (diffMinutes < 60) {
      return `${itemType} ${action} ${diffMinutes} minutes ago`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      return `${itemType} ${action} ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
  }
};

/**
 * Configuration for announcement priorities and regions
 */
export const announcementConfig = {
  // Priority levels (higher = more important)
  priorities: {
    critical: 3,    // Errors, important warnings
    high: 2,        // Important notifications, form errors
    normal: 1,      // Regular updates, success messages
    low: 0          // Informational, navigation
  },

  // Live regions
  regions: {
    polite: 'polite',           // Default region for most announcements
    assertive: 'assertive',     // For important/immediate announcements
    critical: 'critical',       // For critical errors
    status: 'status',           // For status updates
    navigation: 'navigation',   // For navigation changes
    form: 'form',              // For form validation
    data: 'data'               // For data operations
  },

  // Default configuration for different announcement types
  defaults: {
    error: {
      region: 'assertive',
      priority: 3,
      clearPrevious: false
    },
    success: {
      region: 'polite',
      priority: 1,
      clearPrevious: false
    },
    navigation: {
      region: 'navigation',
      priority: 0,
      unique: true
    },
    dataOperation: {
      region: 'data',
      priority: 1,
      clearPrevious: false
    },
    formValidation: {
      region: 'form',
      priority: 2,
      clearPrevious: false
    },
    progress: {
      region: 'status',
      priority: 1,
      unique: true
    },
    stateChange: {
      region: 'polite',
      priority: 1,
      unique: true
    }
  },

  // Timing configuration
  timing: {
    minimumDelay: 100,        // Minimum delay between announcements
    uniqueThreshold: 5000,    // Time window for duplicate prevention
    retryDelay: 1000,         // Delay for failed announcements
    criticalAttention: 200    // Visual attention duration for critical announcements
  },

  // History settings
  history: {
    maxSize: 100,             // Maximum announcements to keep in history
    clearOnPageLoad: false    // Whether to clear history on page reload
  }
};

export default {
  dataOperations,
  formValidation,
  navigation,
  stateChanges,
  errors,
  successes,
  progress,
  accessibility,
  messageBuilders,
  announcementConfig
};