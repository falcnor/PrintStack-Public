import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { runContrastTest, generateContrastReport, exportContrastResults } from '../../utils/contrastTesting';
import styles from './ContrastTestingPanel.module.css';

/**
 * Contrast Testing Panel for WCAG AA compliance validation
 */
const ContrastTestingPanel = ({ visible = false, onClose }) => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showImprovements, setShowImprovements] = useState(false);

  useEffect(() => {
    if (visible && !testResults) {
      runTest();
    }
  }, [visible]);

  const runTest = async () => {
    setIsRunning(true);
    try {
      const results = await runContrastTest();
      setTestResults(results);
      setReport(generateContrastReport(results));
    } catch (error) {
      console.error('Contrast test failed:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleExport = () => {
    if (!testResults) return;

    try {
      const exportedData = exportContrastResults(exportFormat);
      const blob = new Blob([exportedData], {
        type: exportFormat === 'json' ? 'application/json' :
              exportFormat === 'csv' ? 'text/csv' : 'text/html'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrast-test-report.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const getFilteredTests = () => {
    if (!testResults || !testResults.categories) return [];

    if (selectedCategory === 'all') {
      return Object.entries(testResults.categories).flatMap(([category, data]) =>
        data.tests.map(test => ({ ...test, category }))
      );
    }

    const categoryData = testResults.categories[selectedCategory];
    return categoryData ? categoryData.tests.map(test => ({ ...test, category: selectedCategory })) : [];
  };

  const renderColorPreview = (color) => {
    if (!color) return <span className={styles.noColor}>N/A</span>;

    return (
      <div className={styles.colorPreview} style={{ backgroundColor: color }}>
        <span className={styles.colorCode}>{color}</span>
      </div>
    );
  };

  const renderTestRow = (test) => {
    const passed = test.passed !== false && test.boundaryPassed !== false;
    const ratio = test.ratio || 0;
    const required = test.required || test.minimum || 0;
    const gap = Math.max(0, required - ratio);

    return (
      <tr
        key={`${test.category}-${test.name}`}
        className={`${styles.testRow} ${passed ? styles.pass : styles.fail}`}
      >
        <td className={styles.testName}>
          <div className={styles.testInfo}>
            <span className={styles.testNameText}>{test.name}</span>
            <span className={styles.testCategory}>{test.category}</span>
          </div>
        </td>
        <td className={styles.colors}>
          <div className={styles.colorPair}>
            <div className={styles.colorItem}>
              <span className={styles.colorLabel}>FG:</span>
              {renderColorPreview(test.foreground)}
            </div>
            <div className={styles.colorItem}>
              <span className={styles.colorLabel}>BG:</span>
              {renderColorPreview(test.background)}
            </div>
          </div>
        </td>
        <td className={styles.ratio}>
          <div className={styles.ratioDisplay}>
            <span className={`${styles.ratioValue} ${!passed && gap > 0.5 ? styles.critical : ''}`}>
              {ratio}:1
            </span>
            {gap > 0 && (
              <span className={styles.ratioGap}>
                +{Math.round(gap * 100) / 100}
              </span>
            )}
          </div>
        </td>
        <td className={styles.required}>
          {required}:1
        </td>
        <td className={styles.status}>
          <span className={`${styles.statusBadge} ${passed ? styles.pass : styles.fail}`}>
            {passed ? 'PASS' : 'FAIL'}
          </span>
        </td>
      </tr>
    );
  };

  const renderImprovementSuggestions = (test) => {
    if (!test.improvements || test.improvements.length === 0) return null;

    return (
      <div className={styles.improvements}>
        <h4>Suggested Fixes:</h4>
        <ul>
          {test.improvements.slice(0, 3).map((improvement, index) => (
            <li key={index}>
              Change {improvement.type} to {renderColorPreview(improvement.color)}
              ('{improvement.color}') → {improvement.ratio}:1
              (+{Math.round(improvement.improvement * 100) / 100} improvement)
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>WCAG Contrast Test Results</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close contrast test panel"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {isRunning ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Running contrast tests...</p>
            </div>
          ) : testResults && testResults.error ? (
            <div className={styles.error}>
              <h3>Test Failed</h3>
              <p>{testResults.error}</p>
              <button onClick={runTest} className={styles.retryButton}>
                Retry Test
              </button>
            </div>
          ) : testResults ? (
            <>
              {/* Summary Cards */}
              <div className={styles.summary}>
                <div className={`${styles.metric} ${report.summary.overallScore >= 90 ? styles.good : styles.bad}`}>
                  <div className={styles.metricValue}>{report.summary.overallScore}%</div>
                  <div className={styles.metricLabel}>Overall Score</div>
                </div>
                <div className={`${styles.metric} ${report.summary.wcagCompliance === 'AA' ? styles.good : styles.bad}`}>
                  <div className={styles.metricValue}>{report.summary.wcagCompliance}</div>
                  <div className={styles.metricLabel}>WCAG Compliance</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{report.summary.passedTests}</div>
                  <div className={styles.metricLabel}>Tests Passed</div>
                </div>
                <div className={styles.metric}>
                  <div className={styles.metricValue}>{report.summary.failedTests}</div>
                  <div className={styles.metricLabel}>Tests Failed</div>
                </div>
              </div>

              {/* Controls */}
              <div className={styles.controls}>
                <div className={styles.controlGroup}>
                  <label htmlFor="category-filter">Filter by Category:</label>
                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.select}
                  >
                    <option value="all">All Categories</option>
                    <option value="text">Text</option>
                    <option value="interactive">Interactive</option>
                    <option value="boundaries">Boundaries</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className={styles.controlGroup}>
                  <label htmlFor="export-format">Export As:</label>
                  <select
                    id="export-format"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className={styles.select}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="html">HTML Report</option>
                  </select>
                  <button onClick={handleExport} className={styles.exportButton}>
                    Export
                  </button>
                </div>

                <button
                  onClick={() => setShowImprovements(!showImprovements)}
                  className={styles.toggleButton}
                >
                  {showImprovements ? 'Hide' : 'Show'} Fixes
                </button>

                <button onClick={runTest} className={styles.refreshButton}>
                  Refresh Test
                </button>
              </div>

              {/* Test Results Table */}
              <div className={styles.resultsSection}>
                <h3>Test Results</h3>
                <div className={styles.tableContainer}>
                  <table className={styles.testTable}>
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
                      {getFilteredTests().map(renderTestRow)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Improvements Section */}
              {showImprovements && report.criticalIssues.length > 0 && (
                <div className={styles.improvementsSection}>
                  <h3>Priority Fixes</h3>
                  <div className={styles.issuesList}>
                    {report.criticalIssues.slice(0, 5).map((issue, index) => (
                      <div key={index} className={styles.issue}>
                        <h4>{issue.test}</h4>
                        <p>
                          Current: <strong>{issue.currentRatio}:1</strong>
                          {' '}→ Needs: <strong>{issue.requiredRatio}:1</strong>
                          {' '} (+{issue.gap})
                        </p>
                        {issue.improvements && issue.improvements.length > 0 && (
                          <div className={styles.issueFixes}>
                            <strong>Quick fixes:</strong>
                            <ul>
                              {issue.improvements.slice(0, 2).map((fix, fixIndex) => (
                                <li key={fixIndex}>
                                  {fix.type}: {renderColorPreview(fix.color)} → {fix.ratio}:1
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {report.recommendations.length > 0 && (
                <div className={styles.recommendations}>
                  <h3>Recommendations</h3>
                  {report.recommendations.map((rec, index) => (
                    <div key={index} className={`${styles.recommendation} ${styles[rec.priority]}`}>
                      <h4>{rec.title}</h4>
                      <p>{rec.description}</p>
                      {rec.items && (
                        <ul>
                          {rec.items.map((item, itemIndex) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

ContrastTestingPanel.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired
};

export default ContrastTestingPanel;