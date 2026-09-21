// frontend/microfrontends/survey/src/remoteEntry.tsx - Survey MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { ClipboardList, Plus, CheckCircle, FileSpreadsheet, Layers } from 'lucide-react';
import axios from 'axios';

export interface SurveyModuleProps {
  context: MfeContext;
}

export const SurveyModule: React.FC<SurveyModuleProps> = ({ context }) => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8087';

  useEffect(() => {
    const fetchSurveys = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/surveys`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setSurveys(res.data.data);
        }
      } catch {
        // Fallback default survey data
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, [apiBase, context.token]);

  const data = surveys.length > 0 ? surveys : [
    { surveyCode: 'SRV-001', title: 'Baseline Cardiovascular Health Questionnaire', studyId: 'PROTO-2026-001', version: 'v2.1', questions: 24, responses: 312, status: 'ACTIVE' },
    { surveyCode: 'SRV-002', title: 'PSQI Sleep Quality Index & Log', studyId: 'PROTO-2026-002', version: 'v1.0', questions: 18, responses: 184, status: 'ACTIVE' },
    { surveyCode: 'SRV-003', title: 'Pediatric Adverse Reaction Diary', studyId: 'PROTO-2026-003', version: 'v3.0', questions: 12, responses: 45, status: 'ACTIVE' },
    { surveyCode: 'SRV-004', title: 'End-of-Study Quality of Life (SF-36)', studyId: 'PROTO-2025-009', version: 'v1.4', questions: 36, responses: 800, status: 'PUBLISHED' },
  ];

  return (
    <div>
      <PageHeader
        title="Electronic Clinical Outcome Assessments (eCOA) & Surveys"
        subtitle="Design, deploy, and collect patient-reported outcomes (PROs), questionnaires, and clinical surveys"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            <span>Design New Survey</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Active Surveys" value="4" subtext="Deployed instruments" icon={ClipboardList} variant="primary" />
        <StatCard label="Collected Submissions" value="1,341" subtext="PRO responses captured" icon={CheckCircle} variant="success" />
        <StatCard label="Question Library" value="90" subtext="Standardized validated items" icon={FileSpreadsheet} variant="info" />
        <StatCard label="Average Completion" value="94.2%" subtext="Response completion rate" icon={Layers} variant="cyan" />
      </div>

      <Card
        title="Survey Instruments & Questionnaires"
        subtitle="Validated clinical trial questionnaires and digital data capture forms"
      >
        <DataTable
          data={data}
          keyExtractor={(s) => s.surveyCode}
          columns={[
            { key: 'surveyCode', header: 'Survey Code', render: (s) => <strong>{s.surveyCode}</strong> },
            { key: 'title', header: 'Survey Instrument Title' },
            { key: 'studyId', header: 'Protocol ID', render: (s) => <span className="badge badge-neutral">{s.studyId}</span> },
            { key: 'version', header: 'Instrument Version', render: (s) => <code>{s.version}</code> },
            { key: 'items', header: 'Questions', render: (s) => `${s.questions} items` },
            { key: 'responses', header: 'Completed Submissions', render: (s) => `${s.responses} captured` },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default SurveyModule;
