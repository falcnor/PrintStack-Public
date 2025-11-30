/**
 * Comprehensive Keyboard Navigation System
 * Provides full keyboard navigation support with tab management, shortcuts, and focus management
 */

/**
 * Keyboard Navigation Manager
 */
class KeyboardNavigationManager {
  constructor() {
    this.activeShortcuts = new Map();
    this.trapStack = []; // Stack for focus traps
    this.globalEnabled = true;
    this.keydownHandler = this.handleKeydown.bind(this);
    this.keyupHandler = this.handleKeyup.bind(this);
    this.focusHistory = [];
    this.maxFocusHistory = 10;
    this.shortcutsConfigured = false;

    // Default keyboard shortcuts
    this.defaultShortcuts = {
      // Navigation shortcuts
      'Tab': this.handleTab.bind(this),
      'Shift+Tab': this.handleShiftTab.bind(this),
      'Enter': this.handleEnter.bind(this),
      'Space': this.handleSpace.bind(this),

      // Common shortcuts
      'Escape': this.handleEscape.bind(this),
      'ArrowUp': this.handleArrowUp.bind(this),
      'ArrowDown': this.handleArrowDown.bind(this),
      'ArrowLeft': this.handleArrowLeft.bind(this),
      'ArrowRight': this.handleArrowRight.bind(this),
      'Home': this.handleHome.bind(this),
      'End': this.handleEnd.bind(this),
      'PageUp': this.handlePageUp.bind(this),
      'PageDown': this.handlePageDown.bind(this),

      // Action shortcuts
      'Delete': this.handleDelete.bind(this),
      'Backspace': this.handleBackspace.bind(this),
      'Insert': this.handleInsert.bind(this),

      // Modifier shortcuts
      'F1': this.handleF1.bind(this),
      'F2': this.handleF2.bind(this),
      'F5': this.handleF5.bind(this),
      'Ctrl+S': this.handleCtrlS.bind(this),
      'Ctrl+F': this.handleCtrlF.bind(this),
      'Ctrl+Z': this.handleCtrlZ.bind(this),
      'Ctrl+Y': this.handleCtrlY.bind(this),
      'Ctrl+A': this.handleCtrlA.bind(this),
      'Ctrl+C': this.handleCtrlC.bind(this),
      'Ctrl+V': this.handleCtrlV.bind(this),
      'Ctrl+X': this.handleCtrlX.bind(this),
      'Alt+ArrowLeft': this.handleAltArrowLeft.bind(this),
      'Alt+ArrowRight': this.handleAltArrowRight.bind(this)
    };

    this.initialize();
  }

  initialize() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.keydownHandler, { capture: true });
      document.addEventListener('keyup', this.keyupHandler, { capture: true });
      this.setupDefaultShortcuts();
    }
  }

  /**
   * Setup default keyboard shortcuts
   */
  setupDefaultShortcuts() {
    if (this.shortcutsConfigured) return;

    Object.entries(this.defaultShortcuts).forEach(([shortcut, handler]) => {
      this.addShortcut(shortcut, handler, {
        description: this.getShortcutDescription(shortcut),
        category: 'default'
      });
    });

    this.shortcutsConfigured = true;
  }

  /**
   * Get human readable description for shortcuts
   */
  getShortcutDescription(shortcut) {
    const descriptions = {
      'Tab': 'Navigate to next element',
      'Shift+Tab': 'Navigate to previous element',
      'Enter': 'Activate focused element',
      'Space': 'Select focused element',
      'Escape': 'Close dialog or cancel action',
      'ArrowUp': 'Move up or navigate to previous option',
      'ArrowDown': 'Move down or navigate to next option',
      'ArrowLeft': 'Move left',
      'ArrowRight': 'Move right',
      'Home': 'Jump to beginning',
      'End': 'Jump to end',
      'PageUp': 'Go to previous page',
      'PageDown': 'Go to next page',
      'Delete': 'Delete selected item',
      'Backspace': 'Delete previous character or item',
      'F1': 'Show help',
      'F2': 'Edit mode',
      'F5': 'Refresh or reload',
      'Ctrl+S': 'Save',
      'Ctrl+F': 'Search',
      'Ctrl+Z': 'Undo',
      'Ctrl+Y': 'Redo',
      'Ctrl+A': 'Select all',
      'Ctrl+C': 'Copy',
      'Ctrl+V': 'Paste',
      'Ctrl+X': 'Cut',
      'Alt+ArrowLeft': 'Navigate back',
      'Alt+ArrowRight': 'Navigate forward'
    };

    return descriptions[shortcut] || shortcut;
  }

  /**
   * Add keyboard shortcut
   */
  addShortcut(keybinding, handler, options = {}) {
    const {
      category = 'custom',
      description = '',
      preventDefault = true,
      stopPropagation = true,
      enabled = true,
      scope = 'global', // 'global', 'local', 'form'
      element = null // element to scope to
    } = options;

    if (typeof handler !== 'function') {
      console.warn(`Invalid handler for shortcut ${keybinding}`);
      return false;
    }

    const shortcut = {
      keybinding: keybinding.toLowerCase(),
      handler,
      category,
      description,
      preventDefault,
      stopPropagation,
      enabled,
      scope,
      element,
      id: this.generateShortcutId()
    };

    this.activeShortcuts.set(shortcut.id, shortcut);
    return shortcut.id;
  }

  /**
   * Remove keyboard shortcut
   */
  removeShortcut(shortcutId) {
    return this.activeShortcuts.delete(shortcutId);
  }

  /**
   * Enable/disable all shortcuts
   */
  setGlobal(enabled) {
    this.globalEnabled = enabled;
  }

  /**
   * Parse keybinding string
   */
  parseKeybinding(keybinding) {
    const parts = keybinding.toLowerCase().split('+');
    return {
      ctrl: parts.includes('ctrl'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta'),
      key: parts[parts.length - 1]
    };
  }

  /**
   * Check if event matches keybinding
   */
  matchesKeybinding(event, keybinding) {
    const parsed = this.parseKeybinding(keybinding);

    return (
      event.ctrlKey === parsed.ctrl &&
      event.altKey === parsed.alt &&
      event.shiftKey === parsed.shift &&
      event.metaKey === parsed.meta &&
      (!event.key || event.key.toLowerCase() === parsed.key)
    );
  }

  /**
   * Handle global keydown events
   */
  handleKeydown(event) {
    if (!this.globalEnabled) return;

    // Find matching shortcuts
    for (const [id, shortcut] of this.activeShortcuts) {
      if (!shortcut.enabled) continue;
      if (!this.matchesKeybinding(event, shortcut.keybinding)) continue;

      // Check scope
      if (!this.isShortcutInScope(shortcut, event)) continue;

      // Run the shortcut
      try {
        const result = shortcut.handler(event);

        if (shortcut.preventDefault) {
          event.preventDefault();
        }

        if (shortcut.stopPropagation) {
          event.stopPropagation();
        }

        if (result === false) {
          return false; // Stop processing further shortcuts
        }
      } catch (error) {
        console.error(`Error in keyboard shortcut ${shortcut.keybinding}:`, error);
      }

      break; // Only handle first matching shortcut
    }
  }

  /**
   * Handle keyup events
   */
  handleKeyup(event) {
    // Can be used for keyup-specific logic
  }

  /**
   * Check if shortcut is in active scope
   */
  isShortcutInScope(shortcut, event) {
    switch (shortcut.scope) {
      case 'global':
        return true;

      case 'local':
        if (shortcut.element) {
          return shortcut.element.contains(event.target);
        }
        return false;

      case 'form':
        const form = event.target.closest('form');
        return form === shortcut.element || (shortcut.element && form?.contains(shortcut.element));

      default:
        return true;
    }
  }

  /**
   * Focus trap management
   */
  trapFocus(container, options = {}) {
    const {
      restoreFocus = true,
      trapId = this.generateTrapId()
    } = options;

    // Save current focus before trapping
    let previousFocus = document.activeElement;
    if (!previousFocus || previousFocus === document.body) {
      previousFocus = document.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || document.body;
    }

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    if (focusableElements.length === 0) {
      return null;
    }

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstFocusable.focus();

    const keydownHandler = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', keydownHandler);

    const trap = {
      id: trapId,
      container,
      keydownHandler,
      previousFocus,
      destroy: () => {
        container.removeEventListener('keydown', keydownHandler);
        this.trapStack = this.trapStack.filter(t => t.id !== trapId);

        if (restoreFocus && previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus();
        }
      }
    };

    this.trapStack.push(trap);
    return trap;
  }

  /**
   * Release focus trap
   */
  releaseFocusTrap(trapId) {
    const trap = this.trapStack.find(t => t.id === trapId);
    if (trap) {
      trap.destroy();
    }
  }

  /**
   * Focus management utilities
   */
  moveToNextFocusable(container, currentElement = null) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    if (focusableElements.length === 0) return false;

    let currentIndex = -1;
    if (currentElement) {
      currentIndex = Array.from(focusableElements).indexOf(currentElement);
    }

    const nextIndex = currentIndex + 1 < focusableElements.length ? currentIndex + 1 : 0;
    focusableElements[nextIndex].focus();
    return true;
  }

  moveToPreviousFocusable(container, currentElement = null) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"]'
    );

    if (focusableElements.length === 0) return false;

    let currentIndex = focusableElements.length;
    if (currentElement) {
      currentIndex = Array.from(focusableElements).indexOf(currentElement);
    }

    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : focusableElements.length - 1;
    focusableElements[prevIndex].focus();
    return true;
  }

  /**
   * Focus history management
   */
  saveFocusHistory(element) {
    if (!element) return;

    // Remove duplicates
    this.focusHistory = this.focusHistory.filter(el => el !== element);

    // Add to beginning
    this.focusHistory.unshift(element);

    // Limit history size
    if (this.focusHistory.length > this.maxFocusHistory) {
      this.focusHistory = this.focusHistory.slice(0, this.maxFocusHistory);
    }
  }

  getPreviousFocus() {
    return this.focusHistory[1] || null;
  }

  // Default key handlers
  handleTab(event) {
    // Allow default tab behavior
    this.saveFocusHistory(event.target);
  }

  handleShiftTab(event) {
    // Allow default shift+tab behavior
    this.saveFocusHistory(event.target);
  }

  handleEnter(event) {
    const element = event.target;

    // Handle common enter behaviors
    if (element.tagName === 'BUTTON') {
      element.click();
    } else if (element.tagName === 'A') {
      element.click();
    } else if (element.tagName === 'INPUT' && element.type === 'checkbox') {
      element.checked = !element.checked;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element.getAttribute('role') === 'button') {
      element.click();
    }
  }

  handleSpace(event) {
    const element = event.target;

    // Only handle space for button-like elements (not in text inputs)
    if (['INPUT', 'TEXTAREA'].includes(element.tagName) && element.type !== 'checkbox') {
      return;
    }

    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
      event.preventDefault();
      element.click();
    } else if (element.tagName === 'INPUT' && element.type === 'checkbox') {
      event.preventDefault();
      element.checked = !element.checked;
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  handleEscape(event) {
    // Close modals, dropdowns, etc.
    document.dispatchEvent(new CustomEvent('keyboardEscape', { detail: { target: event.target } }));
  }

  handleArrowUp(event) {
    // Handle up arrow navigation in lists, grids, etc.
    document.dispatchEvent(new CustomEvent('keyboardArrowUp', { detail: { target: event.target } }));
  }

  handleArrowDown(event) {
    // Handle down arrow navigation
    document.dispatchEvent(new CustomEvent('keyboardArrowDown', { detail: { target: event.target } }));
  }

  handleArrowLeft(event) {
    // Handle left arrow navigation
    document.dispatchEvent(new CustomEvent('keyboardArrowLeft', { detail: { target: event.target } }));
  }

  handleArrowRight(event) {
    // Handle right arrow navigation
    document.dispatchEvent(new CustomEvent('keyboardArrowRight', { detail: { target: event.target } }));
  }

  handleHome(event) {
    // Jump to beginning of list or content
    document.dispatchEvent(new CustomEvent('keyboardHome', { detail: { target: event.target } }));
  }

  handleEnd(event) {
    // Jump to end of list or content
    document.dispatchEvent(new CustomEvent('keyboardEnd', { detail: { target: event.target } }));
  }

  handlePageUp(event) {
    // Navigate to previous page
    document.dispatchEvent(new CustomEvent('keyboardPageUp', { detail: { target: event.target } }));
  }

  handlePageDown(event) {
    // Navigate to next page
    document.dispatchEvent(new CustomEvent('keyboardPageDown', { detail: { target: event.target } }));
  }

  handleDelete(event) {
    // Delete action
    document.dispatchEvent(new CustomEvent('keyboardDelete', { detail: { target: event.target } }));
  }

  handleBackspace(event) {
    // Backspace action
    document.dispatchEvent(new CustomEvent('keyboardBackspace', { detail: { target: event.target } }));
  }

  handleInsert(event) {
    // Insert toggle (for some applications)
    document.dispatchEvent(new CustomEvent('keyboardInsert', { detail: { target: event.target } }));
  }

  handleF1(event) {
    // Help
    document.dispatchEvent(new CustomEvent('keyboardHelp', { detail: { target: event.target } }));
  }

  handleF2(event) {
    // Edit mode
    document.dispatchEvent(new CustomEvent('keyboardEdit', { detail: { target: event.target } }));
  }

  handleF5(event) {
    // Refresh
    document.dispatchEvent(new CustomEvent('keyboardRefresh', { detail: { target: event.target } }));
  }

  handleCtrlS(event) {
    // Save
    document.dispatchEvent(new CustomEvent('keyboardSave', { detail: { target: event.target } }));
  }

  handleCtrlF(event) {
    // Search
    document.dispatchEvent(new CustomEvent('keyboardSearch', { detail: { target: event.target } }));
  }

  handleCtrlZ(event) {
    // Undo
    document.dispatchEvent(new CustomEvent('keyboardUndo', { detail: { target: event.target } }));
  }

  handleCtrlY(event) {
    // Redo
    document.dispatchEvent(new CustomEvent('keyboardRedo', { detail: { target: event.target } }));
  }

  handleCtrlA(event) {
    // Select all
    document.dispatchEvent(new CustomEvent('keyboardSelectAll', { detail: { target: event.target } }));
  }

  handleCtrlC(event) {
    // Copy
    document.dispatchEvent(new CustomEvent('keyboardCopy', { detail: { target: event.target } }));
  }

  handleCtrlV(event) {
    // Paste
    document.dispatchEvent(new CustomEvent('keyboardPaste', { detail: { target: event.target } }));
  }

  handleCtrlX(event) {
    // Cut
    document.dispatchEvent(new CustomEvent('keyboardCut', { detail: { target: event.target } }));
  }

  handleAltArrowLeft(event) {
    // Navigate back
    document.dispatchEvent(new CustomEvent('keyboardBack', { detail: { target: event.target } }));
  }

  handleAltArrowRight(event) {
    // Navigate forward
    document.dispatchEvent(new CustomEvent('keyboardForward', { detail: { target: event.target } }));
  }

  /**
   * Utility methods
   */
  generateShortcutId() {
    return `shortcut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTrapId() {
    return `trap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all active shortcuts
   */
  getActiveShortcuts() {
    return Array.from(this.activeShortcuts.entries()).map(([id, shortcut]) => ({
      id,
      ...shortcut,
      keybinding: shortcut.keybinding.replace(/\+/g, ' + ')
    }));
  }

  /**
   * Get shortcuts by category
   */
  getShortcutsByCategory(category) {
    return this.getActiveShortcuts().filter(shortcut => shortcut.category === category);
  }

  /**
   * Clean up
   */
  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.keydownHandler, { capture: true });
      document.removeEventListener('keyup', this.keyupHandler, { capture: true });
    }

    // Release all focus traps
    this.trapStack.forEach(trap => trap.destroy());
    this.trapStack = [];

    this.activeShortcuts.clear();
  }
}

/**
 * Create global keyboard navigation manager instance
 */
export const keyboardNavigation = new KeyboardNavigationManager();

/**
 * React Hook for keyboard navigation
 */
export const useKeyboardNavigation = (containerRef, shortcuts = {}) => {
  const [shortcutIds, setShortcutIds] = useState([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ids = [];

    // Add shortcuts scoped to container
    Object.entries(shortcuts).forEach(([keybinding, handler]) => {
      const id = keyboardNavigation.addShortcut(keybinding, handler, {
        scope: 'local',
        element: containerRef.current
      });
      ids.push(id);
    });

    setShortcutIds(ids);

    return () => {
      // Clean up shortcuts
      ids.forEach(id => keyboardNavigation.removeShortcut(id));
    };
  }, [containerRef.current, shortcuts]);

  const addShortcut = useCallback((keybinding, handler, options = {}) => {
    const id = keyboardNavigation.addShortcut(keybinding, handler, {
      ...options,
      scope: 'local',
      element: containerRef.current
    });

    setShortcutIds(prev => [...prev, id]);
    return id;
  }, [containerRef.current]);

  const removeShortcut = useCallback((id) => {
    const removed = keyboardNavigation.removeShortcut(id);
    if (removed) {
      setShortcutIds(prev => prev.filter(sId => sId !== id));
    }
    return removed;
  }, []);

  const trapFocus = useCallback((options = {}) => {
    if (!containerRef.current) return null;
    return keyboardNavigation.trapFocus(containerRef.current, options);
  }, [containerRef.current]);

  return {
    addShortcut,
    removeShortcut,
    trapFocus,
    shortcutIds
  };
};

export default keyboardNavigation;