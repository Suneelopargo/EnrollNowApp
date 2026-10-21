import React, { useRef } from 'react';
import { useRovingTabIndex } from '../../accessibility/useRovingTabIndex';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Navigation Tabs',
}) => {
  const tabIds = tabs.map((t) => t.id);
  const tabButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleActivate = (id: string) => {
    onChange(id);
    const btn = tabButtonRefs.current.get(id);
    btn?.focus();
  };

  const { handleKeyDown, getTabIndex } = useRovingTabIndex({
    itemIds: tabIds,
    activeId: activeTab,
    onActivate: handleActivate,
    orientation: 'horizontal',
  });

  return (
    <div
      className="tabs-header"
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabButtonRefs.current.set(tab.id, el);
              else tabButtonRefs.current.delete(tab.id);
            }}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={getTabIndex(tab.id)}
            className={`tab-btn ${isSelected ? 'active' : ''}`}
            onClick={() => handleActivate(tab.id)}
          >
            {tab.icon && (
              <span className="tab-icon-wrapper" aria-hidden="true">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="badge badge-neutral tab-badge">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
