import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0b1120)',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary, #1e293b)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, #334155)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            padding: '40px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              color: '#ef4444'
            }}>
              <AlertTriangle size={32} />
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                margin: 0,
                color: 'var(--text-primary, #f8fafc)'
              }}>
                Oops! Something went wrong
              </h1>
            </div>

            <p style={{
              color: 'var(--text-secondary, #94a3b8)',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                background: '#111827',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '14px',
                fontFamily: 'monospace',
                color: '#ef4444',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <details style={{ marginTop: '12px', color: '#94a3b8' }}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                      Stack trace
                    </summary>
                    <pre style={{ margin: '8px 0 0 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'var(--bg-color, #0f172a)',
                  color: 'var(--text-primary, #f8fafc)',
                  border: '1px solid var(--border-color, #334155)',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#1e293b'}
                onMouseLeave={(e) => e.target.style.background = 'var(--bg-color, #0f172a)'}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
