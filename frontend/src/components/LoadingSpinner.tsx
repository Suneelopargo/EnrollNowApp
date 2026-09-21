import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
};

export default LoadingSpinner;
