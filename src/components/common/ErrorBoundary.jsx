import PropTypes from 'prop-types';
import React from 'react';
import { handleComponentError, FallbackDataProvider } from '../../utils/errorHandling';

import styles from './ErrorBoundary.module.css';

/**
 * React Error Boundary component that catches and displays runtime errors
 * @class ErrorBoundary
 * @extends React.Component
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorData: null,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error using our enhanced error handling
    const errorData = handleComponentError(
      error,
      this.props.componentName || 'Unknown',
      {
        props: this.props,
        errorBoundary: true
      }
    );

    this.setState({
      error,
      errorInfo,
      errorData,
      recoveryAttempts: 0
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
      console.error('Error data:', errorData);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorData: null,
      recoveryAttempts: 0
    });
  };

  handleRecovery = () => {
    const { recoveryAttempts } = this.state;

    if (recoveryAttempts < 3) {
      this.setState(prevState => ({
        recoveryAttempts: prevState.recoveryAttempts + 1
      }));

      // Try recovery strategies based on error type
      if (this.state.errorData?.category === 'storage') {
        this.attemptStorageRecovery();
      } else {
        // Default recovery
        this.handleReset();
      }
    } else {
      // Max recovery attempts reached, reload page
      window.location.reload();
    }
  };

  attemptStorageRecovery = () => {
    try {
      // Clear potentially corrupted data and use fallbacks
      const fallbackData = {
        filaments: FallbackDataProvider.getEmptyFilamentData(),
        models: FallbackDataProvider.getEmptyModelData(),
        prints: FallbackDataProvider.getEmptyPrintData(),
        statistics: FallbackDataProvider.getEmptyStatistics()
      };

      // Apply fallback data through context if available
      if (this.context?.updateData) {
        this.context.updateData(fallbackData);
      }

      this.handleReset();
    } catch (recoveryError) {
      console.error('Recovery failed:', recoveryError);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.container}>
            <div className={styles.icon}>⚠️</div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              We're sorry, but something unexpected happened. The application
              has encountered an error.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>Error Details</summary>
                <pre className={styles.errorText}>
                  <code>
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo.componentStack}
                  </code>
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button onClick={this.handleReset} className={styles.resetBtn}>
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.reloadBtn}
              >
                Reload Page
              </button>
            </div>

            <div className={styles.help}>
              <p>If this problem persists, you can:</p>
              <ul>
                <li>Clear your browser cache and reload</li>
                <li>Export your data to prevent loss</li>
                <li>Contact support for assistance</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
  fallbackComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object])
};

export default ErrorBoundary;
