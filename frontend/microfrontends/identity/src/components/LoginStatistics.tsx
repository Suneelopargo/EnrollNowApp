// frontend/microfrontends/identity/src/components/LoginStatistics.tsx
import React from 'react';
import { Users, Building2, BarChart3 } from 'lucide-react';
import { StatisticItem } from '../data/loginContent';

export interface LoginStatisticsProps {
  statistics?: StatisticItem[];
  className?: string;
  style?: React.CSSProperties;
}

export const LoginStatistics: React.FC<LoginStatisticsProps> = ({
  statistics = [],
  className = '',
  style,
}) => {
  const renderIcon = (iconName: string) => {
    const size = 18;
    const color = '#ffffff';
    switch (iconName) {
      case 'users':
        return <Users size={size} color={color} strokeWidth={2.2} />;
      case 'building':
        return <Building2 size={size} color={color} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={size} color={color} strokeWidth={2.2} />;
      default:
        return <Users size={size} color={color} strokeWidth={2.2} />;
    }
  };

  return (
    <div
      className={`enl-statistics-row ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '24px',
        userSelect: 'none',
        ...style,
      }}
    >
      {statistics.map((stat, idx) => (
        <React.Fragment key={stat.id}>
          {idx > 0 && (
            <div
              className="enl-stat-divider"
              style={{
                width: '1px',
                height: '28px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
              }}
            />
          )}
          <div
            className="enl-stat-item"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {renderIcon(stat.iconName)}
            </div>

            {/* Stat Texts */}
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#e0f2fe',
                  marginTop: '1px',
                }}
              >
                {stat.label}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};
