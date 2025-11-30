import { useState, useCallback, useReducer } from 'react';

import { isEmpty, deepClone } from '../utils/helpers.js';
import { validateSchema } from '../utils/validation.js';

/**
 * Form state reducer for managing form data and errors
 */
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_VALUES':
      return {
        ...state,
        values: { ...state.values, ...action.payload },
        errors: action.validate ? {} : state.errors
      };

    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: action.validate && state.errors[action.field]
          ? { ...state.errors, [action.field]: undefined }
          : state.errors
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.payload
      };

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, ...action.payload }
      };

    case 'RESET_FORM':
      return {
        values: deepClone(action.initialValues),
        errors: {},
        touched: {},
        isSubmitting: false
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.payload
      };

    default:
      return state;
  }
}

/**
 * Custom hook for form management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation schema object
 * @param {Function} onSubmit - Submit handler function
 * @param {Object} options - Additional options
 */
export const useForm = (
  initialValues = {},
  validationSchema = null,
  onSubmit = null,
  options = {}
) => {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    resetOnSubmit = false,
    enableReinitialize = false
  } = options;

  const [state, dispatch] = useReducer(formReducer, {
    values: deepClone(initialValues),
    errors: {},
    touched: {},
    isSubmitting: false
  });

  // Reinitialize form when initialValues change
  if (enableReinitialize) {
    const prevValuesRef = usePrevious(initialValues);
    if (prevValuesRef !== initialValues) {
      dispatch({ type: 'RESET_FORM', initialValues });
    }
  }

  /**
   * Update a single field value
   */
  const setValue = useCallback((field, value) => {
    dispatch({
      type: 'SET_VALUE',
      field,
      value,
      validate: validateOnChange && validationSchema
    });
  }, [validateOnChange, validationSchema]);

  /**
   * Update multiple field values
   */
  const setValues = useCallback((values, validate = false) => {
    dispatch({
      type: 'SET_VALUES',
      payload: values,
      validate
    });
  }, []);

  /**
   * Mark fields as touched
   */
  const setTouched = useCallback((fields) => {
    dispatch({
      type: 'SET_TOUCHED',
      payload: fields
    });
  }, []);

  /**
   * Validate entire form
   */
  const validateForm = useCallback(() => {
    if (!validationSchema) return true;

    const result = validateSchema(state.values, validationSchema);
    dispatch({
      type: 'SET_ERRORS',
      payload: result.errors
    });

    return result.isValid;
  }, [state.values, validationSchema]);

  /**
   * Validate specific field
   */
  const validateField = useCallback((field) => {
    if (!validationSchema || !validationSchema[field]) return true;

    const fieldSchema = { [field]: validationSchema[field] };
    const result = validateSchema({ [field]: state.values[field] }, fieldSchema);

    dispatch({
      type: 'SET_ERRORS',
      payload: result.isValid ? { ...state.errors, [field]: undefined } : { ...state.errors, [field]: result.errors[field] }
    });

    return result.isValid;
  }, [state.values, validationSchema, state.errors]);

  /**
   * Handle input change
   */
  const handleChange = useCallback((field, value) => {
    setValue(field, value);

    if (validateOnChange && validationSchema && state.touched[field]) {
      validateField(field);
    }
  }, [setValue, validateOnChange, validationSchema, state.touched, validateField]);

  /**
   * Handle input blur
   */
  const handleBlur = useCallback((field) => {
    setTouched({ [field]: true });

    if (validateOnBlur && validationSchema) {
      validateField(field);
    }
  }, [setTouched, validateOnBlur, validationSchema, validateField]);

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM', initialValues });
  }, [initialValues]);

  /**
   * Submit form
   */
  const submitForm = useCallback(async() => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });

    try {
      // Validate entire form
      const isValid = validateForm();
      if (!isValid && !isEmpty(state.errors)) {
        return false;
      }

      // Call onSubmit function
      if (onSubmit) {
        await onSubmit(state.values);
      }

      // Reset if configured
      if (resetOnSubmit) {
        resetForm();
      }

      return true;
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [validateForm, onSubmit, resetOnSubmit, resetForm, state.errors]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useCallback(() => {
    return Object.keys(state.errors).some(key => state.errors[key]);
  }, [state.errors]);

  /**
   * Check if form is dirty (has unsaved changes)
   */
  const isDirty = useCallback(() => {
    return JSON.stringify(state.values) !== JSON.stringify(initialValues);
  }, [state.values, initialValues]);

  return {
    // State
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,

    // Actions
    setValue,
    setValues,
    setTouched,
    handleChange,
    handleBlur,
    validateForm,
    validateField,
    resetForm,
    submitForm,

    // Computed
    hasErrors: hasErrors(),
    isDirty: isDirty(),
    isValid: !hasErrors() && Object.keys(state.touched).length > 0
  };
};

/**
 * Hook to track previous values for comparisons
 */
function usePrevious(value) {
  const ref = useState({ value, current: false });
  ref.current.value = value;
  ref.current.current = false;

  return ref.current.value;
}

/**
 * Hook for simple forms without complex validation
 */
export const useSimpleForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const setError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setFieldTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const hasErrors = Object.values(errors).some(error => error);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setFieldTouched,
    resetForm,
    hasErrors,
    isDirty
  };
};