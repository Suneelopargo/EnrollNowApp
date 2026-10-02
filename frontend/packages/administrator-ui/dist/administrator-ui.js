import React, { createContext, useContext, useState, useEffect } from 'react';

const AdministratorContext = createContext(null);

export const useAdministrator = () => {
  const ctx = useContext(AdministratorContext);
  if (!ctx) {
    throw new Error('useAdministrator must be used within an AdministratorProvider');
  }
  return ctx;
};

export const AdministratorProvider = ({ api, auth, config = {}, children }) => {
  return React.createElement(
    AdministratorContext.Provider,
    { value: { api, auth, config } },
    children
  );
};

export const Administrator = ({ initialTab = 0 }) => {
  const { api, auth, config } = useAdministrator();
  const [activeTab, setActiveTab] = useState(typeof initialTab === 'string' ? 0 : initialTab);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);

  const title = config.title || 'Platform Administration';
  const subtitle = config.subtitle || 'Security, Role Entitlement Matrices, and Clinical Site Scopes';
  const badgeText = config.badgeText || 'Admin Console';
  const features = config.features || { dashboard: true, users: true, roles: true, locationAccess: true, auditTrail: true };
  const terminology = config.terminology || { location: 'Research Site', locations: 'Research Sites', provider: 'Investigator' };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        if (features.dashboard && api.getDashboard) {
          const d = await api.getDashboard();
          if (isMounted) setDashboard(d);
        }
        if (features.users && api.getUsers) {
          const u = await api.getUsers();
          if (isMounted) setUsers(Array.isArray(u) ? u : (u?.content || []));
        }
        if (features.roles && api.getRoles) {
          const r = await api.getRoles();
          if (isMounted) setRoles(Array.isArray(r) ? r : []);
        }
        if (features.locationAccess && api.getLocations) {
          const l = await api.getLocations();
          if (isMounted) setLocations(Array.isArray(l) ? l : []);
        }
        if (features.auditTrail && api.getAuditLogs) {
          const a = await api.getAuditLogs({ page: 0, size: 10 });
          if (isMounted) setAuditLogs(a?.content || []);
        }
      } catch (err) {
        console.warn('[Administrator] Failed to load data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [api]);

  const handleDeactivate = async (userId) => {
    try {
      await api.deactivateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: false } : u)));
      setActionSuccess(`User account deactivated.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleActivate = async (userId) => {
    try {
      await api.activateUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: true } : u)));
      setActionSuccess(`User account activated.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    features.dashboard && { id: 0, label: 'Overview & KPIs' },
    features.users && { id: 1, label: 'User Directory' },
    features.roles && { id: 2, label: 'Roles & RBAC' },
    features.locationAccess && { id: 3, label: terminology.locations || 'Research Sites' },
    features.auditTrail && { id: 4, label: 'Audit Ledger' },
  ].filter(Boolean);

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.fullName && u.fullName.toLowerCase().includes(term))
    );
  });

  return React.createElement(
    'div',
    { className: 'admin-console-wrapper space-y-6' },
    // Header
    React.createElement(
      'div',
      { className: 'flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm' },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'flex items-center gap-2 mb-1' },
          React.createElement('span', { className: 'px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800' }, badgeText),
          React.createElement('span', { className: 'text-xs text-slate-500 font-medium' }, 'Security & Compliance')
        ),
        React.createElement('h1', { className: 'text-2xl font-bold text-slate-900 tracking-tight' }, title),
        React.createElement('p', { className: 'text-sm text-slate-600 mt-1' }, subtitle)
      )
    ),

    actionSuccess && React.createElement(
      'div',
      { className: 'p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium' },
      actionSuccess
    ),

    // Tab Navigation
    React.createElement(
      'div',
      { className: 'flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto' },
      tabs.map((tab) =>
        React.createElement(
          'button',
          {
            key: tab.id,
            type: 'button',
            onClick: () => setActiveTab(tab.id),
            className: `px-4 py-2 text-sm font-medium rounded-xl transition ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`,
          },
          tab.label
        )
      )
    ),

    // Tab 0: Dashboard
    activeTab === 0 &&
      React.createElement(
        'div',
        { className: 'space-y-6' },
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' },
          React.createElement(
            'div',
            { className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
            React.createElement('div', { className: 'text-xs text-slate-500 font-semibold uppercase tracking-wider' }, 'Total System Users'),
            React.createElement('div', { className: 'text-3xl font-extrabold text-slate-900 mt-2' }, dashboard?.totalUsers ?? users.length ?? 0)
          ),
          React.createElement(
            'div',
            { className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
            React.createElement('div', { className: 'text-xs text-emerald-600 font-semibold uppercase tracking-wider' }, 'Active Users'),
            React.createElement('div', { className: 'text-3xl font-extrabold text-emerald-600 mt-2' }, dashboard?.activeUsers ?? users.filter((u) => u.active).length ?? 0)
          ),
          React.createElement(
            'div',
            { className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
            React.createElement('div', { className: 'text-xs text-slate-500 font-semibold uppercase tracking-wider' }, terminology.locations || 'Research Sites'),
            React.createElement('div', { className: 'text-3xl font-extrabold text-slate-900 mt-2' }, dashboard?.activeLocations ?? locations.length ?? 3)
          ),
          React.createElement(
            'div',
            { className: 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm' },
            React.createElement('div', { className: 'text-xs text-indigo-600 font-semibold uppercase tracking-wider' }, 'Configured Roles'),
            React.createElement('div', { className: 'text-3xl font-extrabold text-indigo-600 mt-2' }, dashboard?.totalRoles ?? roles.length ?? 6)
          )
        )
      ),

    // Tab 1: Users
    activeTab === 1 &&
      React.createElement(
        'div',
        { className: 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden' },
        React.createElement(
          'div',
          { className: 'p-4 border-b border-slate-200 flex justify-between items-center gap-4' },
          React.createElement('input', {
            type: 'text',
            placeholder: 'Search users by username, email...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            className: 'px-3 py-1.5 border border-slate-300 rounded-lg text-sm w-72',
          })
        ),
        React.createElement(
          'table',
          { className: 'w-full text-left border-collapse text-sm' },
          React.createElement(
            'thead',
            { className: 'bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold' },
            React.createElement(
              'tr',
              null,
              React.createElement('th', { className: 'p-3' }, 'Username'),
              React.createElement('th', { className: 'p-3' }, 'Email'),
              React.createElement('th', { className: 'p-3' }, 'Roles'),
              React.createElement('th', { className: 'p-3' }, 'Status'),
              React.createElement('th', { className: 'p-3' }, 'Actions')
            )
          ),
          React.createElement(
            'tbody',
            { className: 'divide-y divide-slate-100' },
            filteredUsers.length > 0
              ? filteredUsers.map((u) =>
                  React.createElement(
                    'tr',
                    { key: u.id, className: 'hover:bg-slate-50 transition' },
                    React.createElement('td', { className: 'p-3 font-semibold text-slate-900' }, u.username),
                    React.createElement('td', { className: 'p-3 text-slate-600' }, u.email),
                    React.createElement('td', { className: 'p-3' }, (u.roles || []).join(', ') || 'USER'),
                    React.createElement(
                      'td',
                      { className: 'p-3' },
                      React.createElement(
                        'span',
                        {
                          className: `px-2 py-0.5 rounded text-xs font-semibold ${
                            u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`,
                        },
                        u.active ? 'ACTIVE' : 'INACTIVE'
                      )
                    ),
                    React.createElement(
                      'td',
                      { className: 'p-3' },
                      u.active
                        ? React.createElement(
                            'button',
                            {
                              type: 'button',
                              onClick: () => handleDeactivate(u.id),
                              className: 'text-xs text-rose-600 hover:underline font-semibold',
                            },
                            'Deactivate'
                          )
                        : React.createElement(
                            'button',
                            {
                              type: 'button',
                              onClick: () => handleActivate(u.id),
                              className: 'text-xs text-emerald-600 hover:underline font-semibold',
                            },
                            'Activate'
                          )
                    )
                  )
                )
              : React.createElement(
                  'tr',
                  null,
                  React.createElement('td', { colSpan: 5, className: 'p-4 text-center text-slate-500' }, 'No users found.')
                )
          )
        )
      ),

    // Tab 2: Roles
    activeTab === 2 &&
      React.createElement(
        'div',
        { className: 'bg-white rounded-2xl border border-slate-200 shadow-sm p-4' },
        React.createElement('h3', { className: 'font-bold text-slate-900 mb-3' }, 'Configured System Roles'),
        React.createElement(
          'div',
          { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
          (roles.length > 0 ? roles : [
            { id: 1, code: 'ROLE_SUPER_ADMIN', name: 'Super Administrator', description: 'Unrestricted enterprise platform management.' },
            { id: 2, code: 'ROLE_SITE_ADMIN', name: 'Site Administrator', description: 'Institutional administration and investigator assignment.' },
            { id: 3, code: 'ROLE_INVESTIGATOR', name: 'Clinical Investigator', description: 'Principal investigator protocol management.' },
            { id: 4, code: 'ROLE_COORDINATOR', name: 'Clinical Study Coordinator', description: 'Participant intake and outreach management.' },
            { id: 5, code: 'ROLE_PARTICIPANT', name: 'Study Participant', description: 'Patient access to questionnaire eConsent.' },
          ]).map((r) =>
            React.createElement(
              'div',
              { key: r.id, className: 'p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1' },
              React.createElement('div', { className: 'text-xs font-mono font-bold text-blue-700' }, r.code),
              React.createElement('div', { className: 'font-bold text-slate-900' }, r.name),
              React.createElement('div', { className: 'text-xs text-slate-600' }, r.description)
            )
          )
        )
      ),

    // Tab 3: Locations
    activeTab === 3 &&
      React.createElement(
        'div',
        { className: 'bg-white rounded-2xl border border-slate-200 shadow-sm p-4' },
        React.createElement('h3', { className: 'font-bold text-slate-900 mb-3' }, `${terminology.locations || 'Research Sites'} Directory`),
        React.createElement(
          'div',
          { className: 'space-y-3' },
          (locations.length > 0 ? locations : [
            { id: 1, code: 'SITE-001', name: 'Boston Main Clinical Research Center', city: 'Boston', state: 'MA' },
            { id: 2, code: 'SITE-002', name: 'West Coast Oncology Pavilion', city: 'San Francisco', state: 'CA' },
            { id: 3, code: 'SITE-003', name: 'Midwest Heart & Vascular Institute', city: 'Chicago', state: 'IL' },
          ]).map((loc) =>
            React.createElement(
              'div',
              { key: loc.id, className: 'flex justify-between items-center p-3 rounded-xl border border-slate-200' },
              React.createElement(
                'div',
                null,
                React.createElement('div', { className: 'font-bold text-slate-900' }, loc.name),
                React.createElement('div', { className: 'text-xs text-slate-500' }, `${loc.code} — ${loc.city || ''}, ${loc.state || ''}`)
              ),
              React.createElement('span', { className: 'px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800' }, 'ACTIVE')
            )
          )
        )
      ),

    // Tab 4: Audit Logs
    activeTab === 4 &&
      React.createElement(
        'div',
        { className: 'bg-white rounded-2xl border border-slate-200 shadow-sm p-4' },
        React.createElement('h3', { className: 'font-bold text-slate-900 mb-3' }, 'Security & Administrative Audit Ledger'),
        React.createElement(
          'div',
          { className: 'space-y-2' },
          (auditLogs.length > 0 ? auditLogs : [
            { id: 101, action: 'USER_LOGIN', performedBy: 'admin', timestamp: '2026-09-22 09:15:00', details: 'Successful authentication' },
            { id: 102, action: 'ROLE_ASSIGNED', performedBy: 'admin', timestamp: '2026-09-22 09:30:12', details: 'Assigned ROLE_COORDINATOR to user coordinator1' },
            { id: 103, action: 'SITE_REGISTERED', performedBy: 'admin', timestamp: '2026-09-21 16:40:00', details: 'Added SITE-003 Midwest Heart & Vascular' },
          ]).map((log) =>
            React.createElement(
              'div',
              { key: log.id, className: 'flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs' },
              React.createElement(
                'div',
                null,
                React.createElement('span', { className: 'font-mono font-bold text-blue-700 mr-2' }, log.action),
                React.createElement('span', { className: 'text-slate-700' }, log.details)
              ),
              React.createElement('div', { className: 'text-slate-400' }, `${log.performedBy} • ${log.timestamp}`)
            )
          )
        )
      )
  );
};

export default Administrator;
