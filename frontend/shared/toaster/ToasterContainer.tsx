// frontend/shared/toaster/ToasterContainer.tsx - Host Toaster UI Component
// WCAG 2.2 Level AA (1.4.3 Contrast, 2.1.1 Keyboard, 4.1.3 Status Messages)

import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from './useToast';
import { ToastItem } from './types';

export interface ToasterContainerProps {
  className?: string;
}

export const ToasterContainer: React.FC<ToasterContainerProps> = ({ className = '' }) => {
  const { toasts, dismiss, toast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  const renderIcon = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={22} strokeWidth={2.2} aria-hidden="true" />;
      case 'error':
        return <AlertCircle size={22} strokeWidth={2.2} aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle size={22} strokeWidth={2.2} aria-hidden="true" />;
      case 'info':
      default:
        return <Info size={22} strokeWidth={2.2} aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`enl-toaster-container ${className}`.trim()}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((item) => {
        const isError = item.type === 'error';
        return (
          <div
            key={item.id}
            className={`enl-toast enl-toast--${item.type}`}
            role={isError ? 'alert' : 'status'}
            aria-live={isError ? 'assertive' : 'polite'}
            aria-atomic="true"
            onMouseEnter={() => toast.pause(item.id)}
            onMouseLeave={() => toast.resume(item.id)}
            onFocus={() => toast.pause(item.id)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                toast.resume(item.id);
              }
            }}
          >
            <div className="enl-toast-icon-wrap" aria-hidden="true">
              {renderIcon(item.type)}
            </div>
            <div className="enl-toast-content">
              {item.title && <div className="enl-toast-title">{item.title}</div>}
              <div className="enl-toast-message">{item.message}</div>
              {item.action && (
                <button
                  type="button"
                  className="enl-toast-action-btn"
                  onClick={() => {
                    item.action?.onClick?.();
                    dismiss(item.id);
                  }}
                  aria-label={item.action.label}
                >
                  {item.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              className="enl-toast-close"
              onClick={() => dismiss(item.id)}
              aria-label={`Dismiss ${item.title || item.type} notification`}
            >
              <X size={22} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToasterContainer;
