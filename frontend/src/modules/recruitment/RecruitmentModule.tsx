import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { Target, TrendingUp, Plus, Megaphone, Share2, BarChart3 } from 'lucide-react';
import apiClient from '../../api/client';

export const RecruitmentModule: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecruitment = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/recruitment');
        setCampaigns(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchRecruitment();
  }, []);

  const data = campaigns.length > 0 ? campaigns : [
    { id: 'CMP-001', name: 'Digital Clinical Outreach Q3', channel: 'Digital Ads / Social', targetStudy: 'PROTO-2026-001', leads: 420, conversions: 58, costPerLead: '$32.50', status: 'ACTIVE' },
    { id: 'CMP-002', name: 'Physician Referral Network Direct', channel: 'Provider Referrals', targetStudy: 'PROTO-2026-002', leads: 84, conversions: 32, costPerLead: '$12.00', status: 'ACTIVE' },
    { id: 'CMP-003', name: 'Community Health Fair Intake', channel: 'On-site Community', targetStudy: 'PROTO-2026-003', leads: 110, conversions: 22, costPerLead: '$18.40', status: 'COMPLETED' },
  ];

  return (
    <div>
      <PageHeader
        title="Recruitment Campaigns & Funnels"
        subtitle="Multi-channel participant acquisition velocity, referral sources, and conversion tracking"
        actions={
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Launch Campaign</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Total Inbound Leads" value="614" subtext="Across 3 active channels" icon={Megaphone} variant="info" />
        <StatCard label="Screening Conversion" value="18.2%" subtext="Lead to consented subject" icon={TrendingUp} variant="success" />
        <StatCard label="Top Performing Source" value="Provider Referrals" subtext="38% conversion rate" icon={Share2} variant="cyan" />
      </div>

      <Card
        title="Active Acquisition Campaigns"
        subtitle="Performance metrics by recruitment channel and target protocol"
      >
        <DataTable
          data={data}
          keyExtractor={(c) => c.id}
          columns={[
            { key: 'id', header: 'Campaign ID', render: (c) => <strong>{c.id}</strong> },
            { key: 'name', header: 'Campaign Name' },
            { key: 'channel', header: 'Channel' },
            { key: 'targetStudy', header: 'Target Protocol', render: (c) => <code>{c.targetStudy}</code> },
            { key: 'leads', header: 'Inbound Leads' },
            {
              key: 'conversions',
              header: 'Conversions',
              render: (c) => (
                <div>
                  <strong>{c.conversions}</strong>
                  <span className="stat-subtext"> ({Math.round((c.conversions / c.leads) * 100)}%)</span>
                </div>
              ),
            },
            { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default RecruitmentModule;
