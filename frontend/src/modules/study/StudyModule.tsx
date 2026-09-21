import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { BookOpen, Plus, Search, Filter, Layers, CheckCircle } from 'lucide-react';
import apiClient from '../../api/client';

export const StudyModule: React.FC = () => {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/studies');
        setStudies(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, []);

  const data = studies.length > 0 ? studies : [
    { protocolId: 'PROTO-2026-001', title: 'Phase III Novel Antihypertensive Efficacy Trial', therapeuticArea: 'Cardiovascular', phase: 'Phase III', status: 'ACTIVE', targetEnrollment: 150, currentEnrollment: 112, principalInvestigator: 'Dr. Robert Miller' },
    { protocolId: 'PROTO-2026-002', title: 'Targeted Immunotherapy for Non-Small Cell Lung Cancer', therapeuticArea: 'Oncology', phase: 'Phase II', status: 'ACTIVE', targetEnrollment: 80, currentEnrollment: 64, principalInvestigator: 'Dr. Elena Vance' },
    { protocolId: 'PROTO-2026-003', title: 'Cognitive Biomarker Assessment in Early Stage Alzheimer', therapeuticArea: 'Neurology', phase: 'Phase IIa', status: 'SCREENING', targetEnrollment: 100, currentEnrollment: 38, principalInvestigator: 'Dr. Marcus Vance' },
    { protocolId: 'PROTO-2026-004', title: 'Pediatric Asthma Inhaler Delivery Optimization', therapeuticArea: 'Pulmonology', phase: 'Phase IV', status: 'PENDING', targetEnrollment: 200, currentEnrollment: 0, principalInvestigator: 'Dr. Lisa Chen' },
  ];

  return (
    <div>
      <PageHeader
        title="Clinical Studies & Protocols"
        subtitle="Authoritative protocol catalog, therapeutic areas, and target enrollment milestones"
        actions={
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Create Study Protocol</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Active Protocols" value="8" subtext="Across 4 therapeutic areas" icon={BookOpen} variant="info" />
        <StatCard label="Total Target Accrual" value="530" subtext="214 subjects enrolled" icon={Layers} variant="success" />
        <StatCard label="Protocol Amendments" value="3" subtext="All IRB-approved" icon={CheckCircle} variant="cyan" />
      </div>

      <Card
        title="Protocol Catalog"
        subtitle="Manage investigational study criteria, phases, and recruitment status"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => s.protocolId}
          columns={[
            { key: 'protocolId', header: 'Protocol ID', render: (s) => <strong>{s.protocolId}</strong> },
            {
              key: 'title',
              header: 'Study Title & Investigator',
              render: (s) => (
                <div>
                  <div>{s.title}</div>
                  <span className="stat-subtext">PI: {s.principalInvestigator} · {s.therapeuticArea}</span>
                </div>
              ),
            },
            { key: 'phase', header: 'Phase' },
            {
              key: 'enrollment',
              header: 'Enrollment Accrual',
              render: (s) => (
                <div>
                  <div>{s.currentEnrollment} / {s.targetEnrollment} ({Math.round((s.currentEnrollment / s.targetEnrollment) * 100)}%)</div>
                  <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', marginTop: '4px' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((s.currentEnrollment / s.targetEnrollment) * 100))}%`,
                        height: '100%',
                        backgroundColor: 'var(--color-brand-accent)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              ),
            },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default StudyModule;
