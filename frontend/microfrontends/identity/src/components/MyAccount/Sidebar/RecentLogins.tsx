// frontend/microfrontends/identity/src/components/MyAccount/Sidebar/RecentLogins.tsx
import React, { useState } from 'react';
import { RecentLogin } from '../../../../../../shared/api/accountApi';

export interface RecentLoginsProps {
  logins: RecentLogin[];
  timezone?: string | null;
}

export const RecentLogins: React.FC<RecentLoginsProps> = ({ logins, timezone }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const options: Intl.DateTimeFormatOptions = {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: timezone || undefined,
      };
      return new Intl.DateTimeFormat('en-US', options).format(d);
    } catch {
      return new Date(isoString).toLocaleString();
    }
  };

  const formatIpAddress = (ip?: string | null) => {
    if (!ip) return null;
    // Map IPv6 loopback / localhost addresses cleanly
    if (ip === '0:0:0:0:0:0:0:1' || ip === '::1' || ip === '127.0.0.1') {
      return '127.0.0.1 (Localhost)';
    }
    return ip;
  };

  return (
    <section className="account-sidebar-section account-recent-logins-section">
      <h3 className="account-sidebar-header">Recent logins</h3>
      {logins.length === 0 ? (
        <p className="account-sidebar-muted">No recent logins recorded.</p>
      ) : (
        <div className="account-recent-logins-list">
          {logins.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <table className="account-login-table" key={`${item.loginAt}-${idx}`}>
                <tbody>
                  <tr className="account-login-row account-login-row-time">
                    <td className="account-login-label">Time</td>
                    <td className="account-login-val">{formatTime(item.loginAt)}</td>
                  </tr>
                  {item.ipAddress && (
                    <tr className="account-login-row account-login-row-addr">
                      <td className="account-login-label">Addr.</td>
                      <td className="account-login-val" title={`IP Address: ${item.ipAddress}`}>
                        {formatIpAddress(item.ipAddress)}
                      </td>
                    </tr>
                  )}
                  {item.userAgent && (
                    <tr
                      className={`account-login-row account-login-row-agent ${isHovered ? 'is-active-hover' : ''}`}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      onFocus={() => setHoveredIdx(idx)}
                      onBlur={() => setHoveredIdx(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`User Agent: ${item.userAgent}`}
                    >
                      <td className="account-login-label">Agent</td>
                      <td className="account-login-val account-agent-cell">
                        <span className="account-agent-placeholder">Hover to see</span>
                        <span className="account-agent-full">{item.userAgent}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })}
        </div>
      )}
    </section>
  );
};
