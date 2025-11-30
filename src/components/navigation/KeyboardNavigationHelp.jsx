import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { keyboardNavigation } from '../../utils/keyboardNavigation';
import styles from './KeyboardNavigationHelp.module.css';

/**
 * Keyboard Navigation Help Component
 * Displays available keyboard shortcuts and help information
 */
const KeyboardNavigationHelp = ({
  visible = false,
  onClose,
  position = 'center',
  showCategory = 'all',
  customShortcuts = {}
}) => {
  const [shortcuts, setShortcuts] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (visible) {
      loadShortcuts();
    }
  }, [visible, showCategory, customShortcuts]);

  const loadShortcuts = useCallback(() => {
    const activeShortcuts = keyboardNavigation.getActiveShortcuts();

    // Add custom shortcuts
    const customItems = Object.entries(customShortcuts).map(([keybinding, config]) => ({
      id: `custom_${keybinding}`,
      keybinding,
      category: config.category || 'custom',
      description: config.description || keybinding,
      scope: 'global'
    }));

    const allShortcuts = [...activeShortcuts, ...customItems];

    // Filter by category if specified
    const filteredShortcuts = showCategory === 'all'
      ? allShortcuts
      : allShortcuts.filter(s => s.category === showCategory);

    // Filter by search term
    const searchedShortcuts = searchTerm
      ? filteredShortcuts.filter(s =>
          s.keybinding.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : filteredShortcuts;

    setShortcuts(searchedShortcuts);
  }, [showCategory, customShortcuts, searchTerm]);

  const toggleCategory = (category) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  const formatKeybinding = (keybinding) => {
    return keybinding.split('+').map(key => {
      if (key.toLowerCase() === 'ctrl') return 'Ctrl';
      if (key.toLowerCase() === 'alt') return 'Alt';
      if (key.toLowerCase() === 'shift') return 'Shift';
      if (key.toLowerCase() === 'meta') return 'Cmd';
      return key.toUpperCase();
    }).join(' + ');
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      'default': 'Default Navigation',
      'custom': 'Custom Shortcuts',
      'navigation': 'Navigation',
      'editing': 'Editing',
      'forms': 'Forms',
      'actions': 'Actions'
    };
    return names[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'default': '⌨️',
      'custom': '⚙️',
      'navigation': '🧭',
      'editing': '✏️',
      'forms': '📝',
      'actions': '⚡'
    };
    return icons[category] || '⌨️';
  };

  if (!visible) return null;

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Keyboard Navigation Help</h2>
          <button
            onClick={onClose}
            className={styles.closeBtn}
            aria-label="Close keyboard help"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {/* Search and Filters */}
          <div className={styles.searchSection}>
            <input
              type="text"
              placeholder="Search shortcuts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              aria-label="Search keyboard shortcuts"
            />

            <div className={styles.categoryFilter}>
              <label htmlFor="category-select" className={styles.filterLabel}>
                Category:
              </label>
              <select
                id="category-select"
                value={showCategory}
                onChange={(e) => loadShortcuts()}
                className={styles.categorySelect}
              >
                <option value="all">All Categories</option>
                <option value="default">Default</option>
                <option value="navigation">Navigation</option>
                <option value="editing">Editing</option>
                <option value="forms">Forms</option>
                <option value="actions">Actions</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Shortcuts by Category */}
          <div className={styles.shortcutsList}>
            {Object.entries(groupedShortcuts).length === 0 ? (
              <div className={styles.noResults}>
                {searchTerm ? 'No shortcuts found matching your search.' : 'No shortcuts available.'}
              </div>
            ) : (
              Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                <div key={category} className={styles.categorySection}>
                  <div
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory(category)}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandedCategories.has(category)}
                    aria-controls={`${category}-shortcuts`}
                  >
                    <span className={styles.categoryIcon}>
                      {getCategoryIcon(category)}
                    </span>
                    <span className={styles.categoryName}>
                      {getCategoryDisplayName(category)}
                    </span>
                    <span className={styles.categoryCount}>
                      ({categoryShortcuts.length})
                    </span>
                    <span className={styles.expandIndicator}>
                      {expandedCategories.has(category) ? '▼' : '▶'}
                    </span>
                  </div>

                  {expandedCategories.has(category) && (
                    <div
                      id={`${category}-shortcuts`}
                      className={styles.shortcutList}
                      role="list"
                    >
                      {categoryShortcuts.map((shortcut) => (
                        <div key={shortcut.id} className={styles.shortcutItem} role="listitem">
                          <div className={styles.shortcutKeys}>
                            {formatKeybinding(shortcut.keybinding)}
                          </div>
                          <div className={styles.shortcutDescription}>
                            {shortcut.description}
                          </div>
                          <div className={styles.shortcutScope}>
                            <span className={styles.scopeBadge}>
                              {shortcut.scope}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Tips */}
          <div className={styles.tipsSection}>
            <h3>Quick Tips</h3>
            <ul className={styles.tipsList}>
              <li>Press <kbd>Tab</kbd> to move between focusable elements</li>
              <li>Press <kbd>Shift+Tab</kbd> to move backwards</li>
              <li>Press <kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons and links</li>
              <li>Press <kbd>Escape</kbd> to close dialogs and modals</li>
              <li>Use arrow keys to navigate lists and menus</li>
              <li>Press <kbd>Ctrl+F</kbd> to search across the application</li>
            </ul>
          </div>

          {/* Accessibility Note */}
          <div className={styles.accessibilityNote}>
            <h4>Accessibility</h4>
            <p>
              This application is designed to be fully accessible using keyboard navigation only.
              All interactive elements can be reached using Tab navigation, and all actions can be
              performed using keyboard shortcuts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.closeBottomBtn}
          >
            Close (Escape)
          </button>
          <div className={styles.totalShortcuts}>
            Total shortcuts: {shortcuts.length}
          </div>
        </div>
      </div>
    </div>
  );
};

KeyboardNavigationHelp.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  position: PropTypes.oneOf(['center', 'side', 'bottom']),
  showCategory: PropTypes.string,
  customShortcuts: PropTypes.object
};

export default KeyboardNavigationHelp;