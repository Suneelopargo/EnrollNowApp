// frontend/shared/design-system/components/Footer.tsx - Shared Global Footer Component
import React from 'react';
import { AuthFooterWave } from './AuthFooterWave';

export interface FooterProps {
  variant?: 'app-shell' | 'auth' | 'auth-card';
  className?: string;
  showStatus?: boolean;
  showLinks?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  variant = 'app-shell',
  className = '',
}) => {
  if (variant === 'auth') {
    return (
      <footer className={`enl-login-strong-footer ${className}`.trim()} role="contentinfo">
        <div className="enl-strong-footer-container enl-strong-footer-container--center">
          <span>&copy; 2016 - 2027 </span>
          <a
            href="#enrollnow"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            EnrollNow
          </a>
          <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
          <a
            href="#terms"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Terms of Service
          </a>
          <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
          <a
            href="#support"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Support Center
          </a>
        </div>
      </footer>
    );
  }

  if (variant === 'auth-card') {
    return (
      <footer className={`enl-activation-footer ${className}`.trim()} role="contentinfo">
        <span className="enl-activation-copyright">&copy; 2016 - 2026</span>
        <a href="#enrollnow" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          EnrollNow
        </a>
        <span className="enl-activation-footer-divider" aria-hidden="true">|</span>
        <a href="#terms" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Terms of Service
        </a>
        <span className="enl-activation-footer-divider" aria-hidden="true">|</span>
        <a href="#support" className="enl-activation-footer-link" onClick={(e) => e.preventDefault()}>
          Support Center
        </a>
      </footer>
    );
  }

  return (
    <>
      <div className="app-shell-footer-wave">
        <AuthFooterWave />
      </div>
      <footer
        className={`app-footer enl-login-strong-footer app-shell-footer ${className}`.trim()}
        role="contentinfo"
      >
        <div className="enl-strong-footer-container enl-strong-footer-container--center">
          <span>&copy; 2016 - 2027 </span>
          <a
            href="#enrollnow"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            EnrollNow
          </a>
          <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
          <a
            href="#terms"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Terms of Service
          </a>
          <span className="enl-strong-footer-sep" aria-hidden="true">|</span>
          <a
            href="#support"
            className="enl-strong-footer-link"
            onClick={(e) => e.preventDefault()}
          >
            Support Center
          </a>
        </div>
      </footer>
    </>
  );
};

export default Footer;
