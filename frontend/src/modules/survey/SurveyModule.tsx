import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { ClipboardList, Plus, FileCheck, FileQuestion, Sparkles } from 'lucide-react';
import apiClient from '../../api/client';

export const SurveyModule: React.FC = () => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/surveys');
        setSurveys(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  const data = surveys.length > 0 ? surveys : [
    { id: 'SRV-001', title: 'Hypertension Pre-Screening Questionnaire', type: 'Pre-Screening', protocol: 'PROTO-2026-001', version: 'v2.1', responses: 215, completionRate: '94%', status: 'ACTIVE' },
    { id: 'SRV-002', title: 'Informed Consent Form (eConsent English)', type: 'Electronic Consent', protocol: 'PROTO-2026-001', version: 'v1.0', responses: 120, completionRate: '100%', status: 'ACTIVE' },
    { id: 'SRV-003', title: 'Oncology Baseline Quality of Life (ePRO)', type: 'Patient Reported Outcome', protocol: 'PROTO-2026-002', version: 'v1.2', responses: 64, completionRate: '88%', status: 'ACTIVE' },
    { id: 'SRV-004', title: 'Cognitive Daily Diary Intake Form', type: 'ePRO Questionnaire', protocol: 'PROTO-2026-003', version: 'v1.0', responses: 38, completionRate: '91%', status: 'ACTIVE' },
  ];

  return (
    <div>
      <PageHeader
        title="Survey Studio & eConsent Builder"
        subtitle="Design pre-screening surveys, electronic consent forms, and patient-reported outcome (ePRO) questionnaires"
        actions={
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Create Form / Survey</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Published Forms" value="14" subtext="Across 4 active protocols" icon={ClipboardList} variant="info" />
        <StatCard label="Total Completed Surveys" value="437" subtext="93.4% average completion rate" icon={FileCheck} variant="success" />
        <StatCard label="eConsent Packets Signed" value="184" subtext="21 CFR Part 11 compliant" icon={Sparkles} variant="cyan" />
      </div>

      <Card
        title="Form & Survey Template Library"
        subtitle="Manage dynamic branching questions, validation logic, and eConsent signing workflows"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => s.id}
          columns={[
            { key: 'id', header: 'Form ID', render: (s) => <strong>{s.id}</strong> },
            {
              key: 'title',
              header: 'Form Title & Type',
              render: (s) => (
                <div>
                  <div>{s.title}</div>
                  <span className="stat-subtext">{s.type} · {s.version}</span>
                </div>
              ),
            },
            { key: 'protocol', header: 'Linked Protocol', render: (s) => <code>{s.protocol}</code> },
            { key: 'responses', header: 'Responses' },
            { key: 'completionRate', header: 'Completion Rate' },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default SurveyModule;
