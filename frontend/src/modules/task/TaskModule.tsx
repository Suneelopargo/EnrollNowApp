import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { CheckSquare, Plus, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';

export const TaskModule: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/tasks');
        setTasks(res.data?.data || []);
      } catch {
        // Fallback demo data
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const data = tasks.length > 0 ? tasks : [
    { id: 'TSK-1001', title: 'Verify eConsent Signature for PT-88302', priority: 'HIGH', category: 'Compliance', assignedTo: 'Sarah Jenkins', dueDate: '2026-09-22', status: 'PENDING' },
    { id: 'TSK-1002', title: 'Schedule Baseline Lab Visit for PT-88305', priority: 'NORMAL', category: 'Clinical Operations', assignedTo: 'Robert Miller', dueDate: '2026-09-24', status: 'IN_PROGRESS' },
    { id: 'TSK-1003', title: 'Review Inclusion/Exclusion Criteria for Cohort B', priority: 'HIGH', category: 'Investigator Review', assignedTo: 'Dr. Elena Vance', dueDate: '2026-09-23', status: 'PENDING' },
    { id: 'TSK-1004', title: 'Submit Protocol Amendment #2 to Central IRB', priority: 'NORMAL', category: 'Regulatory', assignedTo: 'Sarah Jenkins', dueDate: '2026-09-28', status: 'COMPLETED' },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks & Clinical Operations"
        subtitle="Operational action queue, participant milestone follow-ups, and protocol compliance items"
        actions={
          <button className="btn btn-primary">
            <Plus size={16} />
            <span>Create Action Task</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Pending Action Items" value="19" subtext="Across all coordinators" icon={Clock} variant="warning" />
        <StatCard label="High Priority Items" value="5" subtext="Requires same-day response" icon={AlertCircle} variant="warning" />
        <StatCard label="Tasks Completed This Week" value="42" subtext="98% on-time completion" icon={CheckCircle2} variant="success" />
      </div>

      <Card
        title="Action Item Queue"
        subtitle="Manage assigned operational tasks, participant follow-ups, and investigator review requests"
      >
        <DataTable
          data={data}
          keyExtractor={(t) => t.id}
          columns={[
            { key: 'id', header: 'Task ID', render: (t) => <strong>{t.id}</strong> },
            {
              key: 'title',
              header: 'Task Description & Category',
              render: (t) => (
                <div>
                  <div>{t.title}</div>
                  <span className="stat-subtext">{t.category}</span>
                </div>
              ),
            },
            {
              key: 'priority',
              header: 'Priority',
              render: (t) => (
                <span className={`badge ${t.priority === 'HIGH' ? 'badge-danger' : 'badge-info'}`}>
                  {t.priority}
                </span>
              ),
            },
            { key: 'assignedTo', header: 'Assigned Coordinator' },
            { key: 'dueDate', header: 'Due Date' },
            { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default TaskModule;
