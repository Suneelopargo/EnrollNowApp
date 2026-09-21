import React from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from '../UserMenu';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export const AppHeader: React.FC = () => {
  const { user, isAdmin } = useAuth();

  return (
    <header className="app-header">
      <div className="header-top-bar">
        <Link to="/dashboard" className="brand-section">
          <div className="brand-logo-badge">EN</div>
          <div className="brand-titles">
            <span className="brand-name">EnrollNow</span>
            <span className="brand-subtitle">Clinical Participant Recruitment Platform</span>
          </div>
        </Link>

        <div className="header-actions">
          {isAdmin && (
            <span className="badge badge-info">
              <Shield size={12} />
              System Admin
            </span>
          )}

          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
