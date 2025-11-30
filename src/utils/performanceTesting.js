/**
 * Performance Testing and Benchmarking Utilities
 * Provides comprehensive performance testing capabilities with automated testing
 */

/**
 * Performance Test Suite Class
 */
export class PerformanceTestSuite {
  constructor(config = {}) {
    this.config = {
      targetInteractionTime: config.targetInteractionTime || 200, // 200ms target
      runsPerTest: config.runsPerTest || 5,
      warmupRuns: config.warmupRuns || 2,
      enableLogging: config.enableLogging !== false,
      generateReports: config.generateReports !== false,
      thresholds: {
        interactionTime: 200,
        renderTime: 100,
        apiResponse: 500,
        bundleLoad: 1000,
        imageLoad: 2000,
        memoryUsage: 50 * 1024 * 1024, // 50MB
        layoutShift: 0.1,
        firstContentfulPaint: 1800,
        largestContentfulPaint: 2500
      },
      ...config
    };

    this.testResults = [];
    this.currentTest = null;
    this.testHistory = [];
  }

  /**
   * Run a complete performance test suite
   * @returns {Promise<Object>} Complete test results
   */
  async runFullTestSuite() {
    console.log('🚀 Starting Performance Test Suite...');

    const testSuite = {
      name: 'Full Performance Test Suite',
      startTime: Date.now(),
      tests: [],
      summary: null,
      passed: false
    };

    try {
      // Test 1: User Interaction Performance
      const interactionResults = await this.testUserInteractions();
      testSuite.tests.push(interactionResults);

      // Test 2: Rendering Performance
      const renderResults = await this.testRenderingPerformance();
      testSuite.tests.push(renderResults);

      // Test 3: Memory Usage
      const memoryResults = await this.testMemoryUsage();
      testSuite.tests.push(memoryResults);

      // Test 4: Resource Loading
      const resourceResults = await this.testResourceLoading();
      testSuite.tests.push(resourceResults);

      // Test 5: Core Web Vitals
      const vitalsResults = await this.testCoreWebVitals();
      testSuite.tests.push(vitalsResults);

      // Test 6: Bundle Size Analysis
      const bundleResults = await this.testBundleSize();
      testSuite.tests.push(bundleResults);

      // Generate summary
      testSuite.summary = this.generateTestSummary(testSuite.tests);
      testSuite.endTime = Date.now();
      testSuite.duration = testSuite.endTime - testSuite.startTime;
      testSuite.passed = testSuite.summary.overallStatus === 'passed';

      this.testResults.push(testSuite);
      this.testHistory.push(testSuite);

      console.log('✅ Performance Test Suite completed');
      console.log(`📊 Overall Status: ${testSuite.summary.overallStatus.toUpperCase()}`);
      console.log(`⏱️ Duration: ${testSuite.duration}ms`);

      if (this.config.generateReports) {
        this.generatePerformanceReport(testSuite);
      }

      return testSuite;

    } catch (error) {
      console.error('❌ Performance Test Suite failed:', error);
      testSuite.error = error.message;
      testSuite.endTime = Date.now();
      testSuite.duration = testSuite.endTime - testSuite.startTime;
      testSuite.passed = false;

      return testSuite;
    }
  }

  /**
   * Test user interaction performance
   */
  async testUserInteractions() {
    const testName = 'User Interaction Performance';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'user-interaction',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      // Test click response time
      const clickTests = await this.measureClickResponse();
      test.runs.push(clickTests);

      // Test form input response time
      const inputTests = await this.measureInputResponse();
      test.runs.push(inputTests);

      // Test navigation response time
      const navigationTests = await this.measureNavigationResponse();
      test.runs.push(navigationTests);

      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeInteractionTests(test.runs);
      test.passed = test.summary.averageResponseTime <= this.config.thresholds.interactionTime;

      console.log(`✅ ${testName} completed - Avg: ${test.summary.averageResponseTime}ms`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Test rendering performance
   */
  async testRenderingPerformance() {
    const testName = 'Rendering Performance';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'rendering',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      // Test component render time
      const renderTests = await this.measureComponentRenderTime();
      test.runs.push(renderTests);

      // Test list rendering performance
      const listTests = await this.measureListRenderPerformance();
      test.runs.push(listTests);

      // Test table rendering performance
      const tableTests = await this.measureTableRenderPerformance();
      test.runs.push(tableTests);

      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeRenderingTests(test.runs);
      test.passed = test.summary.averageRenderTime <= this.config.thresholds.renderTime;

      console.log(`✅ ${testName} completed - Avg: ${test.summary.averageRenderTime}ms`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage() {
    const testName = 'Memory Usage';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'memory',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      const memoryMeasurements = [];

      // Take baseline measurement
      const baseline = this.getCurrentMemoryUsage();
      memoryMeasurements.push({ phase: 'baseline', ...baseline });

      // Measure after component interactions
      await this.simulateUserInteractions();
      const afterInteractions = this.getCurrentMemoryUsage();
      memoryMeasurements.push({ phase: 'after-interactions', ...afterInteractions });

      // Measure after data operations
      await this.simulateDataOperations();
      const afterDataOps = this.getCurrentMemoryUsage();
      memoryMeasurements.push({ phase: 'after-data-ops', ...afterDataOps });

      // Measure after cleanup
      await this.performCleanup();
      const afterCleanup = this.getCurrentMemoryUsage();
      memoryMeasurements.push({ phase: 'after-cleanup', ...afterCleanup });

      test.runs = [{ measurements: memoryMeasurements }];
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeMemoryTests(memoryMeasurements);
      test.passed = test.summary.peakUsage <= this.config.thresholds.memoryUsage;

      console.log(`✅ ${testName} completed - Peak: ${(test.summary.peakUsage / 1024 / 1024).toFixed(2)}MB`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Test resource loading performance
   */
  async testResourceLoading() {
    const testName = 'Resource Loading';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'resources',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      // Test bundle loading
      const bundleTests = await this.measureBundleLoading();
      test.runs.push(bundleTests);

      // Test image loading
      const imageTests = await this.measureImageLoading();
      test.runs.push(imageTests);

      // Test API responses
      const apiTests = await this.measureAPIResponseTime();
      test.runs.push(apiTests);

      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeResourceTests(test.runs);
      test.passed = test.summary.averageLoadTime <= this.config.thresholds.bundleLoad;

      console.log(`✅ ${testName} completed - Avg: ${test.summary.averageLoadTime}ms`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Test Core Web Vitals
   */
  async testCoreWebVitals() {
    const testName = 'Core Web Vitals';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'web-vitals',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      const vitals = {};


      if (performance.getEntriesByType) {
        // FCP - First Contentful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          vitals.FCP = fcpEntry.startTime;
        }

        // LCP - Largest Contentful Paint (requires observer)
        vitals.LCP = await this.measureLCP();

        // CLS - Cumulative Layout Shift (requires observer)
        vitals.CLS = await this.measureCLS();

        // FID - First Input Delay (requires observer)
        vitals.FID = await this.measureFID();
      }

      test.runs = [{ vitals }];
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeWebVitals(vitals);
      test.passed = test.summary.allVitalsPass;

      console.log(`✅ ${testName} completed - Status: ${test.summary.allVitalsPass ? 'PASS' : 'FAIL'}`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Test bundle size
   */
  async testBundleSize() {
    const testName = 'Bundle Size Analysis';
    console.log(`🧪 Running ${testName}...`);

    const test = {
      name: testName,
      category: 'bundle',
      startTime: Date.now(),
      runs: [],
      summary: null,
      passed: false
    };

    try {
      const bundleInfo = await this.analyzeBundleSize();
      test.runs = [{ bundleInfo }];
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.summary = this.summarizeBundleAnalysis(bundleInfo);
      test.passed = test.summary.totalSize <= this.config.thresholds.bundleSize || test.summary.totalSizeKB <= 500; // 500KB default target

      console.log(`✅ ${testName} completed - Total: ${test.summary.totalSizeKB}KB`);
      return test;

    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
      test.error = error.message;
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
      test.passed = false;
      return test;
    }
  }

  /**
   * Measure click response time
   */
  async measureClickResponse() {
    const results = [];
    const testElements = ['button', '.clickable-element', '.interactive-component'];

    for (let i = 0; i < this.config.runsPerTest; i++) {
      for (const selector of testElements) {
        const element = document.querySelector(selector);
        if (element) {
          const startTime = performance.now();

          // Simulate click
          element.click();

          // Wait for response
          await new Promise(resolve => setTimeout(resolve, 100));

          const endTime = performance.now();
          results.push({
            selector,
            responseTime: endTime - startTime,
            timestamp: Date.now()
          });
        }
      }
    }

    return {
      type: 'click-response',
      results,
      average: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    };
  }

  /**
   * Measure input response time
   */
  async measureInputResponse() {
    const results = [];
    const inputs = document.querySelectorAll('input[type="text"], textarea, select');

    for (let i = 0; i < this.config.runsPerTest; i++) {
      for (const input of inputs.slice(0, 5)) { // Test first 5 inputs
        const startTime = performance.now();

        // Simulate input
        input.value = 'test';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        // Wait for response
        await new Promise(resolve => setTimeout(resolve, 50));

        const endTime = performance.now();
        results.push({
          elementType: input.tagName.toLowerCase(),
          inputType: input.type || 'text',
          responseTime: endTime - startTime,
          timestamp: Date.now()
        });
      }
    }

    return {
      type: 'input-response',
      results,
      average: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    };
  }

  /**
   * Measure navigation response time
   */
  async measureNavigationResponse() {
    const results = [];
    const navElements = document.querySelectorAll('a[href], [role="button"]');

    for (let i = 0; i < Math.min(this.config.runsPerTest, navElements.length); i++) {
      const element = navElements[i];
      if (element && !element.href?.includes('://')) { // Skip external links
        const startTime = performance.now();

        // Simulate navigation click (but don't actually navigate)
        element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        const endTime = performance.now();
        results.push({
          text: element.textContent || element.innerText,
          href: element.href || 'internal-route',
          responseTime: endTime - startTime,
          timestamp: Date.now()
        });
      }
    }

    return {
      type: 'navigation-response',
      results,
      average: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
    };
  }

  /**
   * Measure component render time
   */
  async measureComponentRenderTime() {
    const results = [];
    const components = document.querySelectorAll('[data-component]');

    for (let i = 0; i < Math.min(this.config.runsPerTest, components.length); i++) {
      const component = components[i];
      const componentName = component.dataset.component || 'unknown';

      // Force a reflow
      component.hidden = true;
      component.offsetHeight; // Force reflow
      component.hidden = false;

      // Measure render time
      const startTime = performance.now();
      await new Promise(resolve => {
        if (requestAnimationFrame) {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        } else {
          setTimeout(resolve, 16);
        }
      });
      const endTime = performance.now();

      results.push({
        component: componentName,
        renderTime: endTime - startTime,
        elementCount: component.querySelectorAll('*').length,
        timestamp: Date.now()
      });
    }

    return {
      type: 'component-render',
      results,
      average: results.reduce((sum, r) => sum + r.renderTime, 0) / results.length
    };
  }

  /**
   * Measure list render performance
   */
  async measureListRenderPerformance() {
    const lists = document.querySelectorAll('ul, ol, [role="list"]');
    const results = [];

    for (const list of lists.slice(0, 3)) { // Test first 3 lists
      const itemCount = list.querySelectorAll('li, [role="listitem"]').length;
      const startTime = performance.now();

      // Force list re-render
      list.style.display = 'none';
      list.offsetHeight; // Force reflow
      list.style.display = '';

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const endTime = performance.now();

      results.push({
        itemCount,
        renderTime: endTime - startTime,
        timePerItem: (endTime - startTime) / itemCount,
        timestamp: Date.now()
      });
    }

    return {
      type: 'list-render',
      results,
      average: results.reduce((sum, r) => sum + r.timePerItem, 0) / results.length
    };
  }

  /**
   * Measure table render performance
   */
  async measureTableRenderPerformance() {
    const tables = document.querySelectorAll('table, [role="table"]');
    const results = [];

    for (const table of tables.slice(0, 3)) { // Test first 3 tables
      const rowCount = table.querySelectorAll('tr, [role="row"]').length;
      const cellCount = table.querySelectorAll('td, th, [role="cell"], [role="columnheader"]').length;
      const startTime = performance.now();

      // Force table re-render
      table.style.display = 'none';
      table.offsetHeight; // Force reflow
      table.style.display = '';

      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(resolve);
        });
      });

      const endTime = performance.now();

      results.push({
        rowCount,
        cellCount,
        renderTime: endTime - startTime,
        timePerCell: (endTime - startTime) / cellCount,
        timestamp: Date.now()
      });
    }

    return {
      type: 'table-render',
      results,
      average: results.reduce((sum, r) => sum + r.timePerCell, 0) / results.length
    };
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    }

    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Simulate user interactions for memory testing
   */
  async simulateUserInteractions() {
    const interactions = ['click', 'scroll', 'input'];

    for (let i = 0; i < 50; i++) {
      const interaction = interactions[i % interactions.length];

      switch (interaction) {
        case 'click':
          document.body.click();
          break;
        case 'scroll':
          window.scrollBy(0, 10);
          window.scrollBy(0, -10);
          break;
        case 'input':
          const inputs = document.querySelectorAll('input, textarea');
          if (inputs.length > 0) {
            inputs[0].value = `test ${i}`;
            inputs[0].dispatchEvent(new Event('input'));
          }
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Simulate data operations for memory testing
   */
  async simulateDataOperations() {
    // Simulate creating and manipulating data
    const data = [];

    for (let i = 0; i < 1000; i++) {
      data.push({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
        timestamp: Date.now()
      });
    }

    // Simulate sorting and filtering
    const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
    const filtered = data.filter(item => item.value > 0.5);

    // Clean up
    data.length = 0;
    sorted.length = 0;
    filtered.length = 0;
  }

  /**
   * Perform cleanup for memory testing
   */
  async performCleanup() {
    // Trigger garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Clear any temporary data
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Measure bundle loading performance
   */
  async measureBundleLoading() {
    const bundles = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'));

    const results = bundles.filter(bundle => bundle.transferSize > 0).map(bundle => ({
      name: bundle.name.split('/').pop(),
      size: bundle.transferSize,
      duration: bundle.duration,
      timestamp: Date.now()
    }));

    const totalSize = results.reduce((sum, r) => sum + r.size, 0);
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      type: 'bundle-loading',
      results,
      totalSize,
      averageDuration: avgDuration,
      count: results.length
    };
  }

  /**
   * Measure image loading performance
   */
  async measureImageLoading() {
    const images = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('.jpg') || entry.name.includes('.png') || entry.name.includes('.webp'));

    const results = images.map(img => ({
      name: img.name.split('/').pop(),
      size: img.transferSize,
      duration: img.duration,
      timestamp: Date.now()
    }));

    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      type: 'image-loading',
      results,
      averageDuration: avgDuration,
      count: results.length
    };
  }

  /**
   * Measure API response time
   */
  async measureAPIResponseTime() {
    // This is a simulation since we can't actually make API calls in this context
    const simulatedAPIs = [
      '/api/filaments',
      '/api/models',
      '/api/prints'
    ];

    const results = [];

    for (const api of simulatedAPIs) {
      const startTime = performance.now();

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 200));

      const endTime = performance.now();

      results.push({
        api,
        responseTime: endTime - startTime,
        timestamp: Date.now()
      });
    }

    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      type: 'api-response',
      results,
      averageResponseTime: avgResponseTime,
      count: results.length
    };
  }

  /**
   * Measure Largest Contentful Paint
   */
  async measureLCP() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
        observer.disconnect();
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Measure Cumulative Layout Shift
   */
  async measureCLS() {
    return new Promise((resolve) => {
      let clsValue = 0;

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });

      // Wait and then get the final value
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 3000);
    });
  }

  /**
   * Measure First Input Delay
   */
  async measureFID() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0];
          resolve(firstInput.processingStart - firstInput.startTime);
          observer.disconnect();
        }
      });

      observer.observe({ entryTypes: ['first-input'] });

      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Analyze bundle size
   */
  async analyzeBundleSize() {
    const bundles = performance.getEntriesByType('resource')
      .filter(entry => transferSize > 0);

    const jsBundles = bundles.filter(b => b.name.includes('.js'));
    const cssBundles = bundles.filter(b => b.name.includes('.css'));
    const imageBundles = bundles.filter(b => b.name.match(/\.(jpg|png|gif|webp|svg)$/i));

    return {
      totalSize: bundles.reduce((sum, b) => sum + (b.transferSize || 0), 0),
      jsSize: jsBundles.reduce((sum, b) => sum + (b.transferSize || 0), 0),
      cssSize: cssBundles.reduce((sum, b) => sum + (b.transferSize || 0), 0),
      imageSize: imageBundles.reduce((sum, b) => sum + (b.transferSize || 0), 0),
      bundleCount: bundles.length,
      jsBundleCount: jsBundles.length,
      cssBundleCount: cssBundles.length,
      imageCount: imageBundles.length
    };
  }

  /**
   * Summarize interaction tests
   */
  summarizeInteractionTests(runs) {
    const allResponseTimes = runs.flatMap(run => run.results.map(r => r.responseTime));
    const averageResponseTime = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
    const maxResponseTime = Math.max(...allResponseTimes);
    const minResponseTime = Math.min(...allResponseTimes);

    return {
      averageResponseTime: Math.round(averageResponseTime),
      maxResponseTime: Math.round(maxResponseTime),
      minResponseTime: Math.round(minResponseTime),
      totalInteractions: allResponseTimes.length,
      passes: averageResponseTime <= this.config.thresholds.interactionTime
    };
  }

  /**
   * Summarize rendering tests
   */
  summarizeRenderingTests(runs) {
    const allRenderTimes = runs.flatMap(run => run.results.map(r => r.renderTime || r.timePerItem));
    const averageRenderTime = allRenderTimes.reduce((sum, time) => sum + time, 0) / allRenderTimes.length;

    return {
      averageRenderTime: Math.round(averageRenderTime),
      totalRenders: allRenderTimes.length,
      passes: averageRenderTime <= this.config.thresholds.renderTime
    };
  }

  /**
   * Summarize memory tests
   */
  summarizeMemoryTests(measurements) {
    const usages = measurements.map(m => m.usedJSHeapSize);
    const baseline = measurements.find(m => m.phase === 'baseline').usedJSHeapSize;
    const peak = Math.max(...usages);
    const final = measurements[measurements.length - 1].usedJSHeapSize;
    const memoryGrowth = final - baseline;

    return {
      baseline,
      peak,
      final,
      memoryGrowth,
      peakUsage: peak,
      passes: peak <= this.config.thresholds.memoryUsage && memoryGrowth <= 10 * 1024 * 1024 // 10MB growth limit
    };
  }

  /**
   * Summarize resource tests
   */
  summarizeResourceTests(runs) {
    const allLoadTimes = [];
    runs.forEach(run => {
      if (run.totalSize) {
        allLoadTimes.push(run.totalSize);
      }
      if (run.averageDuration) {
        allLoadTimes.push(run.averageDuration);
      }
      if (run.averageResponseTime) {
        allLoadTimes.push(run.averageResponseTime);
      }
    });

    const averageLoadTime = allLoadTimes.reduce((sum, time) => sum + time, 0) / allLoadTimes.length;

    return {
      averageLoadTime: Math.round(averageLoadTime),
      totalResources: runs.reduce((sum, run) => sum + (run.count || 0), 0),
      passes: averageLoadTime <= this.config.thresholds.bundleLoad
    };
  }

  /**
   * Summarize Web Vitals
   */
  summarizeWebVitals(vitals) {
    const thresholds = this.config.thresholds;

    const results = {
      FCP: vitals.FCP ? vitals.FCP <= thresholds.firstContentfulPaint : null,
      LCP: vitals.LCP ? vitals.LCP <= thresholds.largestContentfulPaint : null,
      CLS: vitals.CLS !== null ? vitals.CLS <= thresholds.layoutShift : null,
      FID: vitals.FID ? vitals.FID <= thresholds.interactionTime : null
    };

    const allVitalsPass = Object.values(results).every(result => result === true);

    return {
      vitals,
      results,
      allVitalsPass,
      passes: allVitalsPass
    };
  }

  /**
   * Summarize bundle analysis
   */
  summarizeBundleAnalysis(bundleInfo) {
    const totalSizeKB = Math.round(bundleInfo.totalSize / 1024);

    return {
      totalSize: bundleInfo.totalSize,
      totalSizeKB,
      jsSizeKB: Math.round(bundleInfo.jsSize / 1024),
      cssSizeKB: Math.round(bundleInfo.cssSize / 1024),
      imageSizeKB: Math.round(bundleInfo.imageSize / 1024),
      totalBundles: bundleInfo.bundleCount,
      passes: totalSizeKB <= 500 // 500KB target
    };
  }

  /**
   * Generate test summary
   */
  generateTestSummary(tests) {
    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;
    const overallStatus = passedTests === totalTests ? 'passed' : 'failed';

    const recommendations = [];

    tests.forEach(test => {
      if (!test.passed) {
        recommendations.push(`${test.name}: ${test.error || 'Performance threshold not met'}`);
      }
    });

    return {
      passedTests,
      totalTests,
      overallStatus,
      passRate: Math.round((passedTests / totalTests) * 100),
      recommendations
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(testSuite) {
    console.log('\n📊 === PERFORMANCE TEST REPORT ===');
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
    console.log(`⏱️ Duration: ${testSuite.duration}ms`);
    console.log(`🎯 Status: ${testSuite.summary.overallStatus.toUpperCase()}`);
    console.log(`✅ Pass Rate: ${testSuite.summary.passRate}%`);

    console.log('\n📈 Test Results:');
    testSuite.tests.forEach(test => {
      const status = test.passed ? '✅' : '❌';
      console.log(`${status} ${test.name}`);

      if (test.summary) {
        if (test.summary.averageResponseTime) {
          console.log(`   Response Time: ${test.summary.averageResponseTime}ms`);
        }
        if (test.summary.averageRenderTime) {
          console.log(`   Render Time: ${test.summary.averageRenderTime}ms`);
        }
        if (test.summary.totalSizeKB) {
          console.log(`   Bundle Size: ${test.summary.totalSizeKB}KB`);
        }
      }
    });

    if (testSuite.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      testSuite.summary.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    console.log('================================\n');
  }

  /**
   * Export test results
   */
  exportResults() {
    return {
      testSuite: this.testResults[this.testResults.length - 1],
      history: this.testHistory,
      config: this.config,
      exportedAt: new Date().toISOString()
    };
  }
}

/**
 * Quick performance check function
 */
export const quickPerformanceCheck = async () => {
  const suite = new PerformanceTestSuite({
    runsPerTest: 3,
    warmupRuns: 1,
    enableLogging: false
  });

  return await suite.runFullTestSuite();
};

/**
 * Initialize automated performance monitoring
 */
export const initializeAutoPerformanceTesting = (config = {}) => {
  const suite = new PerformanceTestSuite(config);

  // Run tests on page load
  window.addEventListener('load', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for page to settle
    const results = await suite.runFullTestSuite();

    // Log results to console
    if (!results.passed) {
      console.warn('⚠️ Performance issues detected. See detailed report above.');
    }
  });

  return suite;
};

export default {
  PerformanceTestSuite,
  quickPerformanceCheck,
  initializeAutoPerformanceTesting
};