import { useState, useCallback } from 'react';

/**
 * Custom hook for managing filament usage in forms
 * @param {Array} initialFilamentUsages - Initial filament usage array
 * @returns {Object} Hook state and handlers
 */
export const useFilamentUsage = (initialFilamentUsages = []) => {
  const [filamentUsages, setFilamentUsages] = useState(initialFilamentUsages);

  const addFilamentUsage = useCallback(() => {
    const newUsage = {
      id: Date.now().toString(),
      filamentId: '',
      materialType: '',
      actualWeight: ''
    };
    setFilamentUsages(prev => [...prev, newUsage]);
  }, []);

  const updateFilamentUsage = useCallback((index, field, value) => {
    setFilamentUsages(prev =>
      prev.map((usage, i) =>
        i === index ? { ...usage, [field]: value } : usage
      )
    );
  }, []);

  const removeFilamentUsage = useCallback((index) => {
    setFilamentUsages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const autoPopulateFromRequirements = useCallback((requirements) => {
    if (!requirements || requirements.length === 0) {
      return;
    }

    const usages = requirements.map(req => ({
      id: Date.now().toString() + Math.random().toString(36)
        .substr(2),
      filamentId: req.filamentId,
      materialType: req.materialType,
      actualWeight: ''
    }));

    setFilamentUsages(usages);
  }, []);

  const calculateTotalWeight = useCallback(() => {
    return filamentUsages.reduce((total, usage) => {
      const weight = parseFloat(usage.actualWeight) || 0;
      return total + weight;
    }, 0);
  }, [filamentUsages]);

  const setFilamentUsagesDirect = useCallback((usages) => {
    setFilamentUsages(usages);
  }, []);

  return {
    filamentUsages,
    addFilamentUsage,
    updateFilamentUsage,
    removeFilamentUsage,
    autoPopulateFromRequirements,
    calculateTotalWeight,
    setFilamentUsages: setFilamentUsagesDirect
  };
};