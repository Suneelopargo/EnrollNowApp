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

const LoaderEmblemSvg: React.FC = () => (
  <svg
    className="enl-loader-logo-svg"
    viewBox="70 12 212 134"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    {/* Center Figure (Golden Yellow) */}
    <path
      fill="#ffcb05"
      d="m232.09 128.49v-0.08c-0.75-22.79-15.28-42.1-35.54-49.89-2.3 1.85-4.84 3.38-7.57 4.53-3.91 1.65-8.09 2.49-12.37 2.49-4.29 0-8.46-0.84-12.37-2.49-2.73-1.15-5.28-2.68-7.57-4.53-19.51 7.5-33.71 25.7-35.41 47.39l-0.02 0.24q-0.02 0.4-0.05 0.81l-0.22 3.23c13.07 4.09 32.2 8.49 55.58 8.58 23.33 0.07 42.47-4.19 55.56-8.17v-0.6h0.03q-0.01-0.76-0.03-1.51z"
    />
    <path
      fill="#ffcb05"
      d="m176.59 78.18c16.07 0 29.1-13.01 29.1-29.06 0-16.05-13.03-29.06-29.1-29.06-16.06 0-29.09 13.01-29.09 29.06 0 16.05 13.03 29.06 29.09 29.06z"
    />
    {/* Left Figure (Dark Navy) */}
    <path
      fill="#00274c"
      d="m113.83 128.42c0.36-11.35 3.98-22.21 10.52-31.51q3.11-4.41 6.95-8.18-3.26 0.77-6.65 0.78c-3.91 0-7.7-0.78-11.27-2.28q-3.76-1.59-6.9-4.13c-2.96 0.89-6.2 2.36-9.28 4.72-13.19 10.19-12.39 28.73-12.23 31.39 2.37 2.16 7.06 5.85 14 7.94 6.32 1.9 11.74 1.66 14.86 1.27z"
    />
    <path
      fill="#00274c"
      d="m124.65 83.53c4.19 0 8.14-0.98 11.67-2.71q2.95-2.28 6.17-4.18c1.96-1.78 3.67-3.87 5.03-6.16q-2.96-3.57-4.79-7.86c-1.66-3.9-2.5-8.07-2.5-12.35 0-4.28 0.84-8.45 2.5-12.36q0.05-0.08 0.07-0.16c-4.73-4.44-11.12-7.17-18.13-7.17-14.64 0-26.52 11.85-26.52 26.48 0 14.63 11.87 26.48 26.52 26.48z"
    />
    {/* Right Figure (Dark Navy) */}
    <path
      fill="#00274c"
      d="m239.37 128.42c-0.35-11.35-3.98-22.21-10.52-31.51q-3.1-4.41-6.94-8.18 3.25 0.77 6.64 0.78c3.91 0 7.71-0.78 11.27-2.28q3.76-1.59 6.89-4.13c2.97 0.89 6.21 2.36 9.29 4.72 13.19 10.17 12.4 28.71 12.23 31.36-2.38 2.17-7.06 5.86-14 7.94-6.32 1.91-11.75 1.66-14.88 1.28z"
    />
    <path
      fill="#00274c"
      d="m228.55 83.53c-4.19 0-8.14-0.98-11.67-2.71q-2.95-2.28-6.16-4.18c-1.96-1.78-3.67-3.87-5.03-6.16q2.96-3.57 4.78-7.86c1.66-3.9 2.5-8.07 2.5-12.35 0-4.28-0.84-8.45-2.5-12.36q-0.04-0.08-0.07-0.16c4.74-4.44 11.13-7.17 18.14-7.17 14.64 0 26.51 11.85 26.51 26.48 0 14.63-11.86 26.48-26.51 26.48z"
    />
  </svg>
);

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Processing Request & Syncing Data...',
  title = 'EnrollNow',
  subtitle = 'Please wait while the server responds',
  variant = 'page',
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
            <LoaderEmblemSvg />
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
            <LoaderEmblemSvg />
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
