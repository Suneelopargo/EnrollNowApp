// frontend/shared/toaster/ToasterContainer.tsx - Host Toaster UI Component
import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from './useToast';
import { ToastItem } from './types';

export interface ToasterContainerProps {
  className?: string;
}

export const ToasterContainer: React.FC<ToasterContainerProps> = ({ className = '' }) => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  const renderIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} strokeWidth={2.4} aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={18} strokeWidth={2.4} aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={18} strokeWidth={2.4} aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={18} strokeWidth={2.4} aria-hidden="true" />;
    }
  };

  return (
    <div className={`enl-toaster-container ${className}`} role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        return (
          <div
            key={toast.id}
            className={`enl-toast enl-toast--${toast.type}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-atomic="true"
          >
            <div className="enl-toast-icon-wrap" aria-hidden="true">
              {renderIcon(toast.type)}
            </div>
            <div className="enl-toast-content">
              {toast.title && <div className="enl-toast-title">{toast.title}</div>}
              <div className="enl-toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="enl-toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label={`Close ${toast.title || toast.type} notification`}
            >
              <X size={15} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToasterContainer;
