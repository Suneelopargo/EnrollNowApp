import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Tabs, TabItem } from '../../components/Tabs';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import {
  Users,
  Shield,
  Building,
  ScrollText,
  UserCheck,
  Lock,
  Plus,
  Search,
} from 'lucide-react';
import apiClient from '../../api/client';

export const AdministrationModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const tabs: TabItem[] = [
    { id: 'users', label: 'User Directory', icon: <UserCheck size={16} /> },
    { id: 'roles', label: 'Roles & RBAC Matrix', icon: <Shield size={16} /> },
    { id: 'sites', label: 'Site Assignments', icon: <Building size={16} /> },
    { id: 'audit', label: 'Audit Ledger', icon: <ScrollText size={16} /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const res = await apiClient.get('/api/administrator/users');
          setUsers(res.data?.data || []);
        } else if (activeTab === 'roles') {
          const res = await apiClient.get('/api/administrator/roles');
          setRoles(res.data?.data || []);
        } else if (activeTab === 'audit') {
          const res = await apiClient.get('/api/administrator/audit-logs');
          setAuditLogs(res.data?.data?.content || []);
        }
      } catch {
        // Fallback demo data if offline
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  return (
    <div>
      <PageHeader
        title="System Administration & Governance"
        subtitle="Identity governance, role-based access control (RBAC), and immutable audit ledger"
        actions={
          activeTab === 'users' ? (
            <button className="btn btn-primary">
              <Plus size={16} />
              <span>Create User Account</span>
            </button>
          ) : activeTab === 'roles' ? (
            <button className="btn btn-primary">
              <Plus size={16} />
              <span>Create Custom Role</span>
            </button>
          ) : null
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'users' && (
        <Card
          title="Authoritative User Directory"
          subtitle="System accounts, active authentication credentials, and assigned roles"
        >
          <DataTable
            data={users.length > 0 ? users : [
              { id: 1, username: 'admin', email: 'admin@enrollnow.local', firstName: 'System', lastName: 'Administrator', active: true, roles: ['ROLE_SUPER_ADMIN'] },
              { id: 2, username: 'site_coordinator', email: 'coordinator@bostoncrc.org', firstName: 'Sarah', lastName: 'Jenkins', active: true, roles: ['ROLE_STUDY_USER', 'ROLE_SITE_MANAGER'] },
              { id: 3, username: 'dr_miller', email: 'miller@massgeneral.org', firstName: 'Robert', lastName: 'Miller', active: true, roles: ['ROLE_SITE_ADMIN'] },
            ]}
            keyExtractor={(u) => u.id}
            columns={[
              { key: 'username', header: 'Username', render: (u) => <strong>{u.username}</strong> },
              { key: 'fullName', header: 'Full Name', render: (u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username },
              { key: 'email', header: 'Email Address' },
              {
                key: 'roles',
                header: 'Assigned Roles',
                render: (u) => (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(u.roles || []).map((r: string) => (
                      <span key={r} className="badge badge-info">{r.replace('ROLE_', '')}</span>
                    ))}
                  </div>
                ),
              },
              {
                key: 'active',
                header: 'Status',
                render: (u) => <StatusBadge status={u.active ? 'ACTIVE' : 'INACTIVE'} />,
              },
            ]}
          />
        </Card>
      )}

      {activeTab === 'roles' && (
        <Card
          title="Configurable Roles & RBAC Matrix"
          subtitle="Granular permissions for View, Create, Edit, Delete, and Export across application screens"
        >
          <DataTable
            data={roles.length > 0 ? roles : [
              { id: 1, roleCode: 'ROLE_SUPER_ADMIN', name: 'Super Administrator', description: 'Unrestricted system-wide identity and security governance', status: 'ACTIVE', userCount: 1 },
              { id: 2, roleCode: 'ROLE_SITE_ADMIN', name: 'Site Administrator', description: 'Site-level user management and site operational settings', status: 'ACTIVE', userCount: 4 },
              { id: 3, roleCode: 'ROLE_SITE_MANAGER', name: 'Site Manager', description: 'Site coordinator and workflow management', status: 'ACTIVE', userCount: 6 },
              { id: 4, roleCode: 'ROLE_STUDY_USER', name: 'Study Coordinator', description: 'Study-specific participant recruitment and operational trial workflow', status: 'ACTIVE', userCount: 12 },
              { id: 5, roleCode: 'ROLE_REGISTRY_USER', name: 'Registry User', description: 'Participant registry search and intake operations', status: 'ACTIVE', userCount: 8 },
            ]}
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'roleCode', header: 'Role Code', render: (r) => <code>{r.roleCode}</code> },
              { key: 'name', header: 'Role Name' },
              { key: 'description', header: 'Description' },
              { key: 'userCount', header: 'Assigned Users', render: (r) => `${r.userCount || 0} users` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Card>
      )}

      {activeTab === 'sites' && (
        <Card
          title="Multi-Site User Access Scope"
          subtitle="Scoped site-level permissions allowing investigators to coordinate across multiple clinical locations"
        >
          <DataTable
            data={[
              { siteCode: 'SITE-001', name: 'Main Clinical Research Center', city: 'Boston', state: 'MA', activeUsers: 8 },
              { siteCode: 'SITE-002', name: 'West Coast Oncology Pavilion', city: 'San Francisco', state: 'CA', activeUsers: 5 },
              { siteCode: 'SITE-003', name: 'Midwest Heart & Vascular Institute', city: 'Chicago', state: 'IL', activeUsers: 4 },
            ]}
            keyExtractor={(s) => s.siteCode}
            columns={[
              { key: 'siteCode', header: 'Site Code', render: (s) => <strong>{s.siteCode}</strong> },
              { key: 'name', header: 'Site Name' },
              { key: 'city', header: 'Location', render: (s) => `${s.city}, ${s.state}` },
              { key: 'activeUsers', header: 'Assigned Coordinators', render: (s) => `${s.activeUsers} active` },
              { key: 'status', header: 'Status', render: () => <StatusBadge status="ACTIVE" /> },
            ]}
          />
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card
          title="Security & Governance Audit Ledger"
          subtitle="Immutable audit log recording user logins, permission updates, and operational events"
        >
          <DataTable
            data={auditLogs.length > 0 ? auditLogs : [
              { id: 101, action: 'USER_LOGIN_SUCCESS', performedByUsername: 'admin', targetUsername: 'admin', details: 'Successful authentication via Argon2id', ipAddress: '127.0.0.1', createdAt: '2026-09-21T21:00:00Z' },
              { id: 102, action: 'ROLE_ASSIGNMENTS_UPDATED', performedByUsername: 'admin', targetUsername: 'site_coordinator', details: 'Assigned ROLE_STUDY_USER and ROLE_SITE_MANAGER', ipAddress: '127.0.0.1', createdAt: '2026-09-21T20:45:00Z' },
              { id: 103, action: 'SITE_ACCESS_UPDATED', performedByUsername: 'admin', targetUsername: 'site_coordinator', details: 'Authorized for SITE-001 and SITE-002', ipAddress: '127.0.0.1', createdAt: '2026-09-21T20:30:00Z' },
            ]}
            keyExtractor={(a) => a.id}
            columns={[
              { key: 'action', header: 'Event Action', render: (a) => <code>{a.action}</code> },
              { key: 'performedByUsername', header: 'Performed By' },
              { key: 'targetUsername', header: 'Target' },
              { key: 'details', header: 'Details' },
              { key: 'ipAddress', header: 'IP Address' },
              { key: 'createdAt', header: 'Timestamp', render: (a) => new Date(a.createdAt).toLocaleString() },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default AdministrationModule;
