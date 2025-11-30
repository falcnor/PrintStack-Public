# PrintStack Utilities Documentation

Comprehensive documentation for utility functions and methods available in the PrintStack application.

## 📁 Structure

```
src/utils/
├── dataUtils.js          # Data processing and formatting utilities
├── debugUtils.js         # Debugging and error reporting
├── filamentMigration.js  # Data migration utilities
├── helpers.js           # General helper functions
├── lazyLoad.js          # Lazy loading utilities
├── varianceAnalysis.js   # Statistical analysis
└── filamentValidation.js # Form validation schemas
```

## 🛠️ Data Utils (`dataUtils.js`)

### Data Processing Functions

#### `formatCurrency(amount, currency = 'USD')`

Formats a number as currency.

```javascript
formatCurrency(1234.56); // "$1,234.56"
formatCurrency(1234.56, 'EUR'); // "€1,234.56"
```

**Parameters:**
- `amount` (number): The monetary amount
- `currency` (string): Currency code (default: 'USD')

**Returns:** (string) Formatted currency string

#### `formatWeight(weight, unit = 'g')`

Formats weight values with appropriate units.

```javascript
formatWeight(1500); // "1.5 kg"
formatWeight(500); // "500 g"
formatWeight(0.25); // "0.25 g"
```

#### `calculateFilamentPercentage(remaining, total)`

Calculates the percentage of remaining filament.

```javascript
calculateFilamentPercentage(750, 1000); // 75
calculateFilamentPercentage(0, 1000); // null
```

#### `calculateCostPerGram(cost, weight)`

Calculates cost per gram for filament.

```javascript
calculateCostPerGram(25.99, 1000); // 0.02599
```

#### `calculatePrintStatistics(printHistory)`

Comprehensive print statistics calculation.

```javascript
const stats = calculatePrintStatistics(prints);
// Returns: {
//   totalPrints: 42,
//   successRate: 0.85,
//   averagePrintTime: 180,
//   totalFilamentUsed: 2500,
//   mostPrintedModel: "Model Name"
// }
```

### Data Export/Import

#### `exportToJSON(data, filename = 'export.json')`

Exports data to JSON file download.

```javascript
exportToJSON(filaments, 'filaments-backup.json');
```

#### `importFromJSON(file)`

Imports and validates JSON data from file.

```javascript
const data = await importFromJSON(file);
```

### Search and Filter Functions

#### `filterBySearchTerm(items, term, searchFields)`

Search functionality for arrays of objects.

```javascript
const results = filterBySearchTerm(models, "dragon", ["name", "category"]);
```

#### `sortByMultipleCriteria(items, sortConfig)`

Multi-criteria sorting utility.

```javascript
const sorted = sortByMultipleCriteria(filaments, [
  { key: 'material', direction: 'asc' },
  { key: 'color', direction: 'desc' }
]);
```

## 🐛 Debug Utils (`debugUtils.js`)

### Logging System

#### `logger.info(message, ...args)` / `logger.warn()` / `logger.error()` / `logger.debug()`

Enhanced logging with environment-specific output.

```javascript
logger.info('Component mounted', { component: 'FilamentList' });
logger.error('API request failed', { url, status });
```

### Performance Monitoring

#### `performance.measureRender(ComponentName)`

Higher-order component for render time measurement.

```javascript
const MonitoredComponent = performance.measureRender('MyComponent')(MyComponent);
```

#### `logger.time(label)` / `logger.timeEnd(label)`

Performance timing utilities.

```javascript
logger.time('data-processing');
// ... processing code
logger.timeEnd('data-processing'); // Logs elapsed time
```

### Error Reporting

#### `ErrorReporter` Class

Global error tracking and reporting system.

```javascript
import { errorReporter } from '../utils/debugUtils';

// Manual error reporting
errorReporter.report(new Error('Something went wrong'), {
  component: 'FilamentTable',
  action: 'sort'
});

// Get error history
const recentErrors = errorReporter.getErrors();
```

### Development Helpers

#### `devHelpers`

Development-only utility functions.

```javascript
devHelpers.showLocalStorage(); // Logs localStorage contents
devHelpers.checkMemoryUsage(); // Shows memory statistics
devHelpers.showComponentTree(); // Lists React components on page
```

## 🛡️ Validation (`filamentValidation.js`)

### Validation Schemas

#### `validateFilament(filamentData)`

Comprehensive filament data validation.

```javascript
const validation = validateFilament({
  name: "PLA Blue",
  material: "PLA",
  color: "Blue",
  weight: 1000
});

if (!validation.isValid) {
  console.log(validation.errors); // Array of error messages
}
```

**Validation Rules:**
- `name`: Required, string, 3-50 characters
- `material`: Required, string, from allowed list
- `color`: Optional, string, 3-30 characters
- `weight`: Optional, number, 0-50000
- `remainingWeight`: Optional, number, 0-50000
- `cost`: Optional, number, 0-10000
- `colorName`: Optional, string, 3-50 characters

#### `validateModel(modelData)`

Model data validation with requirements checking.

```javascript
const validation = validateModel({
  name: "Dragon Model",
  category: "Figures",
  difficulty: "Easy",
  printTime: 180
});
```

#### `validatePrint(printData)`

Print record validation with reference checking.

```javascript
const validation = validatePrint({
  modelId: "model-123",
  date: "2024-01-15",
  filamentUsages: [
    { filamentId: "fil-456", actualWeight: 150 }
  ]
});
```

## 🧮 Statistics (`varianceAnalysis.js`)

### Print Quality Analysis

#### `calculatePrintQualityDistribution(printHistory)`

Analyzes quality rating distribution.

```javascript
const distribution = calculatePrintQualityDistribution(prints);
// Returns: {
//   excellent: 15,
//   good: 25,
//   fair: 8,
//   poor: 2,
//   total: 50
// }
```

#### `calculateCostAnalysis(printHistory, filamentData)`

Cost analysis of print operations.

```javascript
const costAnalysis = calculateCostAnalysis(prints, filaments);
// Returns: {
//   totalCost: 156.78,
//   averageCostPerPrint: 3.14,
//   costPerGram: 0.032,
//   filamentsByCost: [...]
// }
```

#### `calculatePrintTrends(printHistory, timeRange)`

Printing trends and patterns analysis.

```javascript
const trends = calculatePrintTrends(prints, '30d');
// Returns: {
//   trendDirection: 'increasing',
//   averagePerDay: 1.2,
//   peakDay: 'Friday',
//   monthlyGrowth: 0.15
// }
```

### Predictive Analytics

#### `predictFilamentNeeds(filaments, historicalData)`

Predicts when filament reorders will be needed.

```javascript
const predictions = predictFilamentNeeds(currentFilaments, printHistory);
// Returns: [{
//   filamentId: "fil-123",
//   daysRemaining: 15,
//   recommendedAction: "order soon"
// }]
```

## 📦 Migration (`filamentMigration.js`)

### Data Migration Utilities

#### `migrateFromVersion(fromVersion, toVersion, data)`

Migrates data between versions.

```javascript
const migratedData = migrateFromVersion('1.0', '2.0', oldData);
```

#### `validateMigrationIntegrity(originalData, migratedData)`

Verifies migration data integrity.

```javascript
const integrity = validateMigrationIntegrity(oldData, newData);
// Returns: { isValid: true, issues: [] }
```

#### `backupCurrentData()`

Creates timestamped backup of current data.

```javascript
const backupPath = backupCurrentData(); // Returns backup file path
```

## 🎨 Helper Functions (`helpers.js`)

### String Utilities

#### `capitalizeFirst(string)`

Capitalizes the first letter of a string.

```javascript
capitalizeFirst('hello world'); // "Hello world"
```

#### `slugify(text)`

Converts text to URL-friendly slug.

```javascript
slugify('Dragon Model Blue'); // "dragon-model-blue"
```

#### `generateUniqueID(prefix = '')`

Generates a unique ID with optional prefix.

```javascript
generateUniqueID('filament'); // "filament_1704067200000_abc123"
```

### Array Utilities

#### `groupBy(array, key)`

Groups array elements by a key.

```javascript
const grouped = groupBy(filaments, 'material');
// Returns: { PLA: [...], PETG: [...], ABS: [...] }
```

#### `uniqueBy(array, key)`

Removes duplicates based on a key.

```javascript
const unique = uniqueBy(filaments, 'color');
```

### Date Utilities

#### `formatDate(date, format = 'YYYY-MM-DD')`

Flexible date formatting.

```javascript
formatDate(new Date(), 'MM/DD/YYYY'); // "01/15/2024"
formatDate(new Date(), 'long'); // "January 15, 2024"
```

#### `getRelativeTime(date)`

Human-readable relative time.

```javascript
getRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### Storage Utilities

#### `debounce(func, delay)`

Debounces function calls.

```javascript
const debouncedSearch = debounce(performSearch, 300);
```

#### `throttle(func, limit)`

Throttles function calls.

```javascript
const throttledScroll = throttle(handleScroll, 100);
```

## ⚡ Performance (`lazyLoad.js`)

### Lazy Loading Components

#### Pre-defined Lazy Components

```javascript
import {
  LazyFilamentImportExport,
  LazyQualityRating,
  LazyRequirementMapping
} from '../utils/lazyLoad';

// Use with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <LazyQualityRating rating="excellent" />
</Suspense>
```

#### `createLazyComponent(importFunc, fallback)`

Create custom lazy-loaded components.

```javascript
const LazyComponent = createLazyComponent(
  () => import('../components/HeavyComponent.jsx'),
  () => <div>Loading...</div>
);
```

## 🎯 Usage Examples

### Comprehensive Data Processing

```javascript
import {
  filterBySearchTerm,
  sortByMultipleCriteria,
  calculatePrintStatistics,
  formatCurrency,
  formatWeight
} from '../utils/dataUtils';

// Filter and sort data
const filteredPrints = filterBySearchTerm(prints, searchTerm, ['name', 'notes']);
const sortedPrints = sortByMultipleCriteria(filteredPrints, [
  { key: 'date', direction: 'desc' },
  { key: 'quality', direction: 'asc' }
]);

// Calculate statistics
const stats = calculatePrintStatistics(sortedPrints);

// Format for display
const formattedStats = {
  totalCost: formatCurrency(stats.totalCost),
  totalWeight: formatWeight(stats.totalFilamentUsed),
  averagetime: `${stats.averagePrintTime} minutes`
};
```

### Form Handling with Validation

```javascript
import { validateFilament } from '../utils/filamentValidation';
import { errorReporter, logger } from '../utils/debugUtils';

const handleFormSubmit = async (formData) => {
  logger.info('Validating filament form', formData);

  const validation = validateFilament(formData);

  if (!validation.isValid) {
    logger.warn('Form validation failed', validation.errors);
    return { success: false, errors: validation.errors };
  }

  try {
    const result = await saveFilament(formData);
    logger.info('Filament saved successfully', { id: result.id });
    return { success: true, data: result };
  } catch (error) {
    errorReporter.report(error, {
      action: 'saveFilament',
      formData: formData
    });
    return { success: false, error: error.message };
  }
};
```

### Performance Monitoring

```javascript
import { performance, logger } from '../utils/debugUtils';

const ExpensiveComponent = ({ largeDataSet }) => {
  logger.time('data-processing');

  const processedData = useMemo(() => {
    // Expensive calculation
    return largeDataSet.map(processItem);
  }, [largeDataSet]);

  logger.timeEnd('data-processing');

  return <div>{/* Render processed data */}</div>;
};

export default performance.measureRender('ExpensiveComponent')(ExpensiveComponent);
```

## 🔧 Extension Guidelines

When adding new utility functions:

1. **Choose appropriate file** in `src/utils/`
2. **Add JSDoc documentation**
3. **Include parameter validation**
4. **Write usage examples**
4. **Consider performance implications**
5. **Add error handling**
6. **Test with edge cases**

### Template for New Utilities

```javascript
/**
 * Brief description of the utility function
 * @param {Type} paramName - Description of parameter
 * @returns {Type} Description of return value
 * @example
 * const result = utilityName(exampleInput);
 * // Returns: expectedOutput
 */
export const utilityName = (paramName) => {
  // Parameter validation
  if (paramName === undefined) {
    throw new Error('Parameter is required');
  }

  // Implementation
  const result = /* ... */;

  return result;
};
```

---

This documentation will be updated as new utilities are added to the application.