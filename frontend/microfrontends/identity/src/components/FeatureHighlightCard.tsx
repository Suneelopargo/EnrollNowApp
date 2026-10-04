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
        return <Users size={iconSize} color={feature.accentColor} strokeWidth={2.2} />;
      case 'calendar':
        return <Calendar size={iconSize} color={feature.accentColor} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={iconSize} color={feature.accentColor} strokeWidth={2.2} />;
      case 'shield':
        return <ShieldCheck size={iconSize} color={feature.accentColor} strokeWidth={2.2} />;
      default:
        return <Users size={iconSize} color={feature.accentColor} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className={`enl-feature-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '2px 0',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        boxSizing: 'border-box',
        maxWidth: '350px',
      }}
    >
      {/* Icon Badge (52x52px) */}
      <div
        className="enl-feature-icon-badge"
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '15px',
          backgroundColor: feature.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {renderIcon()}
      </div>

      {/* Texts */}
      <div style={{ textAlign: 'left', minWidth: 0 }}>
        <div
          className="enl-feature-title"
          style={{
            fontSize: '16.5px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
          }}
        >
          {feature.title}
        </div>
        <div
          className="enl-feature-desc"
          style={{
            fontSize: '13.5px',
            color: '#64748B',
            lineHeight: 1.4,
            marginTop: '3px',
            maxWidth: '280px',
          }}
        >
          {feature.description}
        </div>
      </div>
    </div>
  );
};
