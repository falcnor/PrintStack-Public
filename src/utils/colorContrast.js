/**
 * Color Contrast Utilities for WCAG AA Compliance
 * Provides color contrast checking and high contrast mode support
 */

// WCAG AA contrast requirements
const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,  // Normal text
  AA_LARGE: 3.0,   // Large text (18pt+ or 14pt+ bold)
  AAA_NORMAL: 7.0, // AAA compliance (optional)
  AAA_LARGE: 4.5   // AAA large text
};

// Color definitions for accessibility
const ACCESSIBLE_COLORS = {
  // Primary colors with sufficient contrast
  primary: {
    normal: '#2563eb',      // Blue 600
    light: '#dbeafe',       // Blue 100
    dark: '#1e40af',        // Blue 800
    hover: '#1d4ed8',       // Blue 700
    focus: '#2563eb'        // Blue 600
  },
  // Secondary colors
  secondary: {
    normal: '#6b7280',      // Gray 500
    light: '#f3f4f6',       // Gray 100
    dark: '#4b5563',        // Gray 600
    hover: '#4b5563'        // Gray 600
  },
  // Success colors
  success: {
    normal: '#059669',      // Green 600
    light: '#d1fae5',       // Green 100
    dark: '#047857',        // Green 700
    hover: '#047857'        // Green 700
  },
  // Warning colors
  warning: {
    normal: '#d97706',      // Amber 600
    light: '#fef3c7',       // Amber 100
    dark: '#b45309',        // Amber 700
    hover: '#b45309'        // Amber 700
  },
  // Error colors
  error: {
    normal: '#dc2626',      // Red 600
    light: '#fee2e2',       // Red 100
    dark: '#b91c1c',        // Red 700
    hover: '#b91c1c'        // Red 700
  },
  // High contrast mode colors
  highContrast: {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#ffff00',     // Yellow for primary elements
    secondary: '#ffffff',   // White for secondary
    border: '#ffffff',
    focus: '#00ff00',       // Green for focus indicators
    error: '#ff0000',       // Red for errors
    warning: '#ffff00',     // Yellow for warnings
    success: '#00ff00'      // Green for success
  }
};

/**
 * Convert hex color to RGB values
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance of a color
 */
const getLuminance = (rgb) => {
  const { r, g, b } = rgb;

  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
const getContrastRatio = (color1, color2) => {
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color contrast meets WCAG AA standards
 */
const meetsContrastAA = (foreground, background, isLargeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL;
  return {
    passes: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100,
    required: requiredRatio,
    isLargeText
  };
};

/**
 * Get accessible text color for given background
 */
const getAccessibleTextColor = (backgroundColor, preferrredColor = '#000000') => {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const blackContrast = getContrastRatio('#000000', backgroundColor);

  // Choose the color with better contrast
  return whiteContrast > blackContrast ? '#ffffff' : '#000000';
};

/**
 * Suggest alternative colors if current combination fails
 */
const suggestAlternative = (foreground, background, isLargeText = false) => {
  const alternatives = [];

  const bgRgb = hexToRgb(background);
  if (!bgRgb) return alternatives;

  // Try different foreground colors
  const foregroundOptions = [
    '#000000', '#ffffff',
    ACCESSIBLE_COLORS.primary.normal,
    ACCESSIBLE_COLORS.secondary.normal,
    ACCESSIBLE_COLORS.error.normal,
    ACCESSIBLE_COLORS.success.normal,
    ACCESSIBLE_COLORS.warning.normal
  ];

  foregroundOptions.forEach(color => {
    const test = meetsContrastAA(color, background, isLargeText);
    if (test.passes) {
      alternatives.push({
        color,
        ratio: test.ratio,
        diff: Math.abs(getContrastRatio(foreground, background) - test.ratio)
      });
    }
  });

  // Sort by minimal difference from original and highest contrast
  alternatives.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return b.ratio - a.ratio;
  });

  return alternatives.slice(0, 3); // Return top 3 suggestions
};

/**
 * Generate CSS custom properties for color contrast
 */
const generateContrastCSS = (isHighContrast = false) => {
  if (isHighContrast) {
    return `
      :root {
        /* High Contrast Mode Colors */
        --background-primary: ${ACCESSIBLE_COLORS.highContrast.background};
        --background-secondary: ${ACCESSIBLE_COLORS.highContrast.background};
        --background-card: ${ACCESSIBLE_COLORS.highContrast.background};
        --text-primary: ${ACCESSIBLE_COLORS.highContrast.foreground};
        --text-secondary: ${ACCESSIBLE_COLORS.highContrast.foreground};
        --primary-color: ${ACCESSIBLE_COLORS.highContrast.primary};
        --primary-color-hover: ${ACCESSIBLE_COLORS.highContrast.primary};
        --secondary-color: ${ACCESSIBLE_COLORS.highContrast.secondary};
        --error-color: ${ACCESSIBLE_COLORS.highContrast.error};
        --warning-color: ${ACCESSIBLE_COLORS.highContrast.warning};
        --success-color: ${ACCESSIBLE_COLORS.highContrast.success};
        --border-color: ${ACCESSIBLE_COLORS.highContrast.border};
        --focus-color: ${ACCESSIBLE_COLORS.highContrast.focus};
      }
    `;
  }

  return `
    :root {
      /* Standard Mode Colors with WCAG AA Compliance */
      --background-primary: #ffffff;
      --background-secondary: #f8fafc;
      --background-card: #ffffff;
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --primary-color: ${ACCESSIBLE_COLORS.primary.normal};
      --primary-color-hover: ${ACCESSIBLE_COLORS.primary.hover};
      --primary-color-light: ${ACCESSIBLE_COLORS.primary.light};
      --secondary-color: ${ACCESSIBLE_COLORS.secondary.normal};
      --secondary-color-hover: ${ACCESSIBLE_COLORS.secondary.hover};
      --error-color: ${ACCESSIBLE_COLORS.error.normal};
      --error-color-hover: ${ACCESSIBLE_COLORS.error.hover};
      --warning-color: ${ACCESSIBLE_COLORS.warning.normal};
      --warning-color-hover: ${ACCESSIBLE_COLORS.warning.hover};
      --success-color: ${ACCESSIBLE_COLORS.success.normal};
      --success-color-hover: ${ACCESSIBLE_COLORS.success.hover};
      --border-color: #e5e7eb;
      --border-color-light: #f3f4f6;
      --focus-color: ${ACCESSIBLE_COLORS.primary.focus};
    }

    /* Dark theme with preserved contrast */
    @media (prefers-color-scheme: dark) {
      :root {
        --background-primary: #0f172a;
        --background-secondary: #1e293b;
        --background-card: #1e293b;
        --text-primary: #f8fafc;
        --text-secondary: #cbd5e1;
        --border-color: #334155;
        --border-color-light: #475569;
      }
    }
  `;
};

/**
 * Detect system high contrast preference
 */
const systemPrefersHighContrast = () => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia?.('(prefers-contrast: high)').matches ||
         window.matchMedia?.('(forced-colors: active)').matches;
};

/**
 * Create contrast checker component logic
 */
const createContrastChecker = () => {
  // Monitor for high contrast preference changes
  let highContrastMediaQuery = null;
  let callbacks = [];

  const addChangeListener = (callback) => {
    callbacks.push(callback);

    if (!highContrastMediaQuery && typeof window !== 'undefined') {
      highContrastMediaQuery = window.matchMedia('(prefers-contrast: high)');
      highContrastMediaQuery.addEventListener('change', handleContrastChange);
    }
  };

  const removeChangeListener = (callback) => {
    callbacks = callbacks.filter(cb => cb !== callback);

    if (callbacks.length === 0 && highContrastMediaQuery) {
      highContrastMediaQuery.removeEventListener('change', handleContrastChange);
      highContrastMediaQuery = null;
    }
  };

  const handleContrastChange = () => {
    const isHighContrast = systemPrefersHighContrast();
    callbacks.forEach(callback => callback(isHighContrast));
  };

  return {
    systemPrefersHighContrast,
    addChangeListener,
    removeChangeListener,
    getCurrentContrastMode: () => systemPrefersHighContrast()
  };
};

/**
 * Validate entire color palette for WCAG AA compliance
 */
const validateColorPalette = (palette) => {
  const results = [];
  const combinations = [
    // Text combinations
    { fg: palette.textPrimary, bg: palette.backgroundPrimary, label: 'Primary text on primary background', isLarge: false },
    { fg: palette.textSecondary, bg: palette.backgroundPrimary, label: 'Secondary text on primary background', isLarge: false },
    { fg: palette.textPrimary, bg: palette.backgroundSecondary, label: 'Primary text on secondary background', isLarge: false },
    { fg: palette.textSecondary, bg: palette.backgroundSecondary, label: 'Secondary text on secondary background', isLarge: false },
    // Component combinations
    { fg: palette.primaryColor, bg: palette.backgroundPrimary, label: 'Primary button text', isLarge: false },
    { fg: '#ffffff', bg: palette.primaryColor, label: 'Primary button background', isLarge: false },
    { fg: palette.errorColor, bg: palette.backgroundPrimary, label: 'Error text', isLarge: false },
    { fg: palette.successColor, bg: palette.backgroundPrimary, label: 'Success text', isLarge: false },
    { fg: palette.warningColor, bg: palette.backgroundPrimary, label: 'Warning text', isLarge: false }
  ];

  combinations.forEach(({ fg, bg, label, isLarge }) => {
    const result = meetsContrastAA(fg, bg, isLarge);
    const suggestions = result.passes ? [] : suggestAlternative(fg, bg, isLarge);

    results.push({
      label,
      foreground: fg,
      background: bg,
      ...result,
      suggestions
    });
  });

  return {
    palette: palette,
    validations: results,
    overallPasses: results.every(r => r.passes),
    failingCombinations: results.filter(r => !r.passes)
  };
};

export {
  CONTRAST_RATIOS,
  ACCESSIBLE_COLORS,
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  getAccessibleTextColor,
  suggestAlternative,
  generateContrastCSS,
  systemPrefersHighContrast,
  createContrastChecker,
  validateColorPalette
};

export default {
  CONTRAST_RATIOS,
  ACCESSIBLE_COLORS,
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsContrastAA,
  getAccessibleTextColor,
  suggestAlternative,
  generateContrastCSS,
  systemPrefersHighContrast,
  createContrastChecker,
  validateColorPalette
};