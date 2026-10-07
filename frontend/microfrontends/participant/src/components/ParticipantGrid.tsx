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
import { ChevronDown, FileSpreadsheet, FileText, UserPlus } from 'lucide-react';
import { ParticipantRecord, StudyItem } from '../types/participant';

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

const StudiesCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const studies: StudyItem[] = params.value;
  if (!studies || !Array.isArray(studies) || studies.length === 0) {
    return <span className="text-gray-400">...</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 leading-relaxed py-1">
      {studies.map((item, idx) => (
        <span key={idx} className="text-xs">
          <span className="text-gray-700">{item.name}</span>
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
        className="participant-grid__row-action"
        title="View details"
        aria-label="View participant details"
      >
        <Eye size={15} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); deleteParticipant(); }}
        className="participant-grid__row-action participant-grid__row-action--danger"
        title="Delete participant"
        aria-label="Delete participant"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
};

const DefaultTextRenderer: React.FC<ICellRendererParams> = (params) => {
  const val = params.value;
  if (!val || val === '...') {
    return <span className="text-gray-600 font-normal">...</span>;
  }
  return <span className="text-gray-800 text-xs font-normal">{val}</span>;
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
  onAssignStudyToSelected?: (participantIds: string[], studyName: string) => void;
  totalCount?: number;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  selectedStudies?: string[];
  setSelectedStudies?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({
  participants = [],
  allParticipants = [],
  onSelectParticipant,
  onRefresh,
  onAddParticipant,
  onOpenDetail,
  onDeleteParticipant,
  onAssignStudyToSelected,
  searchTerm = '',
  setSearchTerm,
  selectedStudies = [],
  setSelectedStudies,
}) => {
  const [gridApi, setGridApi] = useState<GridApi<ParticipantRecord> | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<ParticipantRecord[]>([]);
  const [studyToAssign, setStudyToAssign] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const studyFilterButtonRef = useRef<HTMLButtonElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const availableStudyList = useMemo(() => {
    const list = new Set<string>();
    const source = allParticipants.length > 0 ? allParticipants : participants;
    source.forEach((p) => {
      if (Array.isArray(p.studies)) {
        p.studies.forEach((s) => {
          if (s && s.name) list.add(s.name);
        });
      }
    });
    return Array.from(list).sort();
  }, [allParticipants, participants]);

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
            setIsDropdownOpen((prev) => !prev);
          }}
          title="Click to filter by checkbox"
          className={`p-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${
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
      cellRenderer: DefaultTextRenderer,
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
  const exportCsv = () => {
    gridApi?.exportDataAsCsv({
      fileName: `${exportFileName}.csv`,
      columnKeys: ['name', 'studies', 'gender', 'age', 'lastContact'],
      processCellCallback: (params) => {
        if (params.column.getColId() === 'studies' && Array.isArray(params.value)) {
          return params.value.map((study: StudyItem) => study.name).join(', ');
        }
        return params.value ?? '';
      },
    });
    setIsExportMenuOpen(false);
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Participants', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = [
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Studies', key: 'studies', width: 48 },
      { header: 'Sex/Gender', key: 'gender', width: 18 },
      { header: 'Age', key: 'age', width: 12 },
      { header: 'Last Contact', key: 'lastContact', width: 24 },
    ];
    getExportRows().forEach((participant) => sheet.addRow({
      name: participant.name,
      studies: participant.studies?.map((study) => study.name).join(', ') || '',
      gender: participant.gender || '',
      age: participant.age || '',
      lastContact: participant.lastContact || '',
    }));
    sheet.autoFilter = { from: 'A1', to: `E${Math.max(1, sheet.rowCount)}` };
    sheet.getRow(1).height = 25;
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle' };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsExportMenuOpen(false);
  };

  const exportPdf = () => {
    const rows = getExportRows();
    const document = new jsPDF({ orientation: 'landscape' });
    document.setFontSize(16);
    document.setTextColor('#123A5A');
    document.text('Participant Registry', 14, 16);
    autoTable(document, {
      startY: 24,
      head: [['Name', 'Studies', 'Sex/Gender', 'Age', 'Last Contact']],
      body: rows.map((participant) => [
        participant.name || '',
        participant.studies?.map((study) => study.name).join(', ') || '',
        participant.gender || '',
        String(participant.age || ''),
        participant.lastContact || '',
      ]),
      styles: { fontSize: 8, cellPadding: 3, textColor: [36, 68, 91], lineColor: [220, 231, 238], lineWidth: 0.1 },
      headStyles: { fillColor: [18, 58, 90], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 247, 251] },
      margin: { left: 14, right: 14 },
    });
    document.save(`${exportFileName}.pdf`);
    setIsExportMenuOpen(false);
  };

  return (
    <section className="card">
      <div className="card-header data-grid-toolbar">
        <div className="data-grid-toolbar__heading">
          <div className="data-grid-toolbar__search">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              placeholder="Search participants..."
              className="form-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm?.('')}
                className="btn btn-ghost btn-sm"
                title="Clear"
              >
                <X size={14} />
              </button>
            )}
            <SearchIcon size={14} aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={onAddParticipant}
            className="btn btn-primary participant-grid__add-button"
          >
            <span className="participant-grid__add-icon"><UserPlus size={17} strokeWidth={2.4} /></span>
            <span>Add Participant</span>
          </button>
        </div>

        <div className="data-grid-toolbar__actions">
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-secondary"
          >
            Refresh
          </button>

          <div className="data-grid-export-menu-wrap" ref={exportMenuRef}>
            <button
              type="button"
              className="data-grid-export-trigger"
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              onClick={() => setIsExportMenuOpen((open) => !open)}
            >
              <Download size={16} /> Export <ChevronDown size={15} />
            </button>
            {isExportMenuOpen && (
              <div className="data-grid-export-menu" role="menu" aria-label="Choose export format">
                <button type="button" role="menuitem" onClick={exportCsv}>
                  <Download size={15} /><span>CSV</span><small>Comma-separated values</small>
                </button>
                <button type="button" role="menuitem" onClick={() => void exportExcel()}>
                  <FileSpreadsheet size={15} /><span>Excel</span><small>Excel workbook (.xlsx)</small>
                </button>
                <button type="button" role="menuitem" onClick={exportPdf}>
                  <FileText size={15} /><span>PDF</span><small>Portable document</small>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            title="All Users"
            className="btn btn-secondary"
          >
            <Users size={16} />
          </button>
        </div>
      </div>

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
            className="text-blue-700 hover:text-red-600 text-xs font-medium underline cursor-pointer"
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
          <select
            value={studyToAssign}
            onChange={(event) => setStudyToAssign(event.target.value)}
            aria-label="Choose a study for selected participants"
          >
            <option value="">Choose Item</option>
            {availableStudyList.map((study) => <option key={study} value={study}>{study}</option>)}
          </select>
          <button
            type="button"
            className="participant-grid__apply-action"
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
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={filterSearchQuery}
              onChange={(e) => setFilterSearchQuery(e.target.value)}
              placeholder="Search items..."
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
          rowData={participants}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          context={{ onOpenDetail, onDeleteParticipant }}
          onCellClicked={(params) => {
            if (params.column?.getColId() === 'expand' && params.data) {
              onOpenDetail?.(params.data);
            } else if (params.column?.getColId() === 'deleteAction' && params.data) {
              onDeleteParticipant?.(params.data);
            }
          }}
          onRowClicked={(event) => {
            const target = event.event?.target as HTMLElement | null;
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
          onGridReady={(event) => setGridApi(event.api)}
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
