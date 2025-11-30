/**
 * Application constants and configuration
 */

// Material types for filaments
export const MATERIAL_TYPES = {
  PLA: 'PLA',
  PETG: 'PETG',
  ABS: 'ABS',
  TPU: 'TPU',
  ASA: 'ASA',
  PC: 'Polycarbonate',
  NYLON: 'Nylon',
  WOOD: 'Wood',
  METAL: 'Metal',
  CARBON_FIBER: 'Carbon Fiber',
  OTHER: 'Other'
};

// Print status options
export const PRINT_STATUS = {
  QUEUED: 'queued',
  PRINTING: 'printing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Quality rating options
export const QUALITY_RATINGS = {
  EXCELLENT: 5,
  GOOD: 4,
  AVERAGE: 3,
  POOR: 2,
  FAILED: 1
};

// Category options for models
export const MODEL_CATEGORIES = {
  UTILITY: 'Utility',
  TOYS: 'Toys & Games',
  HOME: 'Home & Garden',
  TOOLS: 'Tools & Hardware',
  ART: 'Art & Design',
  EDUCATION: 'Education',
  FASHION: 'Fashion & Accessories',
  ELECTRONICS: 'Electronics',
  AUTOMOTIVE: 'Automotive',
  MEDICAL: 'Medical',
  OTHER: 'Other'
};

// Color presets for common filament colors
export const COLOR_PRESETS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#FF0000',
  BLUE: '#0000FF',
  GREEN: '#00FF00',
  YELLOW: '#FFFF00',
  ORANGE: '#FFA500',
  PURPLE: '#800080',
  PINK: '#FFC0CB',
  GRAY: '#808080',
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  BROWN: '#964B00',
  TRANSPARENT: '#FFFFFF'
};

// LocalStorage keys
export const STORAGE_KEYS = {
  FILAMENTS: 'printstack_filaments',
  MODELS: 'printstack_models',
  PRINTS: 'printstack_prints',
  SETTINGS: 'printstack_settings',
  USER_PREFERENCES: 'printstack_user_preferences'
};

// UI constants
export const UI_CONSTANTS = {
  MAX_FILE_SIZE_MB: 100,
  SUPPORTED_FILE_TYPES: ['.stl', '.obj', '.3mf', '.gcode'],
  DEBOUNCE_DELAY_MS: 300,
  ANIMATION_DURATION_MS: 200,
  SIDEBAR_WIDTH: '300px',
  HEADER_HEIGHT: '60px'
};

// Pagination constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
};

// Validation rules
export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_DESC_LENGTH: 500,
  MIN_WEIGHT: 0.1,
  MAX_WEIGHT: 10000,
  MIN_COST: 0,
  MAX_COST: 10000,
  MAX_FILE_SIZE_MB: 1000
};