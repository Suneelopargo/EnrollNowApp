import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { Building, Plus, MapPin, Phone, Mail, Network } from 'lucide-react';
import apiClient from '../../api/client';

export const OrganizationModule: React.FC = () => {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/sites');
        setSites(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

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
          <button className="btn btn-primary">
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
