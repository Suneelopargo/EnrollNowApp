// frontend/shell/src/navigation/NavigationContext.tsx - Dynamic Top Navigation Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationItem } from '../../../shared/contracts';
import { useAuth } from '../auth/AuthContext';

interface NavigationContextType {
  navItems: NavigationItem[];
  loading: boolean;
  refreshNavigation: () => Promise<void>;
}

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Home', route: '/dashboard', icon: 'Home', order: 1 },
  { id: 'admin', label: 'Administration', route: '/admin', icon: 'Settings', order: 2 },
  { id: 'participants', label: 'Participants', route: '/participants', icon: 'Users', order: 3 },
  { id: 'communications', label: 'Outreach', route: '/communications', icon: 'MessageSquare', order: 4 },
  { id: 'studies', label: 'Studies', route: '/studies', icon: 'BookOpen', order: 5 },
  // Temporarily hidden from the top navigation; routes and MFEs remain available.
  // { id: 'recruitment', label: 'Recruitment', route: '/recruitment', icon: 'Target', order: 6 },
  // { id: 'surveys', label: 'Surveys & eConsent', route: '/surveys', icon: 'ClipboardList', order: 7 },
  // { id: 'tasks', label: 'Tasks', route: '/tasks', icon: 'CheckSquare', order: 8 },
  // { id: 'documents', label: 'Documents', route: '/documents', icon: 'FileText', order: 9 },
  // { id: 'organization', label: 'Sites & Network', route: '/organization', icon: 'Building', order: 10 },
];

const NavigationContext = createContext<NavigationContextType>({
  navItems: DEFAULT_NAVIGATION_ITEMS,
  loading: false,
  refreshNavigation: async () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, hasRole, isAdmin } = useAuth();
  const [navItems, setNavItems] = useState<NavigationItem[]>(DEFAULT_NAVIGATION_ITEMS);
  const [loading] = useState<boolean>(false);

  const filterNavItems = () => {
    if (!user) {
      setNavItems([]);
      return;
    }

    const filtered = DEFAULT_NAVIGATION_ITEMS.filter((item) => {
      if (!item.requiredPermission) return true;
      return (
        isAdmin ||
        hasRole(item.requiredPermission) ||
        hasRole('ROLE_SUPER_ADMIN') ||
        hasRole('ROLE_SITE_ADMIN') ||
        hasRole('ROLE_ADMIN') ||
        hasRole('ADMIN') ||
        Boolean(user?.roles?.some((r) => r.toUpperCase().includes('ADMIN')))
      );
    });

    setNavItems(filtered);
  };

  useEffect(() => {
    filterNavItems();
  }, [user, isAdmin]);

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
