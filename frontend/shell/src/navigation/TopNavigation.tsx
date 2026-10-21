// frontend/shell/src/navigation/TopNavigation.tsx - Multi-Tier Clinical Workspace Navigation & Open Screens Bar
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../auth/AuthContext';
import { useTabWorkspace } from './TabWorkspaceContext';
import { UserMenu } from './UserMenu';
import { EnrollNowBrand } from '../../../shared/design-system/components/EnrollNowBrand';
import { administrationApi } from '../../../shared/api/administrationApi';
import { SUPPORT_KNOWLEDGE_BASE_URL } from '../../../shared/supportLinks';
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

export const TopNavigation: React.FC = () => {
  const { navItems } = useNavigation();
  const { user, logout, loading, isFullSiteAdmin, canAccessSiteAdmin, hasPermission } = useAuth();
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
  const [studies, setStudies] = useState<any[]>([]);
  const [loadingStudies, setLoadingStudies] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const campusRef = useRef<HTMLDivElement>(null);
  const studyActionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Load user's actual assigned studies from backend API
  useEffect(() => {
    if (!user?.id) {
      setStudies([]);
      return;
    }
    let isCancelled = false;
    setLoadingStudies(true);

    const loadStudies = async () => {
      try {
        let userStudies: any[] = [];
        // 1. Always prioritize loading the user's specific assigned studies
        try {
          userStudies = await administrationApi.getUserStudies(user.id, user.tenantId);
        } catch {
          userStudies = [];
        }

        // 2. Only if the user has NO specific study assignments AND is a full Site Admin,
        // fallback to loading all tenant studies
        if ((!Array.isArray(userStudies) || userStudies.length === 0) && isFullSiteAdmin) {
          try {
            userStudies = await administrationApi.getStudies(user.tenantId);
          } catch {
            userStudies = [];
          }
        }

        if (!isCancelled) {
          if (Array.isArray(userStudies) && userStudies.length > 0) {
            setStudies(userStudies);
          } else {
            setStudies([]);
          }
        }
      } catch {
        if (!isCancelled) {
          setStudies([]);
        }
      } finally {
        if (!isCancelled) {
          setLoadingStudies(false);
        }
      }
    };

    void loadStudies();

    const handlePermissionsUpdated = () => {
      void loadStudies();
    };
    window.addEventListener('enrollnow_permissions_updated', handlePermissionsUpdated);
    window.addEventListener('enrollnow:permissions-updated', handlePermissionsUpdated);

    return () => {
      isCancelled = true;
      window.removeEventListener('enrollnow_permissions_updated', handlePermissionsUpdated);
      window.removeEventListener('enrollnow:permissions-updated', handlePermissionsUpdated);
    };
  }, [user?.id, user?.tenantId, isFullSiteAdmin, canAccessSiteAdmin]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsActionsOpen(false);
        setIsCampusOpen(false);
        setIsStudySelectOpen(false);
        setIsStudyActionsOpen(false);
        setIsMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (activeTabId !== 'studies') {
      setIsStudyActionsOpen(false);
      setIsStudySelectOpen(false);
    }
  }, [activeTabId]);

  if (loading || !user) return null;

  const canCreateStudy = canAccessSiteAdmin || hasPermission('SITE_STUDIES_CREATE');
  const studyOptions = studies;

  const renderIcon = (iconName?: string, size = 15) => {
    const IconComponent =
      iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : BookOpen;
    return <IconComponent size={size} />;
  };

  const organizationName =
    user.organizationName || 'Clinical Health Campus';

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % openTabs.length;
      activateTab(openTabs[nextIndex].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + openTabs.length) % openTabs.length;
      activateTab(openTabs[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      activateTab(openTabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      activateTab(openTabs[openTabs.length - 1].id);
    }
  };

  const handleModuleNavigation = (moduleId: string) => {
    if (moduleId === 'communications') {
      window.open(SUPPORT_KNOWLEDGE_BASE_URL, '_blank', 'noopener,noreferrer');
      setIsStudyActionsOpen(false);
      setIsMobileOpen(false);
      return;
    }
    activateTab(moduleId);
  };

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

            {/* Campus / Facility Dropdown Pill — temporarily hidden.
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
            */}
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
                        } else if (item.id === 'communications') {
                          handleModuleNavigation(item.id);
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
                              {loadingStudies ? (
                                <p style={{ padding: '8px 14px', margin: 0, fontSize: 13, color: '#888' }}>Loading studies...</p>
                              ) : studyOptions.length > 0 ? (
                                studyOptions.map((study) => {
                                  const studyId = study.id ?? study.studyId ?? study.protocolNumber;
                                  const studyTitle = (study as any).title || (study as any).name || 'Untitled study';
                                  const studyCode = (study as any).studyCode || (study as any).protocolNumber || (study as any).studyRole || '';
                                  return (
                                    <button
                                      type="button"
                                      role="menuitem"
                                      key={studyId ?? studyTitle}
                                      onClick={() => {
                                        activateTab('studies');
                                        navigate(`/studies?studyId=${encodeURIComponent(String(studyId))}`);
                                        setIsStudySelectOpen(false);
                                        setIsStudyActionsOpen(false);
                                      }}
                                    >
                                      <span className="enl-study-option-icon"><BookOpen size={16} /></span>
                                      <strong>{studyTitle}</strong>
                                      {studyCode && <small>{studyCode}</small>}
                                    </button>
                                  );
                                })
                              ) : (
                                <p>No studies available</p>
                              )}
                            </div>
                          )}
                        </div>
                        {canCreateStudy && (
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
                        )}
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
          <div className="enl-screens-strip" role="tablist" aria-label="Open screens">
            {openTabs.map((tab, index) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  className={`enl-screen-tab ${isActive ? 'enl-screen-tab--active' : ''}`}
                  onClick={() => activateTab(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`screen-pane-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      activateTab(tab.id);
                    } else {
                      handleTabKeyDown(e, index);
                    }
                  }}
                >
                  <span className="enl-screen-tab-icon" aria-hidden="true">
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
                      <X size={13} strokeWidth={2.4} aria-hidden="true" />
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
                      handleModuleNavigation(item.id);
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
