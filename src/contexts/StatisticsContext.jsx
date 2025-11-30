import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Initial state for statistics
const initialState = {
  // Filament Statistics
  filamentStats: {
    totalSpools: 0,
    totalWeight: 0,
    totalValue: 0,
    materialBreakdown: {},
    colorBreakdown: {},
    diameterBreakdown: {},
    brandBreakdown: {},
    averagePricePerKg: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  },

  // Model Statistics
  modelStats: {
    totalModels: 0,
    categoryBreakdown: {},
    averageComplexity: 0,
    printCount: 0,
    printableModelsCount: 0,
    mostPrintedCategory: null,
    recentlyAdded: []
  },

  // Print History Statistics
  printStats: {
    totalPrints: 0,
    successRate: 0,
    averagePrintTime: 0,
    totalPrintTime: 0,
    failureReasons: {},
    qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
    materialUsageBreakdown: {},
    monthlyPrintCounts: {},
    filamentConsumption: 0
  },

  // Usage Analytics
  usageStats: {
    mostUsedMaterials: [],
    longestRunningPrint: null,
    averageFilamentUsage: 0,
    topCategories: [],
    activityByDay: {},
    sessionMetrics: {
      averageSessionTime: 0,
      sessionsThisWeek: 0,
      printPerSessionRate: 0
    }
  },

  // Economic Analysis
  economicStats: {
    totalFilamentInvestment: 0,
    averageCostPerPrint: 0,
    currentInventoryValue: 0,
    costSavingsFromPrints: 0,
    monthlySpending: {}
  },

  // Loading and error states
  loading: false,
  error: null,
  lastUpdated: null
};

// Action types
const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CALCULATE_FILAMENT_STATS: 'CALCULATE_FILAMENT_STATS',
  CALCULATE_MODEL_STATS: 'CALCULATE_MODEL_STATS',
  CALCULATE_PRINT_STATS: 'CALCULATE_PRINT_STATS',
  CALCULATE_USAGE_STATS: 'CALCULATE_USAGE_STATS',
  CALCULATE_ECONOMIC_STATS: 'CALCULATE_ECONOMIC_STATS',
  REFRESH_ALL_STATS: 'REFRESH_ALL_STATS',
  RESET_STATS: 'RESET_STATS'
};

// Reducer function
const statisticsReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case ACTION_TYPES.CALCULATE_FILAMENT_STATS:
      return {
        ...state,
        filamentStats: {
          ...state.filamentStats,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.CALCULATE_MODEL_STATS:
      return {
        ...state,
        modelStats: {
          ...state.modelStats,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.CALCULATE_PRINT_STATS:
      return {
        ...state,
        printStats: {
          ...state.printStats,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.CALCULATE_USAGE_STATS:
      return {
        ...state,
        usageStats: {
          ...state.usageStats,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.CALCULATE_ECONOMIC_STATS:
      return {
        ...state,
        economicStats: {
          ...state.economicStats,
          ...action.payload
        },
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.REFRESH_ALL_STATS:
      return {
        ...state,
        ...action.payload,
        loading: false,
        lastUpdated: Date.now()
      };

    case ACTION_TYPES.RESET_STATS:
      return {
        ...initialState
      };

    default:
      return state;
  }
};

// Create the context
const StatisticsContext = createContext();

/**
 * Statistics Provider Component
 */
export const StatisticsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(statisticsReducer, initialState);

  /**
   * Calculate filament statistics
   */
  const calculateFilamentStats = useCallback((filaments) => {
    if (!filaments || !Array.isArray(filaments)) {
      return;
    }

    try {
      const stats = {
        totalSpools: filaments.length,
        totalWeight: 0,
        totalValue: 0,
        materialBreakdown: {},
        colorBreakdown: {},
        diameterBreakdown: {},
        brandBreakdown: {},
        averagePricePerKg: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      };

      let totalWeight = 0;
      let totalPrice = 0;
      let validPriceCount = 0;

      filaments.forEach(filament => {
        // Weight aggregations
        totalWeight += filament.weight || 0;

        // Price calculations
        if (filament.purchasePrice && filament.weight) {
          const pricePerKg = filament.purchasePrice;
          const filamentValue = (filament.weight / 1000) * pricePerKg;
          totalPrice += filamentValue;
          validPriceCount++;
        }

        // Material breakdown
        const material = filament.materialType || 'Unknown';
        stats.materialBreakdown[material] = (stats.materialBreakdown[material] || 0) + (filament.weight || 0);

        // Color breakdown
        const color = filament.colorName || 'Unknown';
        stats.colorBreakdown[color] = (stats.colorBreakdown[color] || 0) + 1;

        // Diameter breakdown
        const diameter = filament.diameter || 'Unknown';
        stats.diameterBreakdown[diameter] = (stats.diameterBreakdown[diameter] || 0) + 1;

        // Brand breakdown
        const brand = filament.brand || 'Unknown';
        stats.brandBreakdown[brand] = (stats.brandBreakdown[brand] || 0) + 1;

        // Stock status
        if (!filament.inStock) {
          if (filament.weight && filament.weight < 100) {
            stats.lowStockItems++;
          } else if (!filament.weight || filament.weight === 0) {
            stats.outOfStockItems++;
          }
        }
      });

      stats.totalWeight = totalWeight;
      stats.totalValue = totalPrice;
      stats.averagePricePerKg = validPriceCount > 0 ? totalPrice / validPriceCount : 0;

      dispatch({
        type: ACTION_TYPES.CALCULATE_FILAMENT_STATS,
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to calculate filament stats: ${error.message}`
      });
    }
  }, []);

  /**
   * Calculate model statistics
   */
  const calculateModelStats = useCallback((models, prints) => {
    if (!models || !Array.isArray(models)) {
      return;
    }

    try {
      const stats = {
        totalModels: models.length,
        categoryBreakdown: {},
        averageComplexity: 0,
        printCount: 0,
        printableModelsCount: 0,
        mostPrintedCategory: null,
        recentlyAdded: []
      };

      let totalComplexity = 0;
      let complexityCount = 0;
      const categoryPrintCounts = {};
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      models.forEach(model => {
        // Category breakdown
        const category = model.category || 'Uncategorized';
        stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;

        // Complexity calculations
        if (model.complexity) {
          totalComplexity += model.complexity;
          complexityCount++;
        }

        // Track printable models
        if (model.printable !== false) {
          stats.printableModelsCount++;
        }

        // Recently added models
        const modelDate = model.createdAt || model.addedAt;
        if (modelDate && new Date(modelDate) >= new Date(oneWeekAgo)) {
          stats.recentlyAdded.push({
            id: model.id,
            name: model.name,
            addedAt: modelDate
          });
        }

        // Sort recently added
        stats.recentlyAdded.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        stats.recentlyAdded = stats.recentlyAdded.slice(0, 5);
      });

      const modelPrintCounts = {};
      if (prints && Array.isArray(prints)) {
        prints.forEach(print => {
          if (print.modelId) {
            modelPrintCounts[print.modelId] = (modelPrintCounts[print.modelId] || 0) + 1;
          }
        });

        // Category print counts
        models.forEach(model => {
          const category = model.category || 'Uncategorized';
          categoryPrintCounts[category] = (categoryPrintCounts[category] || 0) + (modelPrintCounts[model.id] || 0);
        });

        stats.printCount = Object.values(modelPrintCounts).reduce((sum, count) => sum + count, 0);
      }

      stats.averageComplexity = complexityCount > 0 ? totalComplexity / complexityCount : 0;

      // Find most printed category
      if (Object.keys(categoryPrintCounts).length > 0) {
        stats.mostPrintedCategory = Object.entries(categoryPrintCounts)
          .sort(([, a], [, b]) => b - a)[0][0];
      }

      dispatch({
        type: ACTION_TYPES.CALCULATE_MODEL_STATS,
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to calculate model stats: ${error.message}`
      });
    }
  }, []);

  /**
   * Calculate print history statistics
   */
  const calculatePrintStats = useCallback((prints, filaments) => {
    if (!prints || !Array.isArray(prints)) {
      return;
    }

    try {
      const stats = {
        totalPrints: prints.length,
        successRate: 0,
        averagePrintTime: 0,
        totalPrintTime: 0,
        failureReasons: {},
        qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
        materialUsageBreakdown: {},
        monthlyPrintCounts: {},
        filamentConsumption: 0
      };

      let successfulPrints = 0;
      let totalPrintTime = 0;
      let validPrintTimeCount = 0;
      let totalFilamentUsed = 0;

      // Create lookup for filament materials
      const filamentLookup = {};
      if (filaments && Array.isArray(filaments)) {
        filaments.forEach(filament => {
          filamentLookup[filament.id] = filament.materialType || 'Unknown';
        });
      }

      prints.forEach(print => {
        // Success rate
        if (print.success !== false) {
          successfulPrints++;
        }

        // Print time calculations
        if (print.printTime && print.endTime) {
          const startTime = new Date(print.startTime).getTime();
          const endTime = new Date(print.endTime).getTime();
          const printDuration = endTime - startTime;
          totalPrintTime += printDuration;
          validPrintTimeCount++;
        } else if (print.printTime) {
          totalPrintTime += print.printTime;
          validPrintTimeCount++;
        }

        // Failure reasons
        if (print.success === false && print.failureReason) {
          const reason = print.failureReason;
          stats.failureReasons[reason] = (stats.failureReasons[reason] || 0) + 1;
        }

        // Quality distribution
        if (print.quality) {
          const quality = print.quality.toLowerCase();
          if (['excellent', 'good', 'fair', 'poor'].includes(quality)) {
            stats.qualityDistribution[quality] = (stats.qualityDistribution[quality] || 0) + 1;
          }
        }

        // Material usage breakdown
        if (print.filamentId) {
          const material = filamentLookup[print.filamentId] || 'Unknown';
          stats.materialUsageBreakdown[material] = (stats.materialUsageBreakdown[material] || 0) + 1;
        }

        // Monthly print counts
        if (print.startTime || print.createdAt) {
          const printDate = new Date(print.startTime || print.createdAt);
          const monthKey = `${printDate.getFullYear()}-${String(printDate.getMonth() + 1).padStart(2, '0')}`;
          stats.monthlyPrintCounts[monthKey] = (stats.monthlyPrintCounts[monthKey] || 0) + 1;
        }

        // Filament consumption
        if (print.filamentUsed) {
          totalFilamentUsed += print.filamentUsed;
        } else if (print.weightBefore && print.weightAfter) {
          totalFilamentUsed += print.weightBefore - print.weightAfter;
        }
      });

      stats.successRate = stats.totalPrints > 0 ? (successfulPrints / stats.totalPrints) * 100 : 0;
      stats.averagePrintTime = validPrintTimeCount > 0 ? totalPrintTime / validPrintTimeCount : 0;
      stats.totalPrintTime = totalPrintTime;
      stats.filamentConsumption = totalFilamentUsed;

      dispatch({
        type: ACTION_TYPES.CALCULATE_PRINT_STATS,
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to calculate print stats: ${error.message}`
      });
    }
  }, []);

  /**
   * Calculate usage statistics
   */
  const calculateUsageStats = useCallback((prints, models, filaments) => {
    try {
      const stats = {
        mostUsedMaterials: [],
        longestRunningPrint: null,
        averageFilamentUsage: 0,
        topCategories: [],
        activityByDay: {},
        sessionMetrics: {
          averageSessionTime: 0,
          sessionsThisWeek: 0,
          printPerSessionRate: 0
        }
      };

      // Material usage from prints
      const materialUsage = {};
      let totalFilamentUsed = 0;
      let longestPrint = null;

      if (prints && Array.isArray(prints)) {
        prints.forEach(print => {
          if (print.filamentId) {
            const filament = filaments?.find(f => f.id === print.filamentId);
            if (filament) {
              const material = filament.materialType || 'Unknown';
              materialUsage[material] = (materialUsage[material] || 0) + 1;
            }
          }

          // Filament usage calculation
          if (print.filamentUsed) {
            totalFilamentUsed += print.filamentUsed;
          }

          // Find longest running print
          if (print.printTime && (!longestPrint || print.printTime > longestPrint.printTime)) {
            longestPrint = {
              id: print.id,
              modelName: print.modelName,
              printTime: print.printTime
            };
          }

          // Activity by day
          if (print.startTime || print.createdAt) {
            const date = new Date(print.startTime || print.createdAt);
            const dayKey = date.toISOString().split('T')[0];
            stats.activityByDay[dayKey] = (stats.activityByDay[dayKey] || 0) + 1;
          }
        });

        // Sort materials by usage
        stats.mostUsedMaterials = Object.entries(materialUsage)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([material, count]) => ({ material, count }));

        stats.longestRunningPrint = longestPrint;
        stats.averageFilamentUsage = totalFilamentUsed / prints.length;
      }

      // Top categories from models
      if (models && Array.isArray(models)) {
        const categoryCounts = {};
        models.forEach(model => {
          const category = model.category || 'Uncategorized';
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        stats.topCategories = Object.entries(categoryCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, count]) => ({ category, count }));
      }

      dispatch({
        type: ACTION_TYPES.CALCULATE_USAGE_STATS,
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to calculate usage stats: ${error.message}`
      });
    }
  }, []);

  /**
   * Calculate economic statistics
   */
  const calculateEconomicStats = useCallback((filaments, prints) => {
    try {
      const stats = {
        totalFilamentInvestment: 0,
        averageCostPerPrint: 0,
        currentInventoryValue: 0,
        costSavingsFromPrints: 0,
        monthlySpending: {}
      };

      let totalInvestment = 0;
      let currentInventoryValue = 0;

      if (filaments && Array.isArray(filaments)) {
        filaments.forEach(filament => {
          if (filament.purchasePrice && filament.weight) {
            const totalValue = (filament.weight / 1000) * filament.purchasePrice;
            totalInvestment += totalValue;

            if (filament.inStock) {
              currentInventoryValue += totalValue;
            }
          }

          // Monthly spending
          if (filament.purchaseDate && filament.purchasePrice) {
            const purchaseDate = new Date(filament.purchaseDate);
            const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
            stats.monthlySpending[monthKey] = (stats.monthlySpending[monthKey] || 0) + filament.purchasePrice;
          }
        });
      }

      stats.totalFilamentInvestment = totalInvestment;
      stats.currentInventoryValue = currentInventoryValue;

      if (prints && Array.isArray(prints) && totalInvestment > 0) {
        stats.averageCostPerPrint = totalInvestment / prints.length;
        // Estimate cost savings (assuming printed items would cost 3x more to buy)
        stats.costSavingsFromPrints = totalInvestment * 2; // 3x cost - 1x investment = 2x savings
      }

      dispatch({
        type: ACTION_TYPES.CALCULATE_ECONOMIC_STATS,
        payload: stats
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to calculate economic stats: ${error.message}`
      });
    }
  }, []);

  /**
   * Refresh all statistics
   */
  const refreshAllStats = useCallback(async () => {
    dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

    try {
      // Get data from localStorage
      const filaments = JSON.parse(localStorage.getItem('filaments') || '[]');
      const models = JSON.parse(localStorage.getItem('models') || '[]');
      const prints = JSON.parse(localStorage.getItem('prints') || '[]');

      // Calculate all stats in parallel
      calculateFilamentStats(filaments);
      calculateModelStats(models, prints);
      calculatePrintStats(prints, filaments);
      calculateUsageStats(prints, models, filaments);
      calculateEconomicStats(filaments, prints);

      dispatch({
        type: ACTION_TYPES.SET_LOADING,
        payload: false
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: `Failed to refresh statistics: ${error.message}`
      });
    }
  }, [calculateFilamentStats, calculateModelStats, calculatePrintStats, calculateUsageStats, calculateEconomicStats]);

  /**
   * Reset all statistics
   */
  const resetStats = useCallback(() => {
    dispatch({ type: ACTION_TYPES.RESET_STATS });
  }, []);

  // Auto-refresh statistics when data changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && ['filaments', 'models', 'prints'].includes(e.key)) {
        refreshAllStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Initial calculation
    refreshAllStats();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAllStats]);

  const value = {
    ...state,
    calculateFilamentStats,
    calculateModelStats,
    calculatePrintStats,
    calculateUsageStats,
    calculateEconomicStats,
    refreshAllStats,
    resetStats
  };

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};

StatisticsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use statistics context
 */
export const useStatistics = () => {
  const context = useContext(StatisticsContext);

  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }

  return context;
};

export default StatisticsContext;