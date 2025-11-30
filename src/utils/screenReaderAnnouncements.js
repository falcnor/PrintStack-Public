/**
 * Enhanced Screen Reader Announcement System
 * Provides comprehensive ARIA live regions and announcements for dynamic content
 */

import React from 'react';

/**
 * Screen Reader Announcer Class
 * Manages multiple live regions for different announcement types
 */
export class ScreenReaderAnnouncer {
  constructor() {
    this.liveRegions = new Map();
    this.announcementQueue = [];
    this.isProcessing = false;
    this.announcementHistory = [];
    this.maxHistorySize = 100;

    // Initialize standard live regions
    this.initializeLiveRegions();

    // Bind methods for cleanup
    this.announce = this.announce.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Initialize different types of live regions for optimal user experience
   */
  initializeLiveRegions() {
    if (typeof document === 'undefined') return;

    const regions = [
      {
        id: 'polite',
        politeness: 'polite',
        priority: 1,
        description: 'General announcements (non-interrupting)'
      },
      {
        id: 'assertive',
        politeness: 'assertive',
        priority: 2,
        description: 'Important announcements (may interrupt)'
      },
      {
        id: 'critical',
        politeness: 'assertive',
        priority: 3,
        description: 'Critical announcements (immediate)'
      },
      {
        id: 'status',
        politeness: 'polite',
        priority: 1,
        description: 'Status updates and progress'
      },
      {
        id: 'navigation',
        politeness: 'polite',
        priority: 0,
        description: 'Navigation and location changes'
      },
      {
        id: 'form',
        politeness: 'polite',
        priority: 2,
        description: 'Form validation and field updates'
      },
      {
        id: 'data',
        politeness: 'polite',
        priority: 1,
        description: 'Data loading and content updates'
      }
    ];

    regions.forEach(region => {
      this.createLiveRegion(region);
    });
  }

  /**
   * Create a single live region element
   */
  createLiveRegion(config) {
    const element = document.createElement('div');
    element.setAttribute('aria-live', config.politeness);
    element.setAttribute('aria-atomic', 'true');
    element.setAttribute('aria-relevant', 'additions text');
    element.className = `sr-only announcer-${config.id}`;
    element.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;

    document.body.appendChild(element);

    this.liveRegions.set(config.id, {
      element,
      config,
      lastAnnouncement: null,
      lastAnnouncementTime: 0,
      announcementCount: 0
    });

    return element;
  }

  /**
   * Make an announcement with automatic region selection
   */
  announce(message, options = {}) {
    const {
      region = 'polite',
      priority = null,
      timeout = 0,
      clearPrevious = false,
      unique = false,
      context = {},
      type = 'info'
    } = options;

    // Validate input
    if (!message || typeof message !== 'string') {
      console.warn('ScreenReaderAnnouncer: Invalid message provided');
      return;
    }

    // Check for unique constraint
    if (unique && this.wasRecentlyAnnounced(message)) {
      return;
    }

    // Create announcement object
    const announcement = {
      id: this.generateAnnouncementId(),
      message: this.sanitizeMessage(message),
      region,
      priority: priority !== null ? priority : this.getRegionPriority(region),
      timeout,
      clearPrevious,
      context,
      type,
      timestamp: Date.now(),
      retryCount: 0
    };

    // Add to queue
    this.announcementQueue.push(announcement);

    // Process queue
    if (!this.isProcessing) {
      this.processAnnouncementQueue();
    }
  }

  /**
   * Process the announcement queue with priority order
   */
  async processAnnouncementQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.announcementQueue.length > 0) {
      // Sort by priority (higher first)
      this.announcementQueue.sort((a, b) => b.priority - a.priority);

      const announcement = this.announcementQueue.shift();

      try {
        await this.deliverAnnouncement(announcement);

        // Add to history
        this.addToHistory(announcement);

        // Respect minimum delay between announcements
        await this.delay(100);

      } catch (error) {
        console.error('Announcement delivery failed:', error);

        // Retry failed announcements (max 3 times)
        if (announcement.retryCount < 3) {
          announcement.retryCount++;
          announcement.timeout = Math.min(announcement.timeout + 1000, 3000);
          this.announcementQueue.push(announcement);
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Deliver a single announcement to its region
   */
  async deliverAnnouncement(announcement) {
    const region = this.liveRegions.get(announcement.region);

    if (!region) {
      console.warn(`Announcement region "${announcement.region}" not found`);
      return;
    }

    // Apply timeout if specified
    if (announcement.timeout > 0) {
      await this.delay(announcement.timeout);
    }

    // Clear previous announcement if requested
    if (announcement.clearPrevious) {
      region.element.textContent = '';
    }

    // Set the announcement
    region.element.textContent = announcement.message;

    // Update region metadata
    region.lastAnnouncement = announcement.message;
    region.lastAnnouncementTime = Date.now();
    region.announcementCount++;

    // Trigger browser attention if critical
    if (announcement.region === 'critical') {
      this.triggerAttention();
    }
  }

  /**
   * Specialized announcement methods for common use cases
   */

  // Data updates
  announceDataLoad(context, count, action = 'loaded') {
    const message = this.formatDataMessage(context, count, action);
    this.announce(message, {
      region: 'data',
      type: 'data',
      context: { action, count, ...context }
    });
  }

  formatDataMessage(context, count, action) {
    const contextMap = {
      'filaments': 'filament',
      'models': 'model',
      'prints': 'print',
      'projects': 'project'
    };

    const item = contextMap[context] || 'item';
    const plural = count === 1 ? item : `${item}s`;

    if (action === 'loaded') {
      return `${count} ${plural} loaded`;
    } else if (action === 'added') {
      return `New ${item} added. Total: ${count}`;
    } else if (action === 'updated') {
      return `${item} updated successfully`;
    } else if (action === 'deleted') {
      return `${item} deleted. ${count} remaining`;
    } else if (action === 'error') {
      return `Failed to ${action} ${item}`;
    }

    return `${count} ${plural} ${action}`;
  }

  // Form validation
  announceFormError(fieldName, errorMessage, totalCount = 1) {
    const message = totalCount === 1
      ? `Form error in ${fieldName}: ${errorMessage}`
      : `${totalCount} form errors detected, including ${fieldName}: ${errorMessage}`;

    this.announce(message, {
      region: 'form',
      priority: 2,
      type: 'error',
      context: { fieldName, errorMessage, totalCount }
    });
  }

  announceFormSuccess(message) {
    this.announce(message || 'Form submitted successfully', {
      region: 'form',
      type: 'success'
    });
  }

  // Navigation
  announceNavigation(page, item = null) {
    let message = `Navigated to ${page}`;
    if (item) {
      message += `, ${item}`;
    }

    this.announce(message, {
      region: 'navigation',
      unique: true,
      type: 'navigation'
    });
  }

  // Status updates
  announceStatus(message, priority = 1) {
    this.announce(message, {
      region: 'status',
      priority,
      type: 'status'
    });
  }

  announceProgress(step, total, description) {
    const percentage = Math.round((step / total) * 100);
    const message = `${description || 'Progress'}: ${step} of ${total} complete, ${percentage}%`;

    this.announce(message, {
      region: 'status',
      type: 'progress',
      context: { step, total, percentage },
      unique: true,
      // Only announce significant progress changes
      timeout: percentage % 10 === 0 ? 0 : 500
    });
  }

  // Error handling
  announceError(error, context = null) {
    const message = context
      ? `Error in ${context}: ${error}`
      : `Error: ${error}`;

    this.announce(message, {
      region: 'assertive',
      priority: 3,
      type: 'error',
      context: { error, context }
    });
  }

  // Success messages
  announceSuccess(message, context = null) {
    const fullMessage = context
      ? `${context}: ${message}`
      : message;

    this.announce(fullMessage, {
      region: 'polite',
      type: 'success',
      context: { message, context }
    });
  }

  // Critical announcements
  announceCritical(message) {
    this.announce(message, {
      region: 'critical',
      priority: 3,
      type: 'critical'
    });
  }

  /**
   * State change announcements for React components
   */
  announceStateChange(componentName, stateName, previousValue, newValue) {
    const message = `${componentName} ${stateName} changed from ${previousValue} to ${newValue}`;

    this.announce(message, {
      region: 'polite',
      type: 'state_change',
      context: { componentName, stateName, previousValue, newValue },
      unique: true
    });
  }

  /**
   * List changes for dynamic content
   */
  announceListChange(listName, action, itemIndex, itemName = null) {
    const actionMap = {
      'add': 'added to',
      'remove': 'removed from',
      'update': 'updated in',
      'move': 'moved in'
    };

    const verb = actionMap[action] || action;
    const message = itemName
      ? `${itemName} ${verb} ${listName} at position ${itemIndex + 1}`
      : `Item ${verb} ${listName} at position ${itemIndex + 1}`;

    this.announce(message, {
      region: 'data',
      type: 'list_change',
      context: { listName, action, itemIndex, itemName }
    });
  }

  // Multi-item operations
  announceBulkAction(action, itemType, count) {
    const messages = {
      'delete': `${count} ${itemType}s deleted`,
      'add': `${count} ${itemType}s added`,
      'update': `${count} ${itemType}s updated`,
      'select': `${count} ${itemType}s selected`,
      'import': `${count} ${itemType}s imported`,
      'export': `${count} ${itemType}s exported`
    };

    const message = messages[action] || `${count} ${itemType}s ${action}d`;

    this.announce(message, {
      region: 'data',
      priority: 2,
      type: 'bulk_action',
      context: { action, itemType, count }
    });
  }

  /**
   * Utility methods
   */
  sanitizeMessage(message) {
    // Remove HTML tags
    const clean = message.replace(/<[^>]*>/g, '');
    // Normalize whitespace
    return clean.replace(/\s+/g, ' ').trim();
  }

  generateAnnouncementId() {
    return `announce_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getRegionPriority(regionId) {
    const region = this.liveRegions.get(regionId);
    return region ? region.config.priority : 1;
  }

  wasRecentlyAnnounced(message, timeWindow = 5000) {
    const now = Date.now();
    return this.announcementHistory.some(announcement =>
      announcement.message === message &&
      (now - announcement.timestamp) < timeWindow
    );
  }

  addToHistory(announcement) {
    this.announcementHistory.push({
      message: announcement.message,
      timestamp: announcement.timestamp,
      region: announcement.region,
      type: announcement.type
    });

    // Trim history
    if (this.announcementHistory.length > this.maxHistorySize) {
      this.announcementHistory = this.announcementHistory.slice(-this.maxHistorySize);
    }
  }

  triggerAttention() {
    // Flash the screen or provide visual indication for critical announcements
    if (typeof document !== 'undefined') {
      document.body.style.outline = '3px solid #ff0000';
      document.body.style.outlineOffset = '-3px';

      setTimeout(() => {
        document.body.style.outline = '';
        document.body.style.outlineOffset = '';
      }, 200);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Management methods
   */
  clearRegion(regionId = 'all') {
    if (regionId === 'all') {
      this.liveRegions.forEach(region => {
        region.element.textContent = '';
        region.lastAnnouncement = null;
      });
    } else {
      const region = this.liveRegions.get(regionId);
      if (region) {
        region.element.textContent = '';
        region.lastAnnouncement = null;
      }
    }
  }

  getAnnouncementHistory(limit = 20) {
    return this.announcementHistory.slice(-limit);
  }

  getRegionStats() {
    const stats = {};
    this.liveRegions.forEach((region, id) => {
      stats[id] = {
        announcementCount: region.announcementCount,
        lastAnnouncement: region.lastAnnouncement,
        lastAnnouncementTime: region.lastAnnouncementTime,
        config: region.config
      };
    });
    return stats;
  }

  enableLiveRegionLogging(enabled = true) {
    this.liveRegions.forEach((region, id) => {
      if (enabled) {
        // Log announcements for debugging
        element.addEventListener('DOMSubtreeModified', (e) => {
          console.log(`[${id.toUpperCase()}]`, e.target.textContent);
        });
      }
    });
  }

  cleanup() {
    if (typeof document !== 'undefined') {
      this.liveRegions.forEach(region => {
        document.body.removeChild(region.element);
      });
    }
    this.liveRegions.clear();
    this.announcementQueue = [];
    this.announcementHistory = [];
  }
}

/**
 * React Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const announcer = React.useMemo(() => new ScreenReaderAnnouncer(), []);

  React.useEffect(() => {
    return () => {
      announcer.cleanup();
    };
  }, [announcer]);

  return announcer;
};

/**
 * Global announcer instance
 */
export const globalAnnouncer =
  typeof document !== 'undefined'
    ? new ScreenReaderAnnouncer()
    : null;

/**
 * Convenience functions for common announcements
 */
export const announce = (message, options) => {
  if (globalAnnouncer) {
    globalAnnouncer.announce(message, options);
  }
};

export const announceDataLoad = (context, count, action) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceDataLoad(context, count, action);
  }
};

export const announceFormError = (fieldName, errorMessage, totalCount) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceFormError(fieldName, errorMessage, totalCount);
  }
};

export const announceNavigation = (page, item) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceNavigation(page, item);
  }
};

export const announceStatus = (message, priority) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceStatus(message, priority);
  }
};

export const announceError = (error, context) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceError(error, context);
  }
};

export const announceSuccess = (message, context) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceSuccess(message, context);
  }
};

export const announceCritical = (message) => {
  if (globalAnnouncer) {
    globalAnnouncer.announceCritical(message);
  }
};

export default {
  ScreenReaderAnnouncer,
  useScreenReader,
  globalAnnouncer,
  announce,
  announceDataLoad,
  announceFormError,
  announceNavigation,
  announceStatus,
  announceError,
  announceSuccess,
  announceCritical
};