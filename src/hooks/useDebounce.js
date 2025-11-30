import { useState, useEffect, useRef } from 'react';

import { debounce } from '../utils/helpers.js';

/**
 * Custom hook for debouncing values
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for debounced callback
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependency array
 * @returns {Function} Debounced callback function
 */
export const useDebouncedCallback = (callback, delay, deps = []) => {
  const debouncedRef = useRef();

  useEffect(() => {
    debouncedRef.current = debounce(callback, delay);
  }, [callback, delay, ...deps]);

  useEffect(() => {
    return () => {
      if (debouncedRef.current) {
        debouncedRef.current.cancel();
      }
    };
  }, []);

  return debouncedRef.current;
};

/**
 * Custom hook for debounced search
 * @param {Function} searchFunction - Search function
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Search utilities
 */
export const useDebouncedSearch = (searchFunction, delay = 300) => {
  const [results, setResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebouncedCallback(async(term) => {
    if (!term.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchFunction(term);
      setResults(searchResults);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, delay, [searchFunction]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const clearSearch = () => {
    setSearchTerm('');
    setResults([]);
    setError(null);
    setLoading(false);
  };

  return {
    searchTerm,
    setSearchTerm,
    results,
    loading,
    error,
    clearSearch
  };
};

/**
 * Custom hook for debounced API calls
 * @param {Function} apiFunction - API function to call
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} API utilities
 */
export const useDebouncedApi = (apiFunction, delay = 500) => {
  const [data, setData] = useState(null);
  const [params, setParams] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastCalled, setLastCalled] = useState(null);

  const debouncedCall = useDebouncedCallback(async(callParams) => {
    setLoading(true);
    setError(null);
    setLastCalled(new Date());

    try {
      const result = await apiFunction(callParams);
      setData(result);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, delay, [apiFunction]);

  useEffect(() => {
    if (params && Object.keys(params).length > 0) {
      debouncedCall(params);
    }
  }, [params, debouncedCall]);

  const execute = (newParams) => {
    setParams(newParams);
  };

  const reset = () => {
    setData(null);
    setParams({});
    setError(null);
    setLoading(false);
    setLastCalled(null);
  };

  return {
    data,
    loading,
    error,
    execute,
    reset,
    lastCalled,
    params
  };
};