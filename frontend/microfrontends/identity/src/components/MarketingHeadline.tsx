// frontend/microfrontends/identity/src/components/MarketingHeadline.tsx
import React from 'react';
import { HeadlineConfig } from '../data/loginContent';

export interface MarketingHeadlineProps {
  headline: HeadlineConfig;
  description: string;
  className?: string;
}

export const MarketingHeadline: React.FC<MarketingHeadlineProps> = ({
  headline,
  description,
  className = '',
}) => {
  return (
    <div className={`enl-headline-block ${className}`}>
      {/* Amber Accent Bar */}
      <div
        className="enl-accent-bar"
        style={{
          width: '52px',
          height: '5px',
          backgroundColor: '#F59E0B',
          borderRadius: '3px',
          marginBottom: '16px',
        }}
      />

      {/* Main Headline (Exactly 3 Lines on Desktop) */}
      <h1
        className="enl-main-heading"
        style={{
          margin: 0,
          fontSize: 'clamp(42px, 2.7vw, 49px)',
          fontWeight: 800,
          lineHeight: 1.14,
          letterSpacing: '-0.025em',
          color: '#0F172A',
        }}
      >
        <div>{headline.line1}</div>
        <div style={{ whiteSpace: 'nowrap' }}>{headline.line2}</div>
        <div style={{ color: '#0284C7' }}>{headline.emphasis}</div>
      </h1>

      {/* Supporting Description (Approximately 3 lines on desktop) */}
      <p
        className="enl-heading-desc"
        style={{
          margin: '16px 0 0 0',
          fontSize: '17px',
          lineHeight: 1.5,
          color: '#475569',
          maxWidth: '380px',
        }}
      >
        {description}
      </p>
    </div>
  );
};
