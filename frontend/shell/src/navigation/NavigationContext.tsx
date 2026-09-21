// frontend/shell/src/navigation/NavigationContext.tsx - Dynamic Top Navigation Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationItem } from '../../../shared/contracts';
import { useAuth } from '../auth/AuthContext';

interface NavigationContextType {
  navItems: NavigationItem[];
  loading: boolean;
  refreshNavigation: () => Promise<void>;
}

const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Clinical Operations', route: '/dashboard', icon: 'LayoutDashboard', order: 1 },
  { id: 'studies', label: 'Studies', route: '/studies', icon: 'BookOpen', order: 2 },
  { id: 'participants', label: 'Participants', route: '/participants', icon: 'Users', order: 3 },
  { id: 'recruitment', label: 'Recruitment', route: '/recruitment', icon: 'Target', order: 4 },
  { id: 'surveys', label: 'Surveys & eConsent', route: '/surveys', icon: 'ClipboardList', order: 5 },
  { id: 'tasks', label: 'Tasks', route: '/tasks', icon: 'CheckSquare', order: 6 },
  { id: 'communications', label: 'Outreach', route: '/communications', icon: 'MessageSquare', order: 7 },
  { id: 'documents', label: 'Documents', route: '/documents', icon: 'FileText', order: 8 },
  { id: 'organization', label: 'Sites & Network', route: '/organization', icon: 'Building', order: 9 },
  { id: 'admin', label: 'Administration', route: '/admin', icon: 'Settings', order: 10, requiredPermission: 'ROLE_SUPER_ADMIN' },
];

const NavigationContext = createContext<NavigationContextType>({
  navItems: DEFAULT_NAVIGATION_ITEMS,
  loading: false,
  refreshNavigation: async () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasRole } = useAuth();
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAVIGATION_ITEMS);
  const [loading, setLoading] = useState<boolean>(false);

  const filterNavItems = () => {
    if (!user) {
      setNavItems([]);
      return;
    }

    const filtered = DEFAULT_NAVIGATION_ITEMS.filter((item) => {
      if (!item.requiredPermission) return true;
      return hasRole(item.requiredPermission) || hasRole('ROLE_SUPER_ADMIN') || hasRole('ROLE_SITE_ADMIN');
    });

    setNavItems(filtered);
  };

  useEffect(() => {
    filterNavItems();
  }, [user]);

  return (
    <NavigationContext.Provider
      value={{
        navItems,
        loading,
        refreshNavigation: async () => filterNavItems(),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationContext;
