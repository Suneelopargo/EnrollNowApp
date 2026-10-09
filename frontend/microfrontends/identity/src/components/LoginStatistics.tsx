// frontend/microfrontends/identity/src/components/LoginStatistics.tsx
import React from 'react';
import { Users, Building2, BarChart3 } from 'lucide-react';
import { StatisticItem } from '../data/loginContent';

export interface LoginStatisticsProps {
  statistics?: StatisticItem[];
  className?: string;
}

export const LoginStatistics: React.FC<LoginStatisticsProps> = ({
  statistics = [],
  className = '',
}) => {
  const renderIcon = (iconName: string) => {
    const size = 30;
    switch (iconName) {
      case 'users':
        return <Users size={size} strokeWidth={2.2} />;
      case 'building':
        return <Building2 size={size} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={size} strokeWidth={2.2} />;
      default:
        return <Users size={size} strokeWidth={2.2} />;
    }
  };

  return (
    <div className={`enl-statistics-row ${className}`}>
      {statistics.map((stat, idx) => (
        <React.Fragment key={stat.id}>
          {idx > 0 && <div className="enl-stat-divider" />}
          <div className="enl-stat-item">
            {/* Icon */}
            <div className="enl-stat-icon-box">
              {renderIcon(stat.iconName)}
            </div>

            {/* Stat Texts */}
            <div className="enl-stat-text-col">
              <div className="enl-stat-value">{stat.value}</div>
              <div className="enl-stat-label">{stat.label}</div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default LoginStatistics;
