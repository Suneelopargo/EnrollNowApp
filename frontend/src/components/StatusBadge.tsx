import React from 'react';

export type StatusVariant = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'ENROLLED' | 'SCREENING' | 'COMPLETED' | 'SUSPENDED' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant }) => {
  let resolvedVariant = variant;
  if (!resolvedVariant) {
    const s = (status || '').toUpperCase();
    if (['ACTIVE', 'COMPLETED', 'ENROLLED', 'APPROVED', 'SUCCESS'].includes(s)) {
      resolvedVariant = 'success';
    } else if (['PENDING', 'SCREENING', 'SCHEDULED', 'WARNING'].includes(s)) {
      resolvedVariant = 'warning';
    } else if (['INACTIVE', 'SUSPENDED', 'REJECTED', 'DISCONTINUED', 'DANGER', 'HIGH'].includes(s)) {
      resolvedVariant = 'danger';
    } else if (['INFO', 'INVITED', 'IN_PROGRESS'].includes(s)) {
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
