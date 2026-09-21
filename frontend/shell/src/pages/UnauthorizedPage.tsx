import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="error-fallback-card">
      <div className="error-icon-box">
        <ShieldAlert size={48} className="error-icon" />
      </div>
      <h2>Access Restricted</h2>
      <p>
        You do not have the required role or permissions to access this micro-frontend.
        All unauthorized access attempts are logged to the security audit ledger.
      </p>
      <div className="error-actions-group">
        <Link to="/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
