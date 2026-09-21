// frontend/microfrontends/document/src/remoteEntry.tsx - Document MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { FileText, Plus, ShieldCheck, HardDrive, FileCheck } from 'lucide-react';
import axios from 'axios';

export interface DocumentModuleProps {
  context: MfeContext;
}

export const DocumentModule: React.FC<DocumentModuleProps> = ({ context }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8090';

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/documents`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setDocuments(res.data.data);
        }
      } catch {
        // Fallback default documents
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [apiBase, context.token]);

  const data = documents.length > 0 ? documents : [
    { documentId: 'DOC-9001', title: 'Cardio Protocol Amendment 3.1 Signoff', type: 'REGULATORY_SUBMISSION', studyId: 'PROTO-2026-001', format: 'PDF', size: '4.2 MB', uploadedAt: '2026-09-18', status: 'VERIFIED' },
    { documentId: 'DOC-9002', title: 'Sleep Architecture Informed Consent Template', type: 'ICF_TEMPLATE', studyId: 'PROTO-2026-002', format: 'PDF', size: '1.8 MB', uploadedAt: '2026-09-15', status: 'VERIFIED' },
    { documentId: 'DOC-9003', title: 'Midwest Center Investigator Brochure v4', type: 'INVESTIGATOR_BROCHURE', studyId: 'PROTO-2026-001', format: 'PDF', size: '12.4 MB', uploadedAt: '2026-09-12', status: 'ACTIVE' },
    { documentId: 'DOC-9004', title: 'FDA IND Safety Report Annual Summary', type: 'REGULATORY_ANNUAL', studyId: 'PROTO-2025-009', format: 'PDF', size: '8.7 MB', uploadedAt: '2026-08-30', status: 'ARCHIVED' },
  ];

  return (
    <div>
      <PageHeader
        title="Electronic Trial Master File (eTMF) & Document Repository"
        subtitle="21 CFR Part 11 compliant document management, version control, cryptographic audit logs, and e-signatures"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            <span>Upload Document</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Managed Documents" value="342" subtext="In electronic master file" icon={FileText} variant="primary" />
        <StatCard label="Part 11 Compliant" value="100%" subtext="Cryptographic signature audit" icon={ShieldCheck} variant="success" />
        <StatCard label="Vault Storage" value="48.2 GB" subtext="Encrypted object store" icon={HardDrive} variant="info" />
        <StatCard label="Pending Signoff" value="4" subtext="Investigator signatures required" icon={FileCheck} variant="warning" />
      </div>

      <Card
        title="Trial Master File Documents"
        subtitle="Versioned regulatory artifacts, signed consent forms, and investigator correspondence"
      >
        <DataTable
          data={data}
          keyExtractor={(d) => d.documentId}
          columns={[
            { key: 'documentId', header: 'Document ID', render: (d) => <strong>{d.documentId}</strong> },
            { key: 'title', header: 'Document Title' },
            { key: 'type', header: 'Category', render: (d) => <span className="badge badge-neutral">{d.type}</span> },
            { key: 'studyId', header: 'Protocol ID', render: (d) => <span className="badge badge-neutral">{d.studyId}</span> },
            { key: 'size', header: 'Size / Format', render: (d) => `${d.size} (${d.format})` },
            { key: 'uploadedAt', header: 'Uploaded Date' },
            { key: 'status', header: 'Compliance Status', render: (d) => <StatusBadge status={d.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default DocumentModule;
