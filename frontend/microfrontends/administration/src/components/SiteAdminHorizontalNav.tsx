// frontend/microfrontends/administration/src/components/SiteAdminHorizontalNav.tsx - Horizontal Navigation Bar
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Users,
  Upload,
  Download,
  ScrollText,
  Shield,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  isFullSiteAdmin?: boolean;
}

export const SiteAdminHorizontalNav: React.FC<SiteAdminHorizontalNavProps> = ({
  activeTab,
  onTabChange,
  usersCount = 0,
  onSelectExportOption,
  isFullSiteAdmin = true,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const navTabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll bounds
  const checkScroll = useCallback(() => {
    const el = navTabsRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = navTabsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [checkScroll]);

  // Auto-scroll active tab into view when activeTab changes
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
    const timer = setTimeout(checkScroll, 350);
    return () => clearTimeout(timer);
  }, [activeTab, checkScroll]);

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

  const scrollNav = (direction: 'left' | 'right') => {
    if (navTabsRef.current) {
      const offset = direction === 'left' ? -160 : 160;
      navTabsRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <nav className="site-admin-horizontal-nav" aria-label="Site Admin Sections">
      {/* Mobile Section Dropdown: guarantees 100% visibility of all tabs on small screens */}
      <div className="site-admin-mobile-nav-select-wrap">
        <label htmlFor="site-admin-mobile-tabs" className="site-admin-mobile-nav-label">
          Section:
        </label>
        <div className="site-admin-mobile-select-box">
          <select
            id="site-admin-mobile-tabs"
            value={activeTab}
            onChange={(e) => onTabChange(e.target.value as AdminTabId)}
            className="form-select site-admin-mobile-select"
            aria-label="Select administrative section"
          >
            <option value="studies">Studies</option>
            <option value="users">Users ({usersCount})</option>
            <option value="import">Import</option>
            <option value="export">Export</option>
            {isFullSiteAdmin && <option value="audit">Audit Log</option>}
            {isFullSiteAdmin && <option value="security">Security</option>}
            <option value="settings">General Settings</option>
          </select>
        </div>
      </div>

      <div className="site-admin-nav-tabs-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="site-admin-nav-scroll-btn site-admin-nav-scroll-left"
            onClick={() => scrollNav('left')}
            aria-label="Scroll tabs left"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="site-admin-nav-tabs" role="tablist" ref={navTabsRef}>
        {/* Studies */}
        <button
          ref={activeTab === 'studies' ? activeTabRef : null}
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
          ref={activeTab === 'users' ? activeTabRef : null}
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
          ref={activeTab === 'import' ? activeTabRef : null}
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
            ref={activeTab === 'export' ? activeTabRef : null}
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
        {isFullSiteAdmin && (
          <button
            ref={activeTab === 'audit' ? activeTabRef : null}
            type="button"
            role="tab"
            aria-selected={activeTab === 'audit'}
            className={`site-admin-tab-btn ${activeTab === 'audit' ? 'is-active' : ''}`}
            onClick={() => onTabChange('audit')}
          >
            <ScrollText size={16} aria-hidden="true" />
            <span>Audit Log</span>
          </button>
        )}

        {/* Security */}
        {isFullSiteAdmin && (
          <button
            ref={activeTab === 'security' ? activeTabRef : null}
            type="button"
            role="tab"
            aria-selected={activeTab === 'security'}
            className={`site-admin-tab-btn ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => onTabChange('security')}
          >
            <Shield size={16} aria-hidden="true" />
            <span>Security</span>
          </button>
        )}

        {/* General Settings */}
        <button
          ref={activeTab === 'settings' ? activeTabRef : null}
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

      {canScrollRight && (
        <button
          type="button"
          className="site-admin-nav-scroll-btn site-admin-nav-scroll-right"
          onClick={() => scrollNav('right')}
          aria-label="Scroll tabs right"
          title="Scroll right"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>

  
    </nav>
  );
};

export default SiteAdminHorizontalNav;
