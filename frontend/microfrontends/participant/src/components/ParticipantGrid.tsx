// frontend/microfrontends/participant/src/components/ParticipantGrid.tsx - AG-Grid Participant Table & Actions Bar
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataGrid, type ColDef, type GridApi, type ICellRendererParams } from '../../../../shared/design-system/components/DataGrid';
import { 
  Download, 
  Users, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  X, 
  Trash2,
  Eye,
} from 'lucide-react';
import { ChevronDown, FileSpreadsheet, FileText, UserPlus, List } from 'lucide-react';
import { ParticipantRecord, StudyItem } from '../types/participant';
import { Modal } from '../../../../shared/design-system/components/Modal';
import { toast } from '../../../../shared/toaster';
import { calculateCurrentAge } from '../utils/participantDateUtils';

const parseCsv = (csv: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    if (quoted && char === '"' && csv[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (!quoted && char === ',') { row.push(value); value = ''; }
    else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && csv[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value.length || row.length) { row.push(value); rows.push(row); }
  return rows;
};

const CheckboxCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const [isSelected, setIsSelected] = useState(params.node ? params.node.isSelected() : false);

  useEffect(() => {
    if (!params.node) return;
    const handleSelectionChange = () => {
      setIsSelected(params.node.isSelected());
    };
    params.node.addEventListener('rowSelected', handleSelectionChange);
    return () => {
      params.node.removeEventListener('rowSelected', handleSelectionChange);
    };
  }, [params.node]);

  return (
    <div className="flex items-center justify-center w-full h-full">
      <input
        type="checkbox"
        checked={isSelected}
        aria-label={`Select participant ${params.data?.name || params.data?.id || ''}`.trim()}
        onChange={(e) => {
          e.stopPropagation();
          params.node.setSelected(e.target.checked, false);
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 text-[#1976d2] bg-white border border-gray-400 rounded focus:ring-blue-500 cursor-pointer accent-[#1976d2] shadow-2xs"
      />
    </div>
  );
};

export const StudiesCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const studies: StudyItem[] = params.value;
  if (!studies || !Array.isArray(studies) || studies.length === 0) {
    return <span className="text-gray-500 text-xs font-normal">...</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 leading-relaxed py-1">
      {studies.map((item, idx) => (
        <span key={idx} className="text-xs">
          {item.archived
            || String(item.status || '').toUpperCase() === 'ARCHIVED'
            || [item.id, item.studyId, item.studyCode, item.name]
              .some((key) => params.context?.archivedStudyKeys?.has(String(key || '').trim().toLowerCase())) ? (
            <span
              className="text-gray-700 custom-tooltip-btn cursor-help"
              data-tooltip="Study is Archived"
              data-tooltip-pos="bottom"
              aria-label="Study is Archived"
            >
              {item.name}
            </span>
          ) : item.isLink !== false && (item.studyId || item.id) && params.context?.onNavigateToStudy ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                params.context.onNavigateToStudy(item, params.data);
              }}
              className="participant-grid__study-link cursor-pointer bg-transparent border-0 p-0 text-xs text-left"
              style={{ color: "#1976d2" }}
            >
              {item.name}
            </button>
          ) : (
            <span className="text-gray-700">{item.name}</span>
          )}
          {idx < studies.length - 1 && <span className="text-gray-500">, </span>}
        </span>
      ))}
    </div>
  );
};

const ParticipantActionsRenderer: React.FC<ICellRendererParams> = (params) => {
  const openDetails = () => {
    if (params.data) params.context?.onOpenDetail?.(params.data);
  };

  const deleteParticipant = () => {
    if (params.data) params.context?.onDeleteParticipant?.(params.data);
  };

  return (
    <div className="participant-grid__row-actions">
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); openDetails(); }}
        className="participant-grid__row-action custom-tooltip-btn"
        data-tooltip="View details"
        aria-label="View participant details"
      >
        <Eye size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); deleteParticipant(); }}
        className="participant-grid__row-action participant-grid__row-action--danger custom-tooltip-btn tooltip-align-right"
        data-tooltip="Delete participant"
        aria-label="Delete participant"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
};

const DefaultTextRenderer: React.FC<ICellRendererParams> = (params) => {
  const val = params.value != null ? String(params.value).trim() : '';
  if (!val || val === '...' || val === 'N/A' || val === 'NA' || val.toLowerCase() === 'unspecified') {
    return <span className="text-gray-500 text-xs font-normal">...</span>;
  }
  return <span className="text-gray-800 text-xs font-normal">{val}</span>;
};

const AgeCellRenderer: React.FC<ICellRendererParams<ParticipantRecord>> = (params) => {
  const age = calculateCurrentAge(params.data?.demographics?.dob, params.value);
  if (age === '--') {
    return <span className="text-gray-500 text-xs font-normal">...</span>;
  }
  return <span className="text-gray-800 text-xs font-normal">{age}</span>;
};

interface ParticipantGridProps {
  participants: ParticipantRecord[];
  allParticipants?: ParticipantRecord[];
  selectedParticipant?: ParticipantRecord | null;
  onSelectParticipant?: (participant: ParticipantRecord) => void;
  onRefresh?: () => void;
  onAddParticipant?: () => void;
  onOpenDetail?: (participant: ParticipantRecord) => void;
  onDeleteParticipant?: (participant: ParticipantRecord) => void;
  onDeleteSelected?: (participantIds: string[]) => void;
  onAssignStudyToSelected?: (participantIds: string[], studyName: string) => void;
  isLoading?: boolean;
  onExportServerCsv?: (fields: string[], timezone: string) => Promise<Blob | null>;
  totalCount?: number;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedStudies?: string[];
  setSelectedStudies?: React.Dispatch<React.SetStateAction<string[]>>;
  duplicatesOnly?: boolean;
  onToggleDuplicates?: () => void;
  globalVariables?: { id: string; name: string }[];
  studies?: Array<{
    id?: string | number;
    studyId?: string;
    studyCode?: string;
    name?: string;
    shortName?: string;
    title?: string;
    archived?: boolean;
    status?: string;
  }>;
  onNavigateToStudy?: (study: StudyItem, participant: ParticipantRecord) => void;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants = [],
  allParticipants = [],
  onSelectParticipant,
  onRefresh,
  onAddParticipant,
  onOpenDetail,
  onDeleteParticipant,
  onDeleteSelected,
  onAssignStudyToSelected,
  isLoading = false,
  onExportServerCsv,
  totalCount,
  searchTerm = '',
  setSearchTerm,
  selectedStudies = [],
  setSelectedStudies,
  duplicatesOnly = false,
  onToggleDuplicates,
  globalVariables = [],
  studies = [],
  onNavigateToStudy,
}) => {
  const [gridApi, setGridApi] = useState<GridApi<ParticipantRecord> | null>(null);
  const [gridSearchTerm, setGridSearchTerm] = useState(searchTerm || '');
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantRecord[]>([]);
  const [studyToAssign, setStudyToAssign] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterPopoverPosition, setFilterPopoverPosition] = useState<React.CSSProperties>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [exportTimezone, setExportTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>([]);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const studyFilterButtonRef = useRef<HTMLButtonElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const archivedStudyKeys = useMemo(() => {
    const keys = new Set<string>();
    studies.forEach((study) => {
      if (!study.archived && String(study.status || '').toUpperCase() !== 'ARCHIVED') return;
      [study.id, study.studyId, study.studyCode, study.name, study.shortName, study.title]
        .forEach((value) => {
          const key = String(value || '').trim().toLowerCase();
          if (key) keys.add(key);
        });
    });
    return keys;
  }, [studies]);

  // Synchronize internal quick-filter text if external searchTerm changes (e.g. clear filters)
  useEffect(() => {
    if (searchTerm !== undefined && searchTerm !== gridSearchTerm) {
      setGridSearchTerm(searchTerm);
      gridApi?.setGridOption('quickFilterText', searchTerm);
    }
  }, [searchTerm, gridApi]);

  const handleSearchChange = (value: string) => {
    setGridSearchTerm(value);
    gridApi?.setGridOption('quickFilterText', value);
  };

  const handleClearSearch = () => {
    setGridSearchTerm('');
    gridApi?.setGridOption('quickFilterText', '');
    setSearchTerm?.('');
  };

  const onGridReady = useCallback((params: { api: GridApi<ParticipantRecord> }) => {
    setGridApi(params.api);
    if (gridSearchTerm) {
      params.api.setGridOption('quickFilterText', gridSearchTerm);
    }
  }, [gridSearchTerm]);

  const availableStudyList = useMemo(() => {
    const list = new Set<string>();
    if (Array.isArray(studies)) {
      studies.forEach((s) => {
        const label = String(s?.name || s?.shortName || s?.title || '').trim();
        if (label) list.add(label);
      });
    }
    const source = allParticipants.length > 0 ? allParticipants : participants;
    source.forEach((p) => {
      if (Array.isArray(p.studies)) {
        p.studies.forEach((s) => {
          if (s && s.name) list.add(s.name);
        });
      }
    });
    return Array.from(list).sort();
  }, [allParticipants, participants, studies]);

  const assignableStudyOptions = useMemo(() => {
    const activeStudies: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();
    if (Array.isArray(studies) && studies.length > 0) {
      studies.forEach((s) => {
        const isArchived = Boolean(s?.archived || String(s?.status || '').toUpperCase() === 'ARCHIVED');
        if (isArchived) return;
        const label = String(s?.name || s?.shortName || s?.title || '').trim();
        if (!label) return;
        const val = String(s?.id ?? s?.studyId ?? label).trim();
        if (val && !seen.has(val)) {
          seen.add(val);
          activeStudies.push({ value: val, label });
        }
      });
      return activeStudies.sort((a, b) => a.label.localeCompare(b.label));
    }
    return availableStudyList.map((name) => ({ value: name, label: name }));
  }, [studies, availableStudyList]);

  const filteredStudyOptions = useMemo(() => {
    if (!filterSearchQuery.trim()) return availableStudyList;
    return availableStudyList.filter((name) =>
      name.toLowerCase().includes(filterSearchQuery.toLowerCase())
    );
  }, [availableStudyList, filterSearchQuery]);

  const handleToggleStudy = (studyName: string) => {
    if (!setSelectedStudies) return;
    setSelectedStudies((prev) => {
      if (prev.includes(studyName)) {
        return prev.filter((item) => item !== studyName);
      } else {
        return [...prev, studyName];
      }
    });
  };

  const handleSelectAll = () => {
    if (setSelectedStudies) setSelectedStudies([...availableStudyList]);
  };

  const handleClearAll = () => {
    if (setSelectedStudies) setSelectedStudies([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !studyFilterButtonRef.current?.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const closeExportMenu = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeExportMenu);
    return () => document.removeEventListener('mousedown', closeExportMenu);
  }, []);

  const StudiesFilterHeader = () => {
    return (
      <div className="flex items-center justify-between w-full pr-1 relative">
        <span className="font-semibold text-[#334155]">Studies</span>
        <button
          ref={studyFilterButtonRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (isDropdownOpen) {
              setIsDropdownOpen(false);
              return;
            }
            const bounds = e.currentTarget.getBoundingClientRect();
            const popoverWidth = 288;
            const popoverHeight = Math.min(480, window.innerHeight - 16);
            const left = Math.max(8, Math.min(bounds.right - popoverWidth, window.innerWidth - popoverWidth - 8));
            const top = bounds.bottom + popoverHeight + 8 <= window.innerHeight
              ? bounds.bottom + 8
              : Math.max(8, bounds.top - popoverHeight - 8);
            setFilterPopoverPosition({ position: 'fixed', left, top, margin: 0 });
            setIsDropdownOpen(true);
          }}
          data-tooltip="Click to filter by checkbox"
          aria-label="Filter studies by checkbox"
          className={`p-1 rounded cursor-pointer transition-colors flex items-center gap-1 custom-tooltip-btn ${
            selectedStudies.length > 0
              ? 'bg-[#1976d2] text-white shadow-2xs'
              : 'text-gray-500 hover:text-[#1976d2] hover:bg-gray-100'
          }`}
        >
          <FilterIcon className="w-3.5 h-3.5 stroke-[2.2]" />
          {selectedStudies.length > 0 && (
            <span className="text-[10px] font-bold px-1 bg-white text-[#1976d2] rounded-full">
              {selectedStudies.length}
            </span>
          )}
        </button>
      </div>
    );
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: 'Select',
      field: 'select',
      width: 72,
      minWidth: 68,
      maxWidth: 76,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: CheckboxCellRenderer,
      cellClass: 'p-0 flex items-center justify-center',
      getQuickFilterText: () => '',
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 200,
      minWidth: 160,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellClass: 'flex items-center font-normal text-xs text-gray-900',
    },
    {
      headerComponent: StudiesFilterHeader,
      field: 'studies',
      flex: 2,
      minWidth: 260,
      sortable: false,
      filter: false,
      autoHeight: true,
      cellRenderer: StudiesCellRenderer,
      cellClass: 'flex items-center',
      getQuickFilterText: (params) => {
        if (!params.value || !Array.isArray(params.value)) return '';
        return params.value.map((s: StudyItem) => s?.name || '').join(' ');
      },
    },
    {
      headerName: 'Sex/Gender',
      field: 'gender',
      width: 140,
      minWidth: 130,
      sortable: true,
      filter: true,
      cellRenderer: DefaultTextRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Age',
      field: 'age',
      width: 130,
      minWidth: 100,
      sortable: true,
      filter: true,
      cellRenderer: AgeCellRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Last Contact',
      field: 'lastContact',
      width: 150,
      minWidth: 125,
      sortable: true,
      filter: 'agDateColumnFilter',
      cellRenderer: DefaultTextRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Actions',
      field: 'actions',
      width: 96,
      minWidth: 88,
      maxWidth: 100,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ParticipantActionsRenderer,
      cellClass: 'p-0 flex items-center justify-center',
      getQuickFilterText: () => '',
    }
  ], [selectedStudies]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    suppressMovable: false,
  }), []);

  const onSelectionChanged = useCallback(() => {
    if (!gridApi) return;
    const selectedRows = gridApi.getSelectedRows();
    setSelectedParticipants(selectedRows);
    if (selectedRows && selectedRows.length > 0) {
      onSelectParticipant?.(selectedRows[0]);
    }
  }, [gridApi, onSelectParticipant]);

  const handleBulkAction = () => {
    if (!studyToAssign || selectedParticipants.length === 0) return;
    onAssignStudyToSelected?.(selectedParticipants.map((participant) => participant.id), studyToAssign);
    gridApi?.deselectAll();
    setStudyToAssign('');
  };

  const handleBulkDelete = () => {
    if (selectedParticipants.length === 0) return;
    onDeleteSelected?.(selectedParticipants.map((participant) => participant.id));
  };

  const getExportRows = useCallback(() => {
    const rows: ParticipantRecord[] = [];
    if (gridApi) {
      gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) rows.push(node.data);
      });
      return rows;
    }
    return participants;
  }, [gridApi, participants]);

  const exportFileName = `participants-${new Date().toISOString().slice(0, 10)}`;
  const exportFields = useMemo(() => ([
    { key: 'globalId', label: 'Global ID' },
    { key: 'firstName', label: 'First name' },
    { key: 'middleName', label: 'Middle name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'gender', label: 'Sex' },
    { key: 'age', label: 'Age' },
    { key: 'demographics.dob', label: 'Birthday' },
    { key: 'demographics.race', label: 'Race' },
    { key: 'demographics.ethnicity', label: 'Ethnicity' },
    { key: 'contactForFutureStudies', label: 'Contact for future studies' },
    { key: 'familyId', label: 'Family ID' },
    { key: 'tags', label: 'Tags' },
    { key: 'dateCreated', label: 'Date created' },
    { key: 'phone', label: 'Phone' },
    { key: 'contactMethods.primaryEmail', label: 'Email' },
    { key: 'contactMethods.address', label: 'Address' },
    { key: 'section.comments', label: 'Comments Log' },
    { key: 'section.contacts', label: 'Participant Contacts' },
    { key: 'section.contactLogs', label: 'Contact Log' },
    { key: 'section.emailLogs', label: 'Email Log' },
    { key: 'section.consentLogs', label: 'Consent Log' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'zipcode', label: 'Zip code' },
    ...globalVariables.map((variable) => ({ key: `variables.${variable.id}`, label: variable.name })),
  ]), [globalVariables]);
  const participantExportFields = useMemo(() => exportFields.filter((field) => !field.key.startsWith('variables.') && !field.key.startsWith('section.')), [exportFields]);
  const globalVariableExportFields = useMemo(() => exportFields.filter((field) => field.key.startsWith('variables.')), [exportFields]);
  const globalActivityExportFields = useMemo(() => exportFields.filter((field) => field.key.startsWith('section.')), [exportFields]);
  const timezoneOptions = useMemo(() => {
    const intlWithSupportedValues = Intl as any;
    const values: string[] = typeof intlWithSupportedValues.supportedValuesOf === 'function'
      ? intlWithSupportedValues.supportedValuesOf('timeZone')
      : ['UTC'];
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return [...new Set([...values, 'UTC', ...(browserTimezone ? [browserTimezone] : [])])]
      .sort((a, b) => a.localeCompare(b))
      .map((timezone) => ({ value: timezone, label: timezone }));
  }, []);
  const isTimezoneValid = useMemo(() => {
    try { new Intl.DateTimeFormat('en-US', { timeZone: exportTimezone }); return true; }
    catch { return false; }
  }, [exportTimezone]);
  const toggleExportField = (key: string) => setSelectedExportFields((fields) => fields.includes(key) ? fields.filter((field) => field !== key) : [...fields, key]);
  const getExportValue = (participant: ParticipantRecord, key: string) => {
    if (key.startsWith('variables.')) return participant.variables?.find((variable) => variable.id === key.slice(10) || variable.name === globalVariables.find((item) => `variables.${item.id}` === key)?.name)?.value ?? '';
    const value = key.split('.').reduce<any>((current, part) => current?.[part], participant);
    if (key === 'tags' && Array.isArray(value)) return value.join('; ');
    return value == null ? '' : String(value);
  };
  const beginExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setSelectedExportFields([]);
    setExportFormat(format);
    setIsExportDialogOpen(true);
    setIsExportMenuOpen(false);
  };
  const runSelectedExport = async () => {
    if (!selectedExportFields.length || !isTimezoneValid || isExporting) return;
    setIsExporting(true);
    try {
      const selectedFieldKeys = exportFields.filter((field) => selectedExportFields.includes(field.key)).map((field) => field.key);
      const serverCsv = onExportServerCsv ? await onExportServerCsv(selectedFieldKeys, exportTimezone) : null;
      if (onExportServerCsv && !serverCsv) return;
      const columns = exportFields.filter((field) => selectedExportFields.includes(field.key));
      const rows = serverCsv ? parseCsv(await serverCsv.text()).slice(1) : getExportRows().map((participant) => columns.map((field) => getExportValue(participant, field.key)));
      if (exportFormat === 'csv') {
        const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
        const csv = [columns.map((field) => quote(field.label)).join(','), ...rows.map((record) => columns.map((_, index) => quote(record[index] ?? '')).join(','))].join('\r\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${exportFileName}.csv`; link.click(); URL.revokeObjectURL(url);
      } else if (exportFormat === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Registry', { views: [{ state: 'frozen', ySplit: 1 }] });
        sheet.columns = columns.map((field) => ({ header: field.label, key: field.key, width: Math.max(16, Math.min(field.label.length + 4, 32)) }));
        rows.forEach((record) => sheet.addRow(Object.fromEntries(columns.map((field, index) => [field.key, record[index] ?? '']))));
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a'); link.href = url; link.download = `${exportFileName}.xlsx`; link.click(); URL.revokeObjectURL(url);
      } else {
        const document = new jsPDF({ orientation: 'landscape' });
        document.text('Participant Registry', 14, 16);
        autoTable(document, { startY: 24, head: [columns.map((field) => field.label)], body: rows.map((record) => columns.map((_, index) => record[index] ?? '')), styles: { fontSize: 7 }, horizontalPageBreak: true });
        document.save(`${exportFileName}.pdf`);
      }
      setIsExportDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create the registry export.');
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <section className="card participant-grid-card">
      <div className="card-header data-grid-toolbar">
        <div className="data-grid-toolbar__heading flex items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <h3 className="sub-heading text-lg font-semibold text-gray-800 flex items-center gap-1.5 mb-0 whitespace-nowrap" id="registry-table-heading">
              <span>{duplicatesOnly ? 'Potential Duplicate Participants' : 'All Participants'}</span>
              <span className="text-gray-500 font-normal">({totalCount ?? participants.length})</span>
            </h3>
            <button
              id="bulk-actions-toggle"
              type="button"
              className="bulk-action-icon p-1 text-gray-500 hover:text-gray-800 rounded transition-colors custom-tooltip-btn"
              data-tooltip="Bulk actions"
              aria-label="Bulk actions"
            >
              <List size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="data-grid-toolbar__search">
            <input
              type="text"
              value={gridSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search participants..."
              aria-label="Search participants"
              className="form-input"
            />
            {gridSearchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="btn btn-ghost btn-sm custom-tooltip-btn"
                data-tooltip="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
            <SearchIcon size={14} aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={onAddParticipant}
            className="btn btn-primary participant-grid__add-button custom-tooltip-btn"
            data-tooltip="Add Participant"
          >
            <span className="participant-grid__add-icon"><UserPlus size={17} strokeWidth={2.4} /></span>
            <span>Add Participant</span>
          </button>
        </div>

        <div className="data-grid-toolbar__actions">
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-secondary custom-tooltip-btn"
            data-tooltip="Refresh"
          >
            Refresh
          </button>

          <div className="data-grid-export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="data-grid-export-trigger custom-tooltip-btn"
              data-tooltip="Export"
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              onClick={() => setIsExportMenuOpen((open) => !open)}
            >
              <Download size={16} /> Export <ChevronDown size={15} />
            </button>
            {isExportMenuOpen && (
              <div className="data-grid-export-menu" role="menu" aria-label="Choose export format">
                <button type="button" role="menuitem" onClick={() => beginExport('csv')}>
                  <Download size={15} /><span>CSV</span><small>Comma-separated values</small>
                </button>
                <button type="button" role="menuitem" onClick={() => beginExport('xlsx')}>
                  <FileSpreadsheet size={15} /><span>Excel</span><small>Excel workbook (.xlsx)</small>
                </button>
                <button type="button" role="menuitem" onClick={() => beginExport('pdf')}>
                  <FileText size={15} /><span>PDF</span><small>Portable document</small>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleDuplicates}
            id="potential-duplicates-toggle"
            data-tooltip="Display only potential participant duplicates"
            aria-label="Display only potential participant duplicates"
            aria-pressed={duplicatesOnly}
            style={duplicatesOnly ? { backgroundColor: '#0d3b66', color: '#ffffff', borderColor: '#0d3b66' } : {}}
            className={`btn participant-dupes custom-tooltip-btn tooltip-align-right ${duplicatesOnly ? 'btn-info bg-[#0d3b66] text-white hover:bg-[#0a2f52] border-[#0d3b66]' : 'btn-secondary text-gray-700 hover:bg-gray-100'}`}
          >
            <Users size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={isExportDialogOpen}
        onClose={() => { if (!isExporting) setIsExportDialogOpen(false); }}
        title="Export Registry Results"
        size="wide"
        className="registry-export-modal"
        footer={<>
          <span className="mr-auto text-sm">Export format: <strong>{exportFormat.toUpperCase()}</strong></span>
          <button type="button" className="btn btn-secondary" disabled={isExporting} onClick={() => setIsExportDialogOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!selectedExportFields.length || !isTimezoneValid || isExporting} onClick={() => void runSelectedExport()}>{isExporting ? 'Preparing export...' : `Download ${exportFormat.toUpperCase()}`}</button>
        </>}
      >
        <p className="mb-4">Choose the global participant details to include in your {exportFormat.toUpperCase()} file.</p>
        <div className="mb-4 grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
          <label htmlFor="registry-export-timezone">Timezone</label>
          <select id="registry-export-timezone" className="form-select" value={exportTimezone} onChange={(event) => setExportTimezone(event.target.value)} disabled={isExporting}>
            {timezoneOptions.map((timezone) => <option key={timezone.value} value={timezone.value}>{timezone.label}</option>)}
          </select>
        </div>
        <div className="badge-warning mb-4 px-3 py-2" role="note">Dates will be converted to this timezone. Dates entered in another timezone may appear one day off.</div>
        <label className="mb-3 flex w-fit cursor-pointer items-center gap-2 font-semibold"><input type="checkbox" checked={exportFields.length > 0 && selectedExportFields.length === exportFields.length} onChange={(event) => setSelectedExportFields(event.target.checked ? exportFields.map((field) => field.key) : [])} disabled={isExporting} />Select all fields <span className="font-normal">({selectedExportFields.length} selected)</span></label>
        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="participant-export-fields-heading">
            <h3 id="participant-export-fields-heading" className="mb-2 border-b pb-2 font-semibold">Participant details</h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {participantExportFields.map((field) => <label key={field.key} className="flex min-w-0 cursor-pointer items-start gap-2 rounded px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={selectedExportFields.includes(field.key)} onChange={() => toggleExportField(field.key)} disabled={isExporting} /><span className="break-words">{field.label}</span></label>)}
            </div>
          </section>
          {globalActivityExportFields.length > 0 && <section aria-labelledby="global-activity-export-fields-heading">
            <h3 id="global-activity-export-fields-heading" className="mb-2 border-b pb-2 font-semibold">Global activity and contact history</h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {globalActivityExportFields.map((field) => <label key={field.key} className="flex min-w-0 cursor-pointer items-start gap-2 rounded px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={selectedExportFields.includes(field.key)} onChange={() => toggleExportField(field.key)} disabled={isExporting} /><span className="break-words">{field.label}</span></label>)}
            </div>
          </section>}
          {globalVariableExportFields.length > 0 && <section aria-labelledby="global-variable-export-fields-heading">
            <h3 id="global-variable-export-fields-heading" className="mb-2 border-b pb-2 font-semibold">Global variables</h3>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {globalVariableExportFields.map((field) => <label key={field.key} className="flex min-w-0 cursor-pointer items-start gap-2 rounded px-2 py-2 hover:bg-slate-50"><input type="checkbox" checked={selectedExportFields.includes(field.key)} onChange={() => toggleExportField(field.key)} disabled={isExporting} /><span className="break-words">{field.label}</span></label>)}
            </div>
          </section>}
        </div>
        <p className="mt-4 text-sm text-slate-500">Consent history includes records for each listed participant across their studies.</p>
      </Modal>

      {selectedStudies.length > 0 && (
        <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-blue-900 text-[11px] flex items-center gap-1">
              <FilterIcon className="w-3 h-3 text-blue-600" /> Active Filters:
            </span>
            {selectedStudies.map((study) => (
              <span
                key={study}
                className="bg-white text-blue-700 border border-blue-300 rounded px-2 py-0.5 text-xs flex items-center gap-1 shadow-2xs font-medium"
              >
                {study}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                  onClick={() => handleToggleStudy(study)}
                />
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-blue-700 hover:text-red-600 text-xs font-medium underline cursor-pointer custom-tooltip-btn"
            data-tooltip="Clear all selected studies"
          >
            Clear all ({selectedStudies.length})
          </button>
        </div>
      )}

      {selectedParticipants.length > 0 && (
        <div className="participant-grid__selection-toolbar" role="region" aria-label="Selected participants actions">
          <label className="participant-grid__select-all">
            <input
              type="checkbox"
              checked={participants.length > 0 && selectedParticipants.length === participants.length}
              onChange={(event) => {
                if (!gridApi) return;
                if (event.target.checked) gridApi.selectAll();
                else gridApi.deselectAll();
              }}
            />
            <span>Select All</span>
          </label>
          <span className="participant-grid__selected-count">
            {selectedParticipants.length} selected
          </span>
          <button
            type="button"
            className="participant-grid__apply-action participant-grid__apply-action--danger custom-tooltip-btn"
            data-tooltip={`Delete ${selectedParticipants.length} selected participants`}
            onClick={handleBulkDelete}
            aria-label={`Delete ${selectedParticipants.length} selected participants`}
          >
            Delete selected
          </button>
          <select
            value={studyToAssign}
            onChange={(event) => setStudyToAssign(event.target.value)}
            aria-label="Choose a study for selected participants"
          >
            <option value="">--- Choose Item ---</option>
            {assignableStudyOptions.map((study) => (
              <option key={study.value} value={study.value}>
                Add to {study.label}
              </option>
            ))}

          </select>
          <button
            type="button"
            className="participant-grid__apply-action custom-tooltip-btn"
            data-tooltip="Add selected participants to study"
            onClick={handleBulkAction}
            disabled={!studyToAssign}
          >
            Apply
          </button>
        </div>
      )}

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          style={filterPopoverPosition}
          className="participant-grid__study-filter-popover bg-white rounded-lg shadow-2xl border border-gray-200 p-3 flex flex-col gap-2.5 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800">
              <FilterIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter by Checkbox</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              aria-label="Close study filter"
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              placeholder="Search items..."
              aria-label="Search study filter items"
              className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-gray-50"
            />
            {filterSearchQuery && (
              <X
                className="w-3 h-3 text-gray-400 absolute right-2 top-2 cursor-pointer"
                onClick={() => setFilterSearchQuery('')}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] px-0.5 text-blue-600 font-medium">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:underline cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-gray-500 hover:text-red-500 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1 border border-gray-100 rounded p-1">
            {filteredStudyOptions.length > 0 ? (
              filteredStudyOptions.map((study) => {
                const isChecked = selectedStudies.includes(study);
                return (
                  <label
                    key={study}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                      isChecked ? 'bg-blue-50/80 text-blue-900 font-medium' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleStudy(study)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                    <span className="truncate" title={study}>{study}</span>
                  </label>
                );
              })
            ) : (
              <span className="text-xs text-gray-400 p-2 text-center">No items found</span>
            )}
          </div>

          <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>{selectedStudies.length} checked</span>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(false)}
              className="bg-[#1976d2] hover:bg-[#1565c0] text-white px-3 py-1 rounded text-xs font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <DataGrid
          loading={isLoading}
          rowData={participants}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={gridSearchTerm}
          context={{ onOpenDetail, onDeleteParticipant, onNavigateToStudy, archivedStudyKeys }}
          onCellClicked={(params) => {
            if (params.column?.getColId() === 'expand' && params.data) {
              onOpenDetail?.(params.data);
            } else if (params.column?.getColId() === 'deleteAction' && params.data) {
              onDeleteParticipant?.(params.data);
            }
          }}
          onRowClicked={(event) => {
            const target = event.event?.target as HTMLElement | null;
            // Row action buttons have their own behavior and must not open details.
            if (target?.closest('.participant-grid__row-actions') || target?.closest('.participant-grid__study-link')) return;
            // The Select cell is selection-only. A click anywhere in that column
            // must never bubble into the row detail interaction.
            if (
              target?.closest('input[type="checkbox"]') ||
              target?.closest('.ag-cell[col-id="select"]')
            ) return;
            if (event.data) onOpenDetail?.(event.data);
          }}
          rowSelection={{ mode: 'multiRow', checkboxes: false, headerCheckbox: false }}
          onSelectionChanged={onSelectionChanged}
          onGridReady={onGridReady}
          rowHeight={64}
          headerHeight={44}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          animateRows={true}
          suppressCellFocus={true}
        />
    </section>
  );
};

export default ParticipantGrid;
