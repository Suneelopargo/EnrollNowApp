import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
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
  ChevronDown,
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
  const { modules } = useNavigation();
  const { user } = useAuth();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  if (!user) return null;

  const renderIcon = (iconName?: string) => {
    const IconComponent = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : BookOpen;
    return <IconComponent size={16} />;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      {isMobileOpen && (
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
              className="btn btn-secondary btn-sm"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="mobile-nav-list">
            {modules.map((module) => {
              if (module.links.length === 1) {
                const link = module.links[0];
                return (
                  <NavLink
                    key={link.id}
                    to={link.path}
                    className={({ isActive }) =>
                      `nav-item-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {renderIcon(link.icon || module.icon)}
                    <span>{module.title}</span>
                  </NavLink>
                );
              }

              return (
                <div key={module.id} className="mobile-module-group">
                  <div className="nav-item-btn">
                    {renderIcon(module.icon)}
                    <span>{module.title}</span>
                  </div>
                  {module.links.map((link) => (
                    <NavLink
                      key={link.id}
                      to={link.path}
                      className={({ isActive }) =>
                        `dropdown-link-item ${isActive ? 'active' : ''}`
                      }
                    >
                      {renderIcon(link.icon)}
                      <span>{link.title}</span>
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Horizontal Top Navigation Bar */}
      <div className="top-nav-bar" ref={navRef}>
        <div className="nav-links-container">
          {modules.map((module) => {
            // Single-link module renders directly as a top-level link
            if (module.links.length === 1) {
              const link = module.links[0];
              return (
                <NavLink
                  key={link.id}
                  to={link.path}
                  className={({ isActive }) =>
                    `nav-item-link ${isActive ? 'active' : ''}`
                  }
                >
                  {renderIcon(link.icon || module.icon)}
                  <span>{module.shortTitle || module.title}</span>
                </NavLink>
              );
            }

            // Multi-link module renders as a dropdown
            const isDropdownActive = module.links.some(
              (l) => location.pathname === l.path || location.pathname.startsWith(l.path + '/')
            );
            const isOpen = openDropdown === module.id;

            return (
              <div key={module.id} className="nav-dropdown-wrapper">
                <button
                  type="button"
                  className={`nav-item-btn ${isDropdownActive ? 'active' : ''}`}
                  onClick={() => setOpenDropdown(isOpen ? null : module.id)}
                >
                  {renderIcon(module.icon)}
                  <span>{module.shortTitle || module.title}</span>
                  <ChevronDown size={14} />
                </button>

                {isOpen && (
                  <div className="nav-dropdown-menu">
                    {module.links.map((link) => (
                      <NavLink
                        key={link.id}
                        to={link.path}
                        className={({ isActive }) =>
                          `dropdown-link-item ${isActive ? 'active' : ''}`
                        }
                        onClick={() => setOpenDropdown(null)}
                      >
                        {renderIcon(link.icon)}
                        <div>
                          <div>{link.title}</div>
                          {link.description && (
                            <div className="dropdown-link-desc">{link.description}</div>
                          )}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TopNavigation;
