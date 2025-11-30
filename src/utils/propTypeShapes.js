import PropTypes from 'prop-types';

/**
 * Common PropTypes definitions used throughout the application
 * This provides consistent validation for common data structures
 */

// Base entity shape with common fields
export const baseEntityShape = {
  id: PropTypes.string.isRequired,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string
};

// Filament entity shape
export const filamentShape = PropTypes.shape({
  ...baseEntityShape,
  name: PropTypes.string.isRequired,
  material: PropTypes.string.isRequired,
  color: PropTypes.string,
  colorHex: PropTypes.string,
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
});

// Model entity shape
export const modelShape = PropTypes.shape({
  ...baseEntityShape,
  name: PropTypes.string.isRequired,
  description: PropTypes.string,
  category: PropTypes.string,
  fileSize: PropTypes.number,
  fileName: PropTypes.string,
  filePath: PropTypes.string,
  printTime: PropTypes.number,
  requirements: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    filamentId: PropTypes.string,
    Filament: PropTypes.string,
    quantity: PropTypes.number,
    notes: PropTypes.string
  })),
  tags: PropTypes.arrayOf(PropTypes.string),
  source: PropTypes.shape({
    url: PropTypes.string,
    platform: PropTypes.string
  }),
  images: PropTypes.arrayOf(PropTypes.string),
  printSettings: PropTypes.shape({
    layerHeight: PropTypes.number,
    infill: PropTypes.number,
    supports: PropTypes.bool,
    quality: PropTypes.string
  })
});

// Print entity shape
export const printShape = PropTypes.shape({
  ...baseEntityShape,
  modelId: PropTypes.string.isRequired,
  filamentId: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['queued', 'printing', 'completed', 'failed', 'cancelled']),
  startTime: PropTypes.string,
  endTime: PropTypes.string,
  printTime: PropTypes.number,
  qualityRating: PropTypes.oneOf([1, 2, 3, 4, 5]),
  notes: PropTypes.string,
  photos: PropTypes.arrayOf(PropTypes.string),
  settings: PropTypes.shape({
    layerHeight: PropTypes.number,
    infill: PropTypes.number,
    supports: PropTypes.bool,
    temperature: PropTypes.shape({
      nozzle: PropTypes.number,
      bed: PropTypes.number
    }),
    speed: PropTypes.number
  }),
  Filament: PropTypes.shape({
    name: PropTypes.string,
    material: PropTypes.string,
    color: PropTypes.string
  }),
  model: PropTypes.shape({
    name: PropTypes.string,
    category: PropTypes.string
  })
});

// User settings shape
export const settingsShape = PropTypes.shape({
  theme: PropTypes.oneOf(['light', 'dark', 'auto']),
  language: PropTypes.string,
  units: PropTypes.oneOf(['metric', 'imperial']),
  currency: PropTypes.string,
  notifications: PropTypes.bool,
  autoSave: PropTypes.bool,
  defaultPageSize: PropTypes.number,
  dateFormat: PropTypes.string,
  timeFormat: PropTypes.oneOf(['12h', '24h'])
});

// Form validation shape
export const validationShape = PropTypes.shape({
  isValid: PropTypes.bool.isRequired,
  errors: PropTypes.object.isRequired
});

// Pagination shape
export const paginationShape = PropTypes.shape({
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPrevPage: PropTypes.bool.isRequired
});

// Notification shape
export const notificationShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']).isRequired,
  title: PropTypes.string,
  persistent: PropTypes.bool,
  autoDismiss: PropTypes.bool,
  duration: PropTypes.number,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  }),
  timestamp: PropTypes.instanceOf(Date)
});

// API response shape
export const apiResponseShape = PropTypes.shape({
  data: PropTypes.any,
  meta: PropTypes.shape({
    pagination: paginationShape,
    filters: PropTypes.object,
    sort: PropTypes.shape({
      field: PropTypes.string,
      direction: PropTypes.oneOf(['asc', 'desc'])
    })
  }),
  errors: PropTypes.arrayOf(PropTypes.string),
  warnings: PropTypes.arrayOf(PropTypes.string),
  success: PropTypes.bool,
  message: PropTypes.string
});

// Statistics shape
export const statsShape = PropTypes.shape({
  totalFilaments: PropTypes.number,
  totalModels: PropTypes.number,
  totalPrints: PropTypes.number,
  completedPrints: PropTypes.number,
  failedPrints: PropTypes.number,
  successRate: PropTypes.number,
  totalFilamentCost: PropTypes.number,
  totalFilamentWeight: PropTypes.number,
  avgPrintTime: PropTypes.number,
  printsByMonth: PropTypes.arrayOf(PropTypes.shape({
    month: PropTypes.string,
    prints: PropTypes.number,
    successRate: PropTypes.number
  })),
  materialUsage: PropTypes.arrayOf(PropTypes.shape({
    material: PropTypes.string,
    weight: PropTypes.number,
    cost: PropTypes.number
  }))
});

// File upload shape
export const fileUploadShape = PropTypes.shape({
  file: PropTypes.instanceOf(File).isRequired,
  name: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired,
  lastModified: PropTypes.number,
  validation: validationShape
});

// Search/Filter configuration shape
export const filterConfigShape = PropTypes.shape({
  field: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'select', 'multiselect', 'date', 'number', 'boolean']),
  label: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any,
    label: PropTypes.string
  })),
  multiple: PropTypes.bool,
  defaultValue: PropTypes.any
});

// Route configuration shape (for React Router)
export const routeShape = PropTypes.shape({
  path: PropTypes.string.isRequired,
  component: PropTypes.elementType.isRequired,
  exact: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string
});

// Theme configuration shape
export const themeShape = PropTypes.shape({
  colors: PropTypes.shape({
    primary: PropTypes.string,
    secondary: PropTypes.string,
    success: PropTypes.string,
    error: PropTypes.string,
    warning: PropTypes.string,
    info: PropTypes.string,
    background: PropTypes.string,
    surface: PropTypes.string,
    text: PropTypes.string,
    textSecondary: PropTypes.string
  }),
  spacing: PropTypes.shape({
    xs: PropTypes.string,
    sm: PropTypes.string,
    md: PropTypes.string,
    lg: PropTypes.string,
    xl: PropTypes.string
  }),
  typography: PropTypes.shape({
    fontFamily: PropTypes.string,
    fontSize: PropTypes.shape({
      xs: PropTypes.string,
      sm: PropTypes.string,
      md: PropTypes.string,
      lg: PropTypes.string,
      xl: PropTypes.string
    }),
    lineHeight: PropTypes.string
  })
});

// Custom PropTypes validators
export const colorHex = (props, propName, componentName) => {
  const value = props[propName];
  if (!value) return null;

  if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`. ` +
      `Expected a valid hex color in the format #RRGGBB, received \`${value}\`.`
    );
  }
  return null;
};

export const objectId = (props, propName, componentName) => {
  const value = props[propName];
  if (!value) return null;

  if (typeof value !== 'string' || !/^[0-9a-f]{24}$/.test(value)) {
    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`. ` +
      `Expected a valid ObjectId (24 character hex string), received \`${value}\`.`
    );
  }
  return null;
};

export const dateString = (props, propName, componentName) => {
  const value = props[propName];
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return new Error(
      `Invalid prop \`${propName}\` supplied to \`${componentName}\`. ` +
      `Expected a valid date string, received \`${value}\`.`
    );
  }
  return null;
};