import PropTypes from 'prop-types';
import React from 'react';
import { handleComponentError, FallbackDataProvider } from '../../utils/errorHandling';

import styles from './ErrorBoundary.module.css';

/**
 * Enhanced React Error Boundary component that catches and displays runtime errors
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
      recoveryAttempts: 0,
      errorId: null,
      timestamp: null
    };

    this.maxRetries = props.maxRetries || 3;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, timestamp: new Date().toISOString() };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log error using our enhanced error handling
    const errorData = handleComponentError(
      error,
      this.props.componentName || 'Unknown',
      {
        props: this.props,
        errorBoundary: true,
        errorId: errorId
      }
    );

    this.setState({
      error,
      errorInfo,
      errorData,
      recoveryAttempts: 0,
      errorId
    });

    // Store error in localStorage for analytics
    this.storeErrorInfo(errorId, error, errorInfo, errorData);

    // Emit custom event for global error handling
    window.dispatchEvent(new CustomEvent('error-boundary-error', {
      detail: {
        errorId,
        error: error.message,
        componentName: this.props.componentName,
        timestamp: new Date().toISOString(),
        errorData
      }
    }));

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error caught by boundary:', error, errorInfo);
      console.error('📊 Error data:', errorData);
      console.error('🆔 Error ID:', errorId);
    }
  }

  storeErrorInfo = (errorId, error, errorInfo, errorData) => {
    try {
      const errorLog = JSON.parse(localStorage.getItem('printstack_error_log') || '[]');

      const logEntry = {
        id: errorId,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        component: this.props.componentName || 'Unknown',
        errorData,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      errorLog.push(logEntry);

      // Keep only last 100 errors
      if (errorLog.length > 100) {
        errorLog.splice(0, errorLog.length - 100);
      }

      localStorage.setItem('printstack_error_log', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Failed to store error info:', e);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorData: null,
      recoveryAttempts: 0,
      errorId: null,
      timestamp: null
    });
  };

  handleRetry = () => {
    const { recoveryAttempts } = this.state;

    if (recoveryAttempts < this.maxRetries) {
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

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      timestamp: this.state.timestamp,
      component: this.props.componentName,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        console.log('📋 Error details copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallbackComponent) {
        return typeof this.props.fallbackComponent === 'function'
          ? this.props.fallbackComponent({
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              errorData: this.state.errorData,
              errorId: this.state.errorId,
              retry: this.handleRetry,
              reset: this.handleReset,
              copyErrorDetails: this.copyErrorDetails
            })
          : this.props.fallbackComponent;
      }

      // Default enhanced fallback UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.container}>
            <div className={styles.icon}>🚨</div>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.message}>
              We're sorry, but something unexpected happened. The application
              has encountered an error.
            </p>

            {this.state.errorId && (
              <p className={styles.errorId}>
                Error ID: <code>{this.state.errorId}</code>
              </p>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary className={styles.summary}>Development Details</summary>
                <div className={styles.devInfo}>
                  <div className={styles.section}>
                    <strong>Error:</strong>
                    <pre className={styles.errorText}>
                      <code>{this.state.error.toString()}</code>
                    </pre>
                  </div>

                  {this.state.error.stack && (
                    <div className={styles.section}>
                      <strong>Stack Trace:</strong>
                      <pre className={styles.errorText}>
                        <code>{this.state.error.stack}</code>
                      </pre>
                    </div>
                  )}

                  {this.state.errorInfo?.componentStack && (
                    <div className={styles.section}>
                      <strong>Component Stack:</strong>
                      <pre className={styles.errorText}>
                        <code>{this.state.errorInfo.componentStack}</code>
                      </pre>
                    </div>
                  )}

                  {this.state.errorData && (
                    <div className={styles.section}>
                      <strong>Error Data:</strong>
                      <pre className={styles.errorText}>
                        <code>{JSON.stringify(this.state.errorData, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className={styles.actions}>
              <button onClick={this.handleRetry} className={styles.resetBtn}>
                {this.state.recoveryAttempts >= this.maxRetries
                  ? 'Max retries reached'
                  : `Try Again (${this.state.recoveryAttempts}/${this.maxRetries})`
                }
              </button>
              <button onClick={this.handleReset} className={styles.resetBtn}>
                Reset
              </button>
              <button
                onClick={() => window.location.reload()}
                className={styles.reloadBtn}
              >
                Reload Page
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button onClick={this.copyErrorDetails} className={styles.copyBtn}>
                  Copy Details
                </button>
              )}
            </div>

            <div className={styles.help}>
              <p>If this problem persists, you can:</p>
              <ul>
                <li>Clear your browser cache and reload</li>
                <li>Export your data to prevent loss</li>
                <li>Check browser console for more details</li>
                <li>Contact support with error ID: {this.state.errorId}</li>
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
  fallbackComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  maxRetries: PropTypes.number,
  onError: PropTypes.func
};

// Specialized error boundary components

export const AppErrorBoundary = (props) => (
  <ErrorBoundary
    {...props}
    componentName="App"
    fallbackComponent={({ reset, errorId }) => (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
        <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
          Application Error
        </h1>
        <p style={{ marginBottom: '2rem', color: '#6c757d', maxWidth: '500px' }}>
          We're sorry, but the application encountered a critical error.
          Please try refreshing the page.
        </p>
        {errorId && (
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '2rem' }}>
            Error ID: <code style={{ background: '#e9ecef', padding: '2px 4px', borderRadius: '3px' }}>
              {errorId}
            </code>
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Restart Application
        </button>
      </div>
    )}
  />
);

export const ComponentErrorBoundary = (props) => (
  <ErrorBoundary
    {...props}
    maxRetries={2}
    fallbackComponent={({ retry, errorId }) => (
      <div style={{
        padding: '1rem',
        margin: '0.5rem 0',
        border: '1px solid #dc3545',
        borderRadius: '4px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 1rem 0' }}>
          ⚠️ This component encountered an error.
        </p>
        {errorId && (
          <p style={{ fontSize: '0.75rem', margin: '0 0 1rem 0' }}>
            ID: {errorId}
          </p>
        )}
        <button
          onClick={retry}
          style={{
            padding: '0.25rem 1rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry Component
        </button>
      </div>
    )}
  />
);

export const PageErrorBoundary = (props) => (
  <ErrorBoundary
    {...props}
    fallbackComponent={({ error, retry, errorId }) => (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
        <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
          Page Error
        </h1>
        <p style={{ marginBottom: '2rem', color: '#6c757d' }}>
          This page couldn't load properly. The error has been logged.
        </p>
        {errorId && (
          <p style={{ fontSize: '0.875rem', color: '#6c757d', marginBottom: '2rem' }}>
            Error ID: <code>{errorId}</code>
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={retry}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    )}
  />
);

export const AsyncErrorBoundary = (props) => (
  <ErrorBoundary
    {...props}
    fallbackComponent={({ error, reset, errorId }) => (
      <div style={{
        padding: '1rem',
        border: '1px solid #ffc107',
        borderRadius: '4px',
        backgroundColor: '#fff3cd',
        color: '#856404',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 1rem 0' }}>
          ⏳ Loading error: {error?.message || 'Failed to load data'}
        </p>
        {errorId && (
          <p style={{ fontSize: '0.75rem', margin: '0 0 1rem 0' }}>
            ID: {errorId}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            padding: '0.25rem 1rem',
            backgroundColor: '#ffc107',
            color: '#212529',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Retry Loading
        </button>
      </div>
    )}
  />
);

export default ErrorBoundary;
