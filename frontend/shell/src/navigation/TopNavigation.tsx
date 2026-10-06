// frontend/shell/src/navigation/TopNavigation.tsx - Multi-Tier Clinical Workspace Navigation & Open Screens Bar
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../auth/AuthContext';
import { useTabWorkspace } from './TabWorkspaceContext';
import { UserMenu } from './UserMenu';
import { EnrollNowBrand } from '../../../shared/design-system/components/EnrollNowBrand';
import { MOCK_STUDIES } from '../../../shared/mock-api/mockData';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Target,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  FileText,
  Building,
  Settings,
  Shield,
  Menu,
  X,
  ChevronDown,
  Plus,
  RotateCw,
  LogOut,
  Sparkles,
  Home,
  MoreVertical,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Home,
  BookOpen,
  Users,
  Target,
  ClipboardList,
  CheckSquare,
  MessageSquare,
  FileText,
  Building,
  Settings,
  Shield,
  Sparkles,
};

const CLIENT_MODULE_LABELS: Record<string, string> = {
  admin: 'Site Admin',
  participants: 'Registry',
  communications: 'Support',
};

const MOCK_STUDY_ROLE_ACCESS: Record<string, string[]> = {
  'ST-001': ['ADMIN', 'ROLE_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_SUPER_ADMIN', 'USER', 'ROLE_USER', 'ROLE_INVESTIGATOR', 'ROLE_STUDY_LEAD'],
  'ST-002': ['ADMIN', 'ROLE_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_SUPER_ADMIN', 'USER', 'ROLE_USER', 'ROLE_INVESTIGATOR'],
  'ST-003': ['ADMIN', 'ROLE_ADMIN', 'ROLE_SITE_ADMIN', 'ROLE_SUPER_ADMIN', 'USER', 'ROLE_USER', 'ROLE_STUDY_LEAD', 'ROLE_STUDY_COORDINATOR'],
};

export const TopNavigation: React.FC = () => {
  const { navItems } = useNavigation();
  const { user, logout } = useAuth();
  const {
    openTabs,
    activeTabId,
    activateTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    refreshTab,
    isRefreshing,
  } = useTabWorkspace();

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCampusOpen, setIsCampusOpen] = useState(false);
  const [isStudyActionsOpen, setIsStudyActionsOpen] = useState(false);
  const [isStudySelectOpen, setIsStudySelectOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const campusRef = useRef<HTMLDivElement>(null);
  const studyActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setIsActionsOpen(false);
      }
      if (campusRef.current && !campusRef.current.contains(e.target as Node)) {
        setIsCampusOpen(false);
      }
      if (studyActionsRef.current && !studyActionsRef.current.contains(e.target as Node)) {
        setIsStudySelectOpen(false);
        setIsStudyActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeTabId !== 'studies') {
      setIsStudyActionsOpen(false);
      setIsStudySelectOpen(false);
    }
  }, [activeTabId]);

  if (!user) return null;

  const userRoles = (user.roles || []).map((role) => role.toUpperCase());
  const studyOptions = MOCK_STUDIES.filter((study) =>
    (MOCK_STUDY_ROLE_ACCESS[String(study.id)] || []).some((role) => userRoles.includes(role))
  );

  const renderIcon = (iconName?: string, size = 15) => {
    const IconComponent =
      iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : BookOpen;
    return <IconComponent size={size} />;
  };

  const organizationName =
    user.organizationName || 'Clinical Health Campus';

  return (
    <>
      <header className="enl-workspace-header">
        {/* Tier 1: Campus Selector, Module Navigation, & User Controls */}
        <div className="enl-header-top-row">
          {/* Left: Mobile Toggle, Brand Logo & Campus Selector Pill */}
          <div className="enl-header-left">
            <button
              type="button"
              className="enl-mobile-toggle"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Drawer"
            >
              <Menu size={20} />
            </button>

            {/* Official EnrollNow Vector Brand Logo */}
            <div className="enl-header-brand-wrap">
              <button
                type="button"
                className="enl-header-brand-btn"
                onClick={() => {
                  activateTab('dashboard');
                  navigate('/dashboard');
                }}
                title="EnrollNow Clinical Operations"
                aria-label="EnrollNow Home"
              >
                <div className="enl-header-brand-badge">
                  <EnrollNowBrand size="header" />
                </div>
              </button>
            </div>

            {/* Campus / Facility Dropdown Pill */}
            <div className="enl-site-selector-wrap" ref={campusRef}>
              <button
                type="button"
                className="enl-site-pill"
                onClick={() => setIsCampusOpen(!isCampusOpen)}
                aria-expanded={isCampusOpen}
                aria-haspopup="true"
              >
                <div className="enl-site-avatar">
                  <Building size={15} />
                </div>
                <div className="enl-site-info">
                  <div className="enl-site-title">
                    <span>{organizationName}</span>
                    <ChevronDown size={13} className="enl-site-caret" />
                  </div>
                  <span className="enl-site-badge">ACTIVE CAMPUS</span>
                </div>
              </button>

              {isCampusOpen && (
                <div className="enl-site-dropdown" role="menu">
                  <div className="enl-site-dropdown-header">Select Active Campus</div>
                  <button
                    type="button"
                    className="enl-site-dropdown-item active"
                    onClick={() => setIsCampusOpen(false)}
                  >
                    <Building size={14} />
                    <span>{organizationName}</span>
                    <span className="enl-site-tag">Active</span>
                  </button>
                  <button
                    type="button"
                    className="enl-site-dropdown-item"
                    onClick={() => setIsCampusOpen(false)}
                  >
                    <Building size={14} />
                    <span>Clinical Research Center</span>
                  </button>
                  <button
                    type="button"
                    className="enl-site-dropdown-item"
                    onClick={() => setIsCampusOpen(false)}
                  >
                    <Building size={14} />
                    <span>Metropolitan Clinical Site #102</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Middle: Horizontal Module Navigation */}
          <nav className="enl-header-modules" aria-label="Main Navigation">
            {navItems.map((item) => {
                const isActive = activeTabId === item.id || (item.id === 'studies' && isStudyActionsOpen);
                return (
                  <React.Fragment key={item.id}>
                  <div
                    className={item.id === 'studies' ? 'enl-study-module-group' : 'enl-module-item-wrap'}
                    ref={item.id === 'studies' ? studyActionsRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (item.id === 'studies') {
                          setIsStudyActionsOpen((open) => !open);
                          setIsStudySelectOpen(false);
                        } else {
                          activateTab(item.id);
                          setIsStudyActionsOpen(false);
                        }
                      }}
                      className={`enl-module-btn ${isActive ? 'enl-module-btn--active' : ''}`}
                      aria-expanded={item.id === 'studies' ? isStudyActionsOpen : undefined}
                    >
                      <span className="enl-module-icon">{renderIcon(item.icon, 15)}</span>
                      <span className="enl-module-label">{CLIENT_MODULE_LABELS[item.id] || item.label}</span>
                    </button>
                    {item.id === 'studies' && isStudyActionsOpen && (
                      <div className="enl-study-module-menu">
                        <div
                          className="enl-study-module-menu-item-wrap"
                          onMouseEnter={() => setIsStudySelectOpen(true)}
                          onMouseLeave={() => setIsStudySelectOpen(false)}
                        >
                          <button
                            type="button"
                            className="enl-study-module-menu-item"
                            onClick={() => setIsStudySelectOpen(true)}
                            onFocus={() => setIsStudySelectOpen(true)}
                            aria-expanded={isStudySelectOpen}
                            aria-haspopup="menu"
                          >
                            <span>Select Study</span>
                            <ChevronDown size={14} className="enl-study-menu-arrow" />
                          </button>
                          {isStudySelectOpen && (
                            <div className="enl-study-select-menu" role="menu" aria-label="Select a study">
                              <div className="enl-study-select-heading">Available Studies</div>
                              {studyOptions.length > 0 ? studyOptions.map((study) => {
                                const studyId = study.id ?? study.studyId ?? study.protocolNumber;
                                return (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    key={studyId ?? study.title}
                                    onClick={() => {
                                      activateTab('studies');
                                      navigate(`/studies?studyId=${encodeURIComponent(String(studyId))}`);
                                      setIsStudySelectOpen(false);
                                      setIsStudyActionsOpen(false);
                                    }}
                                  >
                                    <span className="enl-study-option-icon"><BookOpen size={16} /></span>
                                    <strong>{(study as any).title || (study as any).name || 'Untitled study'}</strong>
                                    <small>{(study as any).protocolNumber || studyId || 'Study'}</small>
                                  </button>
                                );
                              }) : <p>No studies available</p>}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="enl-study-module-menu-item"
                          onClick={() => {
                            activateTab('studies');
                            navigate('/studies?action=add');
                            setIsStudyActionsOpen(false);
                          }}
                        >
                          <span>Add Study</span>
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                  </React.Fragment>
                );
            })}

            {/* Temporarily hidden; keep the shortcut for a future navigation restore.
            <button
              type="button"
              className="enl-module-btn enl-module-btn--ai"
              onClick={() => activateTab('dashboard')}
            >
              <Sparkles size={14} className="enl-ai-sparkle" />
              <span>AI Assistant</span>
            </button>
            */}
          </nav>

          {/* Right: Notifications, User Profile Pill, Logout */}
          <div className="enl-header-right">
            {/* Notification Bell */}
            {/* User Profile */}
            <UserMenu />

            {/* Logout Action */}
            <button
              type="button"
              className="enl-icon-action-btn enl-icon-action-btn--logout"
              onClick={logout}
              aria-label="Sign Out"
              title="Sign Out"
            >
              <LogOut size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Tier 2: Open Screens Activity Tab Bar (Keep-Alive Multi-Tab Strip) */}
        <div className="enl-screens-bar">
          <div className="enl-screens-label">Open Screens:</div>

          {/* Scrollable Tab Strip */}
          <div className="enl-screens-strip">
            {openTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  className={`enl-screen-tab ${isActive ? 'enl-screen-tab--active' : ''}`}
                  onClick={() => activateTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      activateTab(tab.id);
                    }
                  }}
                >
                  <span className="enl-screen-tab-icon">
                    {renderIcon(tab.icon, 14)}
                  </span>
                  <span className="enl-screen-tab-title">{tab.title}</span>

                  {tab.closable !== false && (
                    <button
                      type="button"
                      className="enl-screen-tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      aria-label={`Close ${tab.title} tab`}
                      title="Close Screen"
                    >
                      <X size={13} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Actions: Refresh and Tab Management */}
          <div className="enl-screens-actions" ref={actionsRef}>
            <button
              type="button"
              className={`enl-screen-action-btn ${isRefreshing ? 'enl-screen-action-btn--spinning' : ''}`}
              onClick={() => refreshTab(activeTabId)}
              title="Refresh Screen Data"
              aria-label="Refresh Screen Data"
            >
              <RotateCw size={14} className={isRefreshing ? 'enl-spin' : ''} />
            </button>

            <button
              type="button"
              className="enl-screen-action-btn"
              onClick={() => setIsActionsOpen(!isActionsOpen)}
              title="Screen Actions"
              aria-label="Screen Actions"
              aria-haspopup="true"
              aria-expanded={isActionsOpen}
            >
              <MoreVertical size={14} />
            </button>

            {isActionsOpen && (
              <div className="enl-screens-dropdown" role="menu">
                <button
                  type="button"
                  className="enl-screens-dropdown-item"
                  onClick={() => {
                    setIsActionsOpen(false);
                    refreshTab(activeTabId);
                  }}
                >
                  <RotateCw size={14} />
                  <span>Refresh Active Screen</span>
                </button>
                <button
                  type="button"
                  className="enl-screens-dropdown-item"
                  onClick={() => {
                    setIsActionsOpen(false);
                    closeOtherTabs(activeTabId);
                  }}
                >
                  <X size={14} />
                  <span>Close Other Screens</span>
                </button>
                <button
                  type="button"
                  className="enl-screens-dropdown-item"
                  onClick={() => {
                    setIsActionsOpen(false);
                    closeAllTabs();
                  }}
                >
                  <Home size={14} />
                  <span>Close All (Back to Home)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="enl-mobile-nav-backdrop"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="enl-mobile-nav-drawer">
            <div className="enl-mobile-drawer-header">
              <div className="enl-mobile-brand-title">
                <span className="enl-brand-name">{organizationName}</span>
                <span className="enl-brand-tagline">Active Campus</span>
              </div>
              <button
                type="button"
                className="enl-icon-action-btn"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="enl-mobile-nav-list">
              {navItems.map((item) => {
                const isActive = activeTabId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      activateTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`enl-mobile-nav-item ${isActive ? 'enl-mobile-nav-item--active' : ''}`}
                  >
                    {renderIcon(item.icon, 18)}
                    <span>{CLIENT_MODULE_LABELS[item.id] || item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default TopNavigation;
