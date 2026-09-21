import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 'var(--spacing-6)' }}>
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--border-radius-full)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--spacing-4)',
        }}
      >
        <ShieldAlert size={32} />
      </div>
      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
        Access Restricted
      </h1>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginTop: 'var(--spacing-2)', maxWidth: '480px' }}>
        You do not have the required administrative role or site permissions to view this resource. 
        All unauthorized access attempts are logged to the security audit ledger.
      </p>
      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <Link to="/dashboard" className="btn btn-primary">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
