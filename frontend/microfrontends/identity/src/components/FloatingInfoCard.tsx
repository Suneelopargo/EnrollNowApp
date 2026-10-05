// frontend/microfrontends/identity/src/components/FloatingInfoCard.tsx
import React from 'react';
import { Users, Calendar, BarChart3, Check } from 'lucide-react';
import { FloatingCardItem } from '../data/loginContent';

export interface FloatingInfoCardProps {
  card: FloatingCardItem;
  className?: string;
}

export const FloatingInfoCard: React.FC<FloatingInfoCardProps> = ({
  card,
  className = '',
}) => {
  const renderHeaderIcon = () => {
    const iconSize = 18;
    switch (card.iconName) {
      case 'users':
        return <Users size={iconSize} strokeWidth={2.2} />;
      case 'calendar':
        return <Calendar size={iconSize} strokeWidth={2.2} />;
      case 'chart':
        return <BarChart3 size={iconSize} strokeWidth={2.2} />;
      default:
        return <Users size={iconSize} strokeWidth={2.2} />;
    }
  };

  const isChecklist = card.type === 'checklist';
  const isEngage = card.id === 'engage';

  return (
    <div className={`enl-floating-info-card ${className}`}>
      {/* Header Row */}
      <div className={`enl-float-card-header ${isChecklist ? 'enl-float-card-header--checklist' : ''}`}>
        <div className="enl-float-card-icon-box">
          {renderHeaderIcon()}
        </div>
        <div className="enl-float-card-title">
          {card.title}
        </div>
      </div>

      {/* Checklist Content */}
      {isChecklist && card.checkItems && (
        <div className="enl-float-checklist">
          {card.checkItems.map((item, idx) => (
            <div key={idx} className="enl-float-check-item">
              <div className="enl-float-check-icon">
                <Check size={11} strokeWidth={3} />
              </div>
              <span className="enl-float-check-text">{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Skeleton / Bar Content */}
      {!isChecklist && (
        <div className="enl-float-skeleton">
          <div className={`enl-skeleton-bar-long ${isEngage ? 'enl-skeleton-bar-long--wide' : ''}`} />
          <div className={`enl-skeleton-bar-short ${isEngage ? 'enl-skeleton-bar-short--wide' : ''}`} />
        </div>
      )}
    </div>
  );
};

export default FloatingInfoCard;
