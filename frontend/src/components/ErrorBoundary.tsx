import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught micro-frontend error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--color-danger)' }}>
            <AlertTriangle size={48} />
          </div>
          <h2>{this.props.fallbackTitle || 'Module Failed to Load'}</h2>
          <p>
            {this.state.error?.message || 'An unexpected runtime error occurred while rendering this module.'}
          </p>
          <button className="btn btn-primary" onClick={this.handleReset}>
            <RefreshCw size={16} />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
