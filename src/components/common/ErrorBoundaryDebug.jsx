import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { errorReporter, logger, devHelpers } from '../../utils/debugUtils.js';

import styles from './ErrorBoundaryDebug.module.css';

/**
 * Enhanced Error Boundary with debugging and reporting capabilities
 */
class ErrorBoundaryDebug extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString();

    logger.error('Error boundary caught an error', { error, errorInfo, errorId });

    // Report the error
    errorReporter.report(error, {
      componentStack: errorInfo.componentStack,
      errorId,
      errorBoundaryName: this.props.fallbackComponentName || 'Unknown',
      props: this.props.includeProps ? this.props : undefined
    });

    this.setState({
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }
  }

  handleRetry = () => {
    logger.info('Retrying after error', { errorId: this.state.errorId });
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  renderErrorDetails() {
    const { error, errorInfo, errorId } = this.state;

    return (
      <div className={styles.errorDetails}>
        <h4>🔍 Error Details</h4>

        <div className={styles.detailSection}>
          <h5>Error ID:</h5>
          <code className={styles.code}>{errorId}</code>
        </div>

        <div className={styles.detailSection}>
          <h5>Error Message:</h5>
          <pre className={styles.code}>{error.toString()}</pre>
        </div>

        {error.stack && (
          <div className={styles.detailSection}>
            <h5>Stack Trace:</h5>
            <pre className={styles.stackTrace}>{error.stack}</pre>
          </div>
        )}

        {errorInfo && (
          <div className={styles.detailSection}>
            <h5>Component Stack:</h5>
            <pre className={styles.stackTrace}>{errorInfo.componentStack}</pre>
          </div>
        )}

        <div className={styles.debugActions}>
          {import.meta.env.MODE === 'development' && (
            <>
              <button
                onClick={devHelpers.showLocalStorage}
                className={styles.debugButton}
              >
                📋 Show LocalStorage
              </button>
              <button
                onClick={devHelpers.checkMemoryUsage}
                className={styles.debugButton}
              >
                🧠 Check Memory
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.debugButton}
              >
                🔄 Hard Reload
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          errorId: this.state.errorId,
          onRetry: this.handleRetry,
          onShowDetails: this.toggleDetails
        });
      }

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>🔴</div>
            <h2>Something went wrong</h2>
            <p>We encountered an unexpected error. This has been logged and will be investigated.</p>

            <div className={styles.errorActions}>
              <button
                onClick={this.handleRetry}
                className={styles.retryButton}
              >
                🔄 Try Again
              </button>
              <button
                onClick={this.toggleDetails}
                className={styles.detailsButton}
              >
                {this.state.showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            {this.state.showDetails && this.renderErrorDetails()}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundaryDebug.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  fallbackComponentName: PropTypes.string,
  includeProps: PropTypes.bool
};

export default ErrorBoundaryDebug;