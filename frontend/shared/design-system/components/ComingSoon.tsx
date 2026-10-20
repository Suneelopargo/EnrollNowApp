// frontend/shared/design-system/components/ComingSoon.tsx - Professional, Accessible Coming Soon State
import React from 'react';
import { LucideIcon, Sparkles, Clock, Compass } from 'lucide-react';

export interface ComingSoonProps {
  title: string;
  subtitle?: string;
  description?: string;
  targetRelease?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  subtitle,
  description = 'This feature is currently in active development on the EnrollNow platform roadmap. No sample or mock records are displayed for unimplemented workflows.',
  targetRelease = 'Scheduled in Upcoming Sprint',
  icon: Icon = Compass,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`coming-soon-container ${className}`.trim()}
      role="region"
      aria-label={`${title} - Feature in Development`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3.5rem 2rem',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        textAlign: 'center',
        margin: '1.5rem 0',
      }}
    >
      <div
        style={{
          width: '4rem',
          height: '4rem',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 0 8px #f8fafc',
        }}
      >
        <Icon size={32} aria-hidden="true" />
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 600,
          backgroundColor: '#f1f5f9',
          color: '#475569',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <Clock size={13} aria-hidden="true" />
        <span>{targetRelease}</span>
      </div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>

      {subtitle && (
        <p
          style={{
            fontSize: '1rem',
            color: '#334155',
            fontWeight: 500,
            maxWidth: '36rem',
            marginBottom: '0.75rem',
          }}
        >
          {subtitle}
        </p>
      )}

      <p
        style={{
          fontSize: '0.875rem',
          color: '#64748b',
          maxWidth: '32rem',
          lineHeight: 1.6,
          marginBottom: actions ? '1.5rem' : '0',
        }}
      >
        {description}
      </p>

      {actions && (
        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
