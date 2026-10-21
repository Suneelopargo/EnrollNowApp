// frontend/shared/loader/LoaderContainer.tsx - Global Enterprise Loader Overlay Host
import React from 'react';
import { useLoader } from './useLoader';
import { LoadingSpinner } from '../design-system/components/LoadingSpinner';

export interface LoaderContainerProps {
  className?: string;
}

export const LoaderContainer: React.FC<LoaderContainerProps> = ({ className = '' }) => {
  const { visible, message, title, subtitle } = useLoader();

  if (!visible) {
    return null;
  }

  return (
    <LoadingSpinner
      variant="overlay"
      message={message}
      title={title}
      subtitle={subtitle}
      className={className}
    />
  );
};

export default LoaderContainer;
