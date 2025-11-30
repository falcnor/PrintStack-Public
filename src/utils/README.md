# PrintStack Utility Library

This directory contains comprehensive utility functions and helpers for the PrintStack application.

## Organization

### Core Files

- **`dataUtils.js`** - Core data manipulation and validation functions (filaments, models, prints)
- **`constants.js`** - Application constants, enums, and configuration
- **`helpers.js`** - General JavaScript utility functions
- **`validation.js`** - Enhanced validation utilities for complex scenarios
- **`formatters.js`** - Formatting functions for display purposes
- **`arrayUtils.js`** - Array manipulation and processing utilities
- **`index.js`** - Central export point for all utilities

### Migration Files

- **`filamentMigration.js`** - Migration utilities for data transfer from vanilla JS to React
- **`dataMigrationTesting.js`** - Testing utilities for data migrations
- **`varianceAnalysis.js`** - Statistical analysis utilities for print performance

## Usage

```javascript
// Import all utilities at once
import * as Utils from '../utils/';

// Import specific utilities
import {
  generateId,
  formatCurrency,
  formatDate,
  validateFilament,
  MATERIAL_TYPES,
  STORAGE_KEYS
} from '../utils/';

// Import from specific modules
import { debounce, deepClone } from '../utils/helpers.js';
import { formatFileSize, truncateText } from '../utils/formatters.js';
```

## Key Features

### Data Management
- ID generation and cloning utilities
- Currency and weight formatting
- Print time calculations
- Statistics computation
- JSON import/export functionality

### Validation
- Form validation with schema support
- File type and size validation
- Email, URL, phone validation
- Password strength checking
- Custom validation functions

### Array Operations
- Pagination and chunking
- Advanced filtering and sorting
- Duplicate removal
- Item manipulation (update/remove/move)
- Sampling and randomization

### Formatters
- Date/time formatting
- File size display
- Percentage calculations
- Text truncation
- Color formatting

## Constants

The library includes comprehensive constants for:
- Material types (PLA, PETG, ABS, etc.)
- Print status options
- Quality ratings
- Model categories
- Color presets
- LocalStorage keys
- UI configuration
- Validation rules

## Best Practices

1. **Use the central index** for imports to keep import paths clean
2. **Leverage constants** instead of magic strings
3. **Use validation utilities** for form validation
4. **Utilize formatters** for consistent data display
5. **Take advantage of array utilities** for data manipulation

## Examples

### Form Validation
```javascript
const schema = {
  name: { required: true, minLength: 2, maxLength: 50 },
  email: { required: true, validate: validateEmail },
  material: { required: true, type: 'string' }
};

const result = validateSchema(formData, schema);
if (!result.isValid) {
  console.log(result.errors);
}
```

### Array Operations
```javascript
// Paginate results
const paginated = paginate(data, currentPage, pageSize);

// Filter with multiple criteria
const filtered = filterBy(data, {
  material: 'PLA',
  status: 'completed',
  minCost: 20
});

// Remove duplicates
const unique = removeDuplicates(data, 'id');
```

### Formatting
```javascript
// Format dates
const formattedDate = formatDate(date, true); // Include time

// Format file sizes
const sizeDisplay = formatFileSize(bytes);

// Format currency
const price = formatCurrency(29.99);
```

This utility library is designed to be comprehensive, type-safe, and easy to use throughout the PrintStack application.