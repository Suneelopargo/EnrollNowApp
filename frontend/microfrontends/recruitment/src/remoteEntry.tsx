// frontend/microfrontends/recruitment/src/remoteEntry.tsx - Recruitment MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { UserPlus, Filter, TrendingUp, CheckCircle, Megaphone } from 'lucide-react';
import axios from 'axios';

export interface RecruitmentModuleProps {
  context: MfeContext;
}

export const RecruitmentModule: React.FC<RecruitmentModuleProps> = ({ context }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8086';

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/recruitment/campaigns`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setCampaigns(res.data.data);
        }
      } catch {
        // Fallback default campaign data
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, [apiBase, context.token]);

  const data = campaigns.length > 0 ? campaigns : [
    { campaignCode: 'CMP-2026-A', name: 'Cardio Cohort Social Ad Reach', studyId: 'PROTO-2026-001', channel: 'Digital / Social', leads: 1420, screened: 580, enrolled: 312, status: 'ACTIVE' },
    { campaignCode: 'CMP-2026-B', name: 'Community Clinic Physician Referral', studyId: 'PROTO-2026-002', channel: 'Provider Direct', leads: 340, screened: 220, enrolled: 184, status: 'ACTIVE' },
    { campaignCode: 'CMP-2026-C', name: 'Pediatric Rare Disease Advocacy', studyId: 'PROTO-2026-003', channel: 'Patient Advocacy', leads: 110, screened: 82, enrolled: 45, status: 'ACTIVE' },
    { campaignCode: 'CMP-2025-X', name: 'Glucose Sensor Open Registry', studyId: 'PROTO-2025-009', channel: 'Hospital Portal', leads: 2200, screened: 1150, enrolled: 800, status: 'COMPLETED' },
  ];

  return (
    <div>
      <PageHeader
        title="Participant Recruitment & Funnel Management"
        subtitle="Manage recruitment channels, prescreening eligibility funnels, and lead conversion workflows"
        actions={
          <button type="button" className="btn btn-primary">
            <Megaphone size={16} />
            <span>Launch Campaign</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Total Inbound Leads" value="4,070" subtext="Across 4 campaigns" icon={UserPlus} variant="primary" />
        <StatCard label="Screened Candidates" value="2,032" subtext="49.9% prescreen rate" icon={Filter} variant="info" />
        <StatCard label="Confirmed Enrolled" value="1,341" subtext="66.0% conversion rate" icon={CheckCircle} variant="success" />
        <StatCard label="Conversion Velocity" value="8.4 days" subtext="Lead to consent average" icon={TrendingUp} variant="cyan" />
      </div>

      <Card
        title="Active Recruitment Campaigns & Funnel Yield"
        subtitle="Channel-level participant acquisition performance and conversion metrics"
      >
        <DataTable
          data={data}
          keyExtractor={(c) => c.campaignCode}
          columns={[
            { key: 'campaignCode', header: 'Campaign ID', render: (c) => <strong>{c.campaignCode}</strong> },
            { key: 'name', header: 'Campaign Name' },
            { key: 'studyId', header: 'Associated Protocol', render: (c) => <span className="badge badge-neutral">{c.studyId}</span> },
            { key: 'channel', header: 'Acquisition Channel' },
            { key: 'funnel', header: 'Funnel (Leads → Screened → Enrolled)', render: (c) => `${c.leads} → ${c.screened} → ${c.enrolled}` },
            { key: 'status', header: 'Campaign Status', render: (c) => <StatusBadge status={c.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default RecruitmentModule;
