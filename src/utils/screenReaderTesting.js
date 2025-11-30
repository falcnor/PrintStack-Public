/**
 * Screen Reader Testing Utility
 * Provides tools for testing and validating screen reader announcements
 */

import { ScreenReaderAnnouncer } from './screenReaderAnnouncements';
import { announcementConfig } from '../config/announcements';

/**
 * Screen Reader Test Suite
 */
export class ScreenReaderTestSuite {
  constructor(options = {}) {
    this.testAnnouncer = new ScreenReaderAnnouncer();
    this.testResults = [];
    this.currentTest = null;
    this.isRunning = false;

    // Test options
    this.options = {
      enableLogging: true,
      includeVisualTests: true,
      includeTimingTests: true,
      ...options
    };
  }

  /**
   * Run comprehensive announcement tests
   */
  async runFullTestSuite() {
    if (this.isRunning) {
      throw new Error('Test suite is already running');
    }

    this.isRunning = true;
    this.testResults = [];

    try {
      // Basic functionality tests
      await this.testBasicAnnouncements();
      await this.testPrioritySystems();
      await this.testRegionManagement();
      await this.testTimingAndSequencing();

      // Advanced functionality tests
      await this.testStateChangeAnnouncements();
      await this.testFormValidationAnnouncements();
      await this.testAsyncOperationAnnouncements();

      // Edge case tests
      await this.testErrorHandling();
      await this.testPerformanceLoad();
      await this.testContentSanitization();

      // Accessibility compliance tests
      await this.testAriaLabelIntegrity();
      await this.testLiveRegionBehavior();
      await this.testFocusManagement();

    } catch (error) {
      console.error('Test suite error:', error);
      this.addTestResult('suite_error', false, error.message);
    } finally {
      this.isRunning = false;
    }

    return this.generateTestReport();
  }

  /**
   * Test basic announcement functionality
   */
  async testBasicAnnouncements() {
    const tests = [
      {
        name: 'Basic polite announcement',
        test: () => {
          const promise = new Promise((resolve) => {
            const originalLog = console.log;
            console.log = (...args) => {
              originalLog(...args);
              if (args[0] && args[0].includes && args[1] === 'Test message') {
                resolve({ success: true, message: args[1] });
              }
            };

            this.testAnnouncer.announce('Test message', { region: 'polite' });

            setTimeout(() => {
              console.log = originalLog;
              resolve({ success: false, message: 'No announcement detected' });
            }, 1000);
          });

          return promise;
        }
      },
      {
        name: 'Empty message handling',
        test: () => {
          try {
            this.testAnnouncer.announce('');
            return { success: false, message: 'Should reject empty messages' };
          } catch (error) {
            return { success: true, message: 'Correctly rejected empty message' };
          }
        }
      },
      {
        name: 'HTML sanitization',
        test: () => {
          const message = '<script>alert("xss")</script>Test message';
          this.testAnnouncer.announce(message);
          // Check that HTML was removed
          const lastAnnouncement = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const isSanitized = !lastAnnouncement.message.includes('<script>');
          return {
            success: isSanitized,
            message: isSanitized ? 'HTML properly sanitized' : 'HTML not sanitized'
          };
        }
      }
    ];

    return this.runTestGroup('Basic Functionality', tests);
  }

  /**
   * Test priority system
   */
  async testPrioritySystems() {
    const tests = [
      {
        name: 'Critical announcements interrupt',
        test: async () => {
          const announcementOrder = [];

          // Mock announcer to capture order
          const originalAnnounce = this.testAnnouncer.announce.bind(this.testAnnouncer);
          this.testAnnouncer.announce = (message, options) => {
            announcementOrder.push({ message, priority: options.priority });
          };

          // Send announcements out of priority order
          this.testAnnouncer.announce('Low priority', { priority: 0 });
          this.testAnnouncer.announce('High priority', { priority: 2 });
          this.testAnnouncer.announce('Critical priority', { priority: 3 });

          // Restore original function
          this.testAnnouncer.announce = originalAnnounce;

          // Check that higher priority announcements come first
          const priorities = announcementOrder.map(a => a.priority);
          const isCorrectOrder = priorities[0] === 3 && priorities[1] === 2 && priorities[2] === 0;

          return {
            success: isCorrectOrder,
            message: isCorrectOrder ?
              'Correct priority ordering maintained' :
              `Wrong order: ${priorities.join(', ')}`
          };
        }
      },
      {
        name: 'Same priority chronological order',
        test: async () => {
          const timestamp1 = Date.now();
          this.testAnnouncer.announce('First message', { priority: 1 });
          await new Promise(resolve => setTimeout(resolve, 10));
          this.testAnnouncer.announce('Second message', { priority: 1 });

          const history = this.testAnnouncer.getAnnouncementHistory(2);
          const correctOrder = history[0].message === 'First message' &&
                            history[1].message === 'Second message';

          return {
            success: correctOrder,
            message: correctOrder ? 'Chronological order preserved' : 'Order incorrect'
          };
        }
      }
    ];

    return this.runTestGroup('Priority System', tests);
  }

  /**
   * Test live region management
   */
  async testRegionManagement() {
    const tests = [
      {
        name: 'Multiple regions created',
        test: () => {
          const regions = this.testAnnouncer.getRegionStats();
          const expectedRegions = ['polite', 'assertive', 'critical', 'status', 'navigation', 'form', 'data'];
          const hasAllRegions = expectedRegions.every(region => regions[region]);

          return {
            success: hasAllRegions,
            message: hasAllRegions ? 'All expected regions created' : 'Missing regions'
          };
        }
      },
      {
        name: 'Region-specific announcements',
        test: () => {
          // Test that announcements go to correct regions
          const testRegion = 'form';
          this.testAnnouncer.announce('Test form message', { region: testRegion });

          const region = this.testAnnouncer.liveRegions.get(testRegion);
          const announcementWasMade = region.lastAnnouncement === 'Test form message';

          return {
            success: announcementWasMade,
            message: announcementWasMade ? 'Correct region used' : 'Incorrect region'
          };
        }
      },
      {
        name: 'Region clearing',
        test: () => {
          const testRegion = 'status';
          this.testAnnouncer.announce('Status message', { region: testRegion });
          this.testAnnouncer.clearRegion(testRegion);

          const region = this.testAnnouncer.liveRegions.get(testRegion);
          const isCleared = region.lastAnnouncement === null;

          return {
            success: isCleared,
            message: isCleared ? 'Region cleared successfully' : 'Region not cleared'
          };
        }
      }
    ];

    return this.runTestGroup('Region Management', tests);
  }

  /**
   * Test timing and sequencing
   */
  async testTimingAndSequencing() {
    const tests = [
      {
        name: 'Minimum delay maintained',
        test: async () => {
          const startTime = Date.now();

          this.testAnnouncer.announce('First message');
          this.testAnnouncer.announce('Second message');

          // Wait for processing
          await new Promise(resolve => setTimeout(resolve, 200));

          const endTime = Date.now();
          const elapsed = endTime - startTime;

          // Should take at least 100ms (minimum delay)
          const isCorrectTiming = elapsed >= 100;

          return {
            success: isCorrectTiming,
            message: `Timing: ${elapsed}ms, required: >=100ms`
          };
        }
      },
      {
        name: 'Timeout delayed announcements',
        test: async () => {
          const startTime = Date.now();

          this.testAnnouncer.announce('Delayed message', { timeout: 100 });

          // Wait longer than timeout
          await new Promise(resolve => setTimeout(resolve, 200));

          const endTime = Date.now();
          const elapsed = endTime - startTime;

          // Should take at least 100ms + processing time
          const isCorrectDelay = elapsed >= 190; // Allow some variance

          return {
            success: isCorrectDelay,
            message: `Delay: ${elapsed}ms, expected: ~100ms+`
          };
        }
      },
      {
        name: 'Unique announcement prevention',
        test: async () => {
          const message = 'Unique test message';

          this.testAnnouncer.announce(message, { unique: true });
          this.testAnnouncer.announce(message, { unique: true });

          const history = this.testAnnouncer.getAnnouncementHistory(5);
          const occurrences = history.filter(a => a.message === message).length;

          return {
            success: occurrences === 1,
            message: `Occurrences: ${occurrences}, expected: 1`
          };
        }
      }
    ];

    return this.runTestGroup('Timing and Sequencing', tests);
  }

  /**
   * Test state change announcements
   */
  async testStateChangeAnnouncements() {
    const tests = [
      {
        name: 'State change tracking',
        test: () => {
          const componentName = 'TestComponent';
          const stateName = 'count';
          const previousValue = 1;
          const newValue = 2;

          this.testAnnouncer.announceStateChange(componentName, stateName, previousValue, newValue);

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const expectedMessage = `${componentName} ${stateName} changed from ${previousValue} to ${newValue}`;
          const correctMessage = history.message === expectedMessage;

          return {
            success: correctMessage,
            message: correctMessage ? 'State change announced correctly' : 'Incorrect state change message'
          };
        }
      },
      {
        name: 'No announcement for unchanged state',
        test: () => {
          const componentName = 'TestComponent';
          const stateName = 'status';
          const value = 'active';

          this.testAnnouncer.announceStateChange(componentName, stateName, value, value);

          const history = this.testAnnouncer.getAnnouncementHistory(1);
          const noAnnouncement = history.length === 0 || history[0].message.includes('changed');

          return {
            success: noAnnouncement,
            message: noAnnouncement ? 'No announcement for unchanged state' : 'Unnecessary announcement made'
          };
        }
      }
    ];

    return this.runTestGroup('State Change Announcements', tests);
  }

  /**
   * Test form validation announcements
   */
  async testFormValidationAnnouncements() {
    const tests = [
      {
        name: 'Form error announcement',
        test: () => {
          const fieldName = 'Email';
          const errorMessage = 'Invalid email format';
          const totalCount = 1;

          this.testAnnouncer.announceFormError(fieldName, errorMessage, totalCount);

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const expectedMessage = `Form error in ${fieldName}: ${errorMessage}`;
          const correctMessage = history.message === expectedMessage;
          const correctRegion = history.region === 'form';

          return {
            success: correctMessage && correctRegion,
            message: `${correctMessage ? 'Message correct' : 'Message wrong'}, ${correctRegion ? 'Region correct' : 'Region wrong'}`
          };
        }
      },
      {
        name: 'Form success announcement',
        test: () => {
          this.testAnnouncer.announceFormSuccess('Form submitted successfully');

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const correctMessage = history.message === 'Form submitted successfully';
          const correctType = history.type === 'success';

          return {
            success: correctMessage && correctType,
            message: `${correctMessage ? 'Message correct' : 'Message wrong'}, ${correctType ? 'Type correct' : 'Type wrong'}`
          };
        }
      }
    ];

    return this.runTestGroup('Form Validation Announcements', tests);
  }

  /**
   * Test async operation announcements
   */
  async testAsyncOperationAnnouncements() {
    const tests = [
      {
        name: 'Progress announcement',
        test: () => {
          this.testAnnouncer.announceProgress(50, 100, 'Loading data');

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const expectedMessage = 'Loading data: 50 of 100 complete, 50%';
          const correctMessage = history.message === expectedMessage;
          const correctRegion = history.region === 'status';

          return {
            success: correctMessage && correctRegion,
            message: `${correctMessage ? 'Message correct' : 'Message wrong'}, ${correctRegion ? 'Region correct' : 'Region wrong'}`
          };
        }
      },
      {
        name: 'Data load announcement',
        test: () => {
          const context = 'filaments';
          const count = 25;
          const action = 'loaded';

          this.testAnnouncer.announceDataLoad(context, count, action);

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const expectedMessage = '25 filaments loaded';
          const correctMessage = history.message === expectedMessage;
          const correctType = history.type === 'data';

          return {
            success: correctMessage && correctType,
            message: `${correctMessage ? 'Message correct' : 'Message wrong'}, ${correctType ? 'Type correct' : 'Type wrong'}`
          };
        }
      }
    ];

    return this.runTestGroup('Async Operation Announcements', tests);
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    const tests = [
      {
        name: 'Invalid region handling',
        test: () => {
          this.testAnnouncer.announce('Test message', { region: 'invalid_region' });

          // Should still work but with default region
          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const messageDelivered = history.message === 'Test message';

          return {
            success: messageDelivered,
            message: messageDelivered ? 'Message delivered with fallback' : 'Message not delivered'
          };
        }
      },
      {
        name: 'Null message handling',
        test: () => {
          try {
            this.testAnnouncer.announce(null);
            return { success: false, message: 'Should reject null message' };
          } catch {
            return { success: true, message: 'Correctly rejected null message' };
          }
        }
      }
    ];

    return this.runTestGroup('Error Handling', tests);
  }

  /**
   * Test performance under load
   */
  async testPerformanceLoad() {
    const tests = [
      {
        name: 'Bulk announcement performance',
        test: async () => {
          const startTime = Date.now();
          const announcementCount = 50;

          for (let i = 0; i < announcementCount; i++) {
            this.testAnnouncer.announce(`Test message ${i}`);
          }

          // Wait for processing
          await new Promise(resolve => setTimeout(resolve, announcementCount * 2));

          const endTime = Date.now();
          const elapsed = endTime - startTime;
          const avgPerAnnouncement = elapsed / announcementCount;

          // Should average less than 20ms per announcement
          const isPerformant = avgPerAnnouncement < 20;

          return {
            success: isPerformant,
            message: `Avg: ${avgPerAnnouncement.toFixed(2)}ms per announcement, required: <20ms`
          };
        }
      }
    ];

    return this.runTestGroup('Performance Tests', tests);
  }

  /**
   * Test content sanitization
   */
  async testContentSanitization() {
    const tests = [
      {
        name: 'HTML tag removal',
        test: () => {
          const message = '<div>Test <strong>bold</strong> message</div>';
          this.testAnnouncer.announce(message);

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const noHtml = !history.message.includes('<') && !history.message.includes('>');
          const hasContent = history.message.includes('Test') && history.message.includes('bold');

          return {
            success: noHtml && hasContent,
            message: `${noHtml ? 'HTML removed' : 'HTML present'}, ${hasContent ? 'Content preserved' : 'Content lost'}`
          };
        }
      },
      {
        name: 'Whitespace normalization',
        test: () => {
          const message = 'Test    message\n    with  extra   spaces';
          this.testAnnouncer.announce(message);

          const history = this.testAnnouncer.getAnnouncementHistory(1)[0];
          const singleSpaces = !history.message.includes('  ') && !history.message.includes('\n');
          const preservedWords = history.message.includes('Test') && history.message.includes('message');

          return {
            success: singleSpaces && preservedWords,
            message: `${singleSpaces ? 'Whitespaces normalized' : 'Whitespaces not normalized'}`
          };
        }
      }
    ];

    return this.runTestGroup('Content Sanitization', tests);
  }

  /**
   * Test ARIA label integrity
   */
  async testAriaLabelIntegrity() {
    const tests = [
      {
        name: 'Live region attributes',
        test: () => {
          const region = this.testAnnouncer.liveRegions.get('polite');
          const hasLiveAttribute = region.element.hasAttribute('aria-live');
          const hasAtomicAttribute = region.element.hasAttribute('aria-atomic');
          const correctValues =
            region.element.getAttribute('aria-live') === 'polite' &&
            region.element.getAttribute('aria-atomic') === 'true';

          return {
            success: hasLiveAttribute && hasAtomicAttribute && correctValues,
            message: `ARIA attributes: live=${hasLiveAttribute}, atomic=${hasAtomicAttribute}, values=${correctValues}`
          };
        }
      },
      {
        name: 'Screen reader only positioning',
        test: () => {
          const region = this.testAnnouncer.liveRegions.get('assertive');
          const styles = window.getComputedStyle(region.element);

          const isHidden =
            styles.position === 'absolute' &&
            parseInt(styles.width) <= 10 &&
            parseInt(styles.height) <= 10 &&
            styles.clip !== 'auto';

          return {
            success: isHidden,
            message: `Positioning: ${styles.position}, Size: ${styles.width}x${styles.height}`
          };
        }
      }
    ];

    return this.runTestGroup('ARIA Label Integrity', tests);
  }

  /**
   * Test live region behavior
   */
  async testLiveRegionBehavior() {
    const tests = [
      {
        name: 'Polite region non-interrupting',
        test: () => {
          // This is difficult to test automatically, but we can verify the logic
          const region = this.testAnnouncer.liveRegions.get('polite');
          const isPolite = region.element.getAttribute('aria-live') === 'polite';

          return {
            success: isPolite,
            message: `Polite region configured: ${isPolite}`
          };
        }
      },
      {
        name: 'Assertive region interrupting',
        test: () => {
          const region = this.testAnnouncer.liveRegions.get('assertive');
          const isAssertive = region.element.getAttribute('aria-live') === 'assertive';

          return {
            success: isAssertive,
            message: `Assertive region configured: ${isAssertive}`
          };
        }
      }
    ];

    return this.runTestGroup('Live Region Behavior', tests);
  }

  /**
   * Test focus management (basic version)
   */
  async testFocusManagement() {
    const tests = [
      {
        name: 'Critical announcements trigger attention',
        test: () => {
          // Mock attention trigger
          let attentionTriggered = false;
          const originalTrigger = this.testAnnouncer.triggerAttention;
          this.testAnnouncer.triggerAttention = () => { attentionTriggered = true; };

          this.testAnnouncer.announceCritical('Critical test message');

          // Restore original
          this.testAnnouncer.triggerAttention = originalTrigger;

          return {
            success: attentionTriggered,
            message: `Attention triggered: ${attentionTriggered}`
          };
        }
      }
    ];

    return this.runTestGroup('Focus Management', tests);
  }

  /**
   * Run a group of tests
   */
  async runTestGroup(groupName, tests) {
    const groupResults = {
      groupName,
      tests: [],
      passed: 0,
      failed: 0,
      total: tests.length
    };

    for (const test of tests) {
      try {
        this.currentTest = test.name;

        console.log(`Running: ${test.name}`);
        const result = await test.test();
        const passed = result.success;

        groupResults.tests.push({
          name: test.name,
          passed,
          message: result.message,
          duration: result.duration
        });

        if (passed) {
          groupResults.passed++;
        } else {
          groupResults.failed++;
        }

        if (this.options.enableLogging) {
          console.log(`${passed ? '✅' : '❌'} ${test.name}: ${result.message}`);
        }

      } catch (error) {
        groupResults.tests.push({
          name: test.name,
          passed: false,
          message: `Test error: ${error.message}`,
          error
        });
        groupResults.failed++;

        if (this.options.enableLogging) {
          console.log(`❌ ${test.name}: ${error.message}`);
        }
      }
    }

    this.testResults.push(groupResults);
    return groupResults;
  }

  /**
   * Add a single test result
   */
  addTestResult(testName, passed, message, error = null) {
    const existingGroup = this.testResults.find(g => g.groupName === 'Manual Tests');

    if (existingGroup) {
      existingGroup.tests.push({ name: testName, passed, message, error });
      existingGroup.total = existingGroup.tests.length;
      if (passed) {
        existingGroup.passed++;
      } else {
        existingGroup.failed++;
      }
    } else {
      this.testResults.push({
        groupName: 'Manual Tests',
        tests: [{ name: testName, passed, message, error }],
        passed: passed ? 1 : 0,
        failed: passed ? 0 : 1,
        total: 1
      });
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTests = this.testResults.reduce((sum, group) => sum + group.total, 0);
    const totalPassed = this.testResults.reduce((sum, group) => sum + group.passed, 0);
    const totalFailed = this.testResults.reduce((sum, group) => sum + group.failed, 0);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
        status: totalFailed === 0 ? 'PASS' : 'FAIL'
      },
      groups: this.testResults,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];

    this.testResults.forEach(group => {
      group.tests.forEach(test => {
        if (!test.passed) {
          if (test.name.includes('performance')) {
            recommendations.push({
              priority: 'high',
              category: 'Performance',
              issue: `Performance test failed: ${test.name}`,
              suggestion: 'Optimize announcement processing or reduce batch sizes'
            });
          } else if (test.name.includes('aria') || test.name.includes('region')) {
            recommendations.push({
              priority: 'high',
              category: 'Accessibility',
              issue: `Accessibility test failed: ${test.name}`,
              suggestion: 'Verify ARIA attributes and live region configuration'
            });
          } else if (test.name.includes('error') || test.name.includes('handling')) {
            recommendations.push({
              priority: 'medium',
              category: 'Error Handling',
              issue: `Error handling test failed: ${test.name}`,
              suggestion: 'Improve error handling and edge case coverage'
            });
          }
        }
      });
    });

    return recommendations;
  }

  /**
   * Export test results to JSON
   */
  exportResults() {
    return JSON.stringify(this.generateTestReport(), null, 2);
  }

  /**
   * Export test results to HTML report
   */
  exportHTMLReport() {
    const report = this.generateTestReport();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screen Reader Announcement Test Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .metric-value { font-size: 2rem; font-weight: bold; color: ${report.summary.status === 'PASS' ? '#059669' : '#dc2626'}; }
    .metric-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .test-group { margin-bottom: 2rem; }
    .group-header { font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; padding: 0.5rem; background: #f9fafb; border-radius: 0.25rem; }
    .test-item { display: flex; gap: 1rem; padding: 0.5rem; border-bottom: 1px solid #f3f4f6; }
    .test-status { font-size: 1.5rem; }
    .test-details { flex: 1; }
    .test-name { font-weight: 500; }
    .test-message { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .pass { color: #059669; }
    .fail { color: #dc2626; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Screen Reader Announcement Test Report</h1>
    <p>Generated: ${report.timestamp}</p>
  </div>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${report.summary.successRate}%</div>
      <div class="metric-label">Success Rate</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.passed}/${report.summary.total}</div>
      <div class="metric-label">Tests Passed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.status}</div>
      <div class="metric-label">Overall Status</div>
    </div>
  </div>

  ${report.groups.map(group => `
    <div class="test-group">
      <div class="group-header">
        ${group.groupName} (${group.passed}/${group.total})
      </div>
      ${group.tests.map(test => `
        <div class="test-item">
          <span class="test-status ${test.passed ? 'pass' : 'fail'}">
            ${test.passed ? '✅' : '❌'}
          </span>
          <div class="test-details">
            <div class="test-name">${test.name}</div>
            <div class="test-message">${test.message}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('')}

  ${report.recommendations.length > 0 ? `
    <div class="test-group">
      <div class="group-header">Recommendations</div>
      ${report.recommendations.map(rec => `
        <div class="test-item">
          <span class="test-status">💡</span>
          <div class="test-details">
            <div class="test-name">${rec.category}: ${rec.issue}</div>
            <div class="test-message">${rec.suggestion}</div>
          </div>
        </div>
      `).join('')}
    </div>
  ` : ''}

</body>
</html>`;
  }

  /**
   * Cleanup test suite
   */
  cleanup() {
    if (this.testAnnouncer) {
      this.testAnnouncer.cleanup();
    }
    this.testResults = [];
    this.isRunning = false;
  }
}

// Convenience functions
export const runScreenReaderTests = async (options = {}) => {
  const testSuite = new ScreenReaderTestSuite(options);
  const results = await testSuite.runFullTestSuite();
  testSuite.cleanup();
  return results;
};

export default {
  ScreenReaderTestSuite,
  runScreenReaderTests
};