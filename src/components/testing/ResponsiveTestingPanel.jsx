import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ResponsiveTestSuite, DEVICE_VIEWPORTS, checkViewport } from '../../utils/responsiveTesting';
import styles from './ResponsiveTestingPanel.module.css';

/**
 * Responsive Testing Panel Component
 * Provides UI for testing responsive design across different device sizes
 */
const ResponsiveTestingPanel = ({ visible = false, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentViewport, setCurrentViewport] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  const responsiveTestSuite = React.useRef(new ResponsiveTestSuite({
    includeVisualTests: true,
    includePerformanceTests: true
  }));

  useEffect(() => {
    if (visible) {
      // Get current viewport info
      const viewportInfo = checkViewport();
      setCurrentViewport(viewportInfo);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (responsiveTestSuite.current) {
        responsiveTestSuite.current.cleanup();
      }
    };
  }, []);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults(null);

    try {
      let results;
      if (selectedDevice) {
        // Test specific device
        const viewport = DEVICE_VIEWPORTS[selectedDevice];
        const deviceResult = await responsiveTestSuite.current.testViewport(selectedDevice, viewport);
        results = {
          timestamp: new Date().toISOString(),
          viewports: { [selectedDevice]: deviceResult },
          summary: {
            total: deviceResult.tests.total,
            passed: deviceResult.tests.passed,
            failed: deviceResult.tests.failed,
            successRate: Math.round((deviceResult.tests.passed / deviceResult.tests.total) * 100),
            status: deviceResult.tests.failed === 0 ? 'PASS' : 'FAIL'
          },
          issues: deviceResult.issues || [],
          recommendations: []
        };
      } else {
        // Test all devices or by category
        const allResults = await responsiveTestSuite.current.runFullResponsiveTests();

        if (selectedCategory !== 'all') {
          // Filter by category
          const filteredViewports = {};
          Object.entries(allResults.viewports).forEach(([key, viewport]) => {
            if (viewport.viewport.category === selectedCategory) {
              filteredViewports[key] = viewport;
            }
          });

          results = {
            ...allResults,
            viewports: filteredViewports
          };

          // Recalculate summary for filtered results
          let total = 0, passed = 0, failed = 0;
          Object.values(filteredViewports).forEach(viewport => {
            total += viewport.tests.total;
            passed += viewport.tests.passed;
            failed += viewport.tests.failed;
          });

          results.summary = {
            total,
            passed,
            failed,
            successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
            status: failed === 0 ? 'PASS' : 'FAIL'
          };
        } else {
          results = allResults;
        }
      }

      setTestResults(results);
    } catch (error) {
      console.error('Responsive tests failed:', error);
      setTestResults({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    if (!testResults || testResults.error) return;

    let content;
    let fileName;

    switch (exportFormat) {
      case 'html':
        content = responsiveTestSuite.current.generateHTMLReport(testResults);
        fileName = `responsive-test-report-${Date.now()}.html`;
        break;
      case 'json':
      default:
        content = JSON.stringify(testResults, null, 2);
        fileName = `responsive-test-results-${Date.now()}.json`;
        break;
    }

    const blob = new Blob([content], {
      type: exportFormat === 'html' ? 'text/html' : 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFilteredViewports = () => {
    if (!testResults || !testResults.viewports) return [];

    return Object.entries(testResults.viewports)
      .filter(([key]) => selectedCategory === 'all' || testResults.viewports[key].viewport.category === selectedCategory)
      .sort(([a], [b]) => {
        const categoryOrder = { mobile: 0, tablet: 1, desktop: 2 };
        const catA = testResults.viewports[a].viewport.category;
        const catB = testResults.viewports[b].viewport.category;
        if (categoryOrder[catA] !== categoryOrder[catB]) {
          return categoryOrder[catA] - categoryOrder[catB];
        }
        return testResults.viewports[a].viewport.width - testResults.viewports[b].viewport.width;
      });
  };

  const getDeviceCategories = () => {
    const categories = ['all'];
    Object.values(DEVICE_VIEWPORTS).forEach(device => {
      if (!categories.includes(device.category)) {
        categories.push(device.category);
      }
    });
    return categories;
  };

  const renderViewportCard = ([key, viewportResult]) => {
    const viewport = viewportResult.viewport;
    const hasError = viewportResult.error;
    const passRate = viewportResult.tests ? Math.round((viewportResult.tests.passed / viewportResult.tests.total) * 100) : 0;
    const hasFailures = viewportResult.tests && viewportResult.tests.failed > 0;

    return (
      <div
        key={key}
        className={`${styles.viewportCard} ${hasFailures ? styles.hasFailures : ''} ${hasError ? styles.hasError : ''}`}
        onClick={() => setSelectedDevice(key === selectedDevice ? null : key)}
      >
        <div className={styles.viewportHeader}>
          <div className={styles.viewportInfo}>
            <h4>{viewport.name}</h4>
            <div className={styles.viewportSpecs}>
              <span className={styles.dimension}>{viewport.width}×{viewport.height}</span>
              <span className={`${styles.category} ${styles[viewport.category]}`}>{viewport.category}</span>
              <span className={styles.orientation}>{viewport.orientation}</span>
            </div>
          </div>
          <div className={styles.viewportStatus}>
            {hasError ? (
              <span className={styles.errorBadge}>ERROR</span>
            ) : (
              <span className={`${styles.statusBadge} ${passRate >= 90 ? styles.good : passRate >= 70 ? styles.warning : styles.poor}`}>
                {passed}/{viewportResult.tests.total}
              </span>
            )}
          </div>
        </div>

        {hasError && (
          <div className={styles.errorMessage}>
            {viewportResult.error}
          </div>
        )}

        {!hasError && viewportResult.issues && viewportResult.issues.length > 0 && (
          <div className={styles.issuesSummary}>
            <span className={styles.issuesCount}>{viewportResult.issues.length}</span> issues
          </div>
        )}

        {/* Expand detail when selected */}
        {selectedDevice === key && !hasError && (
          <div className={styles.viewportDetails}>
            <div className={styles.testResults}>
              <h5>Test Results</h5>
              {viewportResult.details && Object.entries(viewportResult.details).map(([category, details]) => (
                <div key={category} className={styles.testCategory}>
                  <h6>{category.charAt(0).toUpperCase() + category.slice(1)}</h6>
                  {details.tests && details.details?.map((test, index) => (
                    <div key={index} className={`${styles.testItem} ${test.passed ? styles.pass : styles.fail}`}>
                      <span className={styles.testStatus}>{test.passed ? '✓' : '✗'}</span>
                      <span className={styles.testName}>{test.name}</span>
                      <span className={styles.testMessage}>{test.message}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {viewportResult.issues && viewportResult.issues.length > 0 && (
              <div className={styles.issuesList}>
                <h5>Issues</h5>
                {viewportResult.issues.map((issue, index) => (
                  <div key={index} className={`${styles.issue} ${styles[issue.severity || 'medium']}`}>
                    <div className={styles.issueHeader}>
                      <span className={styles.issueType}>{issue.type}</span>
                      <span className={styles.issueSeverity}>{issue.severity || 'medium'}</span>
                    </div>
                    <div className={styles.issueMessage}>{issue.message}</div>
                    {issue.recommendation && (
                      <div className={styles.issueRecommendation}>
                        <strong>Recommendation:</strong> {issue.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Responsive Design Testing</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close responsive testing panel"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {currentViewport && (
            <div className={styles.currentViewportInfo}>
              <h3>Current Viewport</h3>
              <div className={styles.currentSpecs}>
                <span>{currentViewport.width}×{currentViewport.height}</span>
                <span className={`${styles.category} ${styles[currentViewport.category]}`}>
                  {currentViewport.category}
                </span>
                <span className={styles.orientation}>{currentViewport.orientation}</span>
                <span className={styles.pixelRatio}>DPR: {currentViewport.pixelRatio}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.controlGroup}>
              <label htmlFor="category-select">Test Category:</label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.select}
              >
                {getDeviceCategories().map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Devices' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.controlGroup}>
              <label htmlFor="export-format">Export:</label>
              <select
                id="export-format"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className={styles.select}
              >
                <option value="json">JSON</option>
                <option value="html">HTML Report</option>
              </select>
              <button
                onClick={handleExport}
                disabled={!testResults || testResults.error}
                className={styles.exportButton}
              >
                Export
              </button>
            </div>

            <button
              onClick={runTests}
              disabled={isRunning}
              className={styles.runButton}
            >
              {isRunning ? (
                <>
                  <span className={styles.spinner} />
                  Running Tests...
                </>
              ) : (
                'Run Tests'
              )}
            </button>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className={styles.toggleButton}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {/* Results */}
          {isRunning && (
            <div className={styles.loading}>
              <div className={styles.progressIndicator}>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} />
                </div>
              </div>
              <p>Running responsive design tests...</p>
            </div>
          )}

          {testResults && !testResults.error && (
            <>
              {/* Summary */}
              <div className={styles.summary}>
                <div className={`${styles.metric} ${testResults.summary.status === 'PASS' ? styles.pass : styles.fail}`}>
                  <div className={styles.metricValue}>{testResults.summary.successRate}%</div>
                  <div className={styles.metricLabel}>Success Rate</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{testResults.summary.passed}/{testResults.summary.total}</div>
                  <div className={styles.metricLabel}>Tests Passed</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{testResults.summary.failed}</div>
                  <div className={styles.metricLabel}>Failures</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{Object.keys(testResults.viewports).length}</div>
                  <div className={styles.metricLabel}>Viewports Tested</div>
                </div>
              </div>

              {/* Recommendations */}
              {testResults.recommendations && testResults.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  <h3>Recommendations</h3>
                  {testResults.recommendations.map((rec, index) => (
                    <div key={index} className={`${styles.recommendation} ${styles[rec.priority]}`}>
                      <div className={styles.recommendationHeader}>
                        <span className={styles.recommendationCategory}>{rec.category}</span>
                        <span className={styles.recommendationPriority}>{rec.priority}</span>
                      </div>
                      <div className={styles.recommendationMessage}>{rec.message}</div>
                      <div className={styles.recommendationSuggestion}>
                        <strong>Suggestion:</strong> {rec.suggestion}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Viewport Cards */}
              <div className={styles.viewportResults}>
                <h3>
                  Test Results
                  {selectedCategory !== 'all' && (
                    <span className={styles.filterLabel}>
                      (Filtered: {selectedCategory})
                    </span>
                  )}
                </h3>
                <div className={styles.viewportCards}>
                  {getFilteredViewports().map(renderViewportCard)}
                </div>
              </div>
            </>
          )}

          {testResults && testResults.error && (
            <div className={styles.error}>
              <h3>Test Error</h3>
              <p>{testResults.error}</p>
              <button onClick={runTests} className={styles.retryButton}>
                Retry Tests
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ResponsiveTestingPanel.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

export default ResponsiveTestingPanel;