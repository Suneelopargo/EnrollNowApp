// frontend/microfrontends/participant/src/components/ParticipantFormsSection.tsx - Participant Forms / Surveys List & Assignment
import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, RefreshCw, CheckCircle2, Clock, PlayCircle, AlertCircle, Calendar } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, SurveyAssignmentItem } from '../../../../shared/api/participantApi';
import { AssignFormModal } from './AssignFormModal';

export interface ParticipantFormsSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantFormsSection: React.FC<ParticipantFormsSectionProps> = ({
  participantId,
  participantName,
  studyId,
  tenantId,
  siteId,
}) => {
  const [forms, setForms] = useState<SurveyAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchForms = useCallback(async () => {
    if (!participantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await participantApi.getForms(participantId, { tenantId, siteId });
      setForms(data);
    } catch (err: any) {
      console.error('Failed to load participant forms:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load assigned forms');
    } finally {
      setIsLoading(false);
    }
  }, [participantId, tenantId, siteId]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleFormAssigned = (newForm: SurveyAssignmentItem) => {
    setForms((prev) => [newForm, ...prev.filter((f) => f.id !== newForm.id)]);
  };

  const handleStatusChange = async (assignmentId: string, newStatus: string) => {
    setUpdatingId(assignmentId);
    try {
      const updated = await participantApi.updateFormStatus(participantId, assignmentId, newStatus, {
        tenantId,
        siteId,
      });
      setForms((prev) => prev.map((f) => (f.id === assignmentId ? updated : f)));
      toast.success(`Form status updated to ${newStatus}`);
    } catch (err: any) {
      const msg = getApiErrorMessage(err, 'Failed to update form status');
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <PlayCircle className="w-3 h-3 text-blue-600" /> In Progress
          </span>
        );
      case 'ASSIGNED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Assigned
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-4">
      {/* Header with Title and Actions */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            Forms & Surveys
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Participant surveys, intake questionnaires, and screening assessments for {participantName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchForms}
            disabled={isLoading}
            className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-gray-600"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Form
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={fetchForms} className="btn btn-ghost btn-sm text-red-700 hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {isLoading && forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-sm">Loading questionnaires and forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-medium text-gray-900">No forms assigned</h4>
            <p className="text-xs text-gray-500 max-w-sm mt-1 mb-4">
              There are no questionnaires or assessments currently assigned to this participant.
            </p>
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign First Form
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Form Name</th>
                  <th scope="col" className="px-4 py-3">Study</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Assigned Date</th>
                  <th scope="col" className="px-4 py-3">Due Date</th>
                  <th scope="col" className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-medium text-gray-900">
                      <div>
                        <span>{form.surveyName || 'Survey Assessment'}</span>
                        {form.surveyCode && (
                          <span className="ml-2 text-xs font-mono text-gray-400">({form.surveyCode})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 text-xs">
                      {form.studyName || 'General Registry'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(form.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-xs">
                      {formatDate(form.assignedAt)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-xs">
                      {form.dueAt ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(form.dueAt)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-right text-xs">
                      {updatingId === form.id ? (
                        <span className="text-gray-400 flex items-center justify-end gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                      ) : form.status !== 'COMPLETED' ? (
                        <div className="flex items-center justify-end gap-2">
                          {form.status !== 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleStatusChange(form.id, 'IN_PROGRESS')}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Start
                            </button>
                          )}
                          <button
                            onClick={() => handleStatusChange(form.id, 'COMPLETED')}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            Mark Completed
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">
                          Completed {formatDate(form.completedAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Form Modal */}
      {isAssignModalOpen && (
        <AssignFormModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          participantId={participantId}
          participantName={participantName}
          defaultStudyId={studyId}
          tenantId={tenantId}
          siteId={siteId}
          onFormAssigned={handleFormAssigned}
        />
      )}
    </div>
  );
};
