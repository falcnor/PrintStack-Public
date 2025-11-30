# PrintStack React Components

This directory contains the React component library for the PrintStack 3D printing inventory management system.

## 📁 Directory Structure

```
src/components/
├── common/           # Reusable UI components
├── dashboard/        # Dashboard-specific components
├── filament/         # Filament management components
├── models/           # Model library components
└── prints/           # Print history components
```

## 🧩 Common Components

Reusable components that can be used across different parts of the application.

### Form Components

- **FormErrorDisplay** - Displays validation errors in forms
- **SearchInput** - Search input with clear functionality
- **FilterDropdown** - Generic dropdown filter component
- **AdvancedFilters** - Comprehensive filter panel

### UI Components

- **Pagination** - Table pagination controls with React.memo optimization
- **TableSkeleton** - Loading skeleton for tables
- **ColorPicker** - Color selection component
- **LoadingSpinner** - Loading indicator component

### Development Components

- **ErrorBoundaryDebug** - Enhanced error boundary with debugging features
- **DevToolbar** - Development debugging toolbar (dev mode only)

## 🎯 Component Guidelines

### 1. Component Structure

All components follow this structure:

```jsx
import React from 'react';
import PropTypes from 'prop-types';

import styles from './ComponentName.module.css';

/**
 * Brief component description
 * @param {Object} props - Component props
 * @param {string} props.propName - Prop description
 */
const ComponentName = ({ prop }) => {
  return <div className={styles.component}>Content</div>;
};

ComponentName.propTypes = {
  prop: PropTypes.string.isRequired
};

export default ComponentName;
```

### 2. Performance Optimization

- Use `React.memo` for pure components
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Implement proper key props for lists

### 3. CSS Modules

- Use CSS Modules for styling
- Follow BEM-like naming convention
- Mobile-first responsive design
- Dark mode support where applicable

### 4. Documentation

- All components must have JSDoc documentation
- Comprehensive PropTypes definitions
- Clear prop descriptions and types
- Example usage in component files

## 🚀 Custom Hooks

Reusable hooks located in `src/hooks/`:

- **useTableSort** - Handles table sorting logic
- **useTablePagination** - Manages pagination state
- **useFilamentUsage** - Manages filament usage in forms
- **useFilters** - Handles filtering and search logic
- **useDebounce** - Debounces search input

## 🛠️ Development

### Storybook

Components should be developed and tested with Storybook when available.

### Linting

All components are linted with ESLint:

```bash
npm run lint
```

### Testing

Component documentation includes PropTypes for runtime validation and development-time type checking.

## 📊 Performance Metrics

Components are optimized for:

- **Render Time**: < 16ms for complex components
- **Bundle Size**: Split into logical chunks
- **Lazy Loading**: Heavy components can be loaded on-demand

## 🎨 Styling Guidelines

### Colors
- Primary: `#007bff`
- Success: `#28a745`
- Warning: `#ffc107`
- Error: `#dc3545`

### Spacing
- Use 4px base unit
- Consistent padding/margin in multiples of 4px

### Typography
- System font stack
- Accessible font sizes (14px base)
- Line height 1.5 for readability

## 🔧 Debugging

In development mode:

1. **Error Boundary**: Enhanced error reporting
2. **Dev Toolbar**: Click the 🛠️ button for debugging tools
3. **Console**: Enhanced logging with context
4. **Performance**: Render time tracking

## 📦 Usage Examples

### Using a Common Component

```jsx
import { FormErrorDisplay, SearchInput } from '../common';

const MyForm = () => {
  const [errors, setErrors] = useState([]);
  const [search, setSearch] = useState('');

  return (
    <form>
      <FormErrorDisplay errors={errors} />
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search..."
      />
    </form>
  );
};
```

### Using Custom Hooks

```jsx
import { useTableSort, useTablePagination } from '../../hooks';

const MyTable = ({ data }) => {
  const { sortedData, handleSort, getSortIndicator } = useTableSort(data);
  const { paginatedData, paginationInfo } = useTablePagination(sortedData);

  // Table implementation
};
```

## 🔄 Migration Notes

When migrating from vanilla JavaScript components:

1. Convert class components to functional components
2. Add PropTypes for type safety
3. Use CSS Modules instead of inline styles
4. Implement proper state management with hooks
5. Add React.memo optimization where needed

## 📋 Checklist for New Components

- [ ] JSDoc documentation complete
- [ ] PropTypes defined
- [ ] CSS Modules created
- [ ] Mobile responsive
- [ ] Dark mode support
- [ ] Performance optimized
- [ ] Error handling implemented
- [ ] Accessibility considered
- [ ] Storybook example (if applicable)

## 🤝 Contributing

When adding new components:

1. Follow the established patterns
2. Add comprehensive documentation
3. Include examples in README
4. Test with different data types
5. Consider accessibility implications
6. Add appropriate error boundaries

## 📚 Related Documentation

- [React Documentation](https://react.dev/)
- [PropTypes Documentation](https://react.dev/learn/typechecking-with-proptypes)
- [CSS Modules Documentation](https://github.com/css-modules/css-modules)
- [Vite Build Tool](https://vitejs.dev/)