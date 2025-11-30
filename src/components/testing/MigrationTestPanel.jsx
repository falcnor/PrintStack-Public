import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { migrationTestSuite, runMigrationTest } from '../../utils/migrationTesting';
import styles from './MigrationTestPanel.module.css';

/**
 * Migration Testing Panel Component
 * Provides UI for running and viewing data migration tests
 */
const MigrationTestPanel = ({
  visible = false,
  onClose,
  autoRun = false,
  showDetails = true
}) => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [selectedTest, setSelectedTest] = useState('all');

  const availableTests = [
    { id: 'all', name: 'All Tests', description: 'Run complete migration test suite' },
    { id: 'basic', name: 'Basic Migration', description: 'Test basic data migration functionality' },
    { id: 'corrupted', name: 'Corrupted Data', description: 'Test migration with corrupted data' },
    { id: 'missing', name: 'Missing Data', description: 'Test migration with incomplete data' },
    { id: 'incompatible', name: 'Incompatible Structure', description: 'Test legacy data structure migration' },
    { id: 'large', name: 'Large Dataset', description: 'Test migration with large data volumes' },
    { id: 'concurrent', name: 'Concurrent Operations', description: 'Test parallel migration operations' },
    { id: 'quota', name: 'Storage Quota', description: 'Test behavior when storage quota exceeded' },
    { id: 'unavailable', name: 'Storage Unavailable', description: 'Test migration when storage unavailable' },
    { id: 'integrity', name: 'Data Integrity', description: 'Validate data integrity after migration' },
    { id: 'rollback', name: 'Rollback', description: 'Test rollback functionality on failure' }
  ];

  const runTests = useCallback(async (testId) => {
    setIsRunning(true);
   setCurrentTest(testId);

    try {
      let results;
      if (testId === 'all') {
        results = await migrationTestSuite.runAllTests();
      } else {
        const result = await runMigrationTest(testId);
        results = [result];
      }

      setTestResults({
        selectedTest: testId === 'all' ? 'all' : testId,
        summary: migrationTestSuite.getTestSummary(),
        tests: testId === 'all' ? migrationTestSuite.results : results
      });
    } catch (error) {
      console.error('Migration test failed:', error);
      setTestResults({
        selectedTest: testId === 'all' ? 'all' : testId,
        summary: { totalTests: 1, passedTests: 0, failedTests: 1, successRate: '0' },
        tests: [],
        error: error.message
      });
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  }, []);

  // Auto-run tests if enabled
  useEffect(() => {
    if (autoRun && visible && !testResults && !isRunning) {
      runTests('all');
    }
  }, [autoRun, visible, testResults, isRunning, runTests]);

  const toggleTestExpansion = (testIndex) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testIndex)) {
      newExpanded.delete(testIndex);
    } else {
      newExpanded.add(testIndex);
    }
    setExpandedTests(newExpanded);
  };

  const formatDuration = (duration) => {
    if (typeof duration === 'string') {
      return duration;
    }
    return `${duration}ms`;
  };

  const getStatusClass = (success) => {
    return success ? styles.statusSuccess : styles.statusError;
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  const renderTestDetails = (test) => {
    if (!showDetails || test.success) return null;

    return (
      <div className={styles.testError}>
        <strong>Error:</strong>
        <pre>{test.error?.stack || test.error?.message || 'Unknown error'}</pre>
      </div>
    );
  };

  const renderTestSummary = () => {
    if (!testResults) return null;

    const { summary } = testResults;

    return (
      <div className={styles.testSummary}>
        <h3>Test Results Summary</h3>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Total Tests</div>
            <div className={styles.summaryValue}>{summary.totalTests}</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Passed</div>
            <div className={`${styles.summaryValue} ${styles.success}`}>
              {summary.passedTests}
            </div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Failed</div>
            <div className={`${styles.summaryValue} ${styles.error}`}>
              {summary.failedTests}
            </div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryLabel}>Success Rate</div>
            <div className={`${styles.summaryValue} ${styles.rate} ${
              parseFloat(summary.successRate) >= 90 ? styles.success :
              parseFloat(summary.successRate) >= 70 ? styles.warning : styles.error
            }`}>
              {summary.successRate}%
            </div>
          </div>
        </div>

        {testResults.error && (
          <div className={styles.globalError}>
            <strong>Global Error:</strong> {testResults.error}
          </div>
        )}
      </div>
    );
  };

  const renderTestList = () => {
    if (!testResults?.tests?.length) return null;

    return (
      <div className={styles.testList}>
        <h3>Individual Test Results</h3>

        {testResults.tests.map((test, index) => (
          <div key={index} className={styles.testItem}>
            <div
              className={styles.testHeader}
              onClick={() => toggleTestExpansion(index)}
            >
              <span className={`${styles.testStatus} ${getStatusClass(test.success)}`}>
                {getStatusIcon(test.success)}
              </span>
              <span className={styles.testName}>{test.testName}</span>
              <span className={styles.testTimestamp}>
                {new Date(test.timestamp).toLocaleTimeString()}
              </span>
              <span className={styles.expandIcon}>
                {expandedTests.has(index) ? '▲' : '▼'}
              </span>
            </div>

            {expandedTests.has(index) && (
              <div className={styles.testDetails}>
                <div className={styles.testInfo}>
                  <strong>Status:</strong> {test.success ? 'PASSED' : 'FAILED'}
                </div>

                {Object.entries(test.details).map(([key, value]) => (
                  <div key={key} className={styles.testInfo}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}

                {renderTestDetails(test)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!visible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Data Migration Testing Panel</h2>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      <div className={styles.controls}>
        <div className={styles.testSelector}>
          <label htmlFor="testSelect">Select Test:</label>
          <select
            id="testSelect"
            value={selectedTest}
            onChange={(e) => setSelectedTest(e.target.value)}
            disabled={isRunning}
          >
            {availableTests.map(test => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </select>
          <div className={styles.testDescription}>
            {availableTests.find(t => t.id === selectedTest)?.description}
          </div>
        </div>

        <button
          onClick={() => runTests(selectedTest)}
          disabled={isRunning}
          className={`${styles.runBtn} ${isRunning ? styles.running : ''}`}
        >
          {isRunning ? (
            <>
              <span className={styles.spinner}></span>
              Running {currentTest === 'all' ? 'all tests' : currentTest}...
            </>
          ) : (
            `Run ${selectedTest === 'all' ? 'All Tests' : availableTests.find(t => t.id === selectedTest)?.name}`
          )}
        </button>

        {testResults && (
          <button
            onClick={() => runTests(selectedTest)}
            disabled={isRunning}
            className={styles.rerunBtn}
          >
            🔄 Rerun
          </button>
        )}
      </div>

      {testResults && (
        <div className={styles.results}>
          {renderTestSummary()}
          {renderTestList()}
        </div>
      )}

      {isRunning && (
        <div className={styles.progressIndicator}>
          <div className={styles.progressText}>
            {currentTest === 'all' ? 'Running complete test suite...' : `Running ${currentTest}...`}
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      )}

      <div className={styles.info}>
        <h3>Test Information</h3>
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <strong>Test Environment:</strong> Development
          </div>
          <div className={styles.infoItem}>
            <strong>Safe Storage:</strong> Enabled with fallback
          </div>
          <div className={styles.infoItem">
            <strong>Data Backup:</strong> Automatic before testing
          </div>
          <div className={styles.infoItem">
            <strong>Rollback:</strong> Automatic after testing
          </div>
        </div>

        <div className={styles.warning}>
          <strong>⚠️ Important:</strong> This testing panel creates test data in your browser's storage.
          Your original data is backed up and restored after testing, but it's recommended to
          back up important data manually before running tests.
        </div>
      </div>
    </div>
  );
};

MigrationTestPanel.propTypes = {
  visible: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  autoRun: PropTypes.bool,
  showDetails: PropTypes.bool
};

export default MigrationTestPanel;