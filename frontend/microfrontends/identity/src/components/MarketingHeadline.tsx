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
          width: '28px',
          height: '3.5px',
          backgroundColor: '#F59E0B',
          borderRadius: '2px',
          marginBottom: '10px',
        }}
      />

      {/* Main Headline */}
      <h1
        className="enl-main-heading"
        style={{
          margin: 0,
          fontSize: '26px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.025em',
          color: '#0F172A',
        }}
      >
        <div>{headline.line1}</div>
        <div>{headline.line2}</div>
        <div style={{ color: '#0284C7' }}>{headline.emphasis}</div>
      </h1>

      {/* Supporting Description */}
      <p
        className="enl-heading-desc"
        style={{
          margin: '8px 0 0 0',
          fontSize: '11.5px',
          lineHeight: 1.45,
          color: '#475569',
          maxWidth: '280px',
        }}
      >
        {description}
      </p>
    </div>
  );
};
