import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tabs-header">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span style={{ marginRight: '6px' }}>{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className="badge badge-neutral" style={{ marginLeft: '6px' }}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
