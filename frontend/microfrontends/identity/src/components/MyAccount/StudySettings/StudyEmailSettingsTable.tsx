// frontend/microfrontends/identity/src/components/MyAccount/StudySettings/StudyEmailSettingsTable.tsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StudyNotificationPreference, accountApi } from '../../../../../../shared/api/accountApi';
import { toast } from '../../../../../../shared/toaster';
import {
  DataGrid,
  type ColDef,
  type ICellRendererParams,
} from '../../../../../../shared/design-system/components/DataGrid';

export interface StudyEmailSettingsTableProps {
  preferences: StudyNotificationPreference[];
  onPreferencesUpdated: (updated: StudyNotificationPreference[]) => void;
}

type NotificationField = 'dailyDigest' | 'taskEmails' | 'participantEmails' | 'surveySubmissions';

const FIELD_LABELS: Record<NotificationField, string> = {
  dailyDigest: 'Daily Digest',
  taskEmails: 'Task Emails',
  participantEmails: 'Participant Emails',
  surveySubmissions: 'Survey Submissions',
};

interface SelectAllHeaderProps {
  displayName: string;
  field: NotificationField;
  context?: {
    localPrefs: StudyNotificationPreference[];
    onToggleAllColumn: (field: NotificationField, nextVal: boolean) => void;
  };
}

/**
 * Custom AG Grid header component with an individual "Select All" checkbox.
 */
const SelectAllHeaderComponent: React.FC<SelectAllHeaderProps> = (props) => {
  const { displayName, field, context } = props;
  const localPrefs = context?.localPrefs || [];
  const onToggleAllColumn = context?.onToggleAllColumn;

  const total = localPrefs.length;
  const checkedCount = localPrefs.filter((p) => !!p[field]).length;
  const allChecked = total > 0 && checkedCount === total;
  const isIndeterminate = checkedCount > 0 && checkedCount < total;

  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleAllColumn) {
      onToggleAllColumn(field, e.target.checked);
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        height: '100%',
      }}
    >
      <input
        ref={checkboxRef}
        type="checkbox"
        className="account-checkbox"
        checked={allChecked}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select all ${displayName}`}
        title={`Select all ${displayName}`}
        style={{
          width: '16px',
          height: '16px',
          cursor: 'pointer',
          accentColor: '#087eb8',
          margin: 0,
        }}
      />
      <span style={{ fontWeight: 600, color: '#f5f8fa', whiteSpace: 'nowrap' }}>
        {displayName}
      </span>
    </div>
  );
};

export const StudyEmailSettingsTable: React.FC<StudyEmailSettingsTableProps> = ({
  preferences,
  onPreferencesUpdated,
}) => {
  const [localPrefs, setLocalPrefs] = useState<StudyNotificationPreference[]>(preferences);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Toggle single study checkbox
  const handleToggle = useCallback(
    async (
      studyId: string,
      field: NotificationField,
      currentVal: boolean
    ) => {
      const nextVal = !currentVal;

      // Optimistic update
      const previous = [...localPrefs];
      const updatedList = localPrefs.map((p) =>
        p.studyId === studyId ? { ...p, [field]: nextVal } : p
      );
      setLocalPrefs(updatedList);

      try {
        const saved = await accountApi.updateStudyPreference(studyId, { [field]: nextVal });
        const authoritativeList = localPrefs.map((p) => (p.studyId === studyId ? saved : p));
        setLocalPrefs(authoritativeList);
        onPreferencesUpdated(authoritativeList);
        toast.clear();
        toast.success(`Updated ${FIELD_LABELS[field]} preference`);
      } catch (err: any) {
        // Rollback on failure
        setLocalPrefs(previous);
        toast.clear();
        toast.error(err?.message || 'Failed to update notification setting');
      }
    },
    [localPrefs, onPreferencesUpdated]
  );

  // Toggle all studies for a specific notification column
  const handleToggleAllColumn = useCallback(
    async (field: NotificationField, nextVal: boolean) => {
      if (localPrefs.length === 0) return;

      const previous = [...localPrefs];
      // Optimistic update all rows
      const updatedList = localPrefs.map((p) => ({ ...p, [field]: nextVal }));
      setLocalPrefs(updatedList);

      try {
        await Promise.all(
          localPrefs.map((p) =>
            accountApi.updateStudyPreference(p.studyId, { [field]: nextVal })
          )
        );
        onPreferencesUpdated(updatedList);
        toast.clear();
        toast.success(`Updated all studies for ${FIELD_LABELS[field]}`);
      } catch (err: any) {
        setLocalPrefs(previous);
        toast.clear();
        toast.error(err?.message || `Failed to update all studies for ${FIELD_LABELS[field]}`);
      }
    },
    [localPrefs, onPreferencesUpdated]
  );

  const columnDefs = useMemo<ColDef<StudyNotificationPreference>[]>(
    () => [
      {
        headerName: 'Study Name',
        field: 'studyName',
        flex: 1.8,
        minWidth: 180,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellClass: 'account-study-name-cell',
      },
      {
        headerName: 'Study Role',
        field: 'studyRole',
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => (
          <span>{params.value || 'Coordinator'}</span>
        ),
      },
      {
        headerName: 'Access Role',
        field: 'accessRole',
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: 'agTextColumnFilter',
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => (
          <span>{params.value || 'Study Admin'}</span>
        ),
      },
      {
        headerName: 'Daily Digest',
        field: 'dailyDigest',
        width: 140,
        sortable: false,
        filter: false,
        headerComponent: SelectAllHeaderComponent,
        headerComponentParams: { field: 'dailyDigest', displayName: 'Daily Digest' },
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => {
          const study = params.data;
          if (!study) return null;
          return (
            <input
              type="checkbox"
              className="account-checkbox"
              checked={!!params.value}
              onChange={() => handleToggle(study.studyId, 'dailyDigest', !!params.value)}
              aria-label={`Toggle Daily Digest for ${study.studyName}`}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          );
        },
      },
      {
        headerName: 'Task Emails',
        field: 'taskEmails',
        width: 140,
        sortable: false,
        filter: false,
        headerComponent: SelectAllHeaderComponent,
        headerComponentParams: { field: 'taskEmails', displayName: 'Task Emails' },
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => {
          const study = params.data;
          if (!study) return null;
          return (
            <input
              type="checkbox"
              className="account-checkbox"
              checked={!!params.value}
              onChange={() => handleToggle(study.studyId, 'taskEmails', !!params.value)}
              aria-label={`Toggle Task Emails for ${study.studyName}`}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          );
        },
      },
      {
        headerName: 'Participant Emails',
        field: 'participantEmails',
        width: 160,
        sortable: false,
        filter: false,
        headerComponent: SelectAllHeaderComponent,
        headerComponentParams: { field: 'participantEmails', displayName: 'Participant Emails' },
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => {
          const study = params.data;
          if (!study) return null;
          return (
            <input
              type="checkbox"
              className="account-checkbox"
              checked={!!params.value}
              onChange={() => handleToggle(study.studyId, 'participantEmails', !!params.value)}
              aria-label={`Toggle Participant Emails for ${study.studyName}`}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          );
        },
      },
      {
        headerName: 'Survey Submissions',
        field: 'surveySubmissions',
        width: 175,
        sortable: false,
        filter: false,
        headerComponent: SelectAllHeaderComponent,
        headerComponentParams: { field: 'surveySubmissions', displayName: 'Survey Submissions' },
        cellStyle: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
        cellRenderer: (params: ICellRendererParams<StudyNotificationPreference>) => {
          const study = params.data;
          if (!study) return null;
          return (
            <input
              type="checkbox"
              className="account-checkbox"
              checked={!!params.value}
              onChange={() => handleToggle(study.studyId, 'surveySubmissions', !!params.value)}
              aria-label={`Toggle Survey Submissions for ${study.studyName}`}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          );
        },
      },
    ],
    [handleToggle]
  );

  const gridContext = useMemo(
    () => ({
      localPrefs,
      onToggleAllColumn: handleToggleAllColumn,
    }),
    [localPrefs, handleToggleAllColumn]
  );

  return (
    <div className="account-study-settings-section">
      <h2 className="account-study-heading">Studies, Roles, and Email Notifications</h2>

      {localPrefs.length === 0 ? (
        <div className="account-empty-studies-card">
          <p className="account-empty-text">You are not currently assigned to any active studies.</p>
        </div>
      ) : (
        <div className="account-study-aggrid-wrapper">
          <DataGrid<StudyNotificationPreference>
            rowData={localPrefs}
            columnDefs={columnDefs}
            context={gridContext}
            headerHeight={44}
            rowHeight={48}
            domLayout="autoHeight"
            animateRows
            suppressCellFocus
          />
        </div>
      )}
    </div>
  );
};
