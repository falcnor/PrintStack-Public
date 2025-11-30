import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { logger, devHelpers, errorReporter } from '../../utils/debugUtils.js';

import styles from './DevToolbar.module.css';

/**
 * Development toolbar for debugging and testing
 * Only shows in development mode
 */
const DevToolbar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('errors');

  // Only show in development
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  const errors = errorReporter.getErrors();

  const renderErrorTab = () => (
    <div className={styles.tabContent}>
      <h4>Error History ({errors.length})</h4>

      {errors.length === 0 ? (
        <p className={styles.noContent}>No errors recorded 🎉</p>
      ) : (
        <div className={styles.errorList}>
          {errors.map(error => (
            <div key={error.id} className={styles.errorItem}>
              <div className={styles.errorHeader}>
                <span className={styles.errorTime}>
                  {new Date(error.timestamp).toLocaleTimeString()}
                </span>
                <span className={styles.errorId}>ID: {error.id}</span>
              </div>
              <div className={styles.errorMessage}>{error.message}</div>
              <details className={styles.errorDetails}>
                <summary>Stack Trace</summary>
                <pre>{error.stack}</pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <button
          onClick={() => errorReporter.clearErrors()}
          className={styles.clearButton}
        >
          Clear All Errors
        </button>
      )}
    </div>
  );

  const renderUtilsTab = () => (
    <div className={styles.tabContent}>
      <h4>Development Utils</h4>

      <div className={styles.utilButtons}>
        <button
          onClick={devHelpers.showLocalStorage}
          className={styles.utilButton}
        >
          📋 Show LocalStorage
        </button>

        <button
          onClick={devHelpers.checkMemoryUsage}
          className={styles.utilButton}
        >
          🧠 Memory Usage
        </button>

        <button
          onClick={devHelpers.showComponentTree}
          className={styles.utilButton}
        >
          🌳 Component Tree
        </button>

        <button
          onClick={() => window.location.reload()}
          className={styles.utilButton}
        >
          🔄 Reload Page
        </button>

        <button
          onClick={() => localStorage.clear()}
          className={styles.utilButton}
        >
          🗑️ Clear LocalStorage
        </button>

        <button
          onClick={() => {
            const data = {
              filaments: JSON.parse(localStorage.getItem('printstack_filaments') || '[]'),
              models: JSON.parse(localStorage.getItem('printstack_models') || '[]'),
              prints: JSON.parse(localStorage.getItem('printstack_prints') || '[]')
            };
            navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            alert('Data copied to clipboard!');
          }}
          className={styles.utilButton}
        >
          📋 Copy Data to Clipboard
        </button>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className={styles.tabContent}>
      <h4>Performance</h4>

      <div className={styles.performanceMetrics}>
        <div className={styles.metric}>
          <label>Total Errors:</label>
          <span>{errorReporter.getErrorCount()}</span>
        </div>

        <div className={styles.metric}>
          <label>Memory Usage:</label>
          <button
            onClick={devHelpers.checkMemoryUsage}
            className={styles.metricButton}
          >
            Check Now
          </button>
        </div>

        <div className={styles.metric}>
          <label>Environment:</label>
          <span>{import.meta.env.MODE}</span>
        </div>

        <div className={styles.metric}>
          <label>Vite HMR:</label>
          <span>{import.meta.env.HMR ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${styles.devToolbar} ${isExpanded ? styles.expanded : ''}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.toggleButton}
      >
        {isExpanded ? '✕' : '🛠️'}
      </button>

      {isExpanded && (
        <div className={styles.toolbarContent}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'errors' ? styles.active : ''}`}
              onClick={() => setActiveTab('errors')}
            >
              Errors ({errors.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'utils' ? styles.active : ''}`}
              onClick={() => setActiveTab('utils')}
            >
              Utils
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              Performance
            </button>
          </div>

          <div className={styles.tabContainer}>
            {activeTab === 'errors' && renderErrorTab()}
            {activeTab === 'utils' && renderUtilsTab()}
            {activeTab === 'performance' && renderPerformanceTab()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DevToolbar;