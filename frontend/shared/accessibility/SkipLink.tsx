// frontend/shared/accessibility/SkipLink.tsx
// Accessible Skip Navigation Link (WCAG 2.4.1 Bypass Blocks)

import React from 'react';

export interface SkipLinkProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`enl-skip-link ${className}`.trim()}
    >
      {label}
    </a>
  );
};

export default SkipLink;
