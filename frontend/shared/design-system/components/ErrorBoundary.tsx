import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { telemetry } from '../../telemetry';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  remoteId?: string;
  onRetry?: () => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    telemetry.track({
      eventType: 'UI_ERROR',
      remoteId: this.props.remoteId,
      details: {
        message: error.message,
        componentStack: errorInfo.componentStack,
      },
    });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-card">
          <div className="error-icon-box">
            <AlertTriangle size={48} className="error-icon" />
          </div>
          <h2>{this.props.fallbackTitle || 'Module Temporarily Unavailable'}</h2>
          <p>
            {this.state.error?.message || 'An unexpected runtime error occurred while rendering this micro-frontend.'}
          </p>
          <div className="error-actions-group">
            <button type="button" className="btn btn-primary" onClick={this.handleReset}>
              <RefreshCw size={16} />
              <span>Retry Loading</span>
            </button>
            <a href="/dashboard" className="btn btn-secondary">
              <Home size={16} />
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
