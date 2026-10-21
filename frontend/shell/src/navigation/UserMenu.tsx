import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTabWorkspace } from './TabWorkspaceContext';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout, canAccessSiteAdmin } = useAuth();
  const { activateTab } = useTabWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        avatarBtnRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const primaryRole =
    user.sitePermissionLabel && user.siteRole && user.siteRole !== 'NONE'
      ? user.sitePermissionLabel
      : user.roles && user.roles.length > 0
      ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ')
      : 'User';

  const isAdministrator = canAccessSiteAdmin;

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        ref={avatarBtnRef}
        type="button"
        className="user-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="user-avatar-circle" aria-hidden="true">{getInitials()}</div>
        <div className="user-meta-text">
          <span className="user-name-label">MY ACCOUNT</span>
        </div>
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown" role="menu" aria-label="User Account Options">
          <div className="user-dropdown-header">
            <div className="full-name">{user.fullName || user.username}</div>
            <div className="user-email">{user.email}</div>
            <span className="role-tag">{primaryRole}</span>
          </div>

          <button
            type="button"
            role="menuitem"
            className="user-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              activateTab('dashboard');
            }}
          >
            <User size={16} aria-hidden="true" />
            <span>My Overview</span>
          </button>

          {isAdministrator && (
            <button
              type="button"
              role="menuitem"
              className="user-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                activateTab('admin');
              }}
            >
              <Shield size={16} aria-hidden="true" />
              <span>Admin Console</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            className="user-dropdown-item logout"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
