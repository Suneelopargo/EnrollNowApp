import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AuthComplianceNotice: React.FC = () => (
  <div className="enl-compliance-notice">
    <div className="enl-compliance-header">
      <ShieldCheck size={14} className="enl-compliance-icon" />
      <span className="enl-compliance-title">Authorized Use and Monitoring Notice</span>
    </div>
    <p className="enl-compliance-text">
      This application contains confidential information, including protected health information (PHI) and/or regulated electronic records. Access is restricted to authorized users for approved purposes.
    </p>
    <p className="enl-compliance-text">
      Your access and activity may be monitored, logged, and reviewed. Do not share your account or credentials, or access, use, or disclose information beyond your authorization. Unauthorized use may result in disciplinary action and/or civil or criminal penalties.
    </p>
    <p className="enl-compliance-text">
      By continuing, you acknowledge this notice and agree to use the application in accordance with applicable laws and organizational policies.
    </p>
  </div>
);

export default AuthComplianceNotice;
