// frontend/microfrontends/identity/src/components/FloatingInfoCard.tsx
import React from 'react';
import { Users, Calendar, BarChart3, Check } from 'lucide-react';
import { FloatingCardItem } from '../data/loginContent';

export interface FloatingInfoCardProps {
  card: FloatingCardItem;
  style?: React.CSSProperties;
  className?: string;
}

export const FloatingInfoCard: React.FC<FloatingInfoCardProps> = ({
  card,
  style,
  className = '',
}) => {
  const renderHeaderIcon = () => {
    const iconSize = 15;
    const color = '#0284C7';
    switch (card.iconName) {
      case 'users':
        return <Users size={iconSize} color={color} />;
      case 'calendar':
        return <Calendar size={iconSize} color={color} />;
      case 'chart':
        return <BarChart3 size={iconSize} color={color} />;
      default:
        return <Users size={iconSize} color={color} />;
    }
  };

  return (
    <div
      className={`enl-floating-info-card ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        padding: card.type === 'checklist' ? '12px 14px' : '10px 14px',
        boxShadow:
          '0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.85)',
        boxSizing: 'border-box',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: card.type === 'checklist' ? '8px' : '6px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            backgroundColor: '#E0F2FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {renderHeaderIcon()}
        </div>
        <div
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {card.title}
        </div>
      </div>

      {/* Checklist Content */}
      {card.type === 'checklist' && card.checkItems && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            paddingLeft: '2px',
          }}
        >
          {card.checkItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <div
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check size={8.5} strokeWidth={3.5} color="#ffffff" />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  color: '#334155',
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton / Bar Content */}
      {card.type === 'skeleton' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingLeft: '2px',
            marginTop: '2px',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '5px',
              backgroundColor: '#E2E8F0',
              borderRadius: '3px',
            }}
          />
          <div
            style={{
              width: '46px',
              height: '5px',
              backgroundColor: '#E2E8F0',
              borderRadius: '3px',
            }}
          />
        </div>
      )}
    </div>
  );
};
