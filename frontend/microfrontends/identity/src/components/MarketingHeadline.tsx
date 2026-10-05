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
      <div className="enl-accent-bar" />

      {/* Main Headline (Exactly 3 Lines on Desktop) */}
      <h1 className="enl-main-heading">
        <div>{headline.line1}</div>
        <div className="enl-heading-line2">{headline.line2}</div>
        <div className="enl-heading-emphasis">{headline.emphasis}</div>
      </h1>

      {/* Supporting Description */}
      <p className="enl-heading-desc">
        {description}
      </p>
    </div>
  );
};

export default MarketingHeadline;
