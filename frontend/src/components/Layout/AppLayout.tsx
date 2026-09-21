import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { TopNavigation } from '../TopNavigation';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <AppHeader />
      <TopNavigation />
      <main className="page-container">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default AppLayout;
