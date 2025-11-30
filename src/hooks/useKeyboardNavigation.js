import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Keyboard navigation hook for accessibility
 * @param {Object} config - Configuration object
 * @returns {Object} Keyboard navigation utilities
 */
export const useKeyboardNavigation = (config = {}) => {
  const {
    enabled = true,
    scope = 'global', // 'global', 'local', 'form'
    customShortcuts = {},
    preventDefaults = {}
  } = config;

  const [isListening, setIsListening] = useState(true);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [activeModal, setActiveModal] = useState(null);
  const shortcutsRef = useRef({});
  const listenersRef = useRef(new Set());

  // Default keyboard shortcuts
  const defaultShortcuts = {
    // Navigation
    'ctrl+/': () => showKeyboardHelp(),
    'escape': () => closeActiveModal(),
    'tab': () => focusNextElement(),
    'shift+tab': () => focusPreviousElement(),

    // Global actions
    'ctrl+k': () => focusSearchBar(),
    'ctrl+n': () => createNewEntity(),
    'ctrl+s': () => saveCurrentForm(),
    'ctrl+f': () => openSearch(),
    'ctrl+r': () => refreshData(),
    'delete': () => deleteSelectedItem(),

    // View navigation
    'alt+1': () => navigateToSection('filaments'),
    'alt+2': () => navigateToSection('models'),
    'alt+3': () => navigateToSection('prints'),
    'alt+4': () => navigateToSection('dashboard'),

    // Table navigation
    'up': () => navigateTable('up'),
    'down': () => navigateTable('down'),
    'left': () => navigateTable('left'),
    'right': () => navigateTable('right'),
    'enter': () => activateSelectedRow(),
    'space': () => selectCurrentRow(),
    'ctrl+a': () => selectAllRows(),
    'ctrl+shift+a': () => deselectAllRows(),

    // Form navigation
    'enter': () => submitForm(),
    'ctrl+enter': () => submitAndContinue(),
    'shift+enter': () => addNewRow()
  };

  // Merge with custom shortcuts
  const shortcuts = { ...defaultShortcuts, ...customShortcuts };

  /**
   * Parse keyboard event to shortcut string
   * @param {KeyboardEvent} e - Keyboard event
   * @returns {string} Shortcut string
   */
  const parseKeyEvent = useCallback((e) => {
    const components = [];

    if (e.ctrlKey || e.metaKey) components.push('ctrl');
    if (e.altKey) components.push('alt');
    if (e.shiftKey) components.push('shift');

    // Special keys
    const specialKeys = ['escape', 'enter', 'tab', 'space', 'up', 'down', 'left', 'right', 'delete'];
    const key = specialKeys.includes(e.key.toLowerCase()) ? e.key.toLowerCase() : e.key;

    if (!specialKeys.includes(key.toLowerCase()) && key.length === 1) {
      components.push(key.toLowerCase());
    } else if (specialKeys.includes(key.toLowerCase())) {
      components.push(key.toLowerCase());
    }

    return components.join('+');
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e) => {
    if (!enabled || !isListening) return;

    const shortcut = parseKeyEvent(e);
    const action = shortcuts[shortcut];

    // Prevent default for registered shortcuts
    if (action && preventDefaults[shortcut] !== false) {
      e.preventDefault();
      e.stopPropagation();

      // Update pressed keys
      setPressedKeys(prev => new Set(prev).add(shortcut));

      try {
        action(e);
      } catch (error) {
        console.error(`Keyboard shortcut error for "${shortcut}":`, error);
      }
    }
  }, [enabled, isListening, shortcuts, parseKeyEvent, preventDefaults]);

  const handleKeyUp = useCallback((e) => {
    const shortcut = parseKeyEvent(e);
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(shortcut);
      return newSet;
    });
  }, [parseKeyEvent]);

  /**
   * Register custom shortcuts
   */
  const registerShortcut = useCallback((shortcut, callback, options = {}) => {
    shortcutsRef.current[shortcut] = callback;

    if (options.preventDefault !== undefined) {
      preventDefaults[shortcut] = options.preventDefault;
    }
  }, [preventDefaults]);

  /**
   * Unregister shortcuts
   */
  const unregisterShortcut = useCallback((shortcut) => {
    delete shortcutsRef.current[shortcut];
    delete preventDefaults[shortcut];
  }, [preventDefaults]);

  /**
   * Add keyboard event listener
   */
  const addListener = useCallback((callback) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  /**
   * Default action implementations
   */
  const showKeyboardHelp = useCallback(() => {
    // Implementation would show help modal
    console.log('Show keyboard shortcuts help');
  }, []);

  const closeActiveModal = useCallback(() => {
    if (activeModal) {
      setActiveModal(null);
      document.dispatchEvent(new CustomEvent('closeModal'));
    }
  }, [activeModal]);

  const focusNextElement = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex].focus();
  }, []);

  const focusPreviousElement = useCallback(() => {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const currentIndex = Array.from(focusableElements).findIndex(el => el === document.activeElement);
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex].focus();
  }, []);

  const focusSearchBar = useCallback(() => {
    const searchInput = document.querySelector('[data-search-input]') ||
                       document.querySelector('input[type="search"]') ||
                       document.querySelector('input[placeholder*="search"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, handleKeyDown, handleKeyUp]);

  // Listen for modal events
  useEffect(() => {
    const handleModalOpen = (e) => setActiveModal(e.detail.modalId);
    const handleModalClose = () => setActiveModal(null);

    document.addEventListener('openModal', handleModalOpen);
    document.addEventListener('closeModal', handleModalClose);

    return () => {
      document.removeEventListener('openModal', handleModalOpen);
      document.removeEventListener('closeModal', handleModalClose);
    };
  }, []);

  return {
    // State
    isListening,
    pressedKeys,
    activeModal,

    // Controls
    enable: () => setIsListening(true),
    disable: () => setIsListening(false),
    toggle: () => setIsListening(prev => !prev),

    // Shortcut management
    registerShortcut,
    unregisterShortcut,
    addListener,

    // Utilities
    isShortcutPressed: (shortcut) => pressedKeys.has(shortcut),
    getActiveShortcuts: () => Object.keys({ ...shortcuts, ...shortcutsRef.current })
  };
};

/**
 * Hook for screen reader announcements
 * @param {Object} config - Configuration
 * @returns {Object} Screen reader utilities
 */
export const useScreenReader = (config = {}) => {
  const { priority = 'polite' } = config;
  const [announcements, setAnnouncements] = useState([]);

  /**
   * Make an announcement
   * @param {string} message - Message to announce
   * @param {number} timeout - Auto-clear timeout in ms
   */
  const announce = useCallback((message, timeout = 5000) => {
    const id = Date.now().toString();
    const announcement = { id, message, timestamp: Date.now() };

    setAnnouncements(prev => [...prev, announcement]);

    if (timeout > 0) {
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }, timeout);
    }

    return id;
  }, []);

  /**
   * Clear announcements
   */
  const clear = useCallback((id) => {
    if (id) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } else {
      setAnnouncements([]);
    }
  }, []);

  /**
   * Announce loading state
   */
  const announceLoading = useCallback((message) => {
    announce(message, 0);
  }, [announce]);

  /**
   * Announce navigation
   */
  const announceNavigation = useCallback((section, count) => {
    let message = `Navigated to ${section}`;
    if (count !== undefined) {
      message += `. ${count} items available`;
    }
    announce(message);
  }, [announce]);

  /**
   * Announce action result
   */
  const announceResult = useCallback((action, result, count) => {
    let message = `${action} ${result}`;
    if (count !== undefined) {
      message += `. ${count} ${count === 1 ? 'item' : 'items'} affected`;
    }
    announce(message);
  }, [announce]);

  /**
   * Announce validation errors
   */
  const announceErrors = useCallback((errors) => {
    if (Array.isArray(errors)) {
      const message = errors.length === 1
        ? `Validation error: ${errors[0]}`
        : `${errors.length} validation errors found`;
      announce(message, 3000);
    } else if (errors) {
      announce(`Validation error: ${errors}`, 3000);
    }
  }, [announce]);

  return {
    announcements,
    announce,
    clear,
    announceLoading,
    announceNavigation,
    announceResult,
    announceErrors
  };
};

/**
 * Hook for focus trap in modals and overlays
 * @param {HTMLElement} container - Container element
 * @param {boolean} isActive - Whether trap is active
 * @returns {Object} Focus trap utilities
 */
export const useFocusTrap = (container, isActive = false) => {
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);
  const previousFocusRef = useRef(null);

  /**
   * Get focusable elements within container
   */
  const getFocusableElements = useCallback(() => {
    if (!container) return [];

    return container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  }, [container]);

  /**
   * Save current focus
   */
  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement;
  }, []);

  /**
   * Restore focus to previous element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);

  /**
   * Focus first element
   */
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  /**
   * Handle tab key within trap
   */
  const handleTabKey = useCallback((e) => {
    if (!isActive || e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }, [isActive, getFocusableElements]);

  // Setup and cleanup
  useEffect(() => {
    if (!container || !isActive) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      firstFocusableRef.current = focusableElements[0];
      lastFocusableRef.current = focusableElements[focusableElements.length - 1];
    }

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [container, isActive, getFocusableElements, handleTabKey]);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    getFocusableElements
  };
};

/**
 * Hook for accessible table navigation
 * @param {HTMLTableElement} tableElement - Table element
 * @param {Array} data - Table data
 * @param {Object} config - Configuration
 * @returns {Object} Table navigation utilities
 */
export const useTableNavigation = (tableElement, data, config = {}) => {
  const {
    multiSelect = false,
    wrapNavigation = true
  } = config;

  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [selectedRows, setSelectedRows] = useState(new Set());

  /**
   * Navigate to a specific cell
   */
  const navigateTo = useCallback((row, col) => {
    if (row < 0 || row >= data.length) return;
    if (col < 0 || col >= Object.keys(data[0] || {}).length) return;

    setSelectedCell({ row, col });

    const cell = tableElement?.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (cell) {
      cell.focus();
    }
  }, [data, tableElement]);

  /**
   * Navigate with keyboard
   */
  const handleNavigation = useCallback((e) => {
    if (!tableElement) return;

    const { row, col } = selectedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(data.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(Object.keys(data[0] || {}).length - 1, col + 1);
        break;
      case 'Home':
        e.preventDefault();
        newCol = 0;
        break;
      case 'End':
        e.preventDefault();
        newCol = Object.keys(data[0] || {}).length - 1;
        break;
      case 'PageUp':
        e.preventDefault();
        newRow = 0;
        break;
      case 'PageDown':
        e.preventDefault();
        newRow = data.length - 1;
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        toggleRowSelection(row);
        break;
      default:
        return;
    }

    // Handle wrap navigation
    if (wrapNavigation) {
      if (e.key === 'ArrowRight' && newCol >= Object.keys(data[0] || {}).length) {
        newCol = 0;
        newRow = Math.min(data.length - 1, row + 1);
      } else if (e.key === 'ArrowLeft' && newCol < 0) {
        newCol = Object.keys(data[0] || {}).length - 1;
        newRow = Math.max(0, row - 1);
      }
    }

    navigateTo(newRow, newCol);
  }, [selectedCell, data, tableElement, navigateTo, wrapNavigation]);

  /**
   * Toggle row selection
   */
  const toggleRowSelection = useCallback((rowIndex) => {
    const item = data[rowIndex];
    if (!item) return;

    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (multiSelect) {
        if (prev.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
      } else {
        return prev.has(item.id) ? new Set() : new Set([item.id]);
      }
      return newSet;
    });
  }, [data, multiSelect]);

  // Setup keyboard listener
  useEffect(() => {
    if (!tableElement) return;

    tableElement.addEventListener('keydown', handleNavigation);

    return () => {
      tableElement.removeEventListener('keydown', handleNavigation);
    };
  }, [tableElement, handleNavigation]);

  return {
    selectedCell,
    selectedRows,
    navigateTo,
    toggleRowSelection,
    clearSelection: () => setSelectedRows(new Set()),
    selectAll: () => setSelectedRows(new Set(data.map(item => item.id)))
  };
};

export default {
  useKeyboardNavigation,
  useScreenReader,
  useFocusTrap,
  useTableNavigation
};