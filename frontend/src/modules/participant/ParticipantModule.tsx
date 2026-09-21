import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { Users, UserPlus, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import apiClient from '../../api/client';

export const ParticipantModule: React.FC = () => {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/participants');
        setParticipants(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchParticipants();
  }, []);

  const data = participants.length > 0 ? participants : [
    { mrn: 'PT-88301', name: 'John D. Smith', age: 54, gender: 'Male', assignedStudy: 'PROTO-2026-001', site: 'SITE-001 (Boston)', consentStatus: 'CONSENTED', status: 'ENROLLED', screeningDate: '2026-08-15' },
    { mrn: 'PT-88302', name: 'Maria Rodriguez', age: 47, gender: 'Female', assignedStudy: 'PROTO-2026-002', site: 'SITE-002 (San Francisco)', consentStatus: 'PENDING_SIGNATURE', status: 'SCREENING', screeningDate: '2026-09-02' },
    { mrn: 'PT-88303', name: 'David K. Wilson', age: 62, gender: 'Male', assignedStudy: 'PROTO-2026-001', site: 'SITE-001 (Boston)', consentStatus: 'CONSENTED', status: 'ENROLLED', screeningDate: '2026-08-20' },
    { mrn: 'PT-88304', name: 'Aisha Patel', age: 39, gender: 'Female', assignedStudy: 'PROTO-2026-003', site: 'SITE-003 (Chicago)', consentStatus: 'NOT_CONSENTED', status: 'PENDING', screeningDate: '2026-09-10' },
    { mrn: 'PT-88305', name: 'Thomas Wright', age: 71, gender: 'Male', assignedStudy: 'PROTO-2026-003', site: 'SITE-001 (Boston)', consentStatus: 'CONSENTED', status: 'ENROLLED', screeningDate: '2026-08-28' },
  ];

  return (
    <div>
      <PageHeader
        title="Participant Recruitment & Queue"
        subtitle="Participant registry intake, pre-screening eligibility, and electronic consent tracking"
        actions={
          <button className="btn btn-primary">
            <UserPlus size={16} />
            <span>Screen New Participant</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Total Screened" value="450" subtext="Across all participating sites" icon={Users} variant="info" />
        <StatCard label="Fully Consented" value="284" subtext="eConsent verified" icon={CheckCircle} variant="success" />
        <StatCard label="In Screening Queue" value="86" subtext="Eligibility check pending" icon={Clock} variant="warning" />
      </div>

      <Card
        title="Participant Queue & Registry"
        subtitle="Manage subject screening pipeline and consent verification"
      >
        <DataTable
          data={data}
          keyExtractor={(p) => p.mrn}
          columns={[
            { key: 'mrn', header: 'Participant ID', render: (p) => <strong>{p.mrn}</strong> },
            {
              key: 'name',
              header: 'Demographics',
              render: (p) => (
                <div>
                  <div>{p.name}</div>
                  <span className="stat-subtext">{p.age} yrs · {p.gender}</span>
                </div>
              ),
            },
            { key: 'assignedStudy', header: 'Protocol', render: (p) => <code>{p.assignedStudy}</code> },
            { key: 'site', header: 'Site Location' },
            {
              key: 'consentStatus',
              header: 'Consent Verification',
              render: (p) => (
                <span className={`badge ${p.consentStatus === 'CONSENTED' ? 'badge-success' : 'badge-warning'}`}>
                  {p.consentStatus}
                </span>
              ),
            },
            { key: 'status', header: 'Enrollment Status', render: (p) => <StatusBadge status={p.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default ParticipantModule;
