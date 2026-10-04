// frontend/microfrontends/identity/src/components/FeatureHighlights.tsx
import React from 'react';
import { FeatureHighlight } from '../data/loginContent';
import { FeatureHighlightCard } from './FeatureHighlightCard';

export interface FeatureHighlightsProps {
  features: FeatureHighlight[];
  className?: string;
}

export const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({
  features,
  className = '',
}) => {
  return (
    <div className={`enl-features-stack ${className}`}>
      {features.map((feature) => (
        <FeatureHighlightCard key={feature.id} feature={feature} />
      ))}
    </div>
  );
};
