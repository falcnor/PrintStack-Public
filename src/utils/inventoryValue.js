/**
 * Inventory Value Calculation Utilities
 * Provides comprehensive asset valuation and ROI analysis for 3D printing inventory
 */

/**
 * Calculate total filament inventory value
 * @param {Array} filaments - Array of filament objects
 * @param {Object} options - Calculation options
 * @returns {Object} Detailed inventory valuation
 */
export const calculateFilamentInventoryValue = (filaments = [], options = {}) => {
  const {
    includeDepreciation = true,
    depreciationRate = 0.15, // 15% annual depreciation
    includeResaleValue = true,
    resaleValueMultiplier = 0.4, // 40% of original cost
    calculationDate = new Date()
  } = options;

  const results = {
    totalValue: 0,
    totalWeight: 0,
    totalSpools: 0,
    totalCost: 0,
    depreciationTotal: 0,
    resaleValueTotal: 0,
    materialBreakdown: {},
    brandBreakdown: {},
    ageAnalysis: {
      new: { count: 0, value: 0, weight: 0 },
      recent: { count: 0, value: 0, weight: 0 },
      mature: { count: 0, value: 0, weight: 0 },
      old: { count: 0, value: 0, weight: 0 }
    },
    topInventoryByValue: [],
    topInventoryByWeight: [],
    lowValueSpools: [],
    inventoryHealth: {
      valueDensity: 0,
      weightValueRatio: 0,
      averageSpoolCost: 0,
      valueDistribution: 'balanced'
    },
    calculationDate: calculationDate.toISOString()
  };

  const spoolValues = [];

  filaments.forEach((filament, index) => {
    const spoolWeight = filament.weight || filament.remainingWeight || 0;
    const spoolCost = filament.cost || filament.price || 0;
    const material = filament.material || 'Unknown';
    const brand = filament.brand || 'Unknown';
    const dateAdded = filament.dateAdded ? new Date(filament.dateAdded) : new Date();
    const ageInDays = Math.max(0, Math.floor((calculationDate - dateAdded) / (1000 * 60 * 60 * 24)));

    // Categorize by age
    let ageCategory;
    if (ageInDays < 30) {
      ageCategory = 'new';
    } else if (ageInDays < 90) {
      ageCategory = 'recent';
    } else if (ageInDays < 365) {
      ageCategory = 'mature';
    } else {
      ageCategory = 'old';
    }

    const currentWeight = filament.remainingWeight || spoolWeight;
    const percentRemaining = currentWeight / spoolWeight;
    const currentValue = spoolCost * percentRemaining;

    // Calculate depreciation
    let depreciation = 0;
    let depreciatedValue = currentValue;
    if (includeDepreciation && ageInDays > 0) {
      depreciation = currentValue * (depreciationRate * (ageInDays / 365));
      depreciation = Math.min(depreciation, currentValue * 0.8); // Max 80% depreciation
      depreciatedValue = Math.max(currentValue - depreciation, currentValue * 0.2); // Min 20% value
    }

    // Calculate resale value
    let resaleValue = 0;
    if (includeResaleValue) {
      resaleValue = depreciatedValue * resaleValueMultiplier * (currentWeight / spoolWeight);
    }

    // Update totals
    results.totalValue += depreciatedValue;
    results.totalCost += spoolCost;
    results.deprecationTotal += depreciation;
    results.resaleValueTotal += resaleValue;
    results.totalWeight += currentWeight / 1000; // Convert to kg
    results.totalSpools += 1;

    // Update material breakdown
    if (!results.materialBreakdown[material]) {
      results.materialBreakdown[material] = {
        count: 0,
        weight: 0,
        value: 0,
        cost: 0,
        depreciation: 0
      };
    }
    results.materialBreakdown[material].count++;
    results.materialBreakdown[material].weight += currentWeight / 1000;
    results.materialBreakdown[material].value += depreciatedValue;
    results.materialBreakdown[material].cost += spoolCost;
    results.materialBreakdown[material].depreciation += depreciation;

    // Update brand breakdown
    if (!results.brandBreakdown[brand]) {
      results.brandBreakdown[brand] = {
        count: 0,
        weight: 0,
        value: 0,
        cost: 0
      };
    }
    results.brandBreakdown[brand].count++;
    results.brandBreakdown[brand].weight += currentWeight / 1000;
    results.brandBreakdown[brand].value += depreciatedValue;
    results.brandBreakdown[brand].cost += spoolCost;

    // Update age analysis
    results.ageAnalysis[ageCategory].count++;
    results.ageAnalysis[ageCategory].value += depreciatedValue;
    results.ageAnalysis[ageCategory].weight += currentWeight / 1000;

    // Store for detailed analysis
    spoolValues.push({
      index: index,
      material,
      brand,
      weight: currentWeight,
      currentValue,
      depreciatedValue,
      depreciation,
      resaleValue,
      percentRemaining,
      ageInDays,
      cost: spoolCost,
      ...filament
    });
  });

  // Calculate inventory health metrics
  if (results.totalWeight > 0) {
    results.inventoryHealth.valueDensity = results.totalValue / results.totalWeight;
    results.inventoryHealth.weightValueRatio = results.totalWeight / results.totalValue;
  }
  if (results.totalSpools > 0) {
    results.inventoryHealth.averageSpoolCost = results.totalCost / results.totalSpools;
  }

  // Determine value distribution
  const highValuePercentage = (results.ageAnalysis.new.value + results.ageAnalysis.recent.value) / results.totalValue;
  if (highValuePercentage > 0.7) {
    results.inventoryHealth.valueDistribution = 'high_value';
  } else if (highValuePercentage < 0.3) {
    results.inventoryHealth.valueDistribution = 'low_value';
  } else {
    results.inventoryHealth.valueDistribution = 'balanced';
  }

  // Sort and select top items
  results.topInventoryByValue = spoolValues
    .sort((a, b) => b.depreciatedValue - a.depreciatedValue)
    .slice(0, 10);

  results.topInventoryByWeight = spoolValues
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10);

  // Identify low value spools (less than 25% of average)
  const averageSpoolValue = results.totalValue / results.totalSpools;
  results.lowValueSpools = spoolValues
    .filter(spool => spool.depreciatedValue < averageSpoolValue * 0.25)
    .sort((a, b) => a.depreciatedValue - b.depreciatedValue);

  return results;
};

/**
 * Calculate inventory turnover and usage metrics
 * @param {Array} filaments - Array of filament inventory
 * @param {Array} prints - Array of print history
 * @param {Object} options - Calculation options
 * @returns {Object} Turnover analysis
 */
export const calculateInventoryTurnover = (filaments = [], prints = [], options = {}) => {
  const {
    timeRange = 365, // days to analyze
    calculationDate = new Date()
  } = options;

  const cutoffDate = new Date(calculationDate.getTime() - (timeRange * 24 * 60 * 60 * 1000));

  const recentPrints = prints.filter(print => new Date(print.date) >= cutoffDate);

  const materialUsage = {};
  const brandUsage = {};
  const totalUsedFilament = recentPrints.reduce((sum, print) => sum + (print.filamentUsed || 0), 0);

  recentPrints.forEach(print => {
    const material = print.filamentType || 'Unknown';
    const brand = print.filamentBrand || 'Unknown';
    const usedGrams = print.filamentUsed || 0;

    materialUsage[material] = (materialUsage[material] || 0) + usedGrams;
    brandUsage[brand] = (brandUsage[brand] || 0) + usedGrams;
  });

  // Calculate turnover ratios
  const inventoryByMaterial = {};
  filaments.forEach(filament => {
    const material = filament.material || 'Unknown';
    inventoryByMaterial[material] = (inventoryByMaterial[material] || 0) + (filament.remainingWeight || 0);
  });

  const turnoverByMaterial = {};
  Object.keys(materialUsage).forEach(material => {
    const used = materialUsage[material];
    const available = inventoryByMaterial[material] || 0;
    turnoverByMaterial[material] = available > 0 ? used / available : 0;
  });

  return {
    timeRange,
    totalPrints: recentPrints.length,
    totalFilamentUsed: totalUsedFilament / 1000, // Convert to kg
    averageFilamentPerPrint: recentPrints.length > 0 ? totalUsedFilament / recentPrints.length : 0,
    materialUsage,
    brandUsage,
    turnoverByMaterial,
    mostUsedMaterials: sortObjectByValue(materialUsage, 'desc').slice(0, 5),
    highestTurnoverMaterials: sortObjectByValue(turnoverByMaterial, 'desc').slice(0, 5),
    lowestTurnoverMaterials: sortObjectByValue(turnoverByMaterial, 'asc').slice(0, 5),
    calculationDate: calculationDate.toISOString()
  };
};

/**
 * Calculate ROI and savings from 3D printing
 * @param {Array} filaments - Filament inventory
 * @param {Array} prints - Print history
 * @param {Array} models - Model library with replacement costs
 * @param {Object} options - Calculation options
 * @returns {Object} ROI analysis
 */
export const calculatePrintingROI = (filaments = [], prints = [], models = [], options = {}) => {
  const {
    replacementCostMultiplier = 3, // Typical 3x cost multiplier for purchased parts
    hourlyLaborRate = 25, // $25/hour standard rate
    includeLaborCosts = false,
    includeElectricityCosts = true,
    electricityRate = 0.12, // $/kWh
    printerPowerUsage = 200, // Watts
    calculationDate = new Date()
  } = options;

  const results = {
    totalFilamentInvestment: 0,
    filamentValueUsed: 0,
    filamentsPrinted: 0,
    totalReplacementCost: 0,
    totalPrintCost: 0,
    totalSavings: 0,
    returnOnInvestment: 0,
    breakEvenPrints: 0,
    costPerGram: 0,
    savingsPerGram: 0,
    detailedBreakdown: [],
    timeToBreakEven: null,
    annualizedROI: 0,
    costBreakdown: {
      filament: 0,
      electricity: 0,
      labor: 0,
      other: 0
    }
  };

  const inventoryCalculation = calculateFilamentInventoryValue(filaments, options);
  const inventoryValueBySpool = {};

  // Create lookup for filament costs by brand/material
  filaments.forEach(filament => {
    const key = `${filament.brand}_${filament.material}`;
    inventoryValueBySpool[key] = filament.cost / (filament.weight || 1000); // Cost per gram
  });

  results.totalFilamentInvestment = inventoryCalculation.totalCost;
  results.costPerGram = results.totalFilamentInvestment / ((filaments.reduce((sum, f) => sum + (f.weight || 1000), 0)) / 1000);

  const printData = [];

  prints.forEach(print => {
    const model = models.find(m => m.id === print.modelId);
    const usedGrams = print.filamentUsed || 0;
    const durationHours = (print.duration || 0) / 60; // Convert minutes to hours
    const materialKey = print.filamentBrand && print.filamentType
      ? `${print.filamentBrand}_${print.filamentType}`
      : 'average';

    // Calculate costs for this print
    const filamentCost = (usedGrams / 1000) * (inventoryValueBySpool[materialKey] || results.costPerGram * 1000);
    let electricityCost = 0;

    if (includeElectricityCosts && durationHours > 0) {
      const electricityUsed = (printerPowerUsage / 1000) * durationHours; // kWh
      electricityCost = electricityUsed * electricityRate;
    }

    const laborCost = includeLaborCosts ? durationHours * hourlyLaborRate : 0;
    const totalPrintCost = filamentCost + electricityCost + laborCost;

    // Calculate replacement value (if model has replacement cost)
    const replacementCost = model?.replacementCost || (usedGrams * results.costPerGram * replacementCostMultiplier);
    const savings = Math.max(0, replacementCost - totalPrintCost);

    results.filamentValueUsed += filamentCost;
    results.totalReplacementCost += replacementCost;
    results.totalPrintCost += totalPrintCost;
    results.totalSavings += savings;
    results.filamentsPrinted += (usedGrams / 1000); // Convert to kg

    printData.push({
      printId: print.id,
      modelName: model?.name || 'Unknown',
      filamentUsed: usedGrams,
      filamentCost,
      electricityCost,
      laborCost,
      totalCost: totalPrintCost,
      replacementCost,
      savings,
      duration: durationHours,
      quality: print.quality,
      status: print.status
    });
  });

  results.costBreakdown.filament = results.filamentValueUsed;
  results.costBreakdown.electricity = includeElectricityCosts
    ? printData.reduce((sum, p) => sum + p.electricityCost, 0)
    : 0;
  results.costBreakdown.labor = includeLaborCosts
    ? printData.reduce((sum, p) => sum + p.laborCost, 0)
    : 0;

  // Calculate ROI metrics
  if (results.totalPrintCost > 0) {
    results.returnOnInvestment = ((results.totalSavings - results.totalPrintCost) / results.totalPrintCost) * 100;
    results.savingsPerGram = results.totalSavings / ((results.filamentsPrinted * 1000) || 1);
  }

  // Calculate break-even point
  const averageSavingsPerPrint = prints.length > 0 ? results.totalSavings / prints.length : 0;
  if (averageSavingsPerPrint > 0) {
    results.breakEvenPrints = Math.ceil(results.totalFilamentInvestment / averageSavingsPerPrint);

    // Estimate time to break even based on printing frequency
    const printFrequency = prints.length > 0 ? 365 / (prints.length / timeRangeOfPrints(prints, calculationDate)) : Infinity;
    if (printFrequency !== Infinity) {
      results.timeToBreakEven = `${results.breakEvenPrints} prints (~${Math.round(results.breakEvenPrints * printFrequency)} days)`;
    }
  }

  // Annualized ROI
  const firstPrintDate = prints.length > 0 ? Math.min(...prints.map(p => new Date(p.date))) : calculationDate;
  const daysSinceFirstPrint = Math.max(1, (calculationDate - firstPrintDate) / (1000 * 60 * 60 * 24));
  const yearsSinceFirstPrint = daysSinceFirstPrint / 365;

  if (yearsSinceFirstPrint > 0) {
    results.annualizedROI = results.returnOnInvestment / yearsSinceFirstPrint;
  }

  // Store detailed breakdown
  results.detailedBreakdown = printData.sort((a, b) => b.savings - a.savings).slice(0, 20);

  return results;
};

/**
 * Generate inventory recommendations based on analysis
 * @param {Array} filaments - Filament inventory
 * @param {Array} prints - Print history
 * @param {Object} options - Analysis options
 * @returns {Object} Recommendations and insights
 */
export const generateInventoryRecommendations = (filaments = [], prints = [], options = {}) => {
  const {
    maxInventoryAge = 365, // days
    lowFilamentThreshold = 100, // grams
    overstockThreshold = 5, // spools per material
    includeCostRecommendations = true
  } = options;

  const inventoryValue = calculateFilamentInventoryValue(filaments, options);
  const turnover = calculateInventoryTurnover(filaments, prints, options);

  const recommendations = {
    urgent: [],
    optimization: [],
    costSaving: [],
    preventMaintenance: [],
    riskAssessment: {
      wasteRisk: 'low',
      capitalTiedUp: 'low',
      materialShortage: 'low'
    },
    actionItems: []
  };

  // Check for old inventory
  Object.entries(inventoryValue.ageAnalysis).forEach(([ageGroup, data]) => {
    if (ageGroup === 'old' && data.count > 0) {
      recommendations.urgent.push({
        type: 'old_inventory',
        message: `${data.count} old spools (${ageGroup}) worth ${formatCurrency(data.value)} identified`,
        priority: 'high',
        suggestedActions: ['Use soon', 'Consider sale', 'Donate if unusable'],
        items: data.count
      });
    }

    if (data.value > 500) { // Over $500 tied up in old inventory
      recommendations.riskAssessment.capitalTiedUp = 'high';
    }
  });

  // Check low filament levels
  Object.entries(inventoryValue.materialBreakdown).forEach(([material, data]) => {
    const avgWeightPerSpool = data.weight / data.count;
    if (avgWeightPerSpool < lowFilamentThreshold / 1000) { // Less than 100g remaining
      recommendations.preventMaintenance.push({
        type: 'low_filament',
        message: `${data.count} ${material} spools running low (${avgWeightPerSpool.toFixed(1)}kg avg)`,
        priority: 'medium',
        material,
        currentStock: data.weight,
        suggestedActions: ['Re-order soon', 'Use for small prints']
      });
    }
  });

  // Check overstock situations
  Object.entries(inventoryValue.materialBreakdown).forEach(([material, data]) => {
    if (data.count > overstockThreshold) {
      recommendations.optimization.push({
        type: 'overstock',
        message: `${data.count} spools of ${material} - consider if this is optimal`,
        priority: 'low',
        material,
        count: data.count,
        value: data.value,
        suggestedActions: ['Inventory planning', 'Storage optimization']
      });
    }
  });

  // Check materials with low turnover
  Object.entries(turnover.lowestTurnoverMaterials).forEach(([material, turnover]) => {
    if (turnover < 0.1 && material in inventoryValue.materialBreakdown) {
      recommendations.optimization.push({
        type: 'low_turnover',
        message: `${material} has very low turnover (${(turnover * 100).toFixed(1)}% used in last year)`,
        priority: 'medium',
        material,
        turnover,
        value: inventoryValue.materialBreakdown[material].value,
        suggestedActions: ['Use for projects', 'Consider swapping material types']
      });
    }
  });

  // Cost saving opportunities
  if (includeCostRecommendations) {
    const averageCostPerKg = inventoryValue.totalCost / inventoryValue.totalWeight;
    if (averageCostPerKg > 25) { // Over $25/kg
      recommendations.costSaving.push({
        type: 'high_cost_materials',
        message: `High average materials cost: ${formatCurrency(averageCostPerKg)}/kg`,
        priority: 'medium',
        currentCost: averageCostPerKg,
        suggestedActions: ['Bulk purchasing', 'Alternative materials', 'Supplier comparison']
      });
    }

    // Depreciation losses
    if (inventoryValue.deprecationTotal > 100) { // Over $100 in depreciation
      recommendations.costSaving.push({
        type: 'depreciation_loss',
        message: `Depreciation loss of ${formatCurrency(inventoryValue.deprecationTotal)} identified`,
        priority: 'low',
        loss: inventoryValue.deprecationTotal,
        suggestedActions: ['Accelerate usage', 'Better inventory management', 'FIFO rotation']
      });
    }
  }

  // Overall risk assessment
  if (inventoryValue.totalValue > 1000) {
    recommendations.riskAssessment.capitalTiedUp = 'medium';
    if (inventoryValue.totalValue > 5000) {
      recommendations.riskAssessment.capitalTiedUp = 'high';
    }
  }

  const oldInventoryValue = inventoryValue.ageAnalysis.old.value + inventoryValue.ageAnalysis.mature.value;
  const oldInventoryPercentage = oldInventoryValue / inventoryValue.totalValue;
  if (oldInventoryPercentage > 0.5) {
    recommendations.riskAssessment.wasteRisk = 'high';
  } else if (oldInventoryPercentage > 0.3) {
    recommendations.riskAssessment.wasteRisk = 'medium';
  }

  // Generate action items
  recommendations.actionItems = [
    ...generateActionItems(recommendations.urgent, 'immediate'),
    ...generateActionItems(recommendations.preventMaintenance, 'scheduled'),
    ...generateActionItems(recommendations.optimization, 'planned')
  ];

  return recommendations;
};

// Helper functions
function timeRangeOfPrints(prints, calculationDate) {
  if (!prints.length) return 365; // Default to 1 year

  const dates = prints.map(p => new Date(p.date));
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  return Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24)); // days
}

function sortObjectByValue(obj, order = 'desc') {
  return Object.entries(obj)
    .sort(([,a], [,b]) => order === 'desc' ? b - a : a - b)
    .map(([key, value]) => ({ [key]: value }));
}

function generateActionItems(recommendations, category) {
  return recommendations.map((rec, index) => ({
    id: `${category}_${index}`,
    category,
    priority: rec.priority,
    title: rec.message,
    actions: rec.suggestedActions || [],
    type: rec.type,
    dueDate: category === 'immediate' ? 'This week' : category === 'scheduled' ? 'This month' : 'This quarter'
  }));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

// Export utility function for formatting
export { formatCurrency };