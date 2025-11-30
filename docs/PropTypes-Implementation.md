# PropTypes Implementation Guide

This document outlines the comprehensive PropTypes implementation for the PrintStack React application.

## Overview

PropTypes provide runtime type checking for React component props, helping catch bugs early and improving code reliability. This guide explains how PropTypes are used throughout the application.

## Installation

PropTypes are already installed in the project:

```bash
npm install prop-types
```

## Usage Patterns

### Basic Usage

```javascript
import PropTypes from 'prop-types';

const MyComponent = ({ title, count, isActive }) => {
  return <div>{title}: {count}</div>;
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  isActive: PropTypes.bool
};
```

### Advanced Shapes

For complex objects, use `PropTypes.shape`:

```javascript
const FilamentCard = ({ filament }) => {
  return <div>{filament.name}</div>;
};

FilamentCard.propTypes = {
  filament: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    material: PropTypes.string,
    color: PropTypes.string,
    weight: PropTypes.number,
    cost: PropTypes.number
  }).isRequired
};
```

### Using Pre-defined Shapes

Import and use shapes from `propTypeShapes.js`:

```javascript
import { filamentShape, modelShape } from '../../utils/propTypeShapes.js';

Component.propTypes = {
  filament: filamentShape.isRequired,
  model: modelShape
};
```

## Pre-defined PropTypes Shapes

### Core Entity Shapes

- **`baseEntityShape`** - Common fields for all entities (id, timestamps)
- **`filamentShape`** - Complete filament object structure
- **`modelShape`** - Complete(model object structure
- **`printShape`** - Complete print object structure
- **`settingsShape`** - User application settings

### UI Component Shapes

- **`paginationShape`** - Pagination controls configuration
- **`notificationShape`** - Notification object structure
- **`filterConfigShape`** - Filter configuration objects
- **`themeShape`** - Theme configuration structure

### API and Data Shapes

- **`apiResponseShape`** - Standard API response structure
- **`statsShape`** - Statistics and analytics data
- **`fileUploadShape`** - File upload object structure

## Custom Validators

### Color Hex Validation

```javascript
import { colorHex } from '../../utils/propTypeShapes.js';

Component.propTypes = {
  backgroundColor: colorHex.isRequired
};
```

### Date String Validation

```javascript
import { dateString } from '../../utils/propTypeShapes.js';

Component.propTypes = {
  createdAt: dateString
};
```

### ObjectId Validation

```javascript
import { objectId } from '../../utils/propTypeShapes.js';

Component.propTypes = {
  filamentId: objectId.isRequired
};
```

## Component Guidelines

### 1. Always Define PropTypes

Every component should have PropTypes defined, even if it's just an empty object:

```javascript
const NoPropsComponent = () => {
  return <div>No props</div>;
};

NoPropsComponent.propTypes = {};
```

### 2. Make Required Props Clear

Use `.isRequired` for props that are essential:

```javascript
MyComponent.propTypes = {
  title: PropTypes.string.isRequired, // Required
  subtitle: PropTypes.string, // Optional
};
```

### 3. Use Specific Types

Be specific about prop types:

```javascript
// Good
Component.propTypes = {
  count: PropTypes.number,
  isActive: PropTypes.bool,
  tags: PropTypes.arrayOf(PropTypes.string)
};

// Avoid generic types
Component.propTypes = {
  data: PropTypes.any // Too generic
};
```

### 4. Document Props

Add JSDoc comments for complex components:

```javascript
/**
 * Button component with different styles and states
 * @param {Object} props - Component props
 * @param {string} props.children - Button content
 * @param {'primary'|'secondary'|'danger'} props.variant - Button style variant
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Function} props.onClick - Click handler
 */
const Button = ({ children, variant, disabled, onClick }) => {
  // Component logic
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func
};
```

## PropTypes in Practice

### Example: FilamentForm Component

```javascript
import { filamentShape } from '../../utils/propTypeShapes.js';

const FilamentForm = ({
  onSubmit,
  onCancel,
  initialData = {},
  isEdit = false
}) => {
  // Form implementation
};

FilamentForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    material: PropTypes.string,
    color: PropTypes.string,
    weight: PropTypes.number,
    remainingWeight: PropTypes.number,
    cost: PropTypes.number,
    supplier: PropTypes.string,
    purchaseDate: PropTypes.string,
    temperature: PropTypes.shape({
      nozzle: PropTypes.number,
      bed: PropTypes.number
    }),
    diameter: PropTypes.number,
    notes: PropTypes.string
  }),
  isEdit: PropTypes.bool
};
```

### Example: List Component

```javascript
const ItemList = ({ items, loading, error, onItemClick }) => {
  // List implementation
};

ItemList.propTypes = {
  items: PropTypes.arrayOf(filamentShape).isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  onItemClick: PropTypes.func
};
```

## Best Practices

### 1. Import Convention

```javascript
// Import PropTypes first
import PropTypes from 'prop-types';
import React from 'react';
```

### 2. Default Props

```javascript
const Component = ({ title = 'Default Title', count = 0 }) => {
  return <div>{title}: {count}</div>;
};

Component.propTypes = {
  title: PropTypes.string,
  count: PropTypes.number
};
```

### 3. Complex Validation

For complex validation logic, use custom validators:

```javascript
Component.propTypes = {
  email: (props, propName, componentName) => {
    const email = props[propName];
    if (!email) return null;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Error(`Invalid email prop in ${componentName}`);
    }
    return null;
  }
};
```

### 4. Array of Specific Shapes

```javascript
Component.propTypes = {
  filaments: PropTypes.arrayOf(filamentShape).isRequired,
  tags: PropTypes.arrayOf(PropTypes.string)
};
```

## Development Mode vs Production

PropTypes warnings only appear in development mode. In production, PropTypes are completely removed for performance.

## Testing PropTypes

When testing components, PropTypes help catch prop mismatches:

```javascript
// This will show a PropTypes warning in development
<FilamentForm
  onSubmit={() => {}}
  onCancel={() => {}}
  isEdit="not-a-boolean" // Invalid prop type
/>
```

## Migration Strategy

For existing components without PropTypes:

1. Start with required props
2. Add optional props gradually
3. Use shapes for complex objects
4. Add custom validators for specific needs
5. Document component interfaces

## Common PropTypes Patterns

### Callback Functions

```javascript
Component.propTypes = {
  onClick: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onChange: PropTypes.func
};
```

### Array of Enum Values

```javascript
Component.propTypes = {
  status: PropTypes.oneOf([
    'draft', 'pending', 'approved', 'rejected'
  ]),
  tags: PropTypes.arrayOf(PropTypes.oneOf([
    'urgent', 'important', 'normal'
  ]))
};
```

### Conditional Props

```javascript
Component.propTypes = {
  type: PropTypes.oneOf(['text', 'number', 'date']).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date)
  ])
};
```

 PropTypes are an essential part of maintaining code quality and preventing runtime errors in the PrintStack application. Use them consistently across all components.