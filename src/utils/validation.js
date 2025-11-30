/**
 * Enhanced validation utilities for complex scenarios
 */

import { VALIDATION_RULES } from './constants.js';

/**
 * Enhanced validation utilities for complex scenarios
 */

// Helper function
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate file type against allowed extensions
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Array of allowed file extensions
 * @returns {boolean} Whether file type is valid
 */
export const validateFileType = (file, allowedTypes) => {
  if (!file || !file.name) return false;

  const fileExtension = `.${  file.name.split('.').pop()
    .toLowerCase()}`;
  return allowedTypes.includes(fileExtension);
};

/**
 * Validate file size against maximum allowed size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Whether file size is valid
 */
export const validateFileSize = (file, maxSizeMB = VALIDATION_RULES.MAX_FILE_SIZE_MB) => {
  if (!file || !file.size) return false;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate color hex value
 * @param {string} hexColor - Hex color value
 * @returns {boolean} Whether color is valid hex
 */
export const validateColor = (hexColor) => {
  if (!hexColor || typeof hexColor !== 'string') return false;

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(hexColor);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email format is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL format is valid
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate phone number format (basic validation)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number format is valid
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;

  const phoneRegex = /^\+?[\d\s\-()]+$/;
  const cleanedPhone = phone.replace(/\D/g, '');

  return phoneRegex.test(phone) && cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
};

/**
 * Validate date range (start date before end date)
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {boolean} Whether date range is valid
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  return start < end;
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength score and feedback
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, strength: 0, feedback: 'Password is required' };
  }

  let strength = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) {
    strength += 1;
  } else {
    feedback.push('Password must be at least 8 characters');
  }

  // Uppercase letter
  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Include uppercase letter');
  }

  // Lowercase letter
  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Include lowercase letter');
  }

  // Number
  if (/\d/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Include number');
  }

  // Special character
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('Include special character');
  }

  return {
    isValid: strength >= 4,
    strength,
    feedback: strength >= 4 ? ['Strong password'] : feedback
  };
};

/**
 * Validate numeric input with range constraints
 * @param {number|string} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {boolean} isInteger - Whether value must be integer
 * @returns {Object} Validation result
 */
export const validateNumber = (value, min, max, isInteger = false) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return { isValid: false, error: 'Must be a valid number' };
  }

  if (isInteger && !Number.isInteger(numValue)) {
    return { isValid: false, error: 'Must be a whole number' };
  }

  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }

  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `Must be no more than ${max}` };
  }

  return { isValid: true, value: numValue };
};

/**
 * Comprehensive form field validator
 * @param {Object} data - Form data object
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result with errors
 */
export const validateSchema = (data, schema) => {
  const errors = {};
  let isValid = true;

  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = data[field];

    // Required validation
    if (rules.required && isEmpty(value)) {
      errors[field] = rules.message || `${field} is required`;
      isValid = false;
      return;
    }

    // Skip further validation if field is not required and empty
    if (!rules.required && isEmpty(value)) {
      return;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors[field] = rules.message || `${field} must be of type ${rules.type}`;
      isValid = false;
      return;
    }

    // Min/Max length for strings
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = rules.message || `${field} must be at least ${rules.minLength} characters`;
        isValid = false;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = rules.message || `${field} must be no more than ${rules.maxLength} characters`;
        isValid = false;
      }
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customResult = rules.validate(value);
      if (customResult !== true) {
        errors[field] = customResult || rules.message || `${field} is invalid`;
        isValid = false;
      }
    }
  });

  return { isValid, errors };
};