/**
 * Accessibility Utilities
 * Provides ARIA support, screen reader announcements, and accessibility helpers
 */

/**
 * Screen Reader Announcer
 * Manages live regions for screen reader announcements
 */
class ScreenReaderAnnouncer {
  constructor() {
    this.announcementQueue = [];
    this.announcementTimeout = null;
    this.announcementDelay = 100;

    // Create live regions
    this.createLiveRegions();
  }

  createLiveRegions() {
    if (typeof document !== 'undefined') {
      // Polite announcements (non-interrupting)
      this.politeRegion = this.createElement('div', {
        'aria-live': 'polite',
        'aria-atomic': 'true',
        'aria-relevant': 'additions text',
        className: 'sr-only polite-announcements',
        style: {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0'
        }
      });

      // Assertive announcements (interrupting)
      this.assertiveRegion = this.createElement('div', {
        'aria-live': 'assertive',
        'aria-atomic': 'true',
        'aria-relevant': 'additions',
        className: 'sr-only assertive-announcements',
        style: this.politeRegion.style
      });

      // Status announcements
      this.statusRegion = this.createElement('div', {
        'role': 'status',
        'aria-atomic': 'true',
        className: 'sr-only status-announcements',
        style: this.politeRegion.style
      });

      // Append to document
      document.body.appendChild(this.politeRegion);
      document.body.appendChild(this.assertiveRegion);
      document.body.appendChild(this.statusRegion);
    }
  }

  createElement(tag, attributes) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    return element;
  }

  /**
   * Make a polite announcement
   */
  announce(message, delay = this.announcementDelay) {
    if (!this.politeRegion) return;

    const announcement = message.trim();
    if (this.announcementQueue.includes(announcement)) return; // Avoid duplicates

    this.announcementQueue.push(announcement);

    clearTimeout(this.announcementTimeout);

    this.announcementTimeout = setTimeout(() => {
      if (this.announcementQueue.length > 0) {
        const nextAnnouncement = this.announcementQueue.shift();
        this.politeRegion.textContent = nextAnnouncement;

        // Clear after announcement
        setTimeout(() => {
          this.politeRegion.textContent = '';
        }, 1000);
      }
    }, delay);
  }

  /**
   * Make an assertive announcement (interrupting)
   */
  assert(message, delay = 50) {
    if (!this.assertiveRegion) return;

    const announcement = message.trim();

    clearTimeout(this.announcementTimeout);

    this.announcementTimeout = setTimeout(() => {
      this.assertiveRegion.textContent = announcement;

      // Clear after announcement
      setTimeout(() => {
        this.assertiveRegion.textContent = '';
      }, 1000);
    }, delay);
  }

  /**
   * Update status
   */
  updateStatus(message, delay = 100) {
    if (!this.statusRegion) return;

    const announcement = message.trim();

    clearTimeout(this.announcementTimeout);

    this.announcementTimeout = setTimeout(() => {
      this.statusRegion.textContent = announcement;

      // Clear after a reasonable time
      setTimeout(() => {
        this.statusRegion.textContent = '';
      }, 3000);
    }, delay);
  }

  /**
   * Announce form validation errors
   */
  announceFormErrors(formName, errors = []) {
    if (!errors.length) {
      this.announce(`${formName} form is complete`);
      return;
    }

    const errorMessages = errors.map(error => `${error.field}: ${error.message}`);
    this.assert(`${formName} form has ${errors.length} error${errors.length > 1 ? 's' : ''}. ${errorMessages.join('. ')}`);
  }

  /**
   * Announce navigation changes
   */
  announce(pageTitle, breadcrumb = '') {
    let message = `Navigated to ${pageTitle}`;
    if (breadcrumb) {
      message = `${breadcrumb}, ${message}`;
    }
    this.announce(message);
  }

  /**
   * Announce data changes
   */
  announceDataChange(operation, itemType, count = 1) {
    const messages = {
      create: `Added ${count} ${count === 1 ? itemType : itemType + 's'}`,
      update: `Updated ${count} ${count === 1 ? itemType : itemTypes + 's'}`,
      delete: `Deleted ${count} ${count === 1 ? itemType : itemType + 's'}`
    };

    this.announce(messages[operation] || `Changed ${count} ${itemType}`);
  }

  /**
   * Announce loading states
   */
  announceLoading(message = 'Loading', complete = false) {
    if (complete) {
      this.updateStatus(`${message} complete`);
    } else {
      this.updateStatus(`${message}... Please wait.`);
    }
  }

  /**
   * Announce error states
   */
  announceError(error, context = '') {
    let message = error.message || 'An error occurred';
    if (context) {
      message = `${context}: ${message}`;
    }
    this.assert(message, 100);
  }

  /**
   * Announce successful operations
   */
  announceSuccess(operation, itemType = '') {
    let message = operation;
    if (itemType) {
      message = `${itemType} ${operation}`;
    }
    this.announce(message);
  }

  /**
   * Clean up
   */
  destroy() {
    clearTimeout(this.announcementTimeout);

    if (this.politeRegion) {
      document.body.removeChild(this.politeRegion);
    }
    if (this.assertiveRegion) {
      document.body.removeChild(this.assertiveRegion);
    }
    if (this.statusRegion) {
      document.body.removeChild(this.statusRegion);
    }
  }
}

/**
 * ARIA Utility Functions
 */
export const AriaUtils = {
  /**
   * Generate unique IDs for ARIA relationships
   */
  generateId(prefix = 'aria') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set up ARIA relationship between elements
   */
  setupRelationship(element, type, targetId) {
    if (!element) return;

    const attributes = {
      labelledby: 'aria-labelledby',
      describedby: 'aria-describedby',
      controls: 'aria-controls',
      owns: 'aria-owns',
      activedescendant: 'aria-activedescendant'
    };

    if (attributes[type]) {
      element.setAttribute(attributes[type], targetId);
    }
  },

  /**
   * Make element focusable
   */
  makeFocusable(element, tabIndex = 0) {
    if (!element) return;

    element.setAttribute('tabindex', tabIndex);
    if (!element.hasAttribute('role') && element.tagName !== 'BUTTON' && element.tagName !== 'A') {
      element.setAttribute('role', 'button');
    }
  },

  /**
   * Remove focusable attributes
   */
  makeUnfocusable(element) {
    if (!element) return;

    element.removeAttribute('tabindex');
    if (element.getAttribute('role') === 'button') {
      element.removeAttribute('role');
    }
  },

  /**
   * Add ARIA pressed state
   */
  setPressed(element, pressed = true) {
    if (!element) return;
    element.setAttribute('aria-pressed', pressed.toString());
  },

  /**
   * Add ARIA expanded state
   */
  setExpanded(element, expanded = true) {
    if (!element) return;
    element.setAttribute('aria-expanded', expanded.toString());
  },

  /**
   * Add ARIA selected state
   */
  setSelected(element, selected = true) {
    if (!element) return;
    element.setAttribute('aria-selected', selected.toString());
  },

  /**
   * Add ARIA disabled state
   */
  setDisabled(element, disabled = true) {
    if (!element) return;
    element.setAttribute('aria-disabled', disabled.toString());
    if (disabled) {
      element.setAttribute('tabindex', '-1');
    } else if (element.getAttribute('tabindex') === '-1') {
      element.removeAttribute('tabindex');
    }
  },

  /**
   * Set ARIA invalid state with error message
   */
  setInvalid(element, invalid = true, message = '') {
    if (!element) return;

    element.setAttribute('aria-invalid', invalid.toString());

    if (invalid && message) {
      const errorId = this.generateId('error');
      element.setAttribute('aria-describedby', errorId);

      // Create error element if it doesn't exist
      let errorElement = document.getElementById(errorId);
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.setAttribute('role', 'alert');
        errorElement.className = 'sr-only';
        if (element.parentNode) {
          element.parentNode.insertBefore(errorElement, element.nextSibling);
        }
      }
      errorElement.textContent = message;
    }
  },

  /**
   * Add ARIA role and properties for modal dialogs
   */
  setupModal(element, options = {}) {
    if (!element) return;

    const {
      labelledby,
      describedby,
      modal = true
    } = options;

    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', modal.toString());

    if (labelledby) {
      element.setAttribute('aria-labelledby', labelledby);
    }

    if (describedby) {
      element.setAttribute('aria-describedby', describedby);
    }
  },

  /**
   * Set up ARIA for tab panels
   */
  setupTabs(tabList, tabPanels) {
    if (!tabList || !tabPanels.length) return;

    const tabListId = this.generateId('tablist');
    tabList.setAttribute('role', 'tablist');
    tabList.setAttribute('aria-labelledby', tabListId);

    const tabs = tabList.querySelectorAll('[role="tab"]');

    tabs.forEach((tab, index) => {
      const tabId = tab.getAttribute('id') || this.generateId('tab');
      const panelId = tabPanels[index]?.id || this.generateId('tabpanel');

      // Set tab properties
      tab.setAttribute('id', tabId);
      tab.setAttribute('aria-controls', panelId);
      tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
      tab.setAttribute('aria-setsize', tabs.length);
      tab.setAttribute('aria-posinset', index + 1);

      // Set panel properties
      if (tabPanels[index]) {
        tabPanels[index].setAttribute('role', 'tabpanel');
        tabPanels[index].setAttribute('id', panelId);
        tabPanels[index].setAttribute('aria-labelledby', tabId);
        tabPanels[index].setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
      }
    });
  },

  /**
   * Set up ARIA for data tables
   */
  setupDataTable(element, options = {}) {
    if (!element) return;

    const {
      sortable = true,
      filterable = true
    } = options;

    element.setAttribute('role', 'table');

    // Find and set up headers
    const headers = element.querySelectorAll('th');
    headers.forEach((header, index) => {
      header.setAttribute('role', 'columnheader');

      if (sortable && header.classList.contains('sortable')) {
        const sortId = this.generateId('sort');
        header.setAttribute('aria-describedby', `${sortId}-help`);

        // Add sort instructions
        if (!document.getElementById(`${sortId}-help`)) {
          const helpText = document.createElement('div');
          helpText.id = `${sortId}-help`;
          helpText.setAttribute('role', 'tooltip');
          helpText.className = 'sr-only';
          helpText.textContent = 'Press Enter or Space to sort column';
          document.body.appendChild(helpText);
        }
      }
    });

    // Set up data rows
    const rows = element.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.setAttribute('role', 'row');

      const cells = row.querySelectorAll('td, th');
      cells.forEach(cell => {
        cell.setAttribute('role', 'gridcell');
      });
    });
  },

  /**
   * Add ARIA properties for form validation
   */
  setupFormValidation(element, options = {}) {
    if (!element) return;

    const {
      live = true,
      showSummary = true
    } = options;

    // Add form role if not present
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'form');
    }

    // Create live region for validation messages
    if (live && !element.querySelector('[aria-live="polite"]')) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only form-validation-announcements';
      liveRegion.style.cssText = `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;`;
      element.appendChild(liveRegion);
    }

    // Setup required field indicators
    const requiredFields = element.querySelectorAll('[required], [aria-required="true"]');
    requiredFields.forEach(field => {
      field.setAttribute('aria-required', 'true');

      // Add asterisk or indicator if not present
      const label = document.querySelector(`label[for="${field.id}"]`) || field.closest('label');
      if (label && !label.querySelector('.required-indicator')) {
        const indicator = document.createElement('span');
        indicator.setAttribute('aria-hidden', 'true');
        indicator.className = 'required-indicator';
        indicator.textContent = ' *';
        indicator.style.color = 'red';
        label.appendChild(indicator);
      }
    });
  },

  /**
   * Add ARIA support for data tables with sorting and filtering
   */
  setupInteractiveTable(element, options = {}) {
    if (!element) return;

    const {
      sortable = true,
      filterable = true,
      pagination = true
    } = options;

    // Set up main table properties
    this.setupDataTable(element, { sortable, filterable });

    // Add keyboard navigation
    const tbody = element.querySelector('tbody');
    if (tbody) {
      tbody.setAttribute('role', 'rowgroup');

      const rows = tbody.querySelectorAll('tr');
      rows.forEach(row => {
        if (sortable || filterable) {
          this.makeFocusable(row);
          row.setAttribute('role', 'row');
        }
      });
    }

    // Set up pagination controls
    if (pagination) {
      const paginationControls = element.querySelectorAll('[aria-label*="Page"]');
      paginationControls.forEach(control => {
        if (!control.hasAttribute('aria-current')) {
          control.setAttribute('aria-label', control.textContent);
        }
      });
    }
  },

  /**
   * Update ARIA states dynamically
   */
  updateAriaState(element, state, value) {
    if (!element) return;

    const stateMap = {
      hidden: 'aria-hidden',
      disabled: 'aria-disabled',
      busy: 'aria-busy',
      invalid: 'aria-invalid',
      expanded: 'aria-expanded',
      selected: 'aria-selected',
      pressed: 'aria-pressed',
      checked: 'aria-checked'
    };

    if (stateMap[state]) {
      element.setAttribute(stateMap[state], value.toString());
    } else if (state.startsWith('set-')) {
      element.setAttribute(state, value.toString());
    }
  },

  /**
   * Remove all ARIA attributes from element
   */
  stripAria(element) {
    if (!element) return;

    const ariaAttributes = [
      'role', 'aria-live', 'aria-atomic', 'aria-relevant', 'aria-busy',
      'aria-controls', 'aria-owns', 'aria-activedescendant',
      'aria-labelledby', 'aria-describedby', 'aria-label',
      'aria-hidden', 'aria-disabled', 'aria-invalid',
      'aria-expanded', 'aria-selected', 'aria-pressed', 'aria-checked',
      'aria-current', 'aria-setsize', 'aria-posinset',
      'aria-sort', 'aria-keyshortcuts', 'aria-roledescription',
      'aria-required', 'aria-errormessage'
    ];

    ariaAttributes.forEach(attr => {
      element.removeAttribute(attr);
    });
  }
};

/**
 * Focus Management Utilities
 */
export const FocusManager = {
  /**
   * Trap focus within a container (for modals, dropdowns, etc.)
   */
  trapFocus(container) {
    if (!container) return null;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handler);

    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handler);
    };
  },

  /**
   * Restore focus to previous element
   */
  restoreFocus(previousElement) {
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  },

  /**
   * Get the currently focused element
   */
  getCurrentFocus() {
    return document.activeElement;
  },

  /**
   * Check if element is currently focused
   */
  hasFocus(element) {
    return document.activeElement === element;
  },

  /**
   * Set focus to element with appropriate announcement
   */
  focusAndAnnounce(element, announcement = '') {
    if (!element) return;

    element.focus();

    if (announcement || element.textContent) {
      const message = announcement || element.textContent.trim();
      announcer.announce(message);
    }
  }
};

/**
 * Create screen reader announcer instance
 */
export const announcer = new ScreenReaderAnnouncer();

/**
 * Accessibility Hook for React Components
 */
export const useAccessibility = () => {
  const announce = useCallback((message, options = {}) => {
    const {
      priority = 'polite',
      delay = 100,
      type = 'announcement'
    } = options;

    switch (type) {
      case 'error':
        announcer.announceError(message);
        break;
      case 'success':
        announcer.announceSuccess(message);
        break;
      case 'status':
        announcer.updateStatus(message, delay);
        break;
      case 'assertive':
        announcer.assert(message, delay);
        break;
      default:
        announcer.announce(message, delay);
    }
  }, []);

  const announceFormErrors = useCallback((formName, errors) => {
    announcer.announceFormErrors(formName, errors);
  }, []);

  const announceLoading = useCallback((message, complete = false) => {
    announcer.announceLoading(message, complete);
  }, []);

  return {
    announce,
    announceFormErrors,
    announceLoading,
    Aria: AriaUtils,
    Focus: FocusManager
  };
};

export default {
  announcer,
  Aria: AriaUtils,
  Focus: FocusManager,
  ScreenReaderAnnouncer,
  useAccessibility
};