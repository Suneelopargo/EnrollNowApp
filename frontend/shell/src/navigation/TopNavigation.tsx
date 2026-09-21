// frontend/shell/src/navigation/TopNavigation.tsx - Top Navigation ONLY (Desktop horizontal, Tablet dropdown, Mobile drawer)
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { useNavigation } from './NavigationContext';
import { useAuth } from '../auth/AuthContext';
import { UserMenu } from './UserMenu';
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
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
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
};

export const TopNavigation: React.FC = () => {
  const { navItems } = useNavigation();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const renderIcon = (iconName?: string) => {
    const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : BookOpen;
    return <IconComponent size={16} />;
  };

  return (
    <>
      {/* App Header */}
      <header className="app-header">
        <div className="header-top-bar">
          <div className="header-actions">
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={24} />
            </button>
            <Link to="/dashboard" className="brand-section">
              <div className="brand-logo-badge">EN</div>
              <div className="brand-titles">
                <span className="brand-name">EnrollNow</span>
                <span className="brand-subtitle">Clinical Operations Platform</span>
              </div>
            </Link>
          </div>

          <div className="header-actions">
            {isAdmin && (
              <span className="badge badge-info">
                <Shield size={12} />
                System Admin
              </span>
            )}
            <UserMenu />
          </div>
        </div>

        {/* Desktop & Tablet Top Navigation Bar */}
        <div className="top-nav-bar" ref={navRef}>
          <nav className="nav-links-container">
            {navItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.route}
                className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
              >
                {renderIcon(item.icon)}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="mobile-nav-backdrop"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="mobile-nav-drawer">
            <div className="mobile-drawer-header">
              <div className="brand-section">
                <div className="brand-logo-badge">EN</div>
                <div className="brand-titles">
                  <span className="brand-name">EnrollNow</span>
                  <span className="brand-subtitle">Clinical Platform</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setIsMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mobile-nav-list">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.route}
                  className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
                >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default TopNavigation;
