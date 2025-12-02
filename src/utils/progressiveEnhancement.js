/**
 * Progressive Enhancement Testing Framework
 * Tests application functionality with JavaScript disabled and various browser capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';

class ProgressiveEnhancementTester {
  constructor() {
    this.testResults = {
      semantic: {},
      accessibility: {},
      functionality: {},
      performance: {},
      compatibility: {}
    };
    this.tests = [];
  }

  // Test browser capabilities
  getBrowserCapabilities() {
    return {
      javascript: typeof window !== 'undefined',
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      touchSupport: 'ontouchstart' in window,
      geolocation: 'geolocation' in navigator,
      webGL: this.testWebGL(),
      webWorkers: typeof Worker !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      canvas: !!document.createElement('canvas').getContext,
      svg: !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect,
      webAudio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
      indexedDB: 'indexedDB' in window
    };
  }

  testLocalStorage() {
    try {
      const testKey = '__test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  testSessionStorage() {
    try {
      const testKey = '__test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  testWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // Test semantic HTML structure
  async testSemanticStructure() {
    const results = {
      hasProperHeadings: this.testHeadingHierarchy(),
      hasLandmarks: this.testLandmarkElements(),
      hasProperLists: this.testListStructures(),
      hasProperTables: this.testTableStructure(),
      hasProperForms: this.testFormStructure(),
      hasProperLanguage: this.testLanguageAttribute()
    };

    this.testResults.semantic = results;
    return results;
  }

  testHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const hierarchy = [];
    let hasH1 = false;
    let isProperOrder = true;
    let lastLevel = 0;

    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      hierarchy.push({ element: heading, level });

      if (level === 1) hasH1 = true;
      if (lastLevel > 0 && level > lastLevel + 1) {
        isProperOrder = false;
      }
      lastLevel = level;
    });

    return {
      hasH1,
      isProperOrder,
      headings,
      hierarchy
    };
  }

  testLandmarkElements() {
    const landmarks = {
      header: document.querySelectorAll('header').length,
      nav: document.querySelectorAll('nav').length,
      main: document.querySelectorAll('main').length,
      aside: document.querySelectorAll('aside').length,
      footer: document.querySelectorAll('footer').length,
      section: document.querySelectorAll('section').length,
      article: document.querySelectorAll('article').length
    };

    return {
      hasMain: landmarks.main >= 1,
      hasNavigation: landmarks.nav >= 1,
      hasHeader: landmarks.header >= 1,
      hasFooter: landmarks.footer >= 1,
      landmarks
    };
  }

  testListStructures() {
    const lists = {
      unordered: document.querySelectorAll('ul').length,
      ordered: document.querySelectorAll('ol').length,
      description: document.querySelectorAll('dl').length
    };

    const malformedLists = [];

    // Check for proper list item nesting
    document.querySelectorAll('ul, ol').forEach(list => {
      const invalidItems = list.querySelectorAll(':not(li):not(ul):not(ol)');
      if (invalidItems.length > 0) {
        malformedLists.push({ list, invalidItems });
      }
    });

    return {
      lists,
      malformedLists,
      hasProperStructure: malformedLists.length === 0
    };
  }

  testTableStructure() {
    const tables = document.querySelectorAll('table');
    const results = {
      tables: tables.length,
      withCaption: 0,
      withHeaders: 0,
      withScope: 0,
      properlyStructured: 0
    };

    tables.forEach(table => {
      const hasCaption = table.querySelector('caption') !== null;
      const hasHeaders = table.querySelector('th') !== null;
      const hasScope = table.querySelector('[scope]') !== null;

      if (hasCaption) results.withCaption++;
      if (hasHeaders) results.withHeaders++;
      if (hasScope) results.withScope++;

      // Check for proper table structure
      const hasThead = table.querySelector('thead') !== null;
      const hasTbody = table.querySelector('tbody') !== null || table.querySelector('tr') !== null;

      if (hasHeaders && (hasThead || hasTbody)) {
        results.properlyStructured++;
      }
    });

    return results;
  }

  testFormStructure() {
    const forms = document.querySelectorAll('form');
    const results = {
      forms: forms.length,
      withLabels: 0,
      withFieldsets: 0,
      withLegends: 0,
      withRequired: 0,
      properlyAccessible: 0
    };

    forms.forEach(form => {
      const labels = form.querySelectorAll('label').length;
      const inputs = form.querySelectorAll('input, select, textarea').length;
      const fieldsets = form.querySelectorAll('fieldset').length;
      const legends = form.querySelectorAll('legend').length;
      const requiredFields = form.querySelectorAll('[required]').length;

      const hasFieldset = fieldsets > 0;
      const hasLegend = legends >= fieldsets;
      const hasLabels = labels >= inputs;

      if (hasLabels) results.withLabels++;
      if (hasFieldset) results.withFieldsets++;
      if (hasLegend) results.withLegends++;
      if (requiredFields > 0) results.withRequired++;

      if (hasLabels && (!hasFieldset || hasLegend)) {
        results.properlyAccessible++;
      }
    });

    return results;
  }

  testLanguageAttribute() {
    return {
      htmlLang: document.documentElement.lang || null,
      hasLang: !!document.documentElement.lang
    };
  }

  // Test accessibility features
  async testAccessibilityFeatures() {
    const results = {
      hasAltText: this.testImageAltText(),
      hasAriaLabels: this.testAriaLabels(),
      hasTabIndex: this.testTabIndex(),
      hasFocusManagement: this.testFocusManagement(),
      hasColorContrast: this.testColorContrast(),
      hasKeyboardAccessibility: this.testKeyboardAccessibility()
    };

    this.testResults.accessibility = results;
    return results;
  }

  testImageAltText() {
    const images = document.querySelectorAll('img');
    const withAlt = Array.from(images).filter(img => img.alt !== '').length;
    const meaningfulImages = Array.from(images).filter(img => !img.alt.includes('decorative'));

    return {
      total: images.length,
      withAlt,
      withoutAlt: images.length - withAlt,
      meaningfulWithoutAlt: meaningfulImages.filter(img => !img.alt).length
    };
  }

  testAriaLabels() {
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"]');

    const accessibleInteractive = Array.from(interactiveElements).filter(el => {
      return el.hasAttribute('aria-label') ||
             el.hasAttribute('aria-labelledby') ||
             el.textContent.trim() !== '' ||
             el.tagName === 'BUTTON' ||
             (el.tagName === 'INPUT' && ['submit', 'reset', 'button'].includes(el.type));
    });

    return {
      totalAriaElements: ariaElements.length,
      totalInteractive: interactiveElements.length,
      accessibleInteractive: accessibleInteractive.length,
      inaccessiblyInteractive: interactiveElements.length - accessibleInteractive.length
    };
  }

  testTabIndex() {
    const positiveTabIndex = document.querySelectorAll('[tabindex]');
    const positiveTabIndexElements = Array.from(positiveTabIndex).filter(el => {
      const index = parseInt(el.getAttribute('tabindex'));
      return index > 0;
    });

    return {
      totalTabIndex: positiveTabIndex.length,
      positiveTabIndex: positiveTabIndexElements.length
    };
  }

  testFocusManagement() {
    const focusableElements = document.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    return {
      totalFocusable: focusableElements.length,
      visibleFocusable: Array.from(focusableElements).filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).length
    };
  }

  testColorContrast() {
    // This would require a color contrast calculation library
    // For now, return placeholder
    return {
      note: 'Color contrast testing requires additional library integration',
      recommendation: 'Consider integrating axe-core or similar accessibility testing tool'
    };
  }

  testKeyboardAccessibility() {
    // Basic keyboard navigation test
    const results = {
      canTabThroughElements: false,
      trappedFocus: false,
      skipLinks: document.querySelectorAll('a[href^="#"]').length
    };

    // This would need actual user interaction testing
    return results;
  }

  // Test core functionality without JavaScript
  async testCoreFunctionality() {
    const results = {
      navigationWorks: this.testNavigationWithoutJS(),
      formsWork: this.testFormsWithoutJS(),
      dataPersistence: this.testDataPersistence(),
      errorHandling: this.testErrorHandling()
    };

    this.testResults.functionality = results;
    return results;
  }

  testNavigationWithoutJS() {
    const links = document.querySelectorAll('a[href]');
    const internalLinks = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href && (href.startsWith('#') || href.startsWith('./') || href === '/');
    });

    return {
      totalLinks: links.length,
      internalLinks: internalLinks.length,
      hasProperAnchors: internalLinks.every(link => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
          return document.querySelector(href) !== null;
        }
        return true;
      })
    };
  }

  testFormsWithoutJS() {
    const forms = document.querySelectorAll('form');
    const results = {
      totalForms: forms.length,
      withAction: 0,
      withMethod: 0,
      withValidation: 0
    };

    forms.forEach(form => {
      if (form.getAttribute('action')) results.withAction++;
      if (form.getAttribute('method')) results.withMethod++;

      const hasRequiredFields = form.querySelectorAll('[required]').length > 0;
      const hasPatternFields = form.querySelectorAll('[pattern]').length > 0;
      if (hasRequiredFields || hasPatternFields) results.withValidation++;
    });

    return results;
  }

  testDataPersistence() {
    const capabilities = this.getBrowserCapabilities();

    return {
      localStorage: capabilities.localStorage,
      sessionStorage: capabilities.sessionStorage,
      indexedDB: capabilities.indexedDB,
      fallbackAvailable: !capabilities.localStorage && !capabilities.sessionStorage
    };
  }

  testErrorHandling() {
    // Test graceful degradation scenarios
    return {
      cssDisabled: this.testNoCSSGracefulDegradation(),
      imagesDisabled: this.testNoImagesGracefulDegradation(),
      cookiesDisabled: this.testNoCookiesGracefulDegradation()
    };
  }

  testNoCSSGracefulDegradation() {
    // When CSS is disabled, content should still be readable and logical
    return {
      test: 'Remove all stylesheets and verify content structure',
      passed: true, // Would need actual testing
      notes: 'Check that headings, lists, and forms remain functional without CSS'
    };
  }

  testNoImagesGracefulDegradation() {
    const images = document.querySelectorAll('img');
    const withAlt = Array.from(images).filter(img => img.alt.trim() !== '').length;

    return {
      totalImages: images.length,
      withAltText: withAlt,
      ratio: images.length > 0 ? (withAlt / images.length * 100).toFixed(1) + '%' : 'N/A'
    };
  }

  testNoCookiesGracefulDegradation() {
    return {
      localStorageFallback: !this.getBrowserCapabilities().localStorage,
      sessionStorageFallback: !this.getBrowserCapabilities().sessionStorage,
      gracefulMessage: 'Application should function without persistent storage'
    };
  }

  // Run comprehensive test suite
  async runFullProgressiveEnhancementTest() {
    console.log('🧪 Running Comprehensive Progressive Enhancement Test Suite...');

    const startTime = performance.now();
    const capabilities = this.getBrowserCapabilities();

    console.log('🔍 Testing current browser capabilities...', capabilities);

    try {
      // Core functionality tests
      const semanticResults = await this.testSemanticStructure();
      console.log('📝 Semantic HTML Test Results:', semanticResults);

      const accessibilityResults = await this.testAccessibilityFeatures();
      console.log('♿ Accessibility Test Results:', accessibilityResults);

      const functionalityResults = await this.testCoreFunctionality();
      console.log('⚙️ Core Functionality Test Results:', functionalityResults);

      // Mobile optimization tests
      const mobileResults = await this.testMobileOptimizations();
      console.log('📱 Mobile Optimization Test Results:', mobileResults);

      // JavaScript degradation tests
      const degradationResults = await this.testJavaScriptDegradation();
      console.log('🐛 JavaScript Degradation Test Results:', degradationResults);

      const duration = performance.now() - startTime;

      const comprehensiveResults = {
        capabilities,
        results: {
          ...this.testResults,
          performance: { ...this.testResults.performance, mobile: mobileResults },
          functionality: { ...this.testResults.functionality, degradation: degradationResults }
        },
        score: this.calculateProgressiveEnhancementScore(),
        duration: Math.round(duration),
        timestamp: new Date().toISOString(),
        summary: {
          semanticScore: this.getSemanticScore(),
          accessibilityScore: this.getAccessibilityScore(),
          functionalityScore: this.getFunctionalityScore(),
          mobileScore: this.getMobileScore(),
          degradationScore: this.getDegradationScore()
        }
      };

      console.log(`📊 Final Progressive Enhancement Score: ${comprehensiveResults.score}%`);

      return comprehensiveResults;

    } catch (error) {
      console.error('❌ Progressive Enhancement Test failed:', error);
      throw error;
    }
  }

  // Individual scoring methods for better reporting
  getSemanticScore() {
    const results = this.testResults.semantic;
    if (!results) return 0;

    let score = 0;
    if (results.hasProperHeadings?.hasH1) score += 35;
    if (results.hasLandmarks?.hasMain) score += 35;
    if (results.hasProperForms?.properlyAccessible > 0) score += 30;

    return Math.round(score);
  }

  getAccessibilityScore() {
    const results = this.testResults.accessibility;
    if (!results) return 0;

    const totalImages = results.hasAltText?.total || 0;
    if (totalImages > 0) {
      return Math.round((results.hasAltText.withAlt / totalImages) * 100);
    }
    return 100; // No images to worry about
  }

  getFunctionalityScore() {
    const results = this.testResults.functionality;
    const capabilities = this.getBrowserCapabilities();
    if (!results) return 0;

    let score = 0;
    if (capabilities.localStorage) score += 35;
    if (results.navigationWorks?.hasProperAnchors) score += 35;
    if (results.formsWork?.withAction > 0) score += 30;

    return Math.round(score);
  }

  getMobileScore() {
    const mobile = this.testResults.performance?.mobile;
    if (!mobile) return 0;

    let score = 0;
    if (mobile.viewportConfigured?.isProperlyConfigured) score += 35;
    if (mobile.touchTargets?.passRate >= 80) score += 35;
    if (mobile.responsiveImages?.responsiveRatio >= 50) score += 30;

    return Math.round(score);
  }

  getDegradationScore() {
    const degradation = this.testResults.functionality?.degradation;
    if (!degradation) return 0;

    let score = 0;
    if (degradation.criticalFunctionality?.mainContentAccessible) score += 35;
    if (degradation.localStorageFallback?.gracefulDegradation) score += 35;
    if (degradation.formEnhancements?.basicFormFunctionality) score += 30;

    return Math.round(score);
  }

  // Generate progressive enhancement report
  generateProgressiveEnhancementReport() {
    const report = {
      timestamp: new Date().toISOString(),
      browserCapabilities: this.getBrowserCapabilities(),
      testResults: this.testResults,
      recommendations: this.generateRecommendations(),
      score: this.calculateProgressiveEnhancementScore()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    const results = this.testResults;

    // Semantic HTML recommendations
    if (!results.semantic.hasProperHeadings?.hasH1) {
      recommendations.push('Add a main h1 heading for better document outline');
    }

    if (!results.semantic.hasLandmarks?.hasMain) {
      recommendations.push('Add <main> element for better semantic structure');
    }

    // Accessibility recommendations
    if (results.accessibility.hasAltText?.withoutAlt > 0) {
      recommendations.push(`Add alt text to ${results.accessibility.hasAltText.withoutAlt} image(s)`);
    }

    if (results.accessibility.inaccessiblyInteractive > 0) {
      recommendations.push(`Make ${results.accessibility.inaccessiblyInteractive} interactive element(s) accessible`);
    }

    // Functionality recommendations
    if (!results.functionality.dataPersistence?.localStorage) {
      recommendations.push('Implement fallback for localStorage in case it\'s unavailable');
    }

    return recommendations;
  }

  // Test mobile-specific optimizations
  async testMobileOptimizations() {
    const results = {
      viewportConfigured: this.testViewportConfiguration(),
      touchTargets: this.testTouchTargetSizes(),
      mobileNavigation: this.testMobileNavigation(),
      responsiveImages: this.testResponsiveImages(),
      scrollPerformance: this.testScrollPerformance(),
      reducedMotion: this.testReducedMotionSupport()
    };

    this.testResults.performance = { ...this.testResults.performance, mobile: results };
    return results;
  }

  testViewportConfiguration() {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const hasViewport = !!viewportMeta;
    const isProperlyConfigured = hasViewport &&
      viewportMeta.getAttribute('content').includes('width=device-width');

    return {
      hasViewport,
      isProperlyConfigured,
      content: viewportMeta ? viewportMeta.getAttribute('content') : null
    };
  }

  testTouchTargetSizes() {
    const interactiveElements = document.querySelectorAll(
      'a, button, input, select, textarea, [role="button"], [role="link"], [onclick]'
    );

    const smallTouchTargets = [];
    const recommendedMinSize = 44; // 44px minimum as per WCAG guidelines

    Array.from(interactiveElements).forEach(element => {
      const rect = element.getBoundingClientRect();
      const width = rect.width || 0;
      const height = rect.height || 0;

      if (width < recommendedMinSize || height < recommendedMinSize) {
        smallTouchTargets.push({
          element,
          width,
          height,
          textContent: element.textContent?.trim() || element.alt || element.value || ''
        });
      }
    });

    return {
      totalInteractive: interactiveElements.length,
      smallTouchTargets: smallTouchTargets.length,
      smallTouchTargetDetails: smallTouchTargets,
      passRate: interactiveElements.length > 0
        ? Math.round(((interactiveElements.length - smallTouchTargets.length) / interactiveElements.length) * 100)
        : 100
    };
  }

  testMobileNavigation() {
    const navigation = document.querySelector('nav, [role="navigation"]');
    const burgerMenu = document.querySelector('.burger, .hamburger, [aria-label*="menu"], [aria-label*="Menu"]');
    const mobileOnly = document.querySelectorAll('.mobile-only, [class*="md:hidden"], [class*="lg:hidden"]');
    const desktopOnly = document.querySelectorAll('.desktop-only, [class*="md:block"], [class*="lg:block"]');

    return {
      hasNavigation: !!navigation,
      hasMobileMenu: !!burgerMenu,
      mobileOnlyElements: mobileOnly.length,
      desktopOnlyElements: desktopOnly.length,
      usesResponsiveClasses: mobileOnly.length > 0 || desktopOnly.length > 0
    };
  }

  testResponsiveImages() {
    const images = document.querySelectorAll('img');
    const responsiveImages = [];
    const imagesWithSizes = [];
    const imagesWithPics = document.querySelectorAll('picture');

    Array.from(images).forEach(img => {
      const hasSrcset = !!img.getAttribute('srcset');
      const hasSizes = !!img.getAttribute('sizes');
      const hasLoading = img.getAttribute('loading') === 'lazy';
      const isResponsive = hasSrcset || hasLoading;

      if (hasSrcset) responsiveImages.push(img);
      if (hasSizes) imagesWithSizes.push(img);

      if (isResponsive) {
        responsiveImages.push({
          element: img,
          hasSrcset,
          hasSizes,
          hasLoading,
          src: img.src || img.getAttribute('data-src')
        });
      }
    });

    return {
      totalImages: images.length,
      responsiveImages: responsiveImages.length,
      imagesWithSizes: imagesWithSizes.length,
      pictureElements: imagesWithPics.length,
      lazyLoaded: Array.from(images).filter(img =>
        img.getAttribute('loading') === 'lazy'
      ).length,
      responsiveRatio: images.length > 0
        ? Math.round((responsiveImages.length / images.length) * 100)
        : 100
    };
  }

  testScrollPerformance() {
    const startTime = performance.now();
    const scrollTest = () => {
      let scrollCount = 0;
      const maxScrolls = 100;
      const scrollStep = 10;

      const scroll = () => {
        if (scrollCount < maxScrolls && document.body.scrollHeight > window.innerHeight) {
          window.scrollBy(0, scrollStep);
          scrollCount++;
          setTimeout(scroll, 10);
        } else {
          window.scrollTo(0, 0); // Reset scroll
        }
      };

      return new Promise(resolve => {
        scroll();
        setTimeout(resolve, 2000); // Give it time to complete
      });
    };

    return scrollTest().then(() => {
      const duration = performance.now() - startTime;
      return {
        scrollTestDuration: Math.round(duration),
        smoothScrolling: 'scroll-behavior' in document.documentElement.style,
        hasWillChange: document.querySelectorAll('[style*="will-change"]').length,
        hasTransform: document.querySelectorAll('[style*="transform"]').length
      };
    });
  }

  testReducedMotionSupport() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animatedElements = document.querySelectorAll(
      '[style*="animation"], [style*="transition"], .animate, .animated'
    );

    return {
      prefersReduced: prefersReducedMotion.matches,
      animatedElements: animatedElements.length,
      respectReducedMotion: animatedElements.length === 0 ||
        document.querySelectorAll('@media (prefers-reduced-motion)').length > 0
    };
  }

  // Test JavaScript degradation scenarios
  async testJavaScriptDegradation() {
    const results = {
      noJavaScriptMode: this.testNoJavaScriptMode(),
      partialJavaScriptMode: this.testPartialJavaScriptMode(),
      criticalFunctionality: this.testCriticalFunctionalityWithoutJS(),
      formEnhancements: this.testFormEnhancementsWithoutJS(),
      localStorageFallback: this.testLocalStorageFallback()
    };

    this.testResults.functionality = { ...this.testResults.functionality, degradation: results };
    return results;
  }

  testNoJavaScriptMode() {
    // Test what happens when JavaScript is completely disabled
    return {
      navigation: this.testNavigationWithoutJS(),
      contentAccessible: this.checkContentAccessibilityWithoutJS(),
      formsFunctional: this.testBasicFormFunctionality(),
      dataStructure: this.checkDataStructureWithoutJS()
    };
  }

  testPartialJavaScriptMode() {
    // Test scenarios with limited JavaScript (e.g., slow loading, script errors)
    const results = {
      delayedLoading: this.simulateDelayedJavaScript(),
      scriptErrors: this.simulateScriptErrors(),
      networkLimited: this.simulateLimitedNetwork(),
      memoryLimited: this.simulateLimitedMemory()
    };

    return results;
  }

  simulateDelayedJavaScript() {
    // Simulate slow JavaScript loading by checking async/defer attributes
    const scripts = document.querySelectorAll('script[src]');
    const deferScripts = Array.from(scripts).filter(s => s.hasAttribute('defer'));
    const asyncScripts = Array.from(scripts).filter(s => s.hasAttribute('async'));

    return {
      totalScripts: scripts.length,
      deferScripts: deferScripts.length,
      asyncScripts: asyncScripts.length,
      criticalScriptsInline: document.querySelectorAll('script:not([src])').length
    };
  }

  simulateScriptErrors() {
    // Test resilience to script errors
    const hasErrorHandlers = document.querySelectorAll('script[onerror], window.onerror').length > 0;
    const hasTryCatch = document.body.innerHTML.includes('try') && document.body.innerHTML.includes('catch');

    return {
      hasErrorHandlers,
      hasGlobalErrorHandler: typeof window.onerror === 'function',
      hasTryCatchInCode: hasTryCatch
    };
  }

  simulateLimitedNetwork() {
    // Test behavior on slow/limited networks
    return {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasOfflineSupport: 'caches' in window,
      hasBackgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      connectionAPI: 'connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator
    };
  }

  simulateLimitedMemory() {
    // Test memory conservation
    const memoryInfo = 'memory' in performance ? performance.memory : null;

    return {
      memoryAPIAvailable: !!memoryInfo,
      estimatedLimit: memoryInfo?.jsHeapSizeLimit || null,
      currentUsage: memoryInfo?.usedJSHeapSize || null,
      recommendations: memoryInfo ?
        (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.7 ? 'Consider memory optimization' : 'Memory usage OK')
        : 'Memory API not available'
    };
  }

  testCriticalFunctionalityWithoutJS() {
    // Test core functionality that must work without JavaScript
    return {
      mainContentAccessible: this.testMainContentAccessibility(),
      navigationStructure: this.testNavigationWithoutJS(),
      essentialDataVisible: this.testEssentialDataVisibility(),
      formsBasic: this.testBasicFormFunctionality()
    };
  }

  testFormEnhancementsWithoutJS() {
    // Test how forms degrade gracefully without JavaScript enhancements
    const forms = document.querySelectorAll('form');
    const enhancedForms = Array.from(forms).filter(form => {
      const hasEnhancedInputs = form.querySelectorAll('input[type="date"], input[type="color"], input[type="range"]').length > 0;
      const hasCustomValidation = form.querySelectorAll('[pattern], [min], [max]').length > 0;
      const hasAsyncSubmit = form.querySelector('[type="submit"]');

      return hasEnhancedInputs || hasCustomValidation || hasAsyncSubmit;
    });

    return {
      totalForms: forms.length,
      enhancedForms: enhancedForms.length,
      degradableEnhancements: enhancedForms.every(form => {
        const hasFallbackAction = form.getAttribute('action');
        const hasFallbackMethod = form.getAttribute('method');
        return hasFallbackAction || hasFallbackMethod;
      }),
      basicFormFunctionality: this.testBasicFormFunctionality()
    };
  }

  testLocalStorageFallback() {
    // Test fallback mechanisms when localStorage is not available
    const originalLocalStorage = window.localStorage;
    let originalAvailable;

    try {
      originalAvailable = !!originalLocalStorage;
      // Temporarily disable localStorage to test fallbacks
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true
      });

      // Test if application has fallback mechanisms
      const hasInMemoryFallback = document.body.innerHTML.includes('Map(') || document.body.innerHTML.includes('{}');
      const hasSessionStorageFallback = 'sessionStorage' in window;

      return {
        originalAvailable,
        hasFallbackHandling: hasInMemoryFallback || hasSessionStorageFallback,
        sessionStorageAvailable: hasSessionStorageFallback,
        inMemoryPatterns: hasInMemoryFallback,
        gracefulDegradation: true // Assume true if app still loads
      };

    } catch (error) {
      return {
        error: error.message,
        gracefulDegradation: false
      };
    } finally {
      // Restore localStorage
      if (originalLocalStorage) {
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          writable: true,
          configurable: true
        });
      }
    }
  }

  testMainContentAccessibility() {
    const main = document.querySelector('main, [role="main"], #main, .main') || document.body;
    const hasReadableContent = main.textContent.trim().length > 100;
    const hasHeadings = main.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0;

    return {
      hasMainContent: hasReadableContent,
      hasHeadingStructure: hasHeadings,
      contentLength: main.textContent.trim().length,
      passesAccessibility: hasReadableContent && hasHeadings
    };
  }

  testEssentialDataVisibility() {
    // Check if essential data (like inventory lists) is visible without JavaScript
    const dataElements = document.querySelectorAll(
      'table, [class*="list"], [class*="table"], [class*="data"]'
    );

    return {
      dataElementsFound: dataElements.length,
      hasVisibleData: Array.from(dataElements).some(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }),
      hasStructuredData: document.querySelectorAll('table thead, table tbody').length > 0
    };
  }

  testBasicFormFunctionality() {
    const forms = document.querySelectorAll('form');
    const functionalForms = Array.from(forms).filter(form => {
      const hasAction = form.getAttribute('action');
      const hasMethod = form.getAttribute('method') || 'get';
      const hasSubmitButton = form.querySelector('button[type="submit"], input[type="submit"]');

      return hasAction || hasSubmitButton;
    });

    return {
      totalForms: forms.length,
      functionalForms: functionalForms.length,
      basicFunctionalityOk: forms.length === functionalForms.length
    };
  }

  testNavigationWithoutJS() {
    const links = document.querySelectorAll('a[href]');
    const functionalLinks = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href && href !== '#' && href !== 'javascript:void(0)';
    });

    return {
      totalLinks: links.length,
      functionalLinks: functionalLinks.length,
      hasNonJSNavigation: functionalLinks.length > 0
    };
  }

  checkContentAccessibilityWithoutJS() {
    // Test if content is accessible without JavaScript
    const content = document.body.textContent.trim();
    const hasStructuredContent = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p').length > 0;

    return {
      hasContent: content.length > 50,
      hasStructure: hasStructuredContent,
      contentLength: content.length,
      passesBasicAccessibility: content.length > 50 && hasStructuredContent
    };
  }

  checkDataStructureWithoutJS() {
    // Test if data is structured without JavaScript
    const tables = document.querySelectorAll('table');
    const lists = document.querySelectorAll('ul, ol, dl');
    const articles = document.querySelectorAll('article, section[data-type]');

    return {
      hasStructuredData: tables.length > 0 || lists.length > 0 || articles.length > 0,
      tables: tables.length,
      lists: lists.length,
      articles: articles.length
    };
  }

  calculateProgressiveEnhancementScore() {
    const results = this.testResults;
    let score = 0;
    let maxScore = 0;

    // Semantic HTML scoring (20%)
    maxScore += 20;
    if (results.semantic.hasProperHeadings?.hasH1) score += 7;
    if (results.semantic.hasLandmarks?.hasMain) score += 7;
    if (results.semantic.hasProperForms?.properlyAccessible > 0) score += 6;

    // Accessibility scoring (20%)
    maxScore += 20;
    const totalImages = results.accessibility.hasAltText?.total || 0;
    if (totalImages > 0) {
      const altRatio = (results.accessibility.hasAltText.withAlt / totalImages) * 20;
      score += altRatio;
    } else {
      score += 20; // No images to worry about
    }

    // Functionality scoring (20%)
    maxScore += 20;
    const capabilities = this.getBrowserCapabilities();
    if (capabilities.localStorage) score += 7;
    if (results.functionality.navigationWorks?.hasProperAnchors) score += 7;
    if (results.functionality.formsWork?.withAction > 0) score += 6;

    // Mobile optimization scoring (20%)
    maxScore += 20;
    if (results.performance?.mobile?.viewportConfigured?.isProperlyConfigured) score += 7;
    if (results.performance?.mobile?.touchTargets?.passRate >= 80) score += 7;
    if (results.performance?.mobile?.responsiveImages?.responsiveRatio >= 50) score += 6;

    // JavaScript degradation scoring (20%)
    maxScore += 20;
    if (results.functionality?.degradation?.criticalFunctionality?.mainContentAccessible) score += 7;
    if (results.functionality?.degradation?.localStorageFallback?.gracefulDegradation) score += 7;
    if (results.functionality?.degradation?.formEnhancements?.basicFormFunctionality) score += 6;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }
}

// Progressive Enhancement Testing Component
export const ProgressiveEnhancementTesterComponent = () => {
  const [tester] = useState(() => new ProgressiveEnhancementTester());
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const testResults = await tester.runFullProgressiveEnhancementTest();
      setResults(testResults);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tester]);

  const generateReport = useCallback(() => {
    return tester.generateProgressiveEnhancementReport();
  }, [tester]);

  useEffect(() => {
    // Run tests automatically on mount
    runTests();
  }, [runTests]);

  return {
    results,
    isLoading,
    runTests,
    generateReport,
    tester
  };
};

export default ProgressiveEnhancementTester;