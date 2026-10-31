// frontend/microfrontends/participant/src/components/ParticipantFormsSection.tsx - Participant Forms / Surveys List & Assignment
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import { toast } from '../../../../shared/toaster';
import { getApiErrorMessage } from '../../../../shared/api-client';
import { participantApi, SurveyAssignmentItem } from '../../../../shared/api/participantApi';
import { DataGrid, type ColDef, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';

export interface ParticipantFormsSectionProps {
  participantId: string;
  participantName: string;
  studyId?: string;
  tenantId?: string;
  siteId?: string;
}

export const ParticipantFormsSection: React.FC<ParticipantFormsSectionProps> = ({
  participantId,
  tenantId,
  siteId,
}) => {
  const [forms, setForms] = useState<SurveyAssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const formatSubmittedDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      if (Number.isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const columnDefs = useMemo<ColDef<SurveyAssignmentItem>[]>(() => [
    {
      field: 'completedAt',
      headerName: 'Date/Time Submitted',
      minWidth: 190,
      width: 215,
      valueGetter: (params) => params.data?.submittedAt || params.data?.completedAt,
      valueFormatter: (params) => formatSubmittedDate(params.value),
    },
    {
      colId: 'surveyName',
      headerName: 'Survey Name',
      minWidth: 220,
      flex: 1,
      valueGetter: (params) => params.data?.surveyName || params.data?.surveyCode || '—',
      tooltipValueGetter: (params) => params.value,
      cellRenderer: (params: ICellRendererParams<SurveyAssignmentItem>) => {
        const form = params.data;
        if (!form) return null;
        return (
          <div className="participant-form-survey">
            <span>{form.surveyName || form.surveyCode || '—'}</span>
            {form.studyName && (
              <span className="participant-form-study-badge">{form.studyName}</span>
            )}
          </div>
        );
      },
    },
    {
      colId: 'submittedBy',
      headerName: 'Submitted By',
      minWidth: 170,
      width: 190,
      valueGetter: (params) => params.data?.submittedByName || params.data?.submittedBy || '—',
    },
    {
      colId: 'actions',
      headerName: 'Actions',
      minWidth: 190,
      width: 205,
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
            <span className="flex h-full items-center text-xs font-medium text-emerald-600">Completed</span>
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
  ], [updatingId, handleStatusChange]);

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
              wrapperClassName="participant-forms-grid"
              rowData={forms}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              quickFilterText={searchTerm}
              pagination
              paginationPageSize={10}
              paginationPageSizeSelector={[5, 10, 20, 50]}
              rowHeight={58}
              headerHeight={42}
              animateRows
              suppressCellFocus
              loading={isLoading}
              overlayNoRowsTemplate={`<span class='text-slate-500'>${error ? 'Forms could not be loaded.' : forms.length ? 'No forms match your search.' : 'No forms assigned.'}</span>`}
            />
        </div>
      </div>

    </div>
  );
};
