// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { FlaskConical, Plus, Users, Calendar, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export interface StudyModuleProps {
  context: MfeContext;
}

export const StudyModule: React.FC<StudyModuleProps> = ({ context }) => {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8084';

  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/studies`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setStudies(res.data.data);
        }
      } catch {
        // Fallback default study protocols
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, [apiBase, context.token]);

  const data = studies.length > 0 ? studies : [
    { protocolId: 'PROTO-2026-001', title: 'Phase III Trial for Cardio-Metabolic Biomarkers', phase: 'PHASE_3', targetParticipants: 450, enrolledParticipants: 312, status: 'RECRUITING', siteCount: 3 },
    { protocolId: 'PROTO-2026-002', title: 'Observational Study on Sleep Architecture & Cognitive Health', phase: 'OBSERVATIONAL', targetParticipants: 200, enrolledParticipants: 184, status: 'ACTIVE', siteCount: 2 },
    { protocolId: 'PROTO-2026-003', title: 'Immunotherapy Response In Pediatric Cohorts', phase: 'PHASE_2', targetParticipants: 120, enrolledParticipants: 45, status: 'RECRUITING', siteCount: 1 },
    { protocolId: 'PROTO-2025-009', title: 'Post-Market Surveillance of Novel Glucose Sensor', phase: 'PHASE_4', targetParticipants: 800, enrolledParticipants: 800, status: 'COMPLETED', siteCount: 4 },
  ];

  return (
    <div>
      <PageHeader
        title="Clinical Study Protocol Registry"
        subtitle="Manage clinical trial protocols, study phases, cohort allocations, and institutional approvals"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            <span>Create Protocol</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Active Protocols" value="4" subtext="Across all phases" icon={FlaskConical} variant="primary" />
        <StatCard label="Total Target Cohort" value="1,570" subtext="Target participants" icon={Users} variant="info" />
        <StatCard label="Current Enrolled" value="1,341" subtext="85.4% enrollment rate" icon={CheckCircle2} variant="success" />
        <StatCard label="Active Sites" value="10" subtext="Multi-center execution" icon={Calendar} variant="cyan" />
      </div>

      <Card
        title="Clinical Studies & Protocols"
        subtitle="Current active and recruiting clinical trials across the research network"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => s.protocolId}
          columns={[
            { key: 'protocolId', header: 'Protocol ID', render: (s) => <strong>{s.protocolId}</strong> },
            { key: 'title', header: 'Study Title' },
            { key: 'phase', header: 'Phase', render: (s) => <span className="badge badge-neutral">{s.phase}</span> },
            { key: 'enrollment', header: 'Enrollment Progress', render: (s) => `${s.enrolledParticipants} / ${s.targetParticipants} (${Math.round((s.enrolledParticipants / s.targetParticipants) * 100)}%)` },
            { key: 'siteCount', header: 'Active Sites', render: (s) => `${s.siteCount} sites` },
            { key: 'status', header: 'Protocol Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default StudyModule;
