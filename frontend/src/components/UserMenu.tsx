import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  const primaryRole = user.roles && user.roles.length > 0
    ? user.roles[0].replace('ROLE_', '').replace(/_/g, ' ')
    : 'User';

  return (
    <div className="user-menu-wrapper" ref={menuRef}>
      <button
        className="user-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User Account Menu"
      >
        <div className="user-avatar-circle">{getInitials()}</div>
        <div className="user-meta-text">
          <span className="user-name-label">{user.fullName || user.username}</span>
          <span className="user-role-label">{primaryRole}</span>
        </div>
        <ChevronDown size={14} className="user-menu-chevron" />
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-dropdown-header">
            <div className="full-name">{user.fullName || user.username}</div>
            <div className="user-email">{user.email}</div>
            <span className="role-tag">{primaryRole}</span>
          </div>

          <button
            className="user-dropdown-item"
            onClick={() => {
              setIsOpen(false);
              navigate('/dashboard');
            }}
          >
            <User size={16} />
            <span>My Overview</span>
          </button>

          {user.roles?.includes('ROLE_SUPER_ADMIN') && (
            <button
              className="user-dropdown-item"
              onClick={() => {
                setIsOpen(false);
                navigate('/admin');
              }}
            >
              <Shield size={16} />
              <span>Admin Console</span>
            </button>
          )}

          <button
            className="user-dropdown-item logout"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
