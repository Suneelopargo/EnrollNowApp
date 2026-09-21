// frontend/microfrontends/task/src/remoteEntry.tsx - Task MFE Remote Entry
import React, { useState, useEffect } from 'react';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { StatCard } from '../../../shared/design-system/components/StatCard';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import { CheckSquare, Plus, Clock, AlertTriangle, ListChecks } from 'lucide-react';
import axios from 'axios';

export interface TaskModuleProps {
  context: MfeContext;
}

export const TaskModule: React.FC<TaskModuleProps> = ({ context }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const apiBase = context.apiBaseUrl || 'http://localhost:8088';

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const headers = context.token ? { Authorization: `Bearer ${context.token}` } : {};
        const res = await axios.get(`${apiBase}/api/v1/tasks`, { headers, timeout: 8000 });
        if (res.data?.data) {
          setTasks(res.data.data);
        }
      } catch {
        // Fallback default tasks data
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [apiBase, context.token]);

  const data = tasks.length > 0 ? tasks : [
    { taskId: 'TSK-1049', title: 'Verify e-Consent Signature PT-88105', studyId: 'PROTO-2026-003', assignee: 'Sara Chen', priority: 'HIGH', dueDate: '2026-09-22', status: 'PENDING' },
    { taskId: 'TSK-1050', title: 'Site Initiation Audit - Midwest Vascular', studyId: 'PROTO-2026-001', assignee: 'Elena Rostova', priority: 'MEDIUM', dueDate: '2026-09-25', status: 'IN_PROGRESS' },
    { taskId: 'TSK-1051', title: 'Adverse Reaction Follow-up Call PT-88102', studyId: 'PROTO-2026-001', assignee: 'Sara Chen', priority: 'HIGH', dueDate: '2026-09-21', status: 'PENDING' },
    { taskId: 'TSK-1048', title: 'Quarterly IRB Renewal Submission', studyId: 'PROTO-2026-002', assignee: 'Marcus Vance', priority: 'LOW', dueDate: '2026-09-30', status: 'COMPLETED' },
  ];

  return (
    <div>
      <PageHeader
        title="Clinical Operations & Task Management"
        subtitle="Manage coordinator workflows, protocol milestones, compliance action items, and task queues"
        actions={
          <button type="button" className="btn btn-primary">
            <Plus size={16} />
            <span>Create Action Task</span>
          </button>
        }
      />

      <div className="kpi-grid">
        <StatCard label="Pending Tasks" value="12" subtext="Action items required" icon={Clock} variant="warning" />
        <StatCard label="In Progress" value="5" subtext="Actively worked" icon={ListChecks} variant="info" />
        <StatCard label="High Priority" value="3" subtext="Urgent clinical deadline" icon={AlertTriangle} variant="danger" />
        <StatCard label="Completed (30d)" value="84" subtext="98% on-time completion" icon={CheckSquare} variant="success" />
      </div>

      <Card
        title="Operational Task Queue"
        subtitle="Clinical trial action items, investigator tasks, and regulatory deadline tracking"
      >
        <DataTable
          data={data}
          keyExtractor={(t) => t.taskId}
          columns={[
            { key: 'taskId', header: 'Task ID', render: (t) => <strong>{t.taskId}</strong> },
            { key: 'title', header: 'Task Summary' },
            { key: 'studyId', header: 'Protocol ID', render: (t) => <span className="badge badge-neutral">{t.studyId}</span> },
            { key: 'assignee', header: 'Assigned Coordinator' },
            { key: 'priority', header: 'Priority', render: (t) => (
              <span className={`badge ${t.priority === 'HIGH' ? 'badge-danger' : t.priority === 'MEDIUM' ? 'badge-warning' : 'badge-neutral'}`}>
                {t.priority}
              </span>
            )},
            { key: 'dueDate', header: 'Due Date' },
            { key: 'status', header: 'Task Status', render: (t) => <StatusBadge status={t.status} /> },
          ]}
        />
      </Card>
    </div>
  );
};

export default TaskModule;
