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
    const iconSize = 18;
    const color = '#0284C7';
    switch (card.iconName) {
      case 'users':
        return <Users size={iconSize} color={color} strokeWidth={2.2} />;
      case 'calendar':
        return <Calendar size={iconSize} color={color} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={iconSize} color={color} strokeWidth={2.2} />;
      default:
        return <Users size={iconSize} color={color} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className={`enl-floating-info-card ${className}`}
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '14px 18px',
        boxShadow:
          '0 16px 36px -8px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.9)',
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
          gap: '10px',
          marginBottom: card.type === 'checklist' ? '10px' : '8px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
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
            fontSize: '14.5px',
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.25,
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
            gap: '8px',
            paddingLeft: '2px',
          }}
        >
          {card.checkItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Check size={11} strokeWidth={3} color="#ffffff" />
              </div>
              <span
                style={{
                  fontSize: '12.5px',
                  color: '#334155',
                  fontWeight: 500,
                  lineHeight: 1.3,
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
            gap: '8px',
            paddingLeft: '2px',
            marginTop: '8px',
          }}
        >
          <div
            style={{
              width: card.id === 'engage' ? '135px' : '90px',
              height: '7px',
              backgroundColor: '#E2E8F0',
              borderRadius: '4px',
            }}
          />
          <div
            style={{
              width: card.id === 'engage' ? '95px' : '65px',
              height: '7px',
              backgroundColor: '#E2E8F0',
              borderRadius: '4px',
            }}
          />
        </div>
      )}
    </div>
  );
};
