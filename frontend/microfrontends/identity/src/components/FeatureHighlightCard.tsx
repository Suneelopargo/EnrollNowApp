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
    const iconSize = 15;
    switch (feature.iconName) {
      case 'users':
        return <Users size={iconSize} color={feature.accentColor} />;
      case 'calendar':
        return <Calendar size={iconSize} color={feature.accentColor} />;
      case 'chart':
        return <BarChart3 size={iconSize} color={feature.accentColor} />;
      case 'shield':
        return <ShieldCheck size={iconSize} color={feature.accentColor} />;
      default:
        return <Users size={iconSize} color={feature.accentColor} />;
    }
  };

  return (
    <div
      className={`enl-feature-card ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '6px 11px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid rgba(226, 232, 240, 0.85)',
        boxShadow: '0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        boxSizing: 'border-box',
        maxWidth: '255px',
      }}
    >
      {/* Icon Badge */}
      <div
        className="enl-feature-icon-badge"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
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
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {feature.title}
        </div>
        <div
          style={{
            fontSize: '9.5px',
            color: '#64748B',
            lineHeight: 1.25,
            marginTop: '1px',
          }}
        >
          {feature.description}
        </div>
      </div>
    </div>
  );
};
