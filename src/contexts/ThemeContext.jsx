import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  generateContrastCSS,
  systemPrefersHighContrast,
  createContrastChecker,
  ACCESSIBLE_COLORS,
  validateColorPalette
} from '../utils/colorContrast';

/**
 * Theme Context for WCAG AA compliant color management
 */
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider Component
 */
export const ThemeProvider = ({ children }) => {
  const [isHighContrast, setIsHighContrast] = useState(systemPrefersHighContrast());
  const [currentPalette, setCurrentPalette] = useState('standard');
  const [cssVariables, setCssVariables] = useState('');
  const [contrastResults, setContrastResults] = useState(null);
  const [contrastChecker] = useState(createContrastChecker());

  // Generate and apply CSS custom properties
  const applyTheme = useCallback((highContrast = false, palette = 'standard') => {
    const css = generateContrastCSS(highContrast);
    setCssVariables(css);

    // Apply CSS variables to document root
    if (typeof document !== 'undefined') {
      const styleElement = document.getElementById('theme-styles') ||
                          document.createElement('style');
      styleElement.id = 'theme-styles';
      styleElement.textContent = css;

      if (!document.getElementById('theme-styles')) {
        document.head.appendChild(styleElement);
      }

      // Set data attributes for CSS targeting
      document.documentElement.setAttribute('data-theme', palette);
      document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    }
  }, []);

  // Initialize theme and set up listeners
  useEffect(() => {
    applyTheme(isHighContrast, currentPalette);

    // Monitor system high contrast preference changes
    contrastChecker.addChangeListener((highContrast) => {
      if (currentPalette === 'system') {
        setIsHighContrast(highContrast);
      }
    });

    return () => {
      contrastChecker.removeChangeListener();
    };
  }, [isHighContrast, currentPalette, applyTheme, contrastChecker]);

  // Validate color palette for accessibility
  const validatePalette = useCallback((paletteName = currentPalette) => {
    const getPaletteColors = (name) => {
      const baseColors = {
        textPrimary: getComputedStyle(document.documentElement)
          .getPropertyValue('--text-primary').trim() || '#1f2937',
        textSecondary: getComputedStyle(document.documentElement)
          .getPropertyValue('--text-secondary').trim() || '#6b7280',
        backgroundPrimary: getComputedStyle(document.documentElement)
          .getPropertyValue('--background-primary').trim() || '#ffffff',
        backgroundSecondary: getComputedStyle(document.documentElement)
          .getPropertyValue('--background-secondary').trim() || '#f8fafc',
        primaryColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--primary-color').trim() || ACCESSIBLE_COLORS.primary.normal,
        errorColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--error-color').trim() || ACCESSIBLE_COLORS.error.normal,
        successColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--success-color').trim() || ACCESSIBLE_COLORS.success.normal,
        warningColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--warning-color').trim() || ACCESSIBLE_COLORS.warning.normal
      };

      if (name === 'highContrast') {
        return {
          textPrimary: ACCESSIBLE_COLORS.highContrast.foreground,
          textSecondary: ACCESSIBLE_COLORS.highContrast.foreground,
          backgroundPrimary: ACCESSIBLE_COLORS.highContrast.background,
          backgroundSecondary: ACCESSIBLE_COLORS.highContrast.background,
          primaryColor: ACCESSIBLE_COLORS.highContrast.primary,
          errorColor: ACCESSIBLE_COLORS.highContrast.error,
          successColor: ACCESSIBLE_COLORS.highContrast.success,
          warningColor: ACCESSIBLE_COLORS.highContrast.warning
        };
      }

      return baseColors;
    };

    const palette = getPaletteColors(paletteName);
    const results = validateColorPalette(palette);
    setContrastResults(results);

    return results;
  }, [currentPalette]);

  // Theme switching functions
  const setHighContrastMode = useCallback((enabled) => {
    setIsHighContrast(enabled);
    setCurrentPalette(enabled ? 'highContrast' : 'standard');
    applyTheme(enabled, enabled ? 'highContrast' : 'standard');
  }, [applyTheme]);

  const toggleHighContrast = useCallback(() => {
    setHighContrastMode(!isHighContrast);
  }, [isHighContrast, setHighContrastMode]);

  const setThemePalette = useCallback((paletteName) => {
    let highContrast = isHighContrast;

    switch (paletteName) {
      case 'highContrast':
        highContrast = true;
        break;
      case 'standard':
        highContrast = false;
        break;
      case 'system':
        highContrast = systemPrefersHighContrast();
        break;
      default:
        console.warn(`Unknown palette: ${paletteName}`);
        return;
    }

    setCurrentPalette(paletteName);
    setIsHighContrast(highContrast);
    applyTheme(highContrast, paletteName);
  }, [isHighContrast, applyTheme]);

  // Get current theme information
  const getThemeInfo = useCallback(() => {
    return {
      isHighContrast,
      currentPalette,
      systemPrefersHighContrast: systemPrefersHighContrast(),
      cssVariables,
      contrastResults,
      accessibleColors: ACCESSIBLE_COLORS
    };
  }, [isHighContrast, currentPalette, cssVariables, contrastResults]);

  // Validate current palette
  const validateCurrentPalette = useCallback(() => {
    return validatePalette(currentPalette);
  }, [validatePalette, currentPalette]);

  // Generate theme-aware styles for components
  const getThemedStyles = useCallback((baseStyles) => {
    const themedStyles = { ...baseStyles };

    // Add high contrast overrides if needed
    if (isHighContrast) {
      themedStyles.highContrast = {
        ...themedStyles.highContrast,
        border: '2px solid var(--border-color, #ffffff)',
        background: 'var(--background-primary, #000000)',
        color: 'var(--text-primary, #ffffff)'
      };
    }

    return themedStyles;
  }, [isHighContrast]);

  // Enhanced color with contrast checking
  const getAccessibleColor = useCallback((color, role = 'text') => {
    if (!color) return color;

    if (isHighContrast) {
      // Map colors to high contrast alternatives
      const colorMap = {
        [ACCESSIBLE_COLORS.primary.normal]: ACCESSIBLE_COLORS.highContrast.primary,
        [ACCESSIBLE_COLORS.secondary.normal]: ACCESSIBLE_COLORS.highContrast.secondary,
        [ACCESSIBLE_COLORS.error.normal]: ACCESSIBLE_COLORS.highContrast.error,
        [ACCESSIBLE_COLORS.warning.normal]: ACCESSIBLE_COLORS.highContrast.warning,
        [ACCESSIBLE_COLORS.success.normal]: ACCESSIBLE_COLORS.highContrast.success
      };

      return colorMap[color] || color;
    }

    return color;
  }, [isHighContrast]);

  // Generate CSS for specific component with contrast considerations
  const getComponentCSS = useCallback((componentStyles, componentName) => {
    let css = '';

    // Base component styles
    if (componentStyles.base) {
      css += `
        .${componentName} {
          ${Object.entries(componentStyles.base)
            .map(([prop, value]) => `${prop}: ${value};`)
            .join('\n          ')}
        }
      `;
    }

    // High contrast specific styles
    if (componentStyles.highContrast && isHighContrast) {
      css += `
        .${componentName} {
          ${Object.entries(componentStyles.highContrast)
            .map(([prop, value]) => `${prop}: ${value};`)
            .join('\n          ')}
        }
      `;
    }

    return css;
  }, [isHighContrast]);

  const value = {
    // State
    isHighContrast,
    currentPalette,
    cssVariables,
    contrastResults,

    // Theme control
    setHighContrastMode,
    toggleHighContrast,
    setThemePalette,

    // Information
    getThemeInfo,
    validateCurrentPalette,
    validatePalette,

    // Utilities
    getThemedStyles,
    getAccessibleColor,
    getComponentCSS,
    ACCESSIBLE_COLORS
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default ThemeContext;