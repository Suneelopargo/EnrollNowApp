// frontend/shared/design-system/components/Footer.tsx - Shared Global Footer Component
import React from 'react';

export interface FooterProps {
  variant?: 'app-shell' | 'auth';
  className?: string;
  showStatus?: boolean;
  showLinks?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  className = '',
}) => {
  return (
    <footer className={`app-footer ${className}`} role="contentinfo">
      <div className="footer-container footer-container--center">
        <span>&copy; 2016 - 2027 </span>
        <a
          href="#enrollnow"
          className="footer-link"
          onClick={(e) => e.preventDefault()}
        >
          EnrollNow
        </a>
        <span className="footer-separator" aria-hidden="true">|</span>
        <a
          href="#terms"
          className="footer-link"
          onClick={(e) => e.preventDefault()}
        >
          Terms of Service
        </a>
        <span className="footer-separator" aria-hidden="true">|</span>
        <a
          href="#support"
          className="footer-link"
          onClick={(e) => e.preventDefault()}
        >
          Support Center
        </a>
      </div>
    </footer>
  );
};

export default Footer;
