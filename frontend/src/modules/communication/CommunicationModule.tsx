import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { MessageSquare, Plus, Mail, Smartphone, BellRing, Send } from 'lucide-react';
import apiClient from '../../api/client';

export const CommunicationModule: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCommunications = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/communications');
        setMessages(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchCommunications();
  }, []);

  const data = messages.length > 0 ? messages : [
    { id: 'COMM-501', recipient: 'John D. Smith (PT-88301)', type: 'SMS Reminder', subject: 'Upcoming Clinical Screening Appointment on Sep 24', sentAt: '2026-09-20 14:30', status: 'DELIVERED' },
    { id: 'COMM-502', recipient: 'Maria Rodriguez (PT-88302)', type: 'Email', subject: 'Informed Consent Electronic Signature Link', sentAt: '2026-09-20 11:15', status: 'DELIVERED' },
    { id: 'COMM-503', recipient: 'David K. Wilson (PT-88303)', type: 'Automated Call', subject: 'Medication Adherence Check-In Notice', sentAt: '2026-09-19 09:00', status: 'COMPLETED' },
  ];

  return (
    <div>
      <PageHeader
        title="Participant Communications & Outreach"
        subtitle="Automated appointment reminders, eConsent invitation emails, and omni-channel participant engagement"
        actions={
          <button className="btn btn-primary">
            <Send size={16} />
            <span>Send Outreach Message</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Messages Dispatched" value="1,248" subtext="In past 30 days" icon={MessageSquare} variant="info" />
        <StatCard label="Delivery Rate" value="99.2%" subtext="SMS & Email channels" icon={BellRing} variant="success" />
        <StatCard label="Appointment Confirmation Rate" value="87.5%" subtext="12% reduction in no-shows" icon={Smartphone} variant="cyan" />
      </div>

      <Card
        title="Outreach Dispatch Log"
        subtitle="Real-time transmission history and delivery receipts"
      >
        <DataTable
          data={data}
          keyExtractor={(m) => m.id}
          columns={[
            { key: 'id', header: 'Message ID', render: (m) => <strong>{m.id}</strong> },
            { key: 'recipient', header: 'Participant Recipient' },
            { key: 'type', header: 'Channel / Type' },
            { key: 'subject', header: 'Subject / Content Summary' },
            { key: 'sentAt', header: 'Dispatched At' },
            { key: 'status', header: 'Delivery Status', render: (m) => <StatusBadge status={m.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default CommunicationModule;
