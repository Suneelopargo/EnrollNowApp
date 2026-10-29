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

  const hasChecklist = Boolean(card.checkItems?.length);

  return (
    <div className={`enl-floating-info-card ${className}`}>
      {/* Stage Badge */}
      {card.stageBadge && (
        <div className="enl-float-card-top-row">
          <span className={`enl-float-stage-pill enl-float-stage-pill--${card.stageNumber || 1}`}>
            {card.stageBadge}
          </span>
        </div>
      )}

      {/* Header Row */}
      <div className={`enl-float-card-header ${hasChecklist ? 'enl-float-card-header--checklist' : ''}`}>
        <div className={`enl-float-card-icon-box enl-float-card-icon-box--${card.stageNumber || 1}`}>
          {renderHeaderIcon()}
        </div>
        <div className="enl-float-card-title">
          {card.title}
        </div>
      </div>

      {/* Checklist Content */}
      {hasChecklist && card.checkItems && (
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

    </div>
  );
};

export default FloatingInfoCard;
