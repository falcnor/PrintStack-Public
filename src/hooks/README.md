# PrintStack Custom Hooks

This directory contains custom React hooks that encapsulate shared logic and provide reusable functionality across the PrintStack application.

## Organization

### Core Storage Hooks
- **`useLocalStorage.js`** - LocalStorage operations with error handling and data validation
- **`useModels.js`** - Model management with enhanced business logic
- **`usePrints.js`** - Print history management with statistical analysis

### New Custom Hooks

#### Form Management
- **`useForm.js`** - Advanced form handling with validation, error management, and state management

#### UI Interaction Hooks
- **`useDebounce.js`** - Debouncing for search inputs, API calls, and performance optimization
- **`useFilters.js`** - Advanced filtering, searching, and sorting functionality
- **`usePagination.js`** - Pagination controls and infinite scroll implementation
- **`useNotifications.js`** - Toast and notification system with auto-dismissal

## Usage Examples

### Form Handling with useForm

```javascript
import { useForm, validateSchema } from '../hooks';

const validationSchema = {
  name: { required: true, minLength: 2, maxLength: 50 },
  material: { required: true, type: 'string' },
  cost: { required: true, type: 'number', min: 0 }
};

const filamentForm = useForm(
  { name: '', material: 'PLA', cost: 0 },
  validationSchema,
  async (values) => {
    await createFilament(values);
  }
);

// In component
<input
  value={filamentForm.values.name}
  onChange={(e) => filamentForm.setValue('name', e.target.value)}
  onBlur={() => filamentForm.handleBlur('name')}
/>
{filamentForm.errors.name && <span className="error">{filamentForm.errors.name}</span>}
<button onClick={filamentForm.submitForm} disabled={filamentForm.isSubmitting}>
  Save
</button>
```

### Debounced Search with useDebouncedSearch

```javascript
import { useDebouncedSearch } from '../hooks';

const { searchTerm, setSearchTerm, results, loading, error } = useDebouncedSearch(
  searchFilaments,
  300
);

return (
  <div>
    <input
      placeholder="Search filaments..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    {loading && <div>Searching...</div>}
    {error && <div className="error">{error}</div>}
    <ul>
      {results.map(result => (
        <li key={result.id}>{result.name}</li>
      ))}
    </ul>
  </div>
);
```

### Advanced Filtering with useFilters

```javascript
import { useFilters } from '../hooks';

const {
  filteredData,
  setFilter,
  removeFilter,
  clearFilters,
  setSorting,
  hasActiveFilters,
  getStats
} = useFilters(filaments, {}, { debounceDelay: 300 });

// Usage
<FilterControls>
  <select onChange={(e) => setFilter('material', e.target.value)}>
    <option value="">All Materials</option>
    <option value="PLA">PLA</option>
    <option value="PETG">PETG</option>
  </select>
  <button onClick={() => setSorting('name')}>Sort by Name</button>
  {hasActiveFilters && <button onClick={clearFilters}>Clear Filters</button>}
</FilterControls>

<ResultsSummary>
  {getStats().filteredItems} of {getStats().totalItems} items
</ResultsSummary>

<FilamentList items={filteredData} />
```

### Pagination with usePagination

```javascript
import { usePagination } from '../hooks';

const {
  items,
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  prevPage,
  changePageSize,
  getVisiblePages
} = usePagination(filteredFilaments, 10, { maxButtons: 5 });

// Usage
<Pagination>
  <button onClick={prevPage} disabled={!hasPrevPage}>Previous</button>
  {getVisiblePages().map((page, index) => (
    page === '...' ? (
      <span key={`ellipsis-${index}`}>...</span>
    ) : (
      <button
        key={page}
        onClick={() => goToPage(page)}
        className={currentPage === page ? 'active' : ''}
      >
        {page}
      </button>
    )
  ))}
  <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
</Pagination>
```

### Notifications with useNotifications

```javascript
import { useNotifications } from '../hooks';

const { success, error, warning, info } = useNotifications();

// Usage
const handleSuccess = () => {
  success('Filament saved successfully!', { duration: 3000 });
};

const handleError = (err) => {
  error('Failed to save filament', { persistent: true });
};

const showWarning = () => {
  warning('Low filament detected', {
    action: { label: 'Order More', onClick: () => navigate('/shop') }
  });
};
```

### LocalStorage with useAppData

```javascript
import { useAppData, validateFilament } from '../hooks';

const {
  data: filaments,
  loading,
  error,
  addItem,
  updateItem,
  deleteItem
} = useAppData('filaments', validateFilament);

// Usage
const addFilament = async (filamentData) => {
  try {
    await addItem(filamentData);
    console.log('Filament added successfully');
  } catch (err) {
    console.error('Error adding filament:', err);
  }
};
```

## Key Features

### Reusable Logic
- **Form Management**: Handles validation, errors, touched states, and submission
- **Data Operations**: CRUD operations with error handling and loading states
- **UI Interactions**: Debouncing, filtering, sorting, and pagination

### Performance Optimized
- **Memoization**: Hooks use React's memoization hooks for performance
- **Debouncing**: Prevents excessive API calls or re-renders
- **Efficient Filtering**: Optimized data filtering algorithms

### Type Safety
- **Validation**: Built-in validation with schema support
- **Error Handling**: Comprehensive error management
- **Type Checking**: Proper type validation for all inputs

### Extensible
- **Composable**: Hooks can be combined for complex scenarios
- **Customizable**: Configuration options for different use cases
- **Theme Support**: Hooks work with styling systems

## Best Practices

1. **Import from Index**: Use the central export point for cleaner imports
2. **Destructure Props**: Destructure hook returns for cleaner code
3. **Handle Loading States**: Always show loading indicators for async operations
4. **Validate Inputs**: Use built-in validation for form inputs
5. **Debounce Search**: Use debounced search for better performance
6. **Error Boundaries**: Handle and display error states appropriately

## Migration Guide

To migrate existing components to use these hooks:

1. **Identify Repeat Logic**: Look for duplicated logic across components
2. **Replace with Hooks**: Use appropriate custom hooks to replace it
3. **Test Functionality**: Ensure all features work as expected
4. **Remove Duplicate Code**: Clean up the original implementation
5. **Update Documentation**: Document any component-specific changes

These hooks provide a solid foundation for building maintainable and performant React applications in the PrintStack ecosystem.