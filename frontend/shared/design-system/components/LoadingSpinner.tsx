import React from 'react';

export interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading module...' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;
