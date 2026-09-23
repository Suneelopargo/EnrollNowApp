// frontend/shared/design-system/components/Footer.tsx - Shared Global Footer Component
import React from 'react';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';

export interface FooterProps {
  variant?: 'app-shell' | 'auth';
  showStatus?: boolean;
  showLinks?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  variant = 'app-shell',
  showStatus = true,
  showLinks = true,
}) => {
  const currentYear = new Date().getFullYear();

  if (variant === 'auth') {
    return (
      <footer className="auth-page-footer">
        {showLinks && (
          <div className="auth-footer-links">
            <a href="#privacy" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <span className="separator">·</span>
            <a href="#terms" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>
            <span className="separator">·</span>
            <a href="#security" onClick={(e) => e.preventDefault()}>
              Security & Compliance
            </a>
            <span className="separator">·</span>
            <a href="#help" onClick={(e) => e.preventDefault()}>
              Support Portal
            </a>
          </div>
        )}

        <div className="auth-footer-bottom">
          <span>&copy; {currentYear} EnrollNow Clinical Platform. All rights reserved.</span>
          {showStatus && (
            <>
              <span className="separator">·</span>
              <div className="auth-status-indicator">
                <span className="status-dot" />
                <span>Identity Gateway 8081 Active</span>
              </div>
            </>
          )}
        </div>
      </footer>
    );
  }

  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-left">
          <div className="footer-brand">
            <div className="footer-badge">EN</div>
            <span>EnrollNow</span>
          </div>
          <span className="footer-copyright">
            &copy; {currentYear} EnrollNow Clinical Operations Platform. All rights reserved.
          </span>
          <span className="version-tag">v1.0.0-PROD</span>
        </div>

        <div className="footer-right">
          {showStatus && (
            <div className="system-status-indicator">
              <span className="status-dot" />
              <span>All Systems Operational</span>
            </div>
          )}

          {showLinks && (
            <ul className="footer-links">
              <li>
                <a href="#privacy" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" onClick={(e) => e.preventDefault()}>
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#compliance" onClick={(e) => e.preventDefault()}>
                  21 CFR Part 11 / HIPAA
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
