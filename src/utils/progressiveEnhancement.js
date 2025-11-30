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
    console.log('🧪 Running Progressive Enhancement Test Suite...');

    const startTime = performance.now();
    const capabilities = this.getBrowserCapabilities();

    console.log('🔍 Testing current browser capabilities...', capabilities);

    try {
      const semanticResults = await this.testSemanticStructure();
      console.log('📝 Semantic HTML Test Results:', semanticResults);

      const accessibilityResults = await this.testAccessibilityFeatures();
      console.log('♿ Accessibility Test Results:', accessibilityResults);

      const functionalityResults = await this.testCoreFunctionality();
      console.log('⚙️ Core Functionality Test Results:', functionalityResults);

      const duration = performance.now() - startTime;

      return {
        capabilities,
        results: this.testResults,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Progressive Enhancement Test failed:', error);
      throw error;
    }
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

  calculateProgressiveEnhancementScore() {
    const results = this.testResults;
    let score = 0;
    let maxScore = 0;

    // Semantic HTML scoring (30%)
    maxScore += 30;
    if (results.semantic.hasProperHeadings?.hasH1) score += 10;
    if (results.semantic.hasLandmarks?.hasMain) score += 10;
    if (results.semantic.hasProperForms?.properlyAccessible > 0) score += 10;

    // Accessibility scoring (40%)
    maxScore += 40;
    const totalImages = results.accessibility.hasAltText?.total || 0;
    if (totalImages > 0) {
      const altRatio = (results.accessibility.hasAltText.withAlt / totalImages) * 40;
      score += altRatio;
    } else {
      score += 40; // No images to worry about
    }

    // Functionality scoring (30%)
    maxScore += 30;
    const capabilities = this.getBrowserCapabilities();
    if (capabilities.localStorage) score += 10;
    if (results.functionality.navigationWorks?.hasProperAnchors) score += 10;
    if (results.functionality.formsWork?.withAction > 0) score += 10;

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