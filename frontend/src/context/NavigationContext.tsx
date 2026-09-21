import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationModule } from '../types/navigation';
import apiClient from '../api/client';
import { useAuth } from './AuthContext';

interface NavigationContextType {
  modules: NavigationModule[];
  loading: boolean;
  activeModule: NavigationModule | null;
  setActiveModule: (module: NavigationModule | null) => void;
  refreshNavigation: () => Promise<void>;
}

// Comprehensive fallback navigation hierarchy
const DEFAULT_NAVIGATION_MODULES: NavigationModule[] = [
  {
    id: 1,
    moduleCode: 'MODULE_DASHBOARD',
    title: 'Clinical Operations',
    shortTitle: 'Dashboard',
    icon: 'LayoutDashboard',
    displayOrder: 1,
    isActive: true,
    links: [
      { id: 101, moduleId: 1, linkCode: 'LINK_DASHBOARD', title: 'Executive Overview', path: '/dashboard', icon: 'LayoutDashboard', description: 'Real-time clinical trials enrollment and site KPI dashboard', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 2,
    moduleCode: 'MODULE_STUDIES',
    title: 'Study Management',
    shortTitle: 'Studies',
    icon: 'BookOpen',
    displayOrder: 10,
    isActive: true,
    links: [
      { id: 201, moduleId: 2, linkCode: 'LINK_STUDIES_LIST', title: 'Clinical Studies', path: '/studies', icon: 'BookOpen', description: 'Active protocols, enrollment targets, and trial phases', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 3,
    moduleCode: 'MODULE_PARTICIPANTS',
    title: 'Participants',
    shortTitle: 'Participants',
    icon: 'Users',
    displayOrder: 20,
    isActive: true,
    links: [
      { id: 301, moduleId: 3, linkCode: 'LINK_PARTICIPANTS_LIST', title: 'Participant Queue', path: '/participants', icon: 'Users', description: 'Screening status, eligibility criteria, and enrollment timeline', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 4,
    moduleCode: 'MODULE_RECRUITMENT',
    title: 'Recruitment Campaigns',
    shortTitle: 'Recruitment',
    icon: 'Target',
    displayOrder: 30,
    isActive: true,
    links: [
      { id: 401, moduleId: 4, linkCode: 'LINK_RECRUITMENT_LIST', title: 'Campaigns & Funnels', path: '/recruitment', icon: 'Target', description: 'Recruitment channel velocity, referral sources, and funnel metrics', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 5,
    moduleCode: 'MODULE_SURVEYS',
    title: 'Surveys & eConsent',
    shortTitle: 'Surveys',
    icon: 'ClipboardList',
    displayOrder: 40,
    isActive: true,
    links: [
      { id: 501, moduleId: 5, linkCode: 'LINK_SURVEYS_BUILDER', title: 'Survey Studio', path: '/surveys', icon: 'ClipboardList', description: 'Electronic consent templates, intake forms, and ePRO questionnaires', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 6,
    moduleCode: 'MODULE_TASKS',
    title: 'Tasks & Operations',
    shortTitle: 'Tasks',
    icon: 'CheckSquare',
    displayOrder: 50,
    isActive: true,
    links: [
      { id: 601, moduleId: 6, linkCode: 'LINK_TASKS_LIST', title: 'Action Items', path: '/tasks', icon: 'CheckSquare', description: 'Investigator action queue, screening appointments, and protocol milestones', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 7,
    moduleCode: 'MODULE_COMMUNICATIONS',
    title: 'Communications',
    shortTitle: 'Messages',
    icon: 'MessageSquare',
    displayOrder: 60,
    isActive: true,
    links: [
      { id: 701, moduleId: 7, linkCode: 'LINK_COMMUNICATIONS_LIST', title: 'Participant Outreach', path: '/communications', icon: 'MessageSquare', description: 'Automated SMS, email reminders, and trial dispatch history', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 8,
    moduleCode: 'MODULE_DOCUMENTS',
    title: 'Documents & Regulatory',
    shortTitle: 'Documents',
    icon: 'FileText',
    displayOrder: 70,
    isActive: true,
    links: [
      { id: 801, moduleId: 8, linkCode: 'LINK_DOCUMENTS_LIST', title: 'Document Repository', path: '/documents', icon: 'FileText', description: 'IRB approvals, consent packets, and versioned protocol documents', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 9,
    moduleCode: 'MODULE_ORGANIZATION',
    title: 'Sites & Network',
    shortTitle: 'Sites',
    icon: 'Building',
    displayOrder: 80,
    isActive: true,
    links: [
      { id: 901, moduleId: 9, linkCode: 'LINK_ORGANIZATIONS_LIST', title: 'Research Sites', path: '/organization', icon: 'Building', description: 'Investigative sites, facilities, and network directory', displayOrder: 1, isActive: true },
    ],
  },
  {
    id: 10,
    moduleCode: 'MODULE_ADMIN',
    title: 'System Administration',
    shortTitle: 'Admin',
    icon: 'Settings',
    displayOrder: 100,
    isActive: true,
    links: [
      { id: 1001, moduleId: 10, linkCode: 'LINK_ADMIN_USERS', title: 'User Management', path: '/admin/users', icon: 'UserCheck', description: 'Manage accounts, activation, and role assignments', displayOrder: 1, isActive: true },
      { id: 1002, moduleId: 10, linkCode: 'LINK_ADMIN_ROLES', title: 'Roles & RBAC', path: '/admin/roles', icon: 'Shield', description: 'Manage roles and dynamic permission matrices', displayOrder: 2, isActive: true },
      { id: 1003, moduleId: 10, linkCode: 'LINK_ADMIN_SITES', title: 'Site Management', path: '/admin/sites', icon: 'Building', description: 'Configure research facility sites and access', displayOrder: 3, isActive: true },
      { id: 1004, moduleId: 10, linkCode: 'LINK_ADMIN_AUDIT', title: 'Audit Ledger', path: '/admin/audit-logs', icon: 'ScrollText', description: 'Security and administrative audit trail', displayOrder: 4, isActive: true },
    ],
  },
];

const NavigationContext = createContext<NavigationContextType>({
  modules: DEFAULT_NAVIGATION_MODULES,
  loading: false,
  activeModule: null,
  setActiveModule: () => {},
  refreshNavigation: async () => {},
});

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [modules, setModules] = useState<NavigationModule[]>(DEFAULT_NAVIGATION_MODULES);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<NavigationModule | null>(null);

  const fetchNavigation = async () => {
    if (!user) {
      setModules(DEFAULT_NAVIGATION_MODULES);
      return;
    }

    try {
      setLoading(true);
      const res = await apiClient.get('/api/administrator/navigation');
      if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setModules(res.data.data);
      } else {
        setModules(DEFAULT_NAVIGATION_MODULES);
      }
    } catch {
      // Gracefully fall back to comprehensive static navigation
      setModules(DEFAULT_NAVIGATION_MODULES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNavigation();
  }, [user]);

  return (
    <NavigationContext.Provider
      value={{
        modules,
        loading,
        activeModule,
        setActiveModule,
        refreshNavigation: fetchNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
export default NavigationContext;
