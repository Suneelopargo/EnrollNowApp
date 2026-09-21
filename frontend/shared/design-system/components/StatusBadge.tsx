import React from 'react';

export interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  let resolvedVariant = variant;
  if (!resolvedVariant) {
    const s = (status || '').toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'ENROLLED', 'APPROVED', 'SUCCESS', 'DELIVERED'].includes(s)) {
      resolvedVariant = 'success';
    } else if (['PENDING', 'SCREENING', 'SCHEDULED', 'WARNING', 'IN_PROGRESS'].includes(s)) {
      resolvedVariant = 'warning';
    } else if (['INACTIVE', 'SUSPENDED', 'REJECTED', 'DISCONTINUED', 'DANGER', 'HIGH'].includes(s)) {
      resolvedVariant = 'danger';
    } else if (['INFO', 'INVITED'].includes(s)) {
      resolvedVariant = 'info';
    } else {
      resolvedVariant = 'neutral';
    }
  }

  return (
    <span className={`badge badge-${resolvedVariant}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
