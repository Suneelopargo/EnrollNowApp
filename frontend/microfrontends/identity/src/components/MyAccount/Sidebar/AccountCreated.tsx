// frontend/microfrontends/identity/src/components/MyAccount/Sidebar/AccountCreated.tsx
import React from 'react';

export interface AccountCreatedProps {
  createdAt: string;
  timezone?: string | null;
}

export const AccountCreated: React.FC<AccountCreatedProps> = ({ createdAt, timezone }) => {
  const formattedDate = React.useMemo(() => {
    if (!createdAt) return '—';
    try {
      const date = new Date(createdAt);
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timezone || undefined,
      };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    } catch {
      return new Date(createdAt).toLocaleDateString();
    }
  }, [createdAt, timezone]);

  return (
    <section className="account-sidebar-section account-sidebar-created-section">
      <h3 className="account-sidebar-header">Account Created</h3>
      <div className="account-created-date">{formattedDate}</div>
    </section>
  );
};
