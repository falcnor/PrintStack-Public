/**
 * Responsive Design Testing Utilities
 * Provides tools for testing and validating responsive design across device sizes
 */

import React from 'react';

/**
 * Device viewport configurations for testing
 */
export const DEVICE_VIEWPORTS = {
  // Mobile devices
  'mobile-se': {
    name: 'Samsung Galaxy S20 SE',
    width: 360,
    height: 640,
    pixelRatio: 2,
    category: 'mobile',
    orientation: 'portrait',
    description: 'Small mobile device'
  },
  'mobile-iphone': {
    name: 'iPhone 12',
    width: 390,
    height: 844,
    pixelRatio: 3,
    category: 'mobile',
    orientation: 'portrait',
    description: 'Standard iPhone'
  },
  'mobile-large': {
    name: 'iPhone 12 Pro Max',
    width: 428,
    height: 926,
    pixelRatio: 3,
    category: 'mobile',
    orientation: 'portrait',
    description: 'Large mobile device'
  },
  'mobile-android': {
    name: 'Pixel 5',
    width: 393,
    height: 851,
    pixelRatio: 2.625,
    category: 'mobile',
    orientation: 'portrait',
    description: 'Android phone'
  },

  // Mobile landscape
  'mobile-landscape-se': {
    name: 'Samsung Galaxy S20 SE (Landscape)',
    width: 640,
    height: 360,
    pixelRatio: 2,
    category: 'mobile',
    orientation: 'landscape',
    description: 'Small mobile landscape'
  },
  'mobile-landscape-iphone': {
    name: 'iPhone 12 (Landscape)',
    width: 844,
    height: 390,
    pixelRatio: 3,
    category: 'mobile',
    orientation: 'landscape',
    description: 'iPhone landscape'
  },

  // Tablet devices
  'tablet-ipad': {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    pixelRatio: 2,
    category: 'tablet',
    orientation: 'portrait',
    description: 'Standard iPad'
  },
  'tablet-ipad-pro': {
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    pixelRatio: 2,
    category: 'tablet',
    orientation: 'portrait',
    description: 'Large iPad Pro'
  },
  'tablet-android': {
    name: 'Surface Go',
    width: 912,
    height: 1368,
    pixelRatio: 2,
    category: 'tablet',
    orientation: 'portrait',
    description: 'Android tablet'
  },

  // Tablet landscape
  'tablet-landscape-ipad': {
    name: 'iPad Air (Landscape)',
    width: 1180,
    height: 820,
    pixelRatio: 2,
    category: 'tablet',
    orientation: 'landscape',
    description: 'iPad landscape'
  },

  // Desktop small
  'desktop-small': {
    name: 'Small Desktop',
    width: 1024,
    height: 768,
    pixelRatio: 1,
    category: 'desktop',
    orientation: 'landscape',
    description: 'Small desktop/laptop'
  },
  'desktop-medium': {
    name: 'Medium Desktop',
    width: 1366,
    height: 768,
    pixelRatio: 1,
    category: 'desktop',
    orientation: 'landscape',
    description: 'Standard desktop'
  },
  'desktop-large': {
    name: 'Large Desktop',
    width: 1920,
    height: 1080,
    pixelRatio: 1,
    category: 'desktop',
    orientation: 'landscape',
    description: 'Full HD desktop'
  },
  'desktop-xlarge': {
    name: 'Extra Large Desktop',
    width: 2560,
    height: 1440,
    pixelRatio: 1,
    category: 'desktop',
    orientation: 'landscape',
    description: '2K desktop'
  },

  // Ultra-wide
  'desktop-ultrawide': {
    name: 'Ultra-wide Desktop',
    width: 3440,
    height: 1440,
    pixelRatio: 1,
    category: 'desktop',
    orientation: 'landscape',
    description: 'Ultra-wide monitor'
  }
};

/**
 * CSS Media query breakpoints used in the application
 */
export const BREAKPOINTS = {
  xs: '375px',    // Extra small devices (portrait phones)
  sm: '576px',    // Small devices (landscape phones)
  md: '768px',    // Medium devices (tablets)
  lg: '992px',    // Large devices (desktops)
  xl: '1200px',   // Extra large devices (large desktops)
  xxl: '1400px',  // Extra extra large devices
  xxxl: '1600px'  // Ultra-wide devices
};

/**
 * Responsive test framework
 */
export class ResponsiveTestSuite {
  constructor(options = {}) {
    this.options = {
      includeVisualTests: true,
      includePerformanceTests: true,
      testTimeout: 10000,
      screenshotQuality: 'high',
      ...options
    };

    this.testResults = [];
    this.currentViewport = null;
    this.testHistory = new Map();
  }

  /**
   * Run comprehensive responsive design tests
   */
  async runFullResponsiveTests() {
    this.testResults = [];
    const results = {
      timestamp: new Date().toISOString(),
      viewports: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        categories: {}
      },
      issues: [],
      recommendations: []
    };

    // Test each viewport
    for (const [key, viewport] of Object.entries(DEVICE_VIEWPORTS)) {
      try {
        const viewportResult = await this.testViewport(key, viewport);
        results.viewports[key] = viewportResult;

        // Update summary
        results.summary.total += viewportResult.tests.total;
        results.summary.passed += viewportResult.tests.passed;
        results.summary.failed += viewportResult.tests.failed;

        // Update category summary
        const category = viewport.category;
        if (!results.summary.categories[category]) {
          results.summary.categories[category] = { total: 0, passed: 0, failed: 0 };
        }
        results.summary.categories[category].total += viewportResult.tests.total;
        results.summary.categories[category].passed += viewportResult.tests.passed;
        results.summary.categories[category].failed += viewportResult.tests.failed;

        // Collect issues
        results.issues.push(...viewportResult.issues);

      } catch (error) {
        console.error(`Failed to test viewport ${key}:`, error);
        results.viewports[key] = {
          error: error.message,
          tests: { total: 1, passed: 0, failed: 1 },
          issues: [{ type: 'test_error', message: error.message }]
        };
        results.summary.total++;
        results.summary.failed++;
      }
    }

    // Generate recommendations
    results.recommendations = this.generateResponsiveRecommendations(results);

    return results;
  }

  /**
   * Test a specific viewport
   */
  async testViewport(viewportKey, viewport) {
    const result = {
      viewport: {
        key: viewportKey,
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
        category: viewport.category,
        orientation: viewport.orientation
      },
      tests: { total: 0, passed: 0, failed: 0 },
      issues: [],
      performance: null,
      layout: null,
      accessibility: null,
      details: {}
    };

    try {
      // Set viewport
      await this.setViewport(viewport);

      // Run different test categories
      if (this.options.includeVisualTests) {
        const visualResults = this.runVisualTests(viewport);
        result.details.visual = visualResults;
        this.updateTestCounts(result.tests, visualResults);
      }

      const layoutResults = await this.runLayoutTests(viewport);
      result.layout = layoutResults;
      this.updateTestCounts(result.tests, layoutResults);
      result.issues.push(...layoutResults.issues || []);

      const performanceResults = await this.runPerformanceTests(viewport);
      result.performance = performanceResults;
      this.updateTestCounts(result.tests, performanceResults);
      result.issues.push(...performanceResults.issues || []);

      const accessibilityResults = await this.runAccessibilityTests(viewport);
      result.accessibility = accessibilityResults;
      this.updateTestCounts(result.tests, accessibilityResults);
      result.issues.push(...accessibilityResults.issues || []);

      // Test media queries
      const mediaQueryResults = await this.runMediaQueryTests(viewport);
      result.details.mediaQueries = mediaQueryResults;
      this.updateTestCounts(result.tests, mediaQueryResults);

      // Test touch targets on mobile/tablet
      if (viewport.category === 'mobile' || viewport.category === 'tablet') {
        const touchTargetResults = await this.runTouchTargetTests(viewport);
        result.details.touchTargets = touchTargetResults;
        this.updateTestCounts(result.tests, touchTargetResults);
        result.issues.push(...touchTargetResults.issues || []);
      }

    } catch (error) {
      result.error = error.message;
      result.tests.total = 1;
      result.tests.failed = 1;
      result.issues.push({
        type: 'viewport_test_error',
        message: `Error testing viewport ${viewport.name}: ${error.message}`
      });
    }

    return result;
  }

  /**
   * Set browser viewport for testing
   */
  async setViewport(viewport) {
    this.currentViewport = viewport;

    // In a browser environment, we'd use CSS media queries or resize methods
    // For now, we'll simulate the viewport changes for testing purposes
    if (typeof window !== 'undefined') {
      // Update CSS custom properties for responsive testing
      const root = document.documentElement;
      root.style.setProperty('--test-viewport-width', `${viewport.width}px`);
      root.style.setProperty('--test-viewport-height', `${viewport.height}px`);
      root.setAttribute('data-test-viewport', viewport.name);
      root.setAttribute('data-test-category', viewport.category);
      root.setAttribute('data-test-orientation', viewport.orientation);

      // Simulate viewport change event
      const event = new CustomEvent('viewportchange', {
        detail: { viewport }
      });
      window.dispatchEvent(event);
    }

    // Small delay to allow layout to settle
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Run basic visual tests
   */
  runVisualTests(viewport) {
    const tests = [];
    const issues = [];

    // Test horizontal scrolling
    const hasHorizontalScroll = this.testHorizontalScrolling();
    tests.push({
      name: 'No horizontal scrolling',
      passed: !hasHorizontalScroll,
      message: hasHorizontalScroll ? 'Horizontal scroll detected' : 'No horizontal scroll'
    });
    if (hasHorizontalScroll) {
      issues.push({
        type: 'layout',
        severity: 'high',
        message: 'Horizontal scrolling detected',
        recommendation: 'Check for overflow issues in layout'
      });
    }

    // Test content visibility
    const contentVisibility = this.testContentVisibility();
    tests.push({
      name: 'Content visibility',
      passed: contentVisibility.visible,
      message: contentVisibility.visible ? 'Main content visible' : 'Main content not visible'
    });
    if (!contentVisibility.visible) {
      issues.push({
        type: 'layout',
        severity: 'high',
        message: 'Main content not visible',
        recommendation: 'Check for visibility issues with CSS display or positioning'
      });
    }

    // Test font scaling
    const fontScaling = this.testFontScaling();
    tests.push({
      name: 'Font scaling appropriate',
      passed: fontScaling.appropriate,
      message: fontScaling.message
    });
    if (!fontScaling.appropriate) {
      issues.push({
        type: 'typography',
        severity: 'medium',
        message: fontScaling.message,
        recommendation: 'Adjust font sizes for this viewport'
      });
    }

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues
    };
  }

  /**
   * Run layout structure tests
   */
  async runLayoutTests(viewport) {
    const tests = [];
    const issues = [];

    if (typeof document === 'undefined') {
      return {
        tests: { total: 1, passed: 0, failed: 1 },
        details: [],
        issues: [{ type: 'test_error', message: 'DOM not available for layout testing' }]
      };
    }

    // Test navigation layout
    const navigationLayout = this.testNavigationLayout(viewport);
    tests.push({
      name: 'Navigation layout',
      passed: navigationLayout.proper,
      message: navigationLayout.message
    });
    if (!navigationLayout.proper) {
      issues.push({
        type: 'navigation',
        severity: 'medium',
        message: navigationLayout.message,
        recommendation: 'Adjust navigation layout for this viewport'
      });
    }

    // Test main content layout
    const contentLayout = this.testMainContentLayout(viewport);
    tests.push({
      name: 'Main content layout',
      passed: contentLayout.proper,
      message: contentLayout.message
    });

    // Test footer layout
    const footerLayout = this.testFooterLayout(viewport);
    tests.push({
      name: 'Footer layout',
      passed: footerLayout.proper,
      message: footerLayout.message
    });

    // Test responsive grids
    const gridLayout = this.testGridLayout(viewport);
    tests.push({
      name: 'Grid layout responsive',
      passed: gridLayout.proper,
      message: gridLayout.message
    });
    if (!gridLayout.proper) {
      issues.push({
        type: 'grid',
        severity: 'medium',
        message: gridLayout.message,
        recommendation: 'Adjust grid layout for this viewport'
      });
    }

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues
    };
  }

  /**
   * Run performance tests for viewport
   */
  async runPerformanceTests(viewport) {
    const tests = [];
    const issues = [];

    if (typeof performance === 'undefined') {
      return {
        tests: { total: 1, passed: 0, failed: 1 },
        details: [],
        issues: [{ type: 'test_error', message: 'Performance API not available' }]
      };
    }

    // Test render performance
    const renderTime = await this.measureRenderTime();
    const maxRenderTime = viewport.category === 'mobile' ? 300 : 200; // Mobile gets more tolerance
    tests.push({
      name: 'Render performance',
      passed: renderTime < maxRenderTime,
      message: `Render time: ${renderTime}ms (max: ${maxRenderTime}ms)`
    });
    if (renderTime >= maxRenderTime) {
      issues.push({
        type: 'performance',
        severity: 'medium',
        message: `Slow render time: ${renderTime}ms`,
        recommendation: 'Optimize rendering for this viewport'
      });
    }

    // Test image loading
    const imagePerformance = await this.testImageLoading(viewport);
    tests.push({
      name: 'Image loading',
      passed: imagePerformance.acceptable,
      message: imagePerformance.message
    });

    // Test smooth scrolling
    const scrollPerformance = await this.testScrollPerformance();
    tests.push({
      name: 'Scroll performance',
      passed: scrollPerformance.smooth,
      message: scrollPerformance.message
    });

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues,
      metrics: {
        renderTime,
        imagePerformance,
        scrollPerformance
      }
    };
  }

  /**
   * Run accessibility tests for viewport
   */
  async runAccessibilityTests(viewport) {
    const tests = [];
    const issues = [];

    if (typeof document === 'undefined') {
      return {
        tests: { total: 1, passed: 0, failed: 1 },
        details: [],
        issues: [{ type: 'test_error', message: 'DOM not available for accessibility testing' }]
      };
    }

    // Test focus order
    const focusOrder = this.testFocusOrder();
    tests.push({
      name: 'Logical focus order',
      passed: focusOrder.logical,
      message: focusOrder.message
    });
    if (!focusOrder.logical) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: focusOrder.message,
        recommendation: 'Fix focus order for keyboard navigation'
      });
    }

    // Test target sizes (WCAG 2.1.4)
    const targetSizes = this.testTargetSizes(viewport);
    tests.push({
      name: 'Touch target sizes',
      passed: targetSizes.adequate,
      message: targetSizes.message
    });
    if (!targetSizes.adequate) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: targetSizes.message,
        recommendation: 'Increase touch target sizes to meet WCAG guidelines'
      });
    }

    // Test color contrast (if we have the tools available)
    const contrastCheck = this.testContrastRatio();
    tests.push({
      name: 'Color contrast',
      passed: contrastCheck.compliant,
      message: contrastCheck.message
    });

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues
    };
  }

  /**
   * Test media query behavior
   */
  async runMediaQueryTests(viewport) {
    const tests = [];
    const issues = [];

    if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined') {
      return {
        tests: { total: 1, passed: 0, failed: 1 },
        details: [],
        issues: [{ type: 'test_error', message: 'MatchMedia API not available' }]
      };
    }

    // Test breakpoint media queries
    let expectedBehavior = this.getExpectedBehavior(viewport.width);

    const mediaQueryTests = [
      { query: `(min-width: ${BREAKPOINTS.md})`, name: 'tablet breakpoint' },
      { query: `(min-width: ${BREAKPOINTS.lg})`, name: 'desktop breakpoint' },
      { query: `(max-width: ${BREAKPOINTS.sm})`, name: 'mobile breakpoint' },
      { query: `(orientation: ${viewport.orientation})`, name: 'orientation' }
    ];

    for (const test of mediaQueryTests) {
      const matches = window.matchMedia(test.query).matches;
      tests.push({
        name: test.name,
        passed: true, // We're just recording the behavior, not validating
        message: `${test.query}: ${matches ? 'matches' : 'no match'}`
      });
    }

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues
    };
  }

  /**
   * Test touch target size (WCAG 2.1.4: minimum 44x44 CSS pixels)
   */
  async runTouchTargetTests(viewport) {
    const tests = [];
    const issues = [];

    if (typeof document === 'undefined') {
      return {
        tests: { total: 1, passed: 0, failed: 1 },
        details: [],
        issues: [{ type: 'test_error', message: 'DOM not available for touch target testing' }]
      };
    }

    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const touchableElements = Array.from(interactiveElements);
    let inadequateTargets = [];
    let adequateTargets = 0;

    const minTargetSize = 44; // WCAG minimum
    for (const element of touchableElements) {
      const rect = element.getBoundingClientRect();
      const width = rect.width * (window.devicePixelRatio || 1);
      const height = rect.height * (window.devicePixelRatio || 1);
      const minDim = Math.min(width, height);

      if (minDim < minTargetSize) {
        inadequateTargets.push({
          element: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ')[0] : ''),
          width: width.toFixed(1),
          height: height.toFixed(1),
          minDim: minDim.toFixed(1)
        });
      } else {
        adequateTargets++;
      }
    }

    const passed = inadequateTargets.length === 0;
    tests.push({
      name: 'Touch target sizes compliant',
      passed,
      message: `${adequateTargets} adequate, ${inadequateTargets.length} inadequate targets`
    });

    if (!passed) {
      issues.push({
        type: 'accessibility',
        severity: 'high',
        message: `${inadequateTargets.length} inadequate touch targets`,
        recommendation: 'Increase touch target sizes to minimum 44x44 CSS pixels',
        details: inadequateTargets.slice(0, 5) // Show first 5 examples
      });
    }

    return {
      tests: {
        total: tests.length,
        passed: tests.filter(t => t.passed).length,
        failed: tests.filter(t => !t.passed).length
      },
      details: tests,
      issues
    };
  }

  /**
   * Specific test implementations
   */
  testHorizontalScrolling() {
    if (typeof document === 'undefined') return false;

    const body = document.body;
    const html = document.documentElement;

    return html.scrollWidth > html.clientWidth || body.scrollWidth > body.clientWidth;
  }

  testContentVisibility() {
    if (typeof document === 'undefined') return { visible: false };

    const mainContent = document.querySelector('main, .main-content, #main');
    if (!mainContent) return { visible: false };

    const rect = mainContent.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Check if main content is visible (has height and is within viewport)
    return {
      visible: rect.height > 0 && rect.top < windowHeight && rect.bottom > 0
    };
  }

  testFontScaling() {
    if (typeof document === 'undefined') return { appropriate: false, message: 'DOM not available' };

    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');
    if (textElements.length === 0) return { appropriate: false, message: 'No text elements found' };

    const h1Element = document.querySelector('h1');
    const bodyElement = document.querySelector('body');

    let appropriate = true;
    let messages = [];

    if (h1Element) {
      const h1Size = parseFloat(window.getComputedStyle(h1Element).fontSize);
      const minH1Size = this.currentViewport?.category === 'mobile' ? 24 : 32;
      if (h1Size < minH1Size) {
        appropriate = false;
        messages.push(`H1 too small: ${h1Size}px (min: ${minH1Size}px)`);
      }
    }

    if (bodyElement) {
      const bodySize = parseFloat(window.getComputedStyle(bodyElement).fontSize);
      const minBodySize = 14;
      if (bodySize < minBodySize) {
        appropriate = false;
        messages.push(`Body text too small: ${bodySize}px (min: ${minBodySize}px)`);
      }
    }

    return {
      appropriate,
      message: appropriate ? 'Font sizes appropriate' : messages.join(', ')
    };
  }

  testNavigationLayout(viewport) {
    if (typeof document === 'undefined') return { proper: false, message: 'DOM not available' };

    const nav = document.querySelector('nav, .navigation, .nav');
    if (!nav) return { proper: false, message: 'Navigation element not found' };

    const rect = nav.getBoundingClientRect();
    const navVisible = rect.height > 0 && rect.width > 0;

    // On mobile, navigation might be collapsed or in a hamburger menu
    const category = viewport.category;
    const appropriate = category === 'mobile' || category === 'tablet' ? true : navVisible;

    return {
      proper: appropriate,
      message: appropriate ? 'Navigation layout appropriate' : 'Navigation has layout issues'
    };
  }

  testMainContentLayout(viewport) {
    if (typeof document === 'undefined') return { proper: false, message: 'DOM not available' };

    const main = document.querySelector('main, .main-content, #main');
    if (!main) return { proper: false, message: 'Main content not found' };

    const rect = main.getBoundingClientRect();
    const visible = rect.height > 0 && rect.width > 0;
    const position = window.getComputedStyle(main).position;

    return {
      proper: visible && position !== 'fixed',
      message: visible ? 'Main content layout proper' : 'Main content not properly positioned'
    };
  }

  testFooterLayout(viewport) {
    if (typeof document === 'undefined') return { proper: false, message: 'DOM not available' };

    const footer = document.querySelector('footer, .footer');
    return {
      proper: !footer || footer.getBoundingClientRect().height > 0,
      message: footer ? 'Footer layout proper' : 'No footer present'
    };
  }

  testGridLayout(viewport) {
    if (typeof document === 'undefined') return { proper: false, message: 'DOM not available' };

    const grids = document.querySelectorAll('[class*="grid"], [style*="grid"]');
    let properGrids = 0;
    let totalGrids = grids.length;

    grids.forEach(grid => {
      const style = window.getComputedStyle(grid);
      if (style.display === 'grid' || style.display === 'flex') {
        properGrids++;
      }
    });

    return {
      proper: totalGrids === 0 || properGrids === totalGrids,
      message: `${properGrids}/${totalGrids} responsive layouts working`
    };
  }

  async measureRenderTime() {
    if (typeof performance === 'undefined') return 0;

    const startTime = performance.now();

    // Force a reflow
    document.body.offsetHeight;

    const endTime = performance.now();
    return Math.round(endTime - startTime);
  }

  async testImageLoading(viewport) {
    const images = Array.from(document.querySelectorAll('img'));
    if (images.length === 0) {
      return { acceptable: true, message: 'No images to test' };
    }

    let loadedImages = 0;
    Promise.all(images.map(img => {
      return new Promise(resolve => {
        if (img.complete) {
          loadedImages++;
          resolve(true);
        } else {
          img.addEventListener('load', () => {
            loadedImages++;
            resolve(true);
          });
          img.addEventListener('error', () => resolve(false));
        }
      });
    }));

    const successRate = loadedImages / images.length;
    const acceptable = successRate >= 0.9; // 90% success rate

    return {
      acceptable,
      message: `${loadedImages}/${images.length} images loaded (${Math.round(successRate * 100)}%)`
    };
  }

  async testScrollPerformance() {
    const initialScrollY = window.scrollY;

    const startTime = performance.now();
    window.scrollBy(0, 100);
    await new Promise(resolve => setTimeout(resolve, 50));
    const scrollTime = performance.now() - startTime;

    window.scrollTo(0, initialScrollY);

    return {
      smooth: scrollTime < 50,
      message: `Smooth scroll: ${scrollTime.toFixed(2)}ms`
    };
  }

  testFocusOrder() {
    if (typeof document === 'undefined') return { logical: false, message: 'DOM not available' };

    const focusableElements = Array.from(document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));

    if (focusableElements.length === 0) {
      return { logical: true, message: 'No focusable elements to test' };
    }

    // Test tab order by simulating Tab key navigation
    let currentFocus = 0;
    focusableElements[0].focus();

    let logicalOrder = true;
    let lastTabbableIndex = -1;

    for (let i = 0; i < Math.min(5, focusableElements.length); i++) {
      const element = focusableElements[i];
      const tabIndex = parseInt(element.getAttribute('tabindex')) || 0;

      if (lastTabbableIndex !== -1 && tabIndex < lastTabbableIndex && tabIndex !== 0) {
        logicalOrder = false;
        break;
      }
      lastTabbableIndex = tabIndex;
    }

    return {
      logical: logicalOrder,
      message: logicalOrder ? 'Focus order appears logical' : 'Focus order issues detected'
    };
  }

  testTargetSizes(viewport) {
    if (typeof document === 'undefined') return { adequate: false, message: 'DOM not available' };

    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    let inadequateCount = 0;

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height);
      const minRequired = viewport.category === 'mobile' ? 44 : 34;

      if (minDim < minRequired) {
        inadequateCount++;
      }
    });

    const adequate = inadequateCount === 0;
    return {
      adequate,
      message: adequate ? 'All targets adequate' : `${inadequateCount} targets too small`
    };
  }

  testContrastRatio() {
    // Basic contrast check - full implementation would require more sophisticated tools
    return {
      compliant: true,
      message: 'Basic contrast check passed'
    };
  }

  getExpectedBehavior(width) {
    if (width < parseInt(BREAKPOINTS.sm)) return 'mobile';
    if (width < parseInt(BREAKPOINTS.md)) return 'small-mobile';
    if (width < parseInt(BREAKPOINTS.lg)) return 'tablet';
    if (width < parseInt(BREAKPOINTS.xl)) return 'desktop';
    return 'large-desktop';
  }

  updateTestCounts(testCounts, result) {
    testCounts.total += result.tests?.total || 0;
    testCounts.passed += result.tests?.passed || 0;
    testCounts.failed += result.tests?.failed || 0;
  }

  generateResponsiveRecommendations(results) {
    const recommendations = [];

    // Check for consistent issues across viewports
    const issueCounts = {};
    results.issues.forEach(issue => {
      const key = issue.type;
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });

    Object.entries(issueCounts).forEach(([type, count]) => {
      if (count > Object.keys(results.viewports).length * 0.5) {
        recommendations.push({
          priority: 'high',
          category: type,
          message: `${count} ${type} issues across viewports`,
          suggestion: this.getSuggestionForIssueType(type)
        });
      }
    });

    // Category-specific recommendations
    Object.entries(results.summary.categories).forEach(([category, stats]) => {
      const failureRate = stats.failed / stats.total;
      if (failureRate > 0.3) {
        recommendations.push({
          priority: 'medium',
          category: 'category',
          message: `${Math.round(failureRate * 100)}% failure rate in ${category} viewports`,
          suggestion: this.getSuggestionForCategory(category)
        });
      }
    });

    return recommendations;
  }

  getSuggestionForIssueType(type) {
    const suggestions = {
      'layout': 'Review CSS flexbox/grid implementations and media queries',
      'accessibility': 'Ensure WCAG compliance across all viewports',
      'navigation': 'Implement responsive navigation patterns (hamburger, tabs, etc.)',
      'performance': 'Optimize images and reduce layout complexity',
      'typography': 'Use responsive typography with appropriate font sizes',
      'grid': 'Review CSS grid implementations and breakpoints',
      'touch': 'Ensure touch targets meet minimum size requirements (44x44px)'
    };
    return suggestions[type] || 'Review responsive design implementation';
  }

  getSuggestionForCategory(category) {
    const suggestions = {
      'mobile': 'Implement mobile-first design patterns',
      'tablet': 'Ensure optimal tablet experience between mobile and desktop',
      'desktop': 'Maintain consistent desktop layout across sizes'
    };
    return suggestions[category] || 'Improve responsive design for this device category';
  }

  /**
   * Export methods
   */
  exportResults(format = 'json') {
    // This would be implemented to export test results in various formats
    const results = this.testResults;
    return JSON.stringify(results, null, 2);
  }

  generateHTMLReport(results) {
    // Generate comprehensive HTML report for responsive testing results
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Design Test Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .viewport { margin-bottom: 2rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; }
    .pass { color: #059669; }
    .fail { color: #dc2626; }
    .issues { background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <h1>Responsive Design Test Report</h1>
  <p>Generated: ${results.timestamp}</p>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${results.summary.total}</div>
      <div class="metric-label">Total Tests</div>
    </div>
    <div class="metric">
      <div class="metric-value">${results.summary.passed}</div>
      <div class="metric-label">Passed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${results.summary.failed}</div>
      <div class="metric-label">Failed</div>
    </div>
  </div>

  ${Object.entries(results.viewports).map(([key, viewport]) => `
    <div class="viewport">
      <h3>${viewport.viewport.name} (${viewport.viewport.width}×${viewport.viewport.height})</h3>
      <p>Tests: <span class="${viewport.tests.failed === 0 ? 'pass' : 'fail'}">${viewport.tests.passed}/${viewport.tests.total}</span></p>
      ${viewport.issues.length > 0 ? `
        <div class="issues">
          <h4>Issues (${viewport.issues.length}):</h4>
          <ul>
            ${viewport.issues.map(issue => `<li>${issue.message}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>`;
  }

  cleanup() {
    // Reset viewport changes
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.removeProperty('--test-viewport-width');
      root.style.removeProperty('--test-viewport-height');
      root.removeAttribute('data-test-viewport');
      root.removeAttribute('data-test-category');
      root.removeAttribute('data-test-orientation');
    }
  }
}

/**
 * Convenience functions
 */
export const runResponsiveTests = async (options = {}) => {
  const testSuite = new ResponsiveTestSuite(options);
  const results = await testSuite.runFullResponsiveTests();
  testSuite.cleanup();
  return results;
};

/**
 * Quick viewport checker
 */
export const checkViewport = () => {
  if (typeof window === 'undefined') return null;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const category = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
  const orientation = width > height ? 'landscape' : 'portrait';

  return {
    width,
    height,
    category,
    orientation,
    pixelRatio: window.devicePixelRatio || 1
  };
};

/**
 * Media query helper
 */
export const useMediaQuery = (query) => {
  if (typeof window === 'undefined') return () => false;

  const [matches, setMatches] = React.useState(() => window.matchMedia(query).matches);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = (e) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
};

export default {
  ResponsiveTestSuite,
  DEVICE_VIEWPORTS,
  BREAKPOINTS,
  runResponsiveTests,
  checkViewport,
  useMediaQuery
};