// frontend/microfrontends/organization/src/remoteEntry.tsx - Organization MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { Building, Plus, MapPin, Network } from 'lucide-react';
import { organizationApi } from '../../../shared/api/organizationApi';

export interface OrganizationModuleProps {
  context: MfeContext;
}

export const OrganizationModule: React.FC<OrganizationModuleProps> = ({ context }) => {
  const [sites, setSites] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await organizationApi.getSites();
        setSites(Array.isArray(data) ? (data as unknown as Array<Record<string, unknown>>) : []);
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Unable to load research sites.';
        setError(msg);
        setSites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, [context.apiBaseUrl]);

  const data = sites;
  const activeSitesCount = data.filter((s) => String(s.status || '').toUpperCase() === 'ACTIVE').length;
  const totalAssignedStudies = data.reduce((sum, s) => sum + (Number(s.activeStudies ?? s.studyCount) || 0), 0);

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
        <StatCard label="Registered Research Sites" value={loading ? '—' : String(data.length)} subtext="EnrollNow Research Network" icon={Network} variant="info" />
        <StatCard label="Active Research Sites" value={loading ? '—' : String(activeSitesCount)} subtext="Active clinical facilities" icon={Building} variant="success" />
        <StatCard label="Assigned Study Protocols" value={loading ? '—' : String(totalAssignedStudies)} subtext="Across registered sites" icon={MapPin} variant="cyan" />
      </div>

      {error && (
        <div className="study-alert study-alert--danger" role="alert">
          <span>{error}</span>
        </div>
      )}

      <Card
        title="Research Facility Directory"
        subtitle="Manage geographic sites, clinical coordinators, and protocol enablement"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => String(s.siteCode ?? s.id ?? '')}
          columns={[
            { key: 'siteCode', header: 'Site Code', render: (s) => <strong>{String(s.siteCode ?? s.id ?? '—')}</strong> },
            { key: 'name', header: 'Facility Name' },
            { key: 'location', header: 'Geographic Location', render: (s) => s.city ? `${s.city}, ${s.state || ''} (${s.country || ''})` : String(s.location || '—') },
            { key: 'phone', header: 'Contact Phone' },
            { key: 'activeStudies', header: 'Assigned Studies', render: (s) => `${Number(s.activeStudies ?? s.studyCount ?? 0)} active protocols` },
            { key: 'status', header: 'Operational Status', render: (s) => <StatusBadge status={String(s.status || 'ACTIVE')} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default OrganizationModule;
