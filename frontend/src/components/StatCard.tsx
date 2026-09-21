import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'info' | 'success' | 'warning' | 'cyan';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'info',
}) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon-wrapper ${variant}`}>
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
    </div>
  );
};

export default StatCard;
