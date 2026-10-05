// frontend/shared/design-system/components/LoadingSpinner.tsx - Enterprise High-Tech Clinical OS Loader
import React from 'react';

export interface LoadingSpinnerProps {
  /** Primary action / status message (e.g., 'Processing Request & Syncing Data...', 'Initializing Shell Host...') */
  message?: string;
  /** System / brand header title (default: 'ENROLLNOW') */
  title?: string;
  /** Subtitle / helper note below message (default: 'Please wait while the server responds') */
  subtitle?: string;
  /** Presentation variant: 'page' | 'overlay' | 'card' | 'section' | 'inline' (default: 'page') */
  variant?: 'page' | 'overlay' | 'card' | 'section' | 'inline';
  /** Indicator size: 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the bottom glowing laser progress bar (default: true for page/overlay/card) */
  showProgress?: boolean;
  /** Extra CSS classes */
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Processing Request & Syncing Data...',
  title = 'EnrollNow',
  subtitle = 'Please wait while the server responds',
  variant = 'overlay',
  size = 'md',
  showProgress = true,
  className = '',
}) => {
  // Inline variant for compact controls, buttons, or inline rows
  if (variant === 'inline') {
    return (
      <div
        className={`loading-spinner loading-spinner--inline loading-spinner--${size} spinner-container ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="loading-spinner__indicator spinner" aria-hidden="true" />
        {message && <span className="loading-spinner__message">{message}</span>}
      </div>
    );
  }

  // Section variant for compact embedded card panels
  if (variant === 'section') {
    return (
      <div
        className={`loading-spinner loading-spinner--section loading-spinner--${size} ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="enl-loader-emblem enl-loader-emblem--sm" aria-hidden="true">
          <div className="enl-loader-halo" />
          <div className="enl-loader-orbit-ring enl-loader-orbit-ring--outer" />
          <div className="enl-loader-orbit-ring enl-loader-orbit-ring--inner" />
          <div className="enl-loader-logo-disc">
            <svg
              className="enl-loader-logo-svg"
              viewBox="0 0 44 40"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="15" cy="11" r="7" fill="#F59E0B" />
              <path
                d="M4 36c0-7.18 5.82-13 13-13 3.2 0 6.13 1.16 8.4 3.09-2.2 2.66-3.4 6.15-3.4 9.91H4z"
                fill="#F59E0B"
              />
              <circle cx="29" cy="13" r="6.5" fill="#0F172A" />
              <path
                d="M20 36c0-5.8 4.7-10.5 10.5-10.5S41 30.2 41 36H20z"
                fill="#0F172A"
              />
            </svg>
          </div>
        </div>
        <div className="loading-spinner__message">{message}</div>
      </div>
    );
  }

  // Fullscreen, Overlay, and Standalone Card variants matching the high-tech clinical UI
  const isOverlay = variant === 'overlay';
  const isPage = variant === 'page';

  return (
    <div
      className={`enl-loader-backdrop ${isOverlay ? 'enl-loader-backdrop--overlay' : ''} ${isPage ? 'enl-loader-backdrop--page' : ''} ${className}`}
      role="status"
      aria-live="assertive"
      aria-label={`${title}: ${message}`}
    >
      <div className={`enl-loader-card enl-loader-card--${size}`}>
        {/* Orbital Emblem with Neon Glowing Arcs and Central Brand Disc */}
        <div className="enl-loader-emblem" aria-hidden="true">
          <div className="enl-loader-halo" />
          <div className="enl-loader-orbit-ring enl-loader-orbit-ring--outer" />
          <div className="enl-loader-orbit-ring enl-loader-orbit-ring--inner" />
          <div className="enl-loader-logo-disc">
            <svg
              className="enl-loader-logo-svg"
              viewBox="0 0 44 40"
              fill="none"
              aria-hidden="true"
            >
              {/* Left Figure (Amber/Yellow) */}
              <circle cx="15" cy="11" r="7" fill="#F59E0B" />
              <path
                d="M4 36c0-7.18 5.82-13 13-13 3.2 0 6.13 1.16 8.4 3.09-2.2 2.66-3.4 6.15-3.4 9.91H4z"
                fill="#F59E0B"
              />
              {/* Right Figure (Dark Navy) */}
              <circle cx="29" cy="13" r="6.5" fill="#0F172A" />
              <path
                d="M20 36c0-5.8 4.7-10.5 10.5-10.5S41 30.2 41 36H20z"
                fill="#0F172A"
              />
            </svg>
          </div>
        </div>

        {/* System / Brand Header */}
        {title && <div className="enl-loader-title">{title}</div>}

        {/* Primary Status Message */}
        <div className="enl-loader-message">{message}</div>

        {/* Secondary Subtitle Hint */}
        {subtitle && <div className="enl-loader-subtitle">{subtitle}</div>}

        {/* Animated Glowing Laser Progress Bar Track */}
        {showProgress && (
          <div className="enl-loader-track" role="progressbar" aria-hidden="true">
            <div className="enl-loader-bar" />
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
