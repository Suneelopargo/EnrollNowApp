// frontend/microfrontends/identity/src/components/FeatureHighlightCard.tsx
import React from 'react';
import { Users, Calendar, BarChart3, ShieldCheck } from 'lucide-react';
import { FeatureHighlight } from '../data/loginContent';

export interface FeatureHighlightCardProps {
  feature: FeatureHighlight;
  className?: string;
}

export const FeatureHighlightCard: React.FC<FeatureHighlightCardProps> = ({
  feature,
  className = '',
}) => {
  const renderIcon = () => {
    const iconSize = 26;
    switch (feature.iconName) {
      case 'users':
        return <Users size={iconSize} strokeWidth={2.2} />;
      case 'calendar':
        return <Calendar size={iconSize} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={iconSize} strokeWidth={2.2} />;
      case 'shield':
        return <ShieldCheck size={iconSize} strokeWidth={2.2} />;
      default:
        return <Users size={iconSize} strokeWidth={2.2} />;
    }
  };

  return (
    <div className={`enl-feature-item ${className}`}>
      {/* Icon Badge (52x52px) */}
      <div className={`enl-feature-icon-badge enl-feature-icon-badge--${feature.id}`}>
        {renderIcon()}
      </div>

      {/* Texts */}
      <div className="enl-feature-text-col">
        <div className="enl-feature-title">{feature.title}</div>
        <div className="enl-feature-desc">{feature.description}</div>
      </div>
    </div>
  );
};

export default FeatureHighlightCard;
