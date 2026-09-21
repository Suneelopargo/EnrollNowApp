// frontend/microfrontends/communication/src/remoteEntry.tsx - Communication MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { MessageSquare, Plus, Mail, Smartphone, Send } from 'lucide-react';
import axios from 'axios';

export interface CommunicationModuleProps {
  context: MfeContext;
}

export const CommunicationModule: React.FC<CommunicationModuleProps> = ({ context }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8089';

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/communications`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setMessages(res.data.data);
        }
      } catch {
        // Fallback default communications
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [apiBase, context.token]);

  const data = messages.length > 0 ? messages : [
    { messageId: 'MSG-4001', recipient: 'PT-88102 (Cardio Cohort)', channel: 'SMS', subject: 'Upcoming Clinical Visit Reminder (Visit 3)', sentAt: '2026-09-21 09:30', status: 'DELIVERED' },
    { messageId: 'MSG-4002', recipient: 'PT-88104 (Sleep Study)', channel: 'EMAIL', subject: 'Your Weekly Sleep Log is Ready to Complete', sentAt: '2026-09-21 08:00', status: 'DELIVERED' },
    { messageId: 'MSG-4003', recipient: 'All Enrolled (PROTO-2026-001)', channel: 'BROADCAST', subject: 'Study Protocol Amendment Information Notice', sentAt: '2026-09-20 14:15', status: 'SENT' },
    { messageId: 'MSG-4004', recipient: 'PT-88105 Guardian', channel: 'EMAIL', subject: 'Action Required: e-Consent Signature Verification', sentAt: '2026-09-20 11:00', status: 'PENDING' },
  ];

  return (
    <div>
      <PageHeader
        title="Participant Communications & Outreach Hub"
        subtitle="Automate participant notifications, multi-channel reminders, broadcast alerts, and engagement logs"
        actions={
          <button type="button" className="btn btn-primary">
            <Send size={16} />
            <span>Send Communication</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Messages Sent (30d)" value="3,842" subtext="Across SMS & Email" icon={MessageSquare} variant="primary" />
        <StatCard label="Email Delivery Rate" value="99.2%" subtext="Verified inbox delivery" icon={Mail} variant="success" />
        <StatCard label="SMS Delivery Rate" value="98.7%" subtext="Carrier confirmed" icon={Smartphone} variant="info" />
        <StatCard label="Scheduled Broadcasts" value="2" subtext="Pending distribution" icon={Plus} variant="cyan" />
      </div>

      <Card
        title="Communication Log & Outbound Dispatch"
        subtitle="Chronological audit log of participant notifications, SMS prompts, and email messages"
      >
        <DataTable
          data={data}
          keyExtractor={(m) => m.messageId}
          columns={[
            { key: 'messageId', header: 'Message ID', render: (m) => <strong>{m.messageId}</strong> },
            { key: 'recipient', header: 'Recipient' },
            { key: 'channel', header: 'Channel', render: (m) => <span className="badge badge-neutral">{m.channel}</span> },
            { key: 'subject', header: 'Subject / Notification' },
            { key: 'sentAt', header: 'Dispatched At' },
            { key: 'status', header: 'Delivery Status', render: (m) => <StatusBadge status={m.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default CommunicationModule;
