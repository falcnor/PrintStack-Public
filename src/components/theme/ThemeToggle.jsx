import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

/**
 * Theme Toggle Component for accessibility options
 */
const ThemeToggle = ({
  position = 'header',
  showLabel = true,
  variant = 'dropdown',
  onThemeChange
}) => {
  const {
    isHighContrast,
    currentPalette,
    systemPrefersHighContrast,
    setThemePalette,
    toggleHighContrast,
    ACCESSIBLE_COLORS
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [contrastInfo, setContrastInfo] = useState(null);

  const themeOptions = [
    {
      id: 'standard',
      name: 'Standard Theme',
      description: 'Default colors with WCAG AA contrast',
      icon: '🎨',
      preview: {
        background: ACCESSIBLE_COLORS.primary.normal,
        foreground: '#ffffff'
      }
    },
    {
      id: 'highContrast',
      name: 'High Contrast',
      description: 'Maximum contrast for visual accessibility',
      icon: '♿',
      preview: {
        background: '#000000',
        foreground: '#ffff00'
      }
    },
    {
      id: 'system',
      name: 'System Preference',
      description: `Use system preference (${systemPrefersHighContrast ? 'High Contrast' : 'Standard'})`,
      icon: systemPrefersHighContrast ? '🌙' : '☀️',
      preview: {
        background: systemPrefersHighContrast ? '#000000' : ACCESSIBLE_COLORS.primary.normal,
        foreground: systemPrefersHighContrast ? '#ffff00' : '#ffffff'
      }
    }
  ];

  const handleThemeSelect = (themeId) => {
    setThemePalette(themeId);
    setIsOpen(false);

    if (onThemeChange) {
      onThemeChange({
        theme: themeId,
        isHighContrast: themeId === 'highContrast' || (themeId === 'system' && systemPrefersHighContrast)
      });
    }

    // Announce theme change for screen readers
    announceThemeChange(themeId);
  };

  const announceThemeChange = (themeId) => {
    const option = themeOptions.find(opt => opt.id === themeId);
    if (option && typeof window !== 'undefined') {
      // Use screen reader announcement
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Theme changed to ${option.name}`;
      document.body.appendChild(announcement);

      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  };

  const getCurrentOption = () => {
    return themeOptions.find(opt => opt.id === currentPalette) || themeOptions[0];
  };

  const getContrastStatus = () => {
    let label = 'Theme: ';
    let status = 'good';
    let description = '';

    switch (currentPalette) {
      case 'highContrast':
        label += 'High Contrast';
        status = 'excellent';
        description = 'Maximum WCAG AAA contrast levels';
        break;
      case 'system':
        label += `System (${systemPrefersHighContrast ? 'High Contrast' : 'Standard'})`;
        status = systemPrefersHighContrast ? 'excellent' : 'good';
        description = systemPrefersHighContrast
          ? 'System high contrast mode active'
          : 'System standard theme active';
        break;
      default:
        label += 'Standard';
        status = 'good';
        description = 'WCAG AA compliant contrast levels';
    }

    return { label, status, description };
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.themeToggle}`)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  const contrastStatus = getContrastStatus();
  const currentOption = getCurrentOption();

  if (variant === 'toggle') {
    return (
      <div className={`${styles.themeToggle} ${styles[position]}`}>
        <button
          onClick={toggleHighContrast}
          className={`${styles.toggleButton} ${styles.highContrastToggle}`}
          aria-label={`Toggle high contrast mode (currently ${isHighContrast ? 'on' : 'off'})`}
          aria-pressed={isHighContrast}
        >
          <span className={styles.toggleIcon} aria-hidden="true">
            {isHighContrast ? '♿' : '🎨'}
          </span>
          {showLabel && (
            <span className={styles.toggleLabel}>
              {isHighContrast ? 'High Contrast' : 'Standard'}
            </span>
          )}
          <span className={styles.toggleIndicator} aria-hidden="true" />
        </button>

        {showLabel && (
          <div className={styles.contrastStatus}>
            <span className={`${styles.statusBadge} ${styles[contrastStatus.status]}`}>
              {contrastStatus.status === 'excellent' ? '✓' : '✓'} WCAG {contrastStatus.status === 'excellent' ? 'AAA' : 'AA'}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`${styles.themeToggle} ${styles[position]}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.dropdownButton} ${isOpen ? styles.open : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Theme options"
      >
        <span className={styles.currentIcon} aria-hidden="true">
          {currentOption.icon}
        </span>
        {showLabel && (
          <span className={styles.currentLabel}>
            {currentOption.name}
          </span>
        )}
        <span className={`${styles.dropdownArrow} ${isOpen ? styles.open : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {showLabel && (
        <div className={styles.contrastInfo}>
          <span className={`${styles.statusBadge} ${styles[contrastStatus.status]}`}>
            {contrastStatus.label}
          </span>
        </div>
      )}

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Accessibility Themes</span>
            <span className={styles.dropdownSubtitle}>WCAG AA/AAA compliant</span>
          </div>

          <div className={styles.optionsList}>
            {themeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleThemeSelect(option.id)}
                className={`${styles.option} ${option.id === currentPalette ? styles.selected : ''}`}
                role="option"
                aria-selected={option.id === currentPalette}
              >
                <span className={styles.optionIcon} aria-hidden="true">
                  {option.icon}
                </span>

                <div className={styles.optionPreview}>
                  <div
                    className={styles.previewBox}
                    style={{
                      backgroundColor: option.preview.background,
                      color: option.preview.foreground
                    }}
                    aria-hidden="true"
                  >
                    Aa
                  </div>
                </div>

                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{option.name}</span>
                  <span className={styles.optionDescription}>{option.description}</span>
                </div>

                {option.id === currentPalette && (
                  <span className={styles.selectedIndicator} aria-label="Selected">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={styles.dropdownFooter}>
            <div className={styles.contrastNotice}>
              <span className={styles.noticeIcon}>ℹ️</span>
              <span className={styles.noticeText}>
                All themes meet WCAG AA contrast standards
              </span>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
              aria-label="Close theme options"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

ThemeToggle.propTypes = {
  position: PropTypes.oneOf(['header', 'sidebar', 'floating']),
  showLabel: PropTypes.bool,
  variant: PropTypes.oneOf(['dropdown', 'toggle']),
  onThemeChange: PropTypes.func
};

export default ThemeToggle;