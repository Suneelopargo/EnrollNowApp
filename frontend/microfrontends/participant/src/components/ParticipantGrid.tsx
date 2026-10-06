// frontend/microfrontends/participant/src/components/ParticipantGrid.tsx - AG-Grid Participant Table & Actions Bar
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, ColDef, ICellRendererParams } from 'ag-grid-community';
import { 
  List, 
  Download, 
  Users, 
  Play, 
  Search as SearchIcon, 
  Filter as FilterIcon, 
  X, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { ParticipantRecord, StudyItem } from '../types/participant';

ModuleRegistry.registerModules([AllCommunityModule]);

const SerialNumberRenderer: React.FC<ICellRendererParams> = (params) => {
  if (!params.node || params.node.rowIndex == null) return null;
  return (
    <span className="font-medium text-xs text-gray-700">
      {params.node.rowIndex + 1}
    </span>
  );
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
          {item.isLink ? (
            <a
              href={`#study-${encodeURIComponent(item.name)}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="text-[#1976d2] hover:underline font-normal cursor-pointer"
            >
              {item.name}
            </a>
          ) : (
            <span className="text-gray-600">{item.name}</span>
          )}
          {idx < studies.length - 1 && <span className="text-gray-500">, </span>}
        </span>
      ))}
    </div>
  );
};

const ExpandCollapseRenderer: React.FC<ICellRendererParams> = (params) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (params.data) {
      params.context?.onOpenDetail?.(params.data);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="w-full h-full bg-[#8eaee8] hover:bg-[#1976d2] flex items-center justify-center cursor-pointer transition-colors group"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#8eaee8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      title="Click to view participant details"
    >
      <Play
        size={14}
        fill="#ffffff"
        color="#ffffff"
        style={{ fill: '#ffffff', color: '#ffffff', transform: 'translateX(1px)' }}
        className="fill-white text-white translate-x-[1px] group-hover:scale-110 transition-transform"
      />
    </div>
  );
};

const DeleteCellRenderer: React.FC<ICellRendererParams> = (params) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (params.data) {
      params.context?.onDeleteParticipant?.(params.data);
    }
  };

  return (
    <div
      className="w-full h-full bg-red-50/50 hover:bg-red-100/60 flex items-center justify-center cursor-pointer transition-colors"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(254, 242, 242, 0.5)',
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-7 h-7 rounded-md bg-[#d9534f] hover:bg-[#c9302c] text-white flex items-center justify-center transition-all shadow-2xs hover:scale-105 cursor-pointer"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: '#d9534f',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
        title="Delete Participant"
      >
        <Trash2 size={14} color="#ffffff" />
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
  searchTerm = '',
  setSearchTerm,
  selectedStudies = [],
  setSelectedStudies,
}) => {
  const gridRef = useRef<AgGridReact>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const StudiesFilterHeader = () => {
    return (
      <div className="flex items-center justify-between w-full pr-1 relative">
        <span className="font-semibold text-[#334155]">Studies</span>
        <button
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
      headerName: 'S.No',
      field: 'serialNumber',
      width: 65,
      minWidth: 55,
      maxWidth: 75,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: SerialNumberRenderer,
      cellClass: 'p-0 flex items-center justify-center',
    },
    {
      headerName: 'Select',
      field: 'select',
      width: 70,
      minWidth: 60,
      maxWidth: 80,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: CheckboxCellRenderer,
      cellClass: 'p-0 flex items-center justify-center',
    },
    {
      headerName: 'Name',
      field: 'name',
      width: 220,
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
      width: 120,
      minWidth: 90,
      sortable: true,
      filter: true,
      cellRenderer: DefaultTextRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Age',
      field: 'age',
      width: 150,
      minWidth: 100,
      sortable: true,
      filter: true,
      cellRenderer: DefaultTextRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Last Contact',
      field: 'lastContact',
      width: 180,
      minWidth: 140,
      sortable: true,
      filter: 'agDateColumnFilter',
      cellRenderer: DefaultTextRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'Expand/Collapse',
      field: 'expand',
      width: 130,
      minWidth: 110,
      maxWidth: 150,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ExpandCollapseRenderer,
      cellClass: 'p-0 flex items-stretch justify-stretch overflow-hidden',
    },
    {
      headerName: 'Delete',
      field: 'deleteAction',
      width: 80,
      minWidth: 70,
      maxWidth: 95,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: DeleteCellRenderer,
      cellClass: 'p-0 flex items-center justify-center',
    }
  ], [selectedStudies]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    suppressMovable: false,
  }), []);

  const onSelectionChanged = useCallback(() => {
    if (!gridRef.current || !gridRef.current.api) return;
    const selectedRows = gridRef.current.api.getSelectedRows();
    if (selectedRows && selectedRows.length > 0) {
      onSelectParticipant?.(selectedRows[0]);
    }
  }, [onSelectParticipant]);

  const handleExport = useCallback(() => {
    if (gridRef.current && gridRef.current.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `participants_report_${new Date().toISOString().slice(0, 10)}.csv`
      });
    }
  }, []);

  return (
    <section
      className="w-full bg-white border border-gray-200 rounded-lg flex flex-col shadow-sm relative registry-grid-card"
      style={{
        width: '100%',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="px-5 py-3.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white registry-grid-header"
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          className="flex items-center flex-wrap gap-3 flex-1 min-w-[300px]"
          style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: 1, minWidth: '300px' }}
        >
          <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2
              className="text-xl font-semibold text-gray-900 tracking-tight m-0"
              style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}
            >
              All Participants({participants.length})
            </h2>
            <button
              type="button"
              title="View Options"
              className="text-gray-500 hover:text-gray-800 p-1 rounded transition-colors"
              style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#6b7280' }}
            >
              <List className="w-5 h-5 cursor-pointer" />
            </button>
          </div>

          <div
            className="flex items-center rounded-md border border-gray-300 overflow-hidden shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 w-full sm:w-56 md:w-64 bg-white search-input-group"
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              width: '250px',
            }}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              placeholder="Search participants..."
              className="flex-1 px-3 py-1.5 text-xs text-gray-800 outline-none placeholder-gray-400 bg-transparent search-input-field"
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '12px',
                color: '#1f2937',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm?.('')}
                className="text-gray-400 hover:text-gray-600 px-1.5 cursor-pointer"
                style={{ background: 'none', border: 'none', color: '#9ca3af', padding: '0 6px', cursor: 'pointer' }}
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div
              className="bg-[#1976d2] text-white px-2.5 py-1.5 flex items-center justify-center search-icon-btn"
              style={{
                backgroundColor: '#1976d2',
                color: '#ffffff',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
              }}
            >
              <SearchIcon size={14} color="#ffffff" strokeWidth={2.5} />
            </div>
          </div>

          <button
            type="button"
            onClick={onAddParticipant}
            className="bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-medium py-1.5 px-3.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap btn-add-participant"
            style={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} color="#ffffff" strokeWidth={3} />
            <span>Add Participant</span>
          </button>
        </div>

        <div className="flex items-center gap-2 header-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-medium py-1.5 px-3.5 rounded-md transition-colors cursor-pointer shadow-xs btn-refresh-grid"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="bg-[#1976d2] hover:bg-[#1565c0] text-white text-xs font-medium py-1.5 px-4 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs btn-export-grid"
            style={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Download size={14} color="#ffffff" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            title="All Users"
            className="bg-[#00274c] hover:bg-[#001f3f] text-white p-2 rounded-md transition-colors cursor-pointer shadow-xs btn-users-grid"
            style={{
              backgroundColor: '#00274c',
              color: '#ffffff',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={16} color="#ffffff" />
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

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-72 top-14 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 p-3 flex flex-col gap-2.5 animate-fade-in"
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

      <div
        className="w-full ag-theme-quartz-custom relative min-h-[500px]"
        style={{ width: '100%', height: '540px', minHeight: '520px' }}
      >
        <AgGridReact
          ref={gridRef}
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
          rowSelection={{ mode: 'multiRow', checkboxes: false, headerCheckbox: false }}
          onSelectionChanged={onSelectionChanged}
          rowHeight={64}
          headerHeight={44}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          animateRows={true}
          suppressCellFocus={true}
        />
      </div>
    </section>
  );
};

export default ParticipantGrid;
