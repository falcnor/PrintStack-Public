/**
 * Statistics and Analytics Utilities
 * Provides comprehensive analytics calculations for the PrintStack application
 */

/**
 * Calculate advanced filament statistics
 * @param {Array} filaments - Array of filament objects
 * @returns {Object} Comprehensive filament statistics
 */
export const calculateFilamentAnalytics = (filaments) => {
  if (!filaments || !Array.isArray(filaments)) {
    return getEmptyFilamentStats();
  }

  const stats = getEmptyFilamentStats();

  filaments.forEach(filament => {
    // Basic counts
    stats.totalSpools++;

    // Weight calculations
    const weight = filament.weight || 0;
    stats.totalWeight += weight;

    // Value calculations
    if (filament.purchasePrice && weight > 0) {
      const spoolValue = (weight / 1000) * filament.purchasePrice;
      stats.totalValue += spoolValue;
      stats.priceData.push({ price: filament.purchasePrice, weight });
    }

    // Material breakdown
    const material = filament.materialType || 'Unknown';
    stats.materialBreakdown[material] = {
      count: (stats.materialBreakdown[material]?.count || 0) + 1,
      weight: (stats.materialBreakdown[material]?.weight || 0) + weight
    };

    // Brand breakdown
    const brand = filament.brand || 'Unknown';
    stats.brandBreakdown[brand] = (stats.brandBreakdown[brand] || 0) + 1;

    // Color breakdown with hex codes
    const color = filament.colorName || 'Unknown';
    const hex = filament.colorHex || '#000000';
    stats.colorBreakdown[color] = {
      count: (stats.colorBreakdown[color]?.count || 0) + 1,
      hex: hex
    };

    // Temperature analysis
    if (filament.tempMin) {
      stats.temperatureRanges.min = Math.min(stats.temperatureRanges.min, filament.tempMin);
    }
    if (filament.tempMax) {
      stats.temperatureRanges.max = Math.max(stats.temperatureRanges.max, filament.tempMax);
    }

    // Location tracking
    if (filament.location) {
      stats.locationBreakdown[filament.location] = (stats.locationBreakdown[filament.location] || 0) + 1;
    }

    // Stock status
    if (!filament.inStock) {
      stats.outOfStockItems++;
    } else if (weight < 100) {
      stats.lowStockItems++;
    }

    // Age analysis
    if (filament.purchaseDate) {
      const ageInDays = (Date.now() - new Date(filament.purchaseDate)) / (1000 * 60 * 60 * 24);
      stats.spoolAgeData.push(ageInDays);
    }
  });

  // Calculate derived statistics
  stats.averagePricePerKg = stats.priceData.length > 0
    ? stats.priceData.reduce((sum, item) => sum + (item.price * item.weight), 0) / stats.priceData.reduce((sum, item) => sum + item.weight, 0) / 1000
    : 0;

  stats.averageSpoolWeight = filaments.length > 0 ? stats.totalWeight / filaments.length : 0;

  if (stats.spoolAgeData.length > 0) {
    stats.averageSpoolAge = stats.spoolAgeData.reduce((sum, age) => sum + age, 0) / stats.spoolAgeData.length;
    stats.oldestSpoolAge = Math.max(...stats.spoolAgeData);
    stats.newestSpoolAge = Math.min(...stats.spoolAgeData);
  }

  // Calculate stock health
  const totalSpools = filaments.length;
  stats.inStockPercentage = totalSpools > 0 ? ((totalSpools - stats.outOfStockItems) / totalSpools) * 100 : 0;

  return stats;
};

/**
 * Get empty filament statistics template
 */
const getEmptyFilamentStats = () => ({
  totalSpools: 0,
  totalWeight: 0,
  totalValue: 0,
  averagePricePerKg: 0,
  averageSpoolWeight: 0,
  materialBreakdown: {},
  brandBreakdown: {},
  colorBreakdown: {},
  locationBreakdown: {},
  temperatureRanges: { min: Infinity, max: 0 },
  lowStockItems: 0,
  outOfStockItems: 0,
  inStockPercentage: 0,
  priceData: [],
  spoolAgeData: [],
  averageSpoolAge: 0,
  oldestSpoolAge: 0,
  newestSpoolAge: 0
});

/**
 * Calculate advanced model statistics
 * @param {Array} models - Array of model objects
 * @param {Array} prints - Array of print objects
 * @returns {Object} Comprehensive model statistics
 */
export const calculateModelAnalytics = (models, prints = []) => {
  if (!models || !Array.isArray(models)) {
    return getEmptyModelStats();
  }

  const stats = getEmptyModelStats();

  // Create print lookup
  const printCounts = {};
  const printQualityByModel = {};
  const printTimeByModel = [];

  prints.forEach(print => {
    if (print.modelId) {
      printCounts[print.modelId] = (printCounts[print.modelId] || 0) + 1;

      if (print.quality) {
        if (!printQualityByModel[print.modelId]) {
          printQualityByModel[print.modelId] = [];
        }
        printQualityByModel[print.modelId].push(print.quality);
      }

      if (print.printTime) {
        printTimeByModel.push({
          modelId: print.modelId,
          printTime: print.printTime
        });
      }
    }
  });

  models.forEach(model => {
    stats.totalModels++;

    // Category analysis
    const category = model.category || 'Uncategorized';
    stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;

    // Complexity analysis
    if (model.complexity) {
      stats.complexityData.push(model.complexity);
    }

    // Print analysis
    const printCount = printCounts[model.id] || 0;
    if (printCount > 0) {
      stats.printedModels++;
      stats.totalPrints += printCount;

      if (printCount > stats.mostPrintedModel.count) {
        stats.mostPrintedModel = {
          id: model.id,
          name: model.name,
          count: printCount
        };
      }

      // Quality analysis
      const qualities = printQualityByModel[model.id];
      if (qualities) {
        const avgQuality = calculateAverageQuality(qualities);
        stats.averagePrintQuality = (stats.averagePrintQuality * (stats.printedModels - 1) + avgQuality) / stats.printedModels;
      }
    }

    // File size analysis
    if (model.fileSize) {
      stats.fileSizeData.push(model.fileSize);
    }

    // Date analysis
    const dateField = model.createdAt || model.addedAt;
    if (dateField) {
      const modelDate = new Date(dateField);
      stats.modelAges.push(Date.now() - modelDate.getTime());

      // Recently added
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (modelDate >= new Date(oneWeekAgo)) {
        stats.recentlyAdded.push({
          id: model.id,
          name: model.name,
          addedAt: dateField,
          category
        });
      }
    }

    // Printable status
    if (model.printable !== false) {
      stats.printableModels++;
    }
  });

  // Calculate derived statistics
  if (stats.complexityData.length > 0) {
    stats.averageComplexity = stats.complexityData.reduce((sum, comp) => sum + comp, 0) / stats.complexityData.length;
    stats.minComplexity = Math.min(...stats.complexityData);
    stats.maxComplexity = Math.max(...stats.complexityData);
  }

  if (stats.fileSizeData.length > 0) {
    stats.averageFileSize = stats.fileSizeData.reduce((sum, size) => sum + size, 0) / stats.fileSizeData.length;
    stats.totalFileSize = stats.fileSizeData.reduce((sum, size) => sum + size, 0);
  }

  if (stats.modelAges.length > 0) {
    stats.averageModelAge = stats.modelAges.reduce((sum, age) => sum + age, 0) / stats.modelAges.length;
  }

  stats.printRate = stats.totalModels > 0 ? (stats.printedModels / stats.totalModels) * 100 : 0;

  // Sort recently added
  stats.recentlyAdded.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
  stats.recentlyAdded = stats.recentlyAdded.slice(0, 10);

  return stats;
};

/**
 * Get empty model statistics template
 */
const getEmptyModelStats = () => ({
  totalModels: 0,
  printedModels: 0,
  totalPrints: 0,
  printableModels: 0,
  averageComplexity: 0,
  minComplexity: 0,
  maxComplexity: 0,
  averageFileSize: 0,
  totalFileSize: 0,
  averageModelAge: 0,
  printRate: 0,
  averagePrintQuality: 0,
  categoryBreakdown: {},
  mostPrintedModel: { id: '', name: '', count: 0 },
  recentlyAdded: [],
  complexityData: [],
  fileSizeData: [],
  modelAges: []
});

/**
 * Calculate advanced print statistics
 * @param {Array} prints - Array of print objects
 * @param {Array} filaments - Array of filament objects
 * @returns {Object} Comprehensive print statistics
 */
export const calculatePrintAnalytics = (prints, filaments = []) => {
  if (!prints || !Array.isArray(prints)) {
    return getEmptyPrintStats();
  }

  const stats = getEmptyPrintStats();

  // Create filament lookup
  const filamentLookup = {};
  filaments.forEach(filament => {
    filamentLookup[filament.id] = filament;
  });

  prints.forEach(print => {
    stats.totalPrints++;

    // Success/failure analysis
    const success = print.success !== false;
    if (success) {
      stats.successfulPrints++;
    } else {
      stats.failedPrints++;
      const reason = print.failureReason || 'Unknown';
      stats.failureReasons[reason] = (stats.failureReasons[reason] || 0) + 1;
    }

    // Print time analysis
    if (print.printTime) {
      stats.printTimeData.push(print.printTime);
    }

    // Quality analysis
    if (print.quality) {
      const quality = print.quality.toLowerCase();
      if (['excellent', 'good', 'fair', 'poor'].includes(quality)) {
        stats.qualityDistribution[quality] = (stats.qualityDistribution[quality] || 0) + 1;
        stats.qualityScores.push(qualityToScore(quality));
      }
    }

    // Material usage
    if (print.filamentId) {
      const filament = filamentLookup[print.filamentId];
      if (filament) {
        const material = filament.materialType || 'Unknown';
        stats.materialUsage[material] = (stats.materialUsage[material] || 0) + 1;
      }
    }

    // Filament consumption
    const consumed = calculateFilamentConsumed(print);
    if (consumed > 0) {
      stats.filamentConsumption += consumed;
      stats.consumptionData.push(consumed);
    }

    // Monthly breakdown
    const date = new Date(print.startTime || print.createdAt || Date.now());
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    stats.monthlyBreakdown[monthKey] = (stats.monthlyBreakdown[monthKey] || 0) + 1;

    // Daily breakdown for last 30 days
    const dayKey = date.toISOString().split('T')[0];
    stats.dailyBreakdown[dayKey] = (stats.dailyBreakdown[dayKey] || 0) + 1;

    // Print duration
    if (print.startTime && print.endTime) {
      const duration = new Date(print.endTime) - new Date(print.startTime);
      stats.printDurationData.push(duration);
    }
  });

  // Calculate derived statistics
  stats.successRate = stats.totalPrints > 0 ? (stats.successfulPrints / stats.totalPrints) * 100 : 0;

  if (stats.printTimeData.length > 0) {
    stats.averagePrintTime = stats.printTimeData.reduce((sum, time) => sum + time, 0) / stats.printTimeData.length;
    stats.longestPrint = Math.max(...stats.printTimeData);
    stats.shortestPrint = Math.min(...stats.printTimeData);
  }

  if (stats.qualityScores.length > 0) {
    stats.averageQualityScore = stats.qualityScores.reduce((sum, score) => sum + score, 0) / stats.qualityScores.length;
  }

  if (stats.consumptionData.length > 0) {
    stats.averageConsumption = stats.consumptionData.reduce((sum, cons) => sum + cons, 0) / stats.consumptionData.length;
  }

  // Calculate trends
  stats.printingTrend = calculatePrintingTrend(stats.dailyBreakdown);

  return stats;
};

/**
 * Get empty print statistics template
 */
const getEmptyPrintStats = () => ({
  totalPrints: 0,
  successfulPrints: 0,
  failedPrints: 0,
  successRate: 0,
  averagePrintTime: 0,
  longestPrint: 0,
  shortestPrint: 0,
  averageQualityScore: 0,
  filamentConsumption: 0,
  averageConsumption: 0,
  failureReasons: {},
  qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 },
  materialUsage: {},
  monthlyBreakdown: {},
  dailyBreakdown: {},
  printTimeData: [],
  qualityScores: [],
  consumptionData: [],
  printDurationData: [],
  printingTrend: 'stable'
});

/**
 * Calculate economic analytics
 * @param {Array} filaments - Array of filament objects
 * @param {Array} prints - Array of print objects
 * @param {number} replacementCostMultiplier - Cost multiplier for replacement cost
 * @returns {Object} Economic statistics
 */
export const calculateEconomicAnalytics = (filaments, prints = [], replacementCostMultiplier = 3) => {
  const stats = {
    totalInvestment: 0,
    currentValue: 0,
    depreciation: 0,
    averageCostPerPrint: 0,
    totalSavings: 0,
    estimatedReplacementCosts: 0,
    roi: 0,
    monthlyInvestment: {},
    costPerGram: 0,
    valueAtRisk: 0
  };

  let totalWeight = 0;
  let totalValue = 0;

  filaments.forEach(filament => {
    const weight = filament.weight || 0;
    const price = filament.purchasePrice || 0;

    if (price > 0 && weight > 0) {
      const spoolValue = (weight / 1000) * price;
      totalValue += spoolValue;
      totalWeight += weight;

      // Current value for spools in stock
      if (filament.inStock) {
        stats.currentValue += spoolValue;
      } else {
        stats.depreciation += spoolValue;
      }

      // Monthly investment tracking
      if (filament.purchaseDate) {
        const monthKey = getMonthKey(filament.purchaseDate);
        stats.monthlyInvestment[monthKey] = (stats.monthlyInvestment[monthKey] || 0) + spoolValue;
      }
    }
  });

  stats.totalInvestment = totalValue;
  stats.costPerGram = totalWeight > 0 ? totalValue / totalWeight : 0;

  // Print-related calculations
  if (prints.length > 0) {
    stats.averageCostPerPrint = totalValue / prints.length;

    // Estimated replacement costs (what it would cost to buy printed items)
    const estimatedCostPerPrint = stats.averageCostPerPrint * replacementCostMultiplier;
    stats.estimatedReplacementCosts = stats.averageCostPerPrint * prints.length * replacementCostMultiplier;
    stats.totalSavings = stats.estimatedReplacementCosts - totalValue;

    // ROI calculation
    if (totalValue > 0) {
      stats.roi = ((stats.estimatedReplacementCosts - totalValue) / totalValue) * 100;
    }
  }

  // Value at risk (value of low-stock items)
  filaments.forEach(filament => {
    if (filament.inStock && filament.weight < 100) {
      const weight = filament.weight || 0;
      const price = filament.purchasePrice || 0;
      if (price > 0 && weight > 0) {
        stats.valueAtRisk += (weight / 1000) * price;
      }
    }
  });

  return stats;
};

/**
 * Calculate usage patterns and trends
 * @param {Array} prints - Array of print objects
 * @param {Array} models - Array of model objects
 * @param {Array} filaments - Array of filament objects
 * @returns {Object} Usage pattern statistics
 */
export const calculateUsagePatterns = (prints, models = [], filaments = []) => {
  const stats = {
    peakPrintingHours: [],
    mostActiveDays: [],
    seasonalTrends: {},
    userEngagement: {
      printFrequency: 0,
      averageIntervalBetweenPrints: 0,
      retentionRate: 0
    },
    resourceUtilization: {
      modelUtilizationRate: 0,
      filamentUtilizationRate: 0,
      materialEfficiency: {}
    },
    growthMetrics: {
      monthOverMonthGrowth: 0,
      adoptionCurve: [],
      productivityTrend: 'stable'
    }
  };

  if (prints.length === 0) return stats;

  // Time-based analysis
  const hourlyDistribution = Array(24).fill(0);
  const weeklyDistribution = Array(7).fill(0);

  prints.forEach(print => {
    const date = new Date(print.startTime || print.createdAt);
    const hour = date.getHours();
    const day = date.getDay();

    hourlyDistribution[hour]++;
    weeklyDistribution[day]++;
  });

  // Find peak hours and days
  stats.peakPrintingHours = hourlyDistribution
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.hour);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  stats.mostActiveDays = weeklyDistribution
    .map((count, day) => ({ day: dayNames[day], count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map(item => item.day);

  // Model utilization
  const printedModels = new Set(prints.map(p => p.modelId).filter(Boolean));
  stats.resourceUtilization.modelUtilizationRate = models.length > 0
    ? (printedModels.size / models.length) * 100
    : 0;

  // Filament utilization
  const usedFilaments = new Set(prints.map(p => p.filamentId).filter(Boolean));
  stats.resourceUtilization.filamentUtilizationRate = filaments.length > 0
    ? (usedFilaments.size / filaments.length) * 100
    : 0;

  // Engagement metrics
  stats.userEngagement.printFrequency = prints.length / getDaysSinceFirstPrint(prints);

  // Calculate average interval between prints
  const sortedPrints = prints
    .filter(p => p.startTime || p.createdAt)
    .sort((a, b) => new Date(a.startTime || a.createdAt) - new Date(b.startTime || b.createdAt));

  if (sortedPrints.length > 1) {
    const intervals = [];
    for (let i = 1; i < sortedPrints.length; i++) {
      const interval = new Date(sortedPrints[i].startTime || sortedPrints[i].createdAt) -
                      new Date(sortedPrints[i-1].startTime || sortedPrints[i-1].createdAt);
      intervals.push(interval);
    }
    stats.userEngagement.averageIntervalBetweenPrints = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  return stats;
};

/**
 * Helper functions
 */

const qualityToScore = (quality) => {
  const scores = { excellent: 4, good: 3, fair: 2, poor: 1 };
  return scores[quality] || 0;
};

const calculateAverageQuality = (qualities) => {
  const scores = qualities.map(qualityToScore);
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
};

const calculateFilamentConsumed = (print) => {
  if (print.filamentUsed) return print.filamentUsed;
  if (print.weightBefore && print.weightAfter) return print.weightBefore - print.weightAfter;
  if (print.initialWeight && print.finalWeight) return print.initialWeight - print.finalWeight;
  return 0;
};

const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getDaysSinceFirstPrint = (prints) => {
  if (prints.length === 0) return 1;
  const firstPrint = prints.reduce((earliest, print) => {
    const printDate = new Date(print.startTime || print.createdAt);
    const earliestDate = new Date(earliest.startTime || earliest.createdAt);
    return printDate < earliestDate ? print : earliest;
  });
  return Math.max(1, (Date.now() - new Date(firstPrint.startTime || firstPrint.createdAt)) / (1000 * 60 * 60 * 24));
};

const calculatePrintingTrend = (dailyBreakdown) => {
  const days = Object.keys(dailyBreakdown).sort();
  if (days.length < 7) return 'stable';

  const recentWeek = days.slice(-7);
  const previousWeek = days.slice(-14, -7);

  if (previousWeek.length === 0) return 'increasing';

  const recentAvg = recentWeek.reduce((sum, day) => sum + dailyBreakdown[day], 0) / recentWeek.length;
  const previousAvg = previousWeek.reduce((sum, day) => sum + dailyBreakdown[day], 0) / previousWeek.length;

  if (recentAvg > previousAvg * 1.2) return 'increasing';
  if (recentAvg < previousAvg * 0.8) return 'decreasing';
  return 'stable';
};

/**
 * Generate comprehensive statistics summary
 * @param {Object} data - Data object containing filaments, models, prints
 * @returns {Object} Complete statistics summary
 */
export const generateCompleteStatistics = (data) => {
  const { filaments, models, prints } = data;

  return {
    overview: {
      totalItems: (filaments?.length || 0) + (models?.length || 0) + (prints?.length || 0),
      lastUpdated: new Date().toISOString(),
      dataHealth: {
        filamentCount: filaments?.length || 0,
        modelCount: models?.length || 0,
        printCount: prints?.length || 0
      }
    },
    filament: calculateFilamentAnalytics(filaments),
    model: calculateModelAnalytics(models, prints),
    print: calculatePrintAnalytics(prints, filaments),
    economic: calculateEconomicAnalytics(filaments, prints),
    usage: calculateUsagePatterns(prints, models, filaments)
  };
};

export default {
  calculateFilamentAnalytics,
  calculateModelAnalytics,
  calculatePrintAnalytics,
  calculateEconomicAnalytics,
  calculateUsagePatterns,
  generateCompleteStatistics
};