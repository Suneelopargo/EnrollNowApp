// frontend/microfrontends/identity/src/components/MyAccount/Sidebar/MyAccountSidebar.tsx
import React from 'react';
import { ProfilePhoto } from './ProfilePhoto';
import { AccountCreated } from './AccountCreated';
import { RecentLogins } from './RecentLogins';
import { UserProfile, RecentLogin } from '../../../../../../shared/api/accountApi';

export interface MyAccountSidebarProps {
  profile: UserProfile;
  logins: RecentLogin[];
  onPhotoUpdated: (newUrl: string) => void;
}

export const MyAccountSidebar: React.FC<MyAccountSidebarProps> = ({
  profile,
  logins,
  onPhotoUpdated,
}) => {
  return (
    <aside className="account-sidebar" aria-label="Account Overview and Security">
      <ProfilePhoto url={profile.profilePhotoUrl} onPhotoUpdated={onPhotoUpdated} />
      <AccountCreated createdAt={profile.createdAt} timezone={profile.timezone} />
      <RecentLogins logins={logins} timezone={profile.timezone} />
    </aside>
  );
};
