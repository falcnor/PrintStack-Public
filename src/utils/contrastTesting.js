/**
 * Contrast Testing Utilities for Comprehensive WCAG Compliance Testing
 */

import {
  getContrastRatio,
  meetsContrastAA,
  getAccessibleTextColor,
  validateColorPalette
} from './colorContrast';

/**
 * Test suite for color contrast validation
 */
export class ContrastTestSuite {
  constructor() {
    this.testResults = [];
    this.currentColorPalette = {};
  }

  /**
   * Run comprehensive contrast tests on current theme
   */
  async runFullContrastTest() {
    const results = {
      timestamp: new Date().toISOString(),
      testType: 'comprehensive',
      overall: { passed: 0, failed: 0, total: 0 },
      categories: {
        text: { passed: 0, failed: 0, total: 0, tests: [] },
        interactive: { passed: 0, failed: 0, total: 0, tests: [] },
        boundaries: { passed: 0, failed: 0, total: 0, tests: [] },
        custom: { passed: 0, failed: 0, total: 0, tests: [] }
      },
      paletteValidation: null
    };

    // Get current CSS custom properties
    this.currentColorPalette = this.getCurrentColorPalette();

    if (Object.keys(this.currentColorPalette).length === 0) {
      results.errors = ['Unable to read current color palette'];
      return results;
    }

    // Test text combinations (most critical)
    this.runTextContrastTests(results.categories.text);

    // Test interactive elements
    this.runInteractiveContrastTests(results.categories.interactive);

    // Test boundaries and separators
    this.runBoundaryContrastTests(results.categories.boundaries);

    // Test any custom defined combinations
    this.runCustomContrastTests(results.categories.custom);

    // Calculate overall results
    Object.values(results.categories).forEach(category => {
      results.overall.passed += category.passed;
      results.overall.failed += category.failed;
      results.overall.total += category.total;
    });

    // Validate entire palette
    results.paletteValidation = validateColorPalette(this.currentColorPalette);

    results.overall.passed = results.overall.total - results.overall.failed;

    this.testResults = results;
    return results;
  }

  /**
   * Extract current color palette from CSS custom properties
   */
  getCurrentColorPalette() {
    if (typeof document === 'undefined') return {};

    const styles = getComputedStyle(document.documentElement);
    const colorProperties = [
      '--text-primary',
      '--text-secondary',
      '--text-disabled',
      '--background-primary',
      '--background-secondary',
      '--background-card',
      '--primary-color',
      '--secondary-color',
      '--error-color',
      '--warning-color',
      '--success-color',
      '--border-color',
      '--border-color-light',
      '--focus-color',
      '--hover-color',
      '--link-color',
      '--link-color-visited'
    ];

    const palette = {};
    colorProperties.forEach(prop => {
      const value = styles.getPropertyValue(prop).trim();
      if (value) {
        const key = prop.replace('--', '').replace(/-/g, '');
        palette[key] = value;
      }
    });

    return palette;
  }

  /**
   * Test text contrast combinations
   */
  runTextContrastTests(category) {
    const tests = [
      // Primary text
      {
        name: 'Primary text on primary background',
        foreground: this.currentColorPalette.textprimary,
        background: this.currentColorPalette.backgroundprimary,
        type: 'text',
        size: 'normal'
      },
      {
        name: 'Primary text on secondary background',
        foreground: this.currentColorPalette.textprimary,
        background: this.currentColorPalette.backgroundsecondary,
        type: 'text',
        size: 'normal'
      },
      {
        name: 'Primary text on card background',
        foreground: this.currentColorPalette.textprimary,
        background: this.currentColorPalette.backgroundcard,
        type: 'text',
        size: 'normal'
      },
      // Secondary text
      {
        name: 'Secondary text on primary background',
        foreground: this.currentColorPalette.textsecondary,
        background: this.currentColorPalette.backgroundprimary,
        type: 'text',
        size: 'small'
      },
      {
        name: 'Secondary text on secondary background',
        foreground: this.currentColorPalette.textsecondary,
        background: this.currentColorPalette.backgroundsecondary,
        type: 'text',
        size: 'small'
      },
      // Disabled text
      {
        name: 'Disabled text on primary background',
        foreground: this.currentColorPalette.textdisabled || this.currentColorPalette.textsecondary,
        background: this.currentColorPalette.backgroundprimary,
        type: 'text',
        size: 'small'
      }
    ];

    tests.forEach(test => {
      const result = this.runSingleTest(test);
      category.tests.push(result);
      if (result.passed) {
        category.passed++;
      } else {
        category.failed++;
      }
      category.total++;
    });
  }

  /**
   * Test interactive element contrast
   */
  runInteractiveContrastTests(category) {
    const tests = [
      // Primary buttons
      {
        name: 'Primary button background with white text',
        foreground: '#ffffff',
        background: this.currentColorPalette.primarycolor || '#2563eb',
        type: 'interactive',
        component: 'button-primary'
      },
      {
        name: 'Primary button text on primary background',
        foreground: this.currentColorPalette.primarycolor || '#2563eb',
        background: this.currentColorPalette.backgroundprimary,
        type: 'interactive',
        component: 'button-outline'
      },
      // Secondary buttons
      {
        name: 'Secondary button background with white text',
        foreground: '#ffffff',
        background: this.currentColorPalette.secondarycolor || '#6b7280',
        type: 'interactive',
        component: 'button-secondary'
      },
      // Link text
      {
        name: 'Link text on primary background',
        foreground: this.currentColorPalette.linkcolor || '#2563eb',
        background: this.currentColorPalette.backgroundprimary,
        type: 'interactive',
        component: 'link'
      },
      {
        name: 'Visited link text on primary background',
        foreground: this.currentColorPalette.linkcolorvisited || '#6b21a8',
        background: this.currentColorPalette.backgroundprimary,
        type: 'interactive',
        component: 'link-visited'
      },
      // Form elements
      {
        name: 'Form field text on background',
        foreground: this.currentColorPalette.textprimary,
        background: this.currentColorPalette.backgroundcard,
        type: 'interactive',
        component: 'form-input'
      },
      // Focus indicators
      {
        name: 'Focus indicator on primary background',
        foreground: this.currentColorPalette.focuscolor || '#2563eb',
        background: this.currentColorPalette.backgroundprimary,
        type: 'interactive',
        component: 'focus-indicator'
      }
    ];

    tests.forEach(test => {
      const result = this.runSingleTest(test);
      category.tests.push(result);
      if (result.passed) {
        category.passed++;
      } else {
        category.failed++;
      }
      category.total++;
    });
  }

  /**
   * Test boundary/separator contrast
   */
  runBoundaryContrastTests(category) {
    const tests = [
      {
        name: 'Border on primary background',
        foreground: this.currentColorPalette.bordercolor,
        background: this.currentColorPalette.backgroundprimary,
        type: 'boundary',
        component: 'border'
      },
      {
        name: 'Border on secondary background',
        foreground: this.currentColorPalette.bordercolor,
        background: this.currentColorPalette.backgroundsecondary,
        type: 'boundary',
        component: 'border'
      },
      {
        name: 'Light border on primary background',
        foreground: this.currentColorPalette.bordercolorlight,
        background: this.currentColorPalette.backgroundprimary,
        type: 'boundary',
        component: 'border-light'
      },
      {
        name: 'Separator line on secondary background',
        foreground: this.currentColorPalette.bordercolorlight,
        background: this.currentColorPalette.backgroundsecondary,
        type: 'boundary',
        component: 'separator'
      }
    ];

    tests.forEach(test => {
      const result = this.runSingleBoundaryTest(test);
      category.tests.push(result);
      if (result.boundaryPassed) {
        category.passed++;
      } else {
        category.failed++;
      }
      category.total++;
    });
  }

  /**
   * Test custom color combinations
   */
  runCustomContrastTests(category) {
    const tests = [
      // Error states
      {
        name: 'Error text on primary background',
        foreground: this.currentColorPalette.errorcolor,
        background: this.currentColorPalette.backgroundprimary,
        type: 'custom',
        context: 'error-message'
      },
      // Warning states
      {
        name: 'Warning text on primary background',
        foreground: this.currentColorPalette.warningcolor,
        background: this.currentColorPalette.backgroundprimary,
        type: 'custom',
        context: 'warning-message'
      },
      // Success states
      {
        name: 'Success text on primary background',
        foreground: this.currentColorPalette.successcolor,
        background: this.currentColorPalette.backgroundprimary,
        type: 'custom',
        context: 'success-message'
      },
      // Status indicators
      {
        name: 'Status indicator on card background',
        foreground: this.currentColorPalette.primarycolor,
        background: this.currentColorPalette.backgroundcard,
        type: 'custom',
        context: 'status-badge'
      }
    ];

    tests.forEach(test => {
      const result = this.runSingleTest(test);
      category.tests.push(result);
      if (result.passed) {
        category.passed++;
      } else {
        category.failed++;
      }
      category.total++;
    });
  }

  /**
   * Run individual contrast test
   */
  runSingleTest(test) {
    const { name, foreground, background, type, size = 'normal' } = test;

    if (!foreground || !background) {
      return {
        name,
        type,
        passed: false,
        error: `Missing color values: foreground=${foreground}, background=${background}`,
        ratio: 0,
        required: size === 'large' ? 3.0 : 4.5
      };
    }

    const ratio = getContrastRatio(foreground, background);
    const isLargeText = size === 'large';
    const wcagResult = meetsContrastAA(foreground, background, isLargeText);

    return {
      name,
      type,
      foreground,
      background,
      passed: wcagResult.passes,
      error: null,
      ratio: Math.round(ratio * 100) / 100,
      required: wcagResult.required,
      isLargeText,
      level: wcagResult.passes ? 'AA' : 'FAIL',
      improvements: this.generateImprovements(wcagResult, foreground, background, isLargeText)
    };
  }

  /**
   * Run boundary/separator test (lower requirements)
   */
  runSingleBoundaryTest(test) {
    const { name, foreground, background } = test;

    if (!foreground || !background) {
      return {
        name,
        type: 'boundary',
        boundaryPassed: false,
        error: `Missing color values`,
        ratio: 0
      };
    }

    const ratio = getContrastRatio(foreground, background);
    // Boundaries have lower requirements but should still be distinguishable
    const minimumRatio = 1.5;

    return {
      name,
      type: 'boundary',
      foreground,
      background,
      boundaryPassed: ratio >= minimumRatio,
      error: null,
      ratio: Math.round(ratio * 100) / 100,
      minimum: minimumRatio
    };
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovements(wcagResult, foreground, background, isLargeText) {
    if (wcagResult.passes) return [];

    const improvements = [];
    const currentRatio = getContrastRatio(foreground, background);
    const targetRatio = isLargeText ? 3.0 : 4.5;

    // Suggest alternative foreground colors
    const betterForegrounds = [
      '#000000',
      '#ffffff',
      '#1f2937',
      '#374151',
      '#111827'
    ].filter(color => {
      const test = meetsContrastAA(color, background, isLargeText);
      return test.passes && getContrastRatio(color, background) > currentRatio;
    });

    betterForegrounds.forEach(color => {
      improvements.push({
        type: 'foreground',
        color,
        ratio: Math.round(getContrastRatio(color, background) * 100) / 100,
        improvement: Math.round((getContrastRatio(color, background) - currentRatio) * 100) / 100
      });
    });

    // Suggest alternative background colors if staying with current foreground
    const betterBackgrounds = [
      '#ffffff',
      '#f8fafc',
      '#f9fafb',
      '#1f2937',
      '#111827'
    ].filter(color => {
      const test = meetsContrastAA(foreground, color, isLargeText);
      return test.passes && getContrastRatio(foreground, color) > currentRatio;
    });

    betterBackgrounds.forEach(color => {
      improvements.push({
        type: 'background',
        color,
        ratio: Math.round(getContrastRatio(foreground, color) * 100) / 100,
        improvement: Math.round((getContrastRatio(foreground, color) - currentRatio) * 100) / 100
      });
    });

    // Sort by improvement amount
    improvements.sort((a, b) => b.improvement - a.improvement);

    return improvements.slice(0, 3); // Return top 3 improvements
  }

  /**
   * Generate accessibility report
   */
  generateReport() {
    if (!this.testResults || this.testResults.length === 0) {
      return { error: 'No test results available' };
    }

    const results = Array.isArray(this.testResults) ? this.testResults[0] : this.testResults;

    const report = {
      summary: {
        timestamp: results.timestamp,
        overallScore: Math.round((results.overall.passed / results.overall.total) * 100),
        totalTests: results.overall.total,
        passedTests: results.overall.passed,
        failedTests: results.overall.failed,
        wcagCompliance: results.overall.failed === 0 ? 'AA' : 'Fail'
      },
      categoryBreakdown: {},
      criticalIssues: [],
      recommendations: []
    };

    // Analyze each category
    Object.entries(results.categories).forEach(([categoryName, category]) => {
      const score = Math.round((category.passed / category.total) * 100);
      report.categoryBreakdown[categoryName] = {
        score,
        passed: category.passed,
        failed: category.failed,
        total: category.total
      };

      // Collect critical issues (failing tests)
      const criticalTests = category.tests.filter(test => !test.passed);
      criticalTests.forEach(test => {
        report.criticalIssues.push({
          category: categoryName,
          test: test.name,
          currentRatio: test.ratio,
          requiredRatio: test.required,
          gap: Math.round((test.required - test.ratio) * 100) / 100,
          improvements: test.improvements
        });
      });
    });

    // Generate recommendations
    if (results.overall.failed > 0) {
      const lowestRatios = report.criticalIssues
        .sort((a, b) => (a.requiredRatio - a.currentRatio) - (b.requiredRatio - b.currentRatio))
        .slice(0, 5);

      report.recommendations.push({
        priority: 'high',
        title: 'Address critical contrast failures',
        description: `The following combinations have the largest contrast gaps and should be prioritized:`,
        items: lowestRatios.map(issue =>
          `${issue.test}: current ${issue.currentRatio}:1, needs ${issue.requiredRatio}:1`
        )
      });
    }

    if (results.paletteValidation && !results.paletteValidation.overallPasses) {
      report.recommendations.push({
        priority: 'medium',
        title: 'Review overall color palette',
        description: 'Some color combinations in your palette fail WCAG AA standards',
        items: results.paletteValidation.failingCombinations.map(fail =>
          `${fail.label}: ${fail.ratio}:1 (needs ${fail.required}:1)`
        )
      });
    }

    return report;
  }

  /**
   * Export test results to various formats
   */
  exportResults(format = 'json') {
    if (!this.testResults) {
      throw new Error('No test results to export');
    }

    const results = Array.isArray(this.testResults) ? this.testResults[0] : this.testResults;
    const report = this.generateReport();

    switch (format) {
      case 'json':
        return JSON.stringify({ results, report }, null, 2);

      case 'csv': {
        const headers = ['Test Name', 'Type', 'Foreground', 'Background', 'Ratio', 'Required', 'Status'];
        const rows = results.categories.text.tests
          .concat(...Object.values(results.categories).map(cat => cat.tests))
          .map(test => [
            test.name,
            test.type,
            test.foreground || '',
            test.background || '',
            test.ratio,
            test.required || test.minimum || '',
            test.passed !== false && test.boundaryPassed !== false ? 'PASS' : 'FAIL'
          ]);

        return [headers, ...rows]
          .map(row => row.map(cell => `"${cell}"`).join(','))
          .join('\n');
      }

      case 'html':
        return this.generateHTMLReport(results, report);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(results, report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WCAG Contrast Test Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; margin-bottom: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .metric { background: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
    .metric-value { font-size: 2rem; font-weight: bold; color: ${report.summary.overallScore >= 90 ? '#059669' : '#dc2626'}; }
    .metric-label { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    .category { margin-bottom: 2rem; }
    .category-header { font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem; }
    .tests-table { width: 100%; border-collapse: collapse; }
    .tests-table th, .tests-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .tests-table th { background: #f9fafb; font-weight: 600; }
    .pass { background: #d1fae5; color: #065f46; }
    .fail { background: #fee2e2; color: #991b1b; }
    .color-preview { display: inline-block; width: 20px; height: 20px; border-radius: 4px; border: 1px solid #d1d5db; margin-right: 0.5rem; vertical-align: middle; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WCAG Contrast Test Report</h1>
    <p>Generated: ${report.summary.timestamp}</p>
  </div>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${report.summary.overallScore}%</div>
      <div class="metric-label">Score</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.passedTests}/${report.summary.totalTests}</div>
      <div class="metric-label">Tests Passed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${report.summary.wcagCompliance}</div>
      <div class="metric-label">WCAG Compliance</div>
    </div>
  </div>

  ${Object.entries(results.categories).map(([categoryName, category]) => `
    <div class="category">
      <div class="category-header">${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} (${report.categoryBreakdown[categoryName].score}%)</div>
      <table class="tests-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Colors</th>
            <th>Ratio</th>
            <th>Required</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${category.tests.map(test => `
            <tr class="${test.passed !== false && test.boundaryPassed !== false ? 'pass' : 'fail'}">
              <td>${test.name}</td>
              <td>
                ${test.foreground ? `<span class="color-preview" style="background: ${test.foreground}"></span>${test.foreground}` : 'N/A'}
                ${test.background ? `<span class="color-preview" style="background: ${test.background}"></span>${test.background}` : ''}
              </td>
              <td>${test.ratio}:1</td>
              <td>${test.required || test.minimum || 'N/A'}:1</td>
              <td>${test.passed !== false && test.boundaryPassed !== false ? 'PASS' : 'FAIL'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  ${report.recommendations.length > 0 ? `
    <div class="category">
      <div class="category-header">Recommendations</div>
      ${report.recommendations.map(rec => `
        <div style="margin-bottom: 1.5rem; padding: 1rem; background: #fef3c7; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #92400e;">${rec.title}</h3>
          <p style="margin-bottom: 0.5rem; color: #78350f;">${rec.description}</p>
          <ul style="margin: 0; color: #78350f;">
            ${rec.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
  ` : ''}

</body>
</html>`;
  }
}

// Singleton instance for global use
export const contrastTestSuite = new ContrastTestSuite();

// Convenience functions
export const runContrastTest = () => contrastTestSuite.runFullContrastTest();
export const generateContrastReport = () => contrastTestSuite.generateReport();
export const exportContrastResults = (format) => contrastTestSuite.exportResults(format);

export default {
  ContrastTestSuite,
  contrastTestSuite,
  runContrastTest,
  generateContrastReport,
  exportContrastResults
};