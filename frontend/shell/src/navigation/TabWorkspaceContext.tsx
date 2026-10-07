// frontend/shell/src/navigation/TabWorkspaceContext.tsx - Multi-Tab Keep-Alive Workspace Context
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface WorkspaceTab {
  id: string;
  title: string;
  route: string;
  icon: string;
  closable?: boolean;
  refreshCount: number;
  createdAt: number;
}

export interface TabWorkspaceContextType {
  openTabs: WorkspaceTab[];
  activeTabId: string;
  isRefreshing: boolean;
  refreshingTabId: string | null;
  openTabByRoute: (route: string) => void;
  activateTab: (tabId: string, options?: { refresh?: boolean }) => void;
  closeTab: (tabId: string) => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  refreshTab: (tabId?: string) => void;
}

export const ROUTE_TAB_DEFINITIONS: Record<string, Omit<WorkspaceTab, 'refreshCount' | 'createdAt'>> = {
  '/dashboard': { id: 'dashboard', title: 'Clinical Operations', route: '/dashboard', icon: 'LayoutDashboard', closable: false },
  '/studies': { id: 'studies', title: 'Studies', route: '/studies', icon: 'BookOpen', closable: true },
  '/participants': { id: 'participants', title: 'Registry', route: '/participants', icon: 'Users', closable: true },
  '/recruitment': { id: 'recruitment', title: 'Recruitment', route: '/recruitment', icon: 'Target', closable: true },
  '/surveys': { id: 'surveys', title: 'Surveys & eConsent', route: '/surveys', icon: 'ClipboardList', closable: true },
  '/tasks': { id: 'tasks', title: 'Tasks', route: '/tasks', icon: 'CheckSquare', closable: true },
  '/communications': { id: 'communications', title: 'Outreach', route: '/communications', icon: 'MessageSquare', closable: true },
  '/documents': { id: 'documents', title: 'Documents', route: '/documents', icon: 'FileText', closable: true },
  '/organization': { id: 'organization', title: 'Sites & Network', route: '/organization', icon: 'Building', closable: true },
  '/admin': { id: 'admin', title: 'Site Admin', route: '/admin', icon: 'Settings', closable: true },
};

export const DEFAULT_HOME_TAB: WorkspaceTab = {
  id: 'dashboard',
  title: 'Clinical Operations',
  route: '/dashboard',
  icon: 'LayoutDashboard',
  closable: false,
  refreshCount: 0,
  createdAt: Date.now(),
};

export function findDefinition(identifier: string): Omit<WorkspaceTab, 'refreshCount' | 'createdAt'> | null {
  if (!identifier) return null;
  const clean = identifier.split('?')[0].split('#')[0];

  // 1. Direct ID match
  const byId = Object.values(ROUTE_TAB_DEFINITIONS).find((d) => d.id === clean);
  if (byId) return byId;

  // 2. Direct route match
  if (ROUTE_TAB_DEFINITIONS[clean]) {
    return ROUTE_TAB_DEFINITIONS[clean];
  }

  // 3. Root fallback
  if (clean === '/' || clean === '') {
    return ROUTE_TAB_DEFINITIONS['/dashboard'];
  }

  // 4. Prefix / Sub-route match (e.g., /studies/123 -> /studies, /admin/roles -> /admin)
  const matchKey = Object.keys(ROUTE_TAB_DEFINITIONS).find((key) => {
    return clean === key || clean.startsWith(`${key}/`);
  });

  return matchKey ? ROUTE_TAB_DEFINITIONS[matchKey] : null;
}

const TabWorkspaceContext = createContext<TabWorkspaceContextType>({
  openTabs: [DEFAULT_HOME_TAB],
  activeTabId: 'dashboard',
  isRefreshing: false,
  refreshingTabId: null,
  openTabByRoute: () => {},
  activateTab: () => {},
  closeTab: () => {},
  closeOtherTabs: () => {},
  closeAllTabs: () => {},
  refreshTab: () => {},
});

const STORAGE_KEY = 'enrollnow_workspace_tabs';

export const TabWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore open tabs from sessionStorage or start with Home + current URL
  const [openTabs, setOpenTabs] = useState<WorkspaceTab[]>(() => {
    let tabs: WorkspaceTab[] = [DEFAULT_HOME_TAB];

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed
            .map((t: any) => {
              const def = findDefinition(t.id) || findDefinition(t.route);
              if (def) {
                return {
                  ...def,
                  refreshCount: t.refreshCount || 0,
                  createdAt: t.createdAt || Date.now(),
                };
              }
              return null;
            })
            .filter(Boolean) as WorkspaceTab[];

          if (validated.length > 0) {
            // Ensure home tab is always present at start
            if (!validated.some((t) => t.id === 'dashboard')) {
              validated.unshift(DEFAULT_HOME_TAB);
            }
            tabs = validated;
          }
        }
      }
    } catch {
      // Ignore storage read errors
    }

    // If initial location corresponds to another tab, add it immediately
    const initialDef = findDefinition(location.pathname);
    if (initialDef && !tabs.some((t) => t.id === initialDef.id)) {
      tabs.push({
        ...initialDef,
        refreshCount: 0,
        createdAt: Date.now(),
      });
    }

    return tabs;
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    const currentDef = findDefinition(location.pathname);
    return currentDef ? currentDef.id : 'dashboard';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingTabId, setRefreshingTabId] = useState<string | null>(null);

  // Sync open tabs to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openTabs));
    } catch {
      // Ignore storage write errors
    }
  }, [openTabs]);

  // A logout keeps the app mounted, so reset in-memory tabs as well as storage.
  useEffect(() => {
    const handleAuthChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.logout) return;

      setOpenTabs([DEFAULT_HOME_TAB]);
      setActiveTabId('dashboard');
      setIsRefreshing(false);
      setRefreshingTabId(null);
      sessionStorage.removeItem(STORAGE_KEY);
    };

    window.addEventListener('enrollnow_auth_change', handleAuthChange);
    return () => window.removeEventListener('enrollnow_auth_change', handleAuthChange);
  }, []);

  // Refresh tab data with smooth animated loader
  const refreshTab = useCallback((targetTabId?: string) => {
    const idToRefresh = targetTabId || activeTabId;
    setIsRefreshing(true);
    setRefreshingTabId(idToRefresh);

    // Increment refreshCount to re-render fresh content
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab.id === idToRefresh
          ? { ...tab, refreshCount: tab.refreshCount + 1 }
          : tab
      )
    );

    // Broadcast refresh event for listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('enrollnow_tab_refresh', {
          detail: { tabId: idToRefresh },
        })
      );
    }

    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshingTabId(null);
    }, 600);
  }, [activeTabId]);

  // Activate tab: opens the tab if not already in openTabs, sets it active, navigates, and refreshes
  const activateTab = useCallback(
    (tabId: string, options?: { refresh?: boolean }) => {
      let target = openTabs.find((t) => t.id === tabId || t.route === tabId);

      if (!target) {
        const def = findDefinition(tabId);
        if (def) {
          const newTab: WorkspaceTab = {
            ...def,
            refreshCount: 0,
            createdAt: Date.now(),
          };
          setOpenTabs((prev) => {
            if (prev.some((t) => t.id === newTab.id)) return prev;
            return [...prev, newTab];
          });
          target = newTab;
        }
      }

      if (!target) return;

      const switching = target.id !== activeTabId;
      setActiveTabId(target.id);

      if (location.pathname !== target.route) {
        navigate(target.route);
      }

      if (switching || options?.refresh) {
        refreshTab(target.id);
      }
    },
    [openTabs, activeTabId, location.pathname, navigate, refreshTab]
  );

  // Open or switch tab by route
  const openTabByRoute = useCallback(
    (route: string) => {
      const def = findDefinition(route);
      if (!def) return;
      activateTab(def.id);
    },
    [activateTab]
  );

  // Sync tab state when browser URL changes (e.g., Back/Forward navigation)
  useEffect(() => {
    const def = findDefinition(location.pathname);
    if (!def) return;

    setOpenTabs((prev) => {
      if (prev.some((t) => t.id === def.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          ...def,
          refreshCount: 0,
          createdAt: Date.now(),
        },
      ];
    });

    setActiveTabId(def.id);
  }, [location.pathname]);

  // Close tab cleanly
  const closeTab = useCallback(
    (tabId: string) => {
      const tabToClose = openTabs.find((t) => t.id === tabId);
      if (!tabToClose || tabToClose.closable === false) {
        return;
      }

      const closedIndex = openTabs.findIndex((t) => t.id === tabId);
      const remaining = openTabs.filter((t) => t.id !== tabId);

      setOpenTabs(remaining);

      // If closing the currently active tab, activate closest neighbor or Home
      if (activeTabId === tabId) {
        const nextTab =
          remaining[closedIndex] ||
          remaining[closedIndex - 1] ||
          remaining[0] ||
          DEFAULT_HOME_TAB;

        setActiveTabId(nextTab.id);
        navigate(nextTab.route);
      }
    },
    [openTabs, activeTabId, navigate]
  );

  // Close other tabs
  const closeOtherTabs = useCallback(
    (tabId: string) => {
      const target = openTabs.find((t) => t.id === tabId);
      if (!target) return;

      const homeTab = openTabs.find((t) => t.id === 'dashboard') || DEFAULT_HOME_TAB;
      const kept = target.id === 'dashboard' ? [homeTab] : [homeTab, target];

      setOpenTabs(kept);
      setActiveTabId(target.id);
      navigate(target.route);
    },
    [openTabs, navigate]
  );

  // Close all tabs (reset to Home)
  const closeAllTabs = useCallback(() => {
    setOpenTabs([DEFAULT_HOME_TAB]);
    setActiveTabId('dashboard');
    navigate('/dashboard');
  }, [navigate]);

  return (
    <TabWorkspaceContext.Provider
      value={{
        openTabs,
        activeTabId,
        isRefreshing,
        refreshingTabId,
        openTabByRoute,
        activateTab,
        closeTab,
        closeOtherTabs,
        closeAllTabs,
        refreshTab,
      }}
    >
      {children}
    </TabWorkspaceContext.Provider>
  );
};

export const useTabWorkspace = () => useContext(TabWorkspaceContext);
export default TabWorkspaceContext;
