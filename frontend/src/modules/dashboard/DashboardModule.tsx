import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Users,
  BookOpen,
  Building,
  CheckSquare,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Plus,
  FileText,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalStudies: number;
  activeStudies: number;
  totalParticipants: number;
  enrolledParticipants: number;
  screeningParticipants: number;
  activeSites: number;
  pendingTasks: number;
  recruitmentVelocity: string;
}

const DEFAULT_STATS: DashboardStats = {
  totalStudies: 12,
  activeStudies: 8,
  totalParticipants: 450,
  enrolledParticipants: 284,
  screeningParticipants: 86,
  activeSites: 6,
  pendingTasks: 19,
  recruitmentVelocity: '+14.2% MoM',
};

const RECENT_STUDIES = [
  { id: 'ST-101', title: 'Cardiovascular Phase III Efficacy Trial', phase: 'Phase III', status: 'ACTIVE', enrolled: 120, target: 150 },
  { id: 'ST-102', title: 'Type 2 Diabetes Glycemic Control', phase: 'Phase II', status: 'ACTIVE', enrolled: 85, target: 100 },
  { id: 'ST-103', title: 'Oncology Biomarker Screening Study', phase: 'Phase Ib', status: 'SCREENING', enrolled: 45, target: 60 },
  { id: 'ST-104', title: 'Neurological Cognitive Recovery Cohort', phase: 'Phase IIa', status: 'PENDING', enrolled: 34, target: 80 },
];

export const DashboardModule: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/v1/dashboard/overview');
        if (res.data?.data) {
          const d = res.data.data;
          setStats({
            totalStudies: d.totalStudies || DEFAULT_STATS.totalStudies,
            activeStudies: d.activeStudies || DEFAULT_STATS.activeStudies,
            totalParticipants: d.totalParticipants || DEFAULT_STATS.totalParticipants,
            enrolledParticipants: d.enrolledParticipants || DEFAULT_STATS.enrolledParticipants,
            screeningParticipants: d.screeningParticipants || DEFAULT_STATS.screeningParticipants,
            activeSites: d.activeSites || DEFAULT_STATS.activeSites,
            pendingTasks: d.pendingTasks || DEFAULT_STATS.pendingTasks,
            recruitmentVelocity: d.recruitmentVelocity || DEFAULT_STATS.recruitmentVelocity,
          });
        }
      } catch {
        // Use default enterprise stats
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div>
      <PageHeader
        title="Clinical Operations Overview"
        subtitle="Real-time trial recruitment metrics, enrollment velocity, and site operational health"
        actions={
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/surveys')}>
              <FileText size={16} />
              <span>Survey Studio</span>
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/studies')}>
              <Plus size={16} />
              <span>New Study Protocol</span>
            </button>
          </div>
        }
      />

      {/* KPI Metric Grid */}
      <div className="kpi-grid">
        <StatCard
          label="Active Clinical Studies"
          value={`${stats.activeStudies} / ${stats.totalStudies}`}
          subtext="8 protocols currently recruiting"
          icon={BookOpen}
          variant="info"
        />
        <StatCard
          label="Total Participants"
          value={stats.totalParticipants}
          subtext={`${stats.enrolledParticipants} enrolled · ${stats.screeningParticipants} in screening`}
          icon={Users}
          variant="success"
        />
        <StatCard
          label="Recruitment Velocity"
          value={stats.recruitmentVelocity}
          subtext="Compared to previous 30 days"
          icon={TrendingUp}
          variant="cyan"
        />
        <StatCard
          label="Pending Action Tasks"
          value={stats.pendingTasks}
          subtext="5 urgent protocol reviews"
          icon={CheckSquare}
          variant="warning"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)' }}>
        {/* Active Protocols Table */}
        <Card
          title="Active Study Protocols"
          subtitle="Top prioritized clinical trials and recruitment status"
          actions={
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/studies')}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          }
        >
          <DataTable
            data={RECENT_STUDIES}
            keyExtractor={(item) => item.id}
            columns={[
              {
                key: 'id',
                header: 'Protocol ID',
                render: (item) => <strong>{item.id}</strong>,
              },
              {
                key: 'title',
                header: 'Study Title',
                render: (item) => (
                  <div>
                    <div>{item.title}</div>
                    <span className="stat-subtext">{item.phase}</span>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (item) => <StatusBadge status={item.status} />,
              },
              {
                key: 'enrolled',
                header: 'Progress',
                render: (item) => (
                  <div>
                    <div>{item.enrolled} / {item.target} ({Math.round((item.enrolled / item.target) * 100)}%)</div>
                    <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '4px' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.round((item.enrolled / item.target) * 100))}%`,
                          height: '100%',
                          backgroundColor: 'var(--color-brand-accent)',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Operational Highlights & Sites */}
        <Card
          title="Operational Quick Launch"
          subtitle="Direct navigation to core microservice modules"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
            <div
              className="card"
              style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }}
              onClick={() => navigate('/participants')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-brand-accent)', fontWeight: 600 }}>
                <Users size={18} />
                <span>Participant Intake</span>
              </div>
              <p className="stat-subtext" style={{ marginTop: '6px' }}>
                Screen eligible volunteers and track informed consent progression.
              </p>
            </div>

            <div
              className="card"
              style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }}
              onClick={() => navigate('/recruitment')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 600 }}>
                <Activity size={18} />
                <span>Campaign Funnel</span>
              </div>
              <p className="stat-subtext" style={{ marginTop: '6px' }}>
                Analyze outreach conversion rates and referral channel ROI.
              </p>
            </div>

            <div
              className="card"
              style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }}
              onClick={() => navigate('/surveys')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0891b2', fontWeight: 600 }}>
                <FileText size={18} />
                <span>Survey Studio</span>
              </div>
              <p className="stat-subtext" style={{ marginTop: '6px' }}>
                Design validated electronic questionnaires and ePRO forms.
              </p>
            </div>

            <div
              className="card"
              style={{ padding: 'var(--spacing-4)', cursor: 'pointer' }}
              onClick={() => navigate('/organization')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-warning)', fontWeight: 600 }}>
                <Building size={18} />
                <span>Site Directory</span>
              </div>
              <p className="stat-subtext" style={{ marginTop: '6px' }}>
                Manage investigational trial sites and regional coordinators.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardModule;
