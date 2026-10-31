// frontend/microfrontends/participant/src/components/ParticipantFormsSection.tsx - Participant Forms / Surveys List & Assignment
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClipboardList, Plus, RefreshCw, CheckCircle2, Clock, PlayCircle, Search, X } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, SurveyAssignmentItem } from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
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
  const [searchTerm, setSearchTerm] = useState('');

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

  const columnDefs = useMemo<ColDef<SurveyAssignmentItem>[]>(() => [
    {
      colId: 'formName',
      headerName: 'Form Name',
      minWidth: 200,
      flex: 1,
      valueGetter: (params) => [
        params.data?.surveyName || 'Survey Assessment',
        params.data?.surveyCode,
      ].filter(Boolean).join(' '),
      tooltipValueGetter: (params) => params.value,
    },
    {
      field: 'studyName',
      headerName: 'Study',
      minWidth: 150,
      valueGetter: (params) => params.data?.studyName || 'General Registry',
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      cellRenderer: (params: ICellRendererParams<SurveyAssignmentItem>) => params.data
        ? getStatusBadge(params.data.status)
        : null,
    },
    {
      field: 'assignedAt',
      headerName: 'Assigned Date',
      minWidth: 140,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'dueAt',
      headerName: 'Due Date',
      minWidth: 130,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      minWidth: 180,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: (params: ICellRendererParams<SurveyAssignmentItem>) => {
        const form = params.data;
        if (!form) return null;
        if (updatingId === form.id) {
          return (
            <span className="flex h-full items-center gap-1 text-gray-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          );
        }
        if (form.status === 'COMPLETED') {
          return (
            <span className="flex h-full items-center text-xs font-medium text-emerald-600">
              Completed {formatDate(form.completedAt)}
            </span>
          );
        }
        return (
          <div className="flex h-full items-center gap-2">
            {form.status !== 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={() => void handleStatusChange(form.id, 'IN_PROGRESS')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Start
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleStatusChange(form.id, 'COMPLETED')}
              className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-100"
            >
              Mark Completed
            </button>
          </div>
        );
      },
    },
  ], [updatingId, handleStatusChange, getStatusBadge, formatDate]);

  const defaultColDef = useMemo<ColDef<SurveyAssignmentItem>>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  return (
    <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-4">
      {/* Header with Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="btn btn-sm btn-primary flex items-center gap-1.5"
            id="assign-form-btn"
          >
            <Plus className="w-3.5 h-3.5" /> Assign Form
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
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              There are no questionnaires or assessments currently assigned to this participant.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="relative block max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search forms..."
                aria-label="Search forms"
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear forms search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            <DataGrid<SurveyAssignmentItem>
              wrapperClassName="participant-email-grid"
              rowData={forms}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              quickFilterText={searchTerm}
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[5, 10, 20, 50]}
              rowHeight={48}
              headerHeight={42}
              animateRows
              suppressCellFocus
              overlayNoRowsTemplate="<span class='text-slate-500'>No forms match your search.</span>"
            />
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
