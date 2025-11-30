# PrintStack Development Guide

A comprehensive guide for developing and maintaining the PrintStack React application.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Modern web browser with ES6+ support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting and formatting
npm run lint
npm run format
```

### Development Workflow

1. **Create/modify components** in `src/components/`
2. **Add documentation** with JSDoc comments
3. **Define PropTypes** for type safety
4. **Test with development tools**
5. **Run linting** before committing
6. **Build and test** production build

## 🏗️ Architecture Overview

### File Structure

```
src/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   ├── dashboard/      # Dashboard components
│   ├── filament/       # Filament management
│   ├── models/         # Model library
│   └── prints/         # Print history
├── contexts/           # React contexts
├── hooks/             # Custom hooks
├── utils/             # Utility functions
└── styles/            # Global styles
```

### Component Architecture

- **Context-based state management** for global data
- **Custom hooks** for shared logic
- **CSS Modules** for component styling
- **React.memo** for performance optimization
- **Error boundaries** for error handling

## 🎯 Development Best Practices

### 1. Component Development

#### Functional Components

```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { memo } from 'react';

import styles from './MyComponent.module.css';

/**
 * Component description
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 * @param {Function} props.onClick - Click handler
 */
const MyComponent = ({ title, onClick }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, []);

  return (
    <div className={styles.myComponent}>
      <h1>{title}</h1>
      <button onClick={onClick}>Click me</button>
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

export default memo(MyComponent);
```

#### Key Principles

- **Pure functions**: Keep components pure when possible
- **Single responsibility**: Each component has one clear purpose
- **Performance**: Use React.memo, useMemo, useCallback appropriately
- **Documentation**: JSDoc comments for all public APIs

### 2. State Management

#### Context Example

```jsx
// contexts/MyContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const MyContext = createContext();

const myReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export const MyProvider = ({ children }) => {
  const [state, dispatch] = useReducer(myReducer, initialState);

  const actions = {
    update: (data) => dispatch({ type: 'UPDATE', payload: data })
  };

  return (
    <MyContext.Provider value={{ ...state, ...actions }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
};
```

### 3. Custom Hooks

#### Example Hook

```jsx
// hooks/useMyHook.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook description
 * @param {string} initialValue - Initial value
 * @returns {Object} Hook state and actions
 */
export const useMyHook = (initialValue) => {
  const [state, setState] = useState(initialValue);

  const updateState = useCallback((newValue) => {
    setState(newValue);
  }, []);

  useEffect(() => {
    // Setup or cleanup
  }, []);

  return {
    state,
    updateState
  };
};
```

### 4. Styling

#### CSS Modules

```css
/* MyComponent.module.css */
.myComponent {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
}

.myComponent:hover {
  transition: transform 0.2s ease;
  transform: translateY(-2px);
}

/* Responsive design */
@media (max-width: 768px) {
  .myComponent {
    padding: 16px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .myComponent {
    background-color: #2d2d2d;
    border-color: #404040;
  }
}
```

#### Styling Guidelines

- **CSS Modules**: Always use CSS Modules over global styles
- **Mobile-first**: Design for mobile viewport first
- **Dark mode**: Include dark mode styles where applicable
- **Accessibility**: Use semantic HTML and proper color contrast

## 🛠️ Development Tools

### 1. Linting and Formatting

```bash
# Run ESLint with auto-fix
npm run lint

# Check formatting
npm run format:check

# Format code
npm run format

# Type checking
npm run type-check
```

### 2. Build Tools

```bash
# Development server
npm run dev

# Production build
npm run build

# Build with analysis
npm run build:analyze

# Preview production build
npm run preview
```

### 3. Debugging

#### Development Toolbar
In development mode, click the 🛠️ button in the top-right corner to access:

- Error history and details
- LocalStorage inspection
- Memory usage monitoring
- Component tree analysis

#### Console Debugging
Enhanced logging utilities in `src/utils/debugUtils.js`:

```jsx
import { logger, devHelpers } from '../utils/debugUtils';

logger.info('Component rendered');
logger.error('Something went wrong');
devHelpers.showLocalStorage();
```

## 🧪 Testing Strategy

### TypeScript/PropTypes Validation

All components include comprehensive PropTypes:

```jsx
MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string
    })
  ),
  isActive: PropTypes.bool,
  onClick: PropTypes.func
};
```

### Error Handling

Enhanced error boundaries provide detailed debugging:

```jsx
import ErrorBoundaryDebug from '../components/common/ErrorBoundaryDebug';

<ErrorBoundaryDebug fallbackComponentName="MyComponent">
  <MyComponent />
</ErrorBoundaryDebug>
```

## 📊 Performance Optimization

### 1. Component Optimization

```jsx
import React, { memo, useMemo, useCallback } from 'react';

const MyComponent = ({ data, onAction }) => {
  // Expensive calculation
  const expensiveValue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  // Stable event handler
  const handleAction = useCallback((item) => {
    onAction(item);
  }, [onAction]);

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default memo(MyComponent);
```

### 2. Bundle Optimization

- **Code splitting**: Automatic with dynamic imports
- **Tree shaking**: Remove unused code
- **Lazy loading**: Heavy components on-demand

### 3. Build Analysis

```bash
npm run build:analyze
```

Provides detailed bundle analysis in `deploy/build-analysis.json`.

## 🔧 Common Patterns

### 1. Data Fetching

```jsx
import { useState, useEffect } from 'react';
import { useMyContext } from '../contexts/MyContext';

const MyComponent = () => {
  const { items, loading, error } = useMyContext();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorComponent error={error} />;

  return (
    <div>
      {items.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
};
```

### 2. Form Handling

```jsx
import { useState } from 'react';

const MyForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [errors, setErrors] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors([]); // Clear errors on input
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormErrorDisplay errors={errors} />
      {/* Form fields */}
    </form>
  );
};
```

### 3. Component Composition

```jsx
import { SearchInput, FilterDropdown, AdvancedFilters } from '../common';

const SearchableList = ({ data, onFilter }) => {
  return (
    <div>
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search items..."
      />
      <AdvancedFilters
        filters={filters}
        onFilterChange={onFilter}
        availableOptions={availableOptions}
      />
      {/* List content */}
    </div>
  );
};
```

## 🎨 UI/UX Guidelines

### 1. Responsive Design

- **Mobile-first approach**
- **Fluid layouts** using flexible grids
- **Touch-friendly** tap targets (minimum 44px)
- **Keyboard navigation** support

### 2. Accessibility

- **Semantic HTML** elements
- **ARIA labels** for interactive elements
- **Color contrast** meeting WCAG standards
- **Focus management** for modals and forms
- **Screen reader** friendly markup

### 3. User Feedback

- **Loading states** for async operations
- **Error messages** with actionable guidance
- **Success confirmations** for user actions
- **Empty states** with helpful guidance

## 🚀 Deployment

### Production Build

```bash
npm run build
```

Build output in `deploy/` directory with:
- **Optimized bundles**
- **Source maps** (development)
- **Asset minification**
- **Browser compatibility**

### Environment Variables

```bash
# Development
VITE_API_URL=http://localhost:3000/api
VITE_DEBUG=true

# Production
VITE_API_URL=https://printstack.app/api
VITE_DEBUG=false
```

## 📝 Contributing Guidelines

### Git Workflow

1. **Create feature branch** from main
2. **Make small, focused commits**
3. **Write descriptive commit messages**
4. **Run tests and linting**
5. **Create pull request** with description

### Code Review Checklist

- [ ] Component follows established patterns
- [ ] PropTypes are complete
- [ ] JSDoc documentation is present
- [ ] Responsive design implemented
- [ ] Accessibility considered
- [ ] Error handling implemented
- [ ] Performance optimized where needed
- [ ] Styles consistent with design system

## 📚 Resources

### Documentation

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [CSS Modules](https://github.com/css-modules/css-modules)
- [PropTypes](https://react.dev/learn/typechecking-with-proptypes)

### Tools

- [VS Code React Extension Pack](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Performance

- [React Performance Profiler](https://react.dev/learn/react-developer-tools#profiling-components-with-the-react-profiler)
- [Lighthouse Audits](https://developer.chrome.com/docs/lighthouse/)

## 🆘 Troubleshooting

### Common Issues

#### Component Not Rendering
- Check console for errors
- Verify import paths
- Ensure PropTypes validation passes
- Check for errors in parent components

#### Styling Not Applying
- Verify CSS module import
- Check class name in JSX
- Inspect element in DevTools
- Check CSS specificity

#### Performance Issues
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Verify memoization is working
- Analyze build size with `npm run build:analyze`

### Development Debugging

1. **Enable Dev Toolbar** (development mode only)
2. **Check error history** for component errors
3. **Monitor console** for warnings/errors
4. **Use browser DevTools** for inspection
5. **Profile performance** with React DevTools

---

Happy coding! 🚀