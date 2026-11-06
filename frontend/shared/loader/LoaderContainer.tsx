// frontend/shared/loader/LoaderContainer.tsx - Global Enterprise Loader Overlay Host
import React from 'react';
import { createPortal } from 'react-dom';
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

  const content = (
    <LoadingSpinner
      variant="overlay"
      message={message}
      title={title}
      subtitle={subtitle}
      className={className}
    />
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
};

export default LoaderContainer;
