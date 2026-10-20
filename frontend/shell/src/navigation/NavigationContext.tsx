// frontend/shell/src/navigation/NavigationContext.tsx - Dynamic Top Navigation Management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, NavigationItem } from '../../../shared/contracts';
import {
  userHasPermission,
  userHasRegistryAccess,
  userHasRole,
  userHasSiteAdminAccess,
} from '../../../shared/api/authApi';
import { useAuth } from '../auth/AuthContext';

interface NavigationContextType {
  navItems: NavigationItem[];
  loading: boolean;
  refreshNavigation: () => Promise<void>;
}

export const DEFAULT_NAVIGATION_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'Home', route: '/dashboard', icon: 'Home', order: 1 },
  {
    id: 'admin',
    label: 'Administration',
    route: '/admin',
    icon: 'Settings',
    requiredPermission: 'SITE_ADMIN_ACCESS',
    order: 2,
  },
  {
    id: 'participants',
    label: 'Registry',
    route: '/participants',
    icon: 'Users',
    requiredPermission: 'REGISTRY_VIEW',
    order: 3,
  },
  { id: 'communications', label: 'Outreach', route: '/communications', icon: 'MessageSquare', order: 4 },
  { id: 'studies', label: 'Studies', route: '/studies', icon: 'BookOpen', order: 5 },
  // Temporarily hidden from the top navigation; routes and MFEs remain available.
  // { id: 'recruitment', label: 'Recruitment', route: '/recruitment', icon: 'Target', order: 6 },
  // { id: 'surveys', label: 'Surveys & eConsent', route: '/surveys', icon: 'ClipboardList', order: 7 },
  // { id: 'tasks', label: 'Tasks', route: '/tasks', icon: 'CheckSquare', order: 8 },
  // { id: 'documents', label: 'Documents', route: '/documents', icon: 'FileText', order: 9 },
  // { id: 'organization', label: 'Sites & Network', route: '/organization', icon: 'Building', order: 10 },
];

export function getAuthorizedNavigationItems(
  user: AuthUser | null | undefined,
  items: NavigationItem[] = DEFAULT_NAVIGATION_ITEMS
): NavigationItem[] {
  if (!user) {
    return [];
  }

  return items.filter((item) => {
    if (!item.requiredPermission) {
      return true;
    }

    if (item.id === 'admin' || item.requiredPermission === 'SITE_ADMIN_ACCESS') {
      return userHasSiteAdminAccess(user);
    }

    if (item.id === 'participants' || item.requiredPermission === 'REGISTRY_VIEW') {
      return userHasRegistryAccess(user);
    }

    return (
      userHasPermission(user, item.requiredPermission) ||
      userHasRole(user, item.requiredPermission)
    );
  });
}

const NavigationContext = createContext<NavigationContextType>({
  navItems: [],
  loading: false,
  refreshNavigation: async () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [navItems, setNavItems] = useState<NavigationItem[]>(() =>
    authLoading ? [] : getAuthorizedNavigationItems(user)
  );

  const filterNavItems = useCallback(() => {
    if (authLoading || !user) {
      setNavItems([]);
      return;
    }
    setNavItems(getAuthorizedNavigationItems(user));
  }, [user, authLoading]);

  useEffect(() => {
    filterNavItems();
  }, [filterNavItems]);

  return (
    <NavigationContext.Provider
      value={{
        navItems,
        loading: authLoading,
        refreshNavigation: async () => filterNavItems(),
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationContext;
