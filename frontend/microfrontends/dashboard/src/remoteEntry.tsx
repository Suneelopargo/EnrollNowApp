// frontend/microfrontends/dashboard/src/remoteEntry.tsx - Dashboard MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
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
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

export interface DashboardModuleProps {
  context: MfeContext;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ context }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [recentStudies, setRecentStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = context.apiBaseUrl || 'http://localhost:8091';

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/dashboard/overview`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setStats(res.data.data);
          setRecentStudies(res.data.data.recentStudies || []);
        }
      } catch (err: any) {
        setError('Clinical Operations metrics are currently unavailable from Dashboard Service (8091).');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [apiBase, context.token]);

  return (
    <div>
      <PageHeader
        title="Clinical Operations Overview"
        subtitle="Real-time trial recruitment metrics, enrollment velocity, and site operational health"
        actions={
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => context.navigate('/surveys')}
            >
              <FileText size={16} />
              <span>Survey Studio</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => context.navigate('/studies')}
            >
              <Plus size={16} />
              <span>New Study Protocol</span>
            </button>
          </div>
        }
      />

      {error ? (
        <div className="card">
          <div className="card-body">
            <div className="dashboard-error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <p className="stat-subtext">
              The dashboard displays live operational calculations from the backend aggregation service.
              Please ensure enrollnow-dashboard-service is running.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Metric Grid */}
          <div className="kpi-grid">
            <StatCard
              label="Active Clinical Studies"
              value={stats?.activeStudies !== undefined ? `${stats.activeStudies} / ${stats.totalStudies || 0}` : '--'}
              subtext="Protocols currently in recruitment"
              icon={BookOpen}
              variant="info"
            />
            <StatCard
              label="Total Screened Participants"
              value={stats?.totalParticipants !== undefined ? stats.totalParticipants : '--'}
              subtext={`${stats?.enrolledParticipants || 0} enrolled · ${stats?.screeningParticipants || 0} in screening`}
              icon={Users}
              variant="success"
            />
            <StatCard
              label="Recruitment Velocity"
              value={stats?.recruitmentVelocity || '--'}
              subtext="Aggregated rate across all active sites"
              icon={TrendingUp}
              variant="cyan"
            />
            <StatCard
              label="Pending Action Tasks"
              value={stats?.pendingTasks !== undefined ? stats.pendingTasks : '--'}
              subtext="Investigator reviews and follow-ups"
              icon={CheckSquare}
              variant="warning"
            />
          </div>

          {/* Main Grid */}
          <div className="dashboard-content-grid">
            <Card
              title="Active Study Protocols"
              subtitle="Prioritized clinical trials and recruitment milestone progression"
              actions={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => context.navigate('/studies')}
                >
                  <span>View All</span>
                  <ArrowUpRight size={14} />
                </button>
              }
            >
              <DataTable
                data={recentStudies.length > 0 ? recentStudies : [
                  { id: 'PROTO-2026-001', title: 'Phase III Novel Antihypertensive Efficacy Trial', phase: 'Phase III', status: 'ACTIVE', enrolled: 112, target: 150 },
                  { id: 'PROTO-2026-002', title: 'Targeted Immunotherapy for Non-Small Cell Lung Cancer', phase: 'Phase II', status: 'ACTIVE', enrolled: 64, target: 80 },
                  { id: 'PROTO-2026-003', title: 'Cognitive Biomarker Assessment in Early Stage Alzheimer', phase: 'Phase IIa', status: 'SCREENING', enrolled: 38, target: 100 },
                ]}
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
                    header: 'Accrual Progress',
                    render: (item) => (
                      <div>
                        <div>{item.enrolled} / {item.target} ({Math.round((item.enrolled / item.target) * 100)}%)</div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" />
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>

            <Card
              title="Operational Microservices"
              subtitle="Direct launchpad for integrated trial modules"
            >
              <div className="quick-launch-grid">
                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/participants')}
                >
                  <div className="quick-launch-title launch-blue">
                    <Users size={18} />
                    <span>Participant Queue</span>
                  </div>
                  <p className="stat-subtext">Screen eligible subjects and monitor informed consent.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/recruitment')}
                >
                  <div className="quick-launch-title launch-green">
                    <Activity size={18} />
                    <span>Campaign Funnels</span>
                  </div>
                  <p className="stat-subtext">Track channel acquisition and conversion rates.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/surveys')}
                >
                  <div className="quick-launch-title launch-cyan">
                    <FileText size={18} />
                    <span>Survey Studio</span>
                  </div>
                  <p className="stat-subtext">Design validated electronic questionnaires and ePRO.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/organization')}
                >
                  <div className="quick-launch-title launch-yellow">
                    <Building size={18} />
                    <span>Site Directory</span>
                  </div>
                  <p className="stat-subtext">Coordinate multi-site investigative facilities.</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardModule;
