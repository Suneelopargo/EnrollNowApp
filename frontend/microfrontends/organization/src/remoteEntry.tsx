// frontend/microfrontends/organization/src/remoteEntry.tsx - Organization MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { Building, Plus, MapPin, Network } from 'lucide-react';
import axios from 'axios';

export interface OrganizationModuleProps {
  context: MfeContext;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({ context }) => {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8083';

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/sites`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setSites(res.data.data);
        }
      } catch {
        // Fallback default site data
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, [apiBase, context.token]);

  const data = sites.length > 0 ? sites : [
    { siteCode: 'SITE-001', name: 'Main Clinical Research Center', city: 'Boston', state: 'MA', country: 'USA', phone: '+1 617-555-0199', activeStudies: 4, status: 'ACTIVE' },
    { siteCode: 'SITE-002', name: 'West Coast Oncology Pavilion', city: 'San Francisco', state: 'CA', country: 'USA', phone: '+1 415-555-0144', activeStudies: 2, status: 'ACTIVE' },
    { siteCode: 'SITE-003', name: 'Midwest Heart & Vascular Institute', city: 'Chicago', state: 'IL', country: 'USA', phone: '+1 312-555-0182', activeStudies: 3, status: 'ACTIVE' },
  ];

  return (
    <div>
      <PageHeader
        title="Research Sites & Network Directory"
        subtitle="Authoritative site infrastructure, clinical facilities, and multi-site investigator directories"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            <span>Add Research Site</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Network Organizations" value="1" subtext="EnrollNow Research Network" icon={Network} variant="info" />
        <StatCard label="Active Research Sites" value="3" subtext="Across 3 regional hubs" icon={Building} variant="success" />
        <StatCard label="Participating Coordinators" value="17" subtext="Multi-site assigned" icon={MapPin} variant="cyan" />
      </div>

      <Card
        title="Research Facility Directory"
        subtitle="Manage geographic sites, clinical coordinators, and protocol enablement"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => s.siteCode}
          columns={[
            { key: 'siteCode', header: 'Site Code', render: (s) => <strong>{s.siteCode}</strong> },
            { key: 'name', header: 'Facility Name' },
            { key: 'location', header: 'Geographic Location', render: (s) => `${s.city}, ${s.state} (${s.country})` },
            { key: 'phone', header: 'Contact Phone' },
            { key: 'activeStudies', header: 'Assigned Studies', render: (s) => `${s.activeStudies} active protocols` },
            { key: 'status', header: 'Operational Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default OrganizationModule;
