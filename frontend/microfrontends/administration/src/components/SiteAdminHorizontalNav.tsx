// frontend/microfrontends/administration/src/components/SiteAdminHorizontalNav.tsx - Horizontal Navigation Bar
import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Users,
  Upload,
  Download,
  ScrollText,
  Shield,
  Settings,
  ChevronDown,
  FileSpreadsheet,
  FolderGit2,
  Share2,
} from 'lucide-react';
import { AdminTabId, ExportSubOption } from '../types/admin';

export interface SiteAdminHorizontalNavProps {
  activeTab: AdminTabId;
  onTabChange: (tabId: AdminTabId) => void;
  usersCount?: number;
  onSelectExportOption?: (option: ExportSubOption) => void;
}

export const SiteAdminHorizontalNav: React.FC<SiteAdminHorizontalNavProps> = ({
  activeTab,
  onTabChange,
  usersCount = 0,
  onSelectExportOption,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExportSubClick = (option: ExportSubOption) => {
    setIsExportOpen(false);
    onTabChange('export');
    onSelectExportOption?.(option);
  };

  return (
    <nav className="site-admin-horizontal-nav" aria-label="Site Admin Sections">
      <div className="site-admin-nav-tabs" role="tablist">
        {/* Studies */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'studies'}
          className={`site-admin-tab-btn ${activeTab === 'studies' ? 'is-active' : ''}`}
          onClick={() => onTabChange('studies')}
        >
          <BookOpen size={16} aria-hidden="true" />
          <span>Studies</span>
        </button>

        {/* Users (Primary) */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`site-admin-tab-btn ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => onTabChange('users')}
        >
          <Users size={16} aria-hidden="true" />
          <span>Users</span>
          {usersCount > 0 && (
            <span className="site-admin-tab-badge">{usersCount}</span>
          )}
        </button>

        {/* Import */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'import'}
          className={`site-admin-tab-btn ${activeTab === 'import' ? 'is-active' : ''}`}
          onClick={() => onTabChange('import')}
        >
          <Upload size={16} aria-hidden="true" />
          <span>Import</span>
        </button>

        {/* Export with Dropdown */}
        <div className="site-admin-nav-dropdown-wrap" ref={exportDropdownRef}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'export'}
            aria-haspopup="true"
            aria-expanded={isExportOpen}
            className={`site-admin-tab-btn ${activeTab === 'export' ? 'is-active' : ''}`}
            onClick={() => {
              onTabChange('export');
              setIsExportOpen((prev) => !prev);
            }}
          >
            <Download size={16} aria-hidden="true" />
            <span>Export</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {isExportOpen && (
            <div className="site-admin-nav-dropdown-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="site-admin-nav-dropdown-item"
                onClick={() => handleExportSubClick('new_config')}
              >
                <FileSpreadsheet size={15} aria-hidden="true" />
                <span>New Export Config</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="site-admin-nav-dropdown-item"
                onClick={() => handleExportSubClick('my_exports')}
              >
                <FolderGit2 size={15} aria-hidden="true" />
                <span>My Exports</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="site-admin-nav-dropdown-item"
                onClick={() => handleExportSubClick('shared_with_me')}
              >
                <Share2 size={15} aria-hidden="true" />
                <span>Shared With Me</span>
              </button>
            </div>
          )}
        </div>

        {/* Audit Log */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'audit'}
          className={`site-admin-tab-btn ${activeTab === 'audit' ? 'is-active' : ''}`}
          onClick={() => onTabChange('audit')}
        >
          <ScrollText size={16} aria-hidden="true" />
          <span>Audit Log</span>
        </button>

        {/* Security */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'security'}
          className={`site-admin-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
          onClick={() => onTabChange('security')}
        >
          <Shield size={16} aria-hidden="true" />
          <span>Security</span>
        </button>

        {/* General Settings */}
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          className={`site-admin-tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={16} aria-hidden="true" />
          <span>General Settings</span>
        </button>
      </div>

      <div className="site-admin-nav-meta">
        <span className="site-admin-version-badge">Version: 2.1.9-1</span>
      </div>
    </nav>
  );
};

export default SiteAdminHorizontalNav;
