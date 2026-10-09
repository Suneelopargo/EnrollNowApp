// frontend/shared/design-system/components/Skeleton.tsx - Standardized SCSS-Driven Skeleton Loader
import React from 'react';

export interface SkeletonProps {
  /** Shape variant: 'text' | 'circular' | 'rectangular' | 'card' (default: 'text') */
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  /** For text variant: number of lines to render (default: 1) */
  lines?: number;
  /** Extra CSS classes */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  lines = 1,
  className = '',
}) => {
  if (lines > 1 && variant === 'text') {
    return (
      <div className={`skeleton-group ${className}`} role="status" aria-label="Loading content...">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton skeleton--text ${index === lines - 1 ? 'skeleton--text-short' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      role="status"
      aria-label="Loading content..."
    />
  );
};

export default Skeleton;
