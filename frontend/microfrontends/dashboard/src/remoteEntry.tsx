// frontend/microfrontends/dashboard/src/remoteEntry.tsx - Dashboard MFE Remote Entry
import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MfeContext } from '../../../shared/contracts';
import { PageHeader } from '../../../shared/design-system/components/PageHeader';
import { Card } from '../../../shared/design-system/components/Card';
import { DataTable } from '../../../shared/design-system/components/DataTable';
import { DataGrid, type ColDef, type GridApi } from '../../../shared/design-system/components/DataGrid';
import { StatusBadge } from '../../../shared/design-system/components/StatusBadge';
import {
  Users,
  Building,
  Activity,
  TrendingUp,
  CheckSquare,
  ArrowUpRight,
  Plus,
  FileText,
  AlertCircle,
  Search,
  Download,
  X,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { apiClient } from '../../../shared/api-client';

const SAMPLE_STUDIES = [
  { id: 'PROTO-2026-001', title: 'Phase III Novel Antihypertensive Efficacy Trial', phase: 'Phase III', status: 'ACTIVE', enrolled: 112, target: 150 },
  { id: 'PROTO-2026-002', title: 'Targeted Immunotherapy for Non-Small Cell Lung Cancer', phase: 'Phase II', status: 'ACTIVE', enrolled: 64, target: 80 },
  { id: 'PROTO-2026-003', title: 'Cognitive Biomarker Assessment in Early Stage Alzheimer', phase: 'Phase IIa', status: 'SCREENING', enrolled: 38, target: 100 },
];

interface DashboardPieSegment {
  key: string;
  label: string;
  value: number;
  color: string;
  colorIndex: number;
}

interface ExecutivePieChartProps {
  segments: DashboardPieSegment[];
  selectedKey?: string;
  centerValue: string;
  centerLabel: string;
  onSelect: (key: string) => void;
}

const PIE_COLORS = ['#087eb8', '#14a38b', '#f0a638', '#8256b5', '#dc6b73', '#70869a'];

function normalizeStudy(study: any) {
  return {
    ...study,
    id: study.id ?? study.studyId ?? study.protocolId ?? study.protocolNumber ?? 'Unknown protocol',
    title: study.title ?? study.studyTitle ?? 'Untitled study',
    phase: study.phase ?? study.studyPhase ?? 'Unspecified',
    status: study.status ?? 'OTHER',
    enrolled: Number(study.enrolled ?? study.enrolledParticipants ?? study.participantsEnrolled ?? 0),
    targetEnrollment: Number(study.targetEnrollment ?? study.targetParticipants ?? study.target ?? 0),
  };
}

function pieSlicePath(startAngle: number, endAngle: number): string {
  const radius = 46;
  const point = (angle: number) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return [50 + radius * Math.cos(radians), 50 + radius * Math.sin(radians)];
  };

  if (endAngle - startAngle >= 359.99) {
    return 'M 50 50 L 50 4 A 46 46 0 1 1 50 96 A 46 46 0 1 1 50 4 Z';
  }

  const [startX, startY] = point(startAngle);
  const [endX, endY] = point(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 50 50 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

const ExecutivePieChart: React.FC<ExecutivePieChartProps> = ({
  segments,
  selectedKey,
  centerValue,
  centerLabel,
  onSelect,
}) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let accumulated = 0;

  if (total <= 0) {
    return <div className="executive-pie-chart__empty">No chart data available</div>;
  }

  return (
    <svg className="executive-pie-chart" viewBox="0 0 100 100" role="group" aria-label="Interactive pie chart">
      {segments.filter((segment) => segment.value > 0).map((segment) => {
        const startAngle = (accumulated / total) * 360;
        accumulated += segment.value;
        const endAngle = (accumulated / total) * 360;
        const selectWithKeyboard = (event: React.KeyboardEvent<SVGPathElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(segment.key);
          }
        };

        return (
          <path
            key={segment.key}
            d={pieSlicePath(startAngle, endAngle)}
            fill={segment.color}
            className={selectedKey === segment.key ? 'executive-pie-chart__slice is-selected' : 'executive-pie-chart__slice'}
            role="button"
            tabIndex={0}
            aria-label={`${segment.label}: ${segment.value.toLocaleString()}`}
            aria-pressed={selectedKey === segment.key}
            onClick={() => onSelect(segment.key)}
            onKeyDown={selectWithKeyboard}
          >
            <title>{segment.label}: {segment.value.toLocaleString()}</title>
          </path>
        );
      })}
      <circle className="executive-pie-chart__center" cx="50" cy="50" r="27" />
      <text className="executive-pie-chart__center-value" x="50" y="48" textAnchor="middle">{centerValue}</text>
      <text className="executive-pie-chart__center-label" x="50" y="59" textAnchor="middle">{centerLabel}</text>
    </svg>
  );
};

export interface DashboardModuleProps {
  context: MfeContext;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({ context }) => {
  const [stats, setStats] = useState<any | null>(null);
  const [recentStudies, setRecentStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrilldown, setSelectedDrilldown] = useState<{ chart: 'status' | 'phase' | 'participants'; key: string } | null>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/api/v1/dashboard/overview');
        if (res.data?.data) {
          setStats(res.data.data);
          const overviewStudies = res.data.data.recentStudies || [];
          try {
            const studiesRes = await apiClient.get('/api/v1/studies');
            const allStudies = studiesRes.data?.data;
            if (Array.isArray(allStudies) && allStudies.length > 0) {
              const overviewById = new Map<string, ReturnType<typeof normalizeStudy>>();
              overviewStudies.map(normalizeStudy).forEach((study: any) => {
                [study.id, study.studyId, study.protocolNumber].forEach((id) => {
                  if (id !== undefined && id !== null) overviewById.set(String(id), study);
                });
              });
              setRecentStudies(allStudies.map((rawStudy: any) => {
                const study = normalizeStudy(rawStudy);
                const overviewStudy = [study.id, study.studyId, study.protocolNumber]
                  .map((id) => id === undefined || id === null ? undefined : overviewById.get(String(id)))
                  .find(Boolean);
                return normalizeStudy({
                  ...overviewStudy,
                  ...rawStudy,
                  enrolled: rawStudy.enrolled ?? rawStudy.enrolledParticipants ?? rawStudy.participantsEnrolled ?? overviewStudy?.enrolled,
                  targetEnrollment: rawStudy.targetEnrollment ?? rawStudy.targetParticipants ?? rawStudy.target ?? overviewStudy?.targetEnrollment,
                });
              }));
            } else {
              setRecentStudies(overviewStudies.map(normalizeStudy));
            }
          } catch {
            setRecentStudies(overviewStudies.map(normalizeStudy));
          }
        }
        try {
          const participantsRes = await apiClient.get('/api/v1/participants');
          setParticipants(Array.isArray(participantsRes.data?.data) ? participantsRes.data.data : []);
        } catch {
          setParticipants([]);
        }
      } catch (err: any) {
        setError('Clinical Operations metrics are currently unavailable from Dashboard Service.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!selectedDrilldown) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedDrilldown(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedDrilldown]);

  const openDrilldown = (chart: 'status' | 'phase' | 'participants', key: string) => {
    setQuickSearch('');
    setGridApi(null);
    setSelectedDrilldown({ chart, key });
  };

  const closeDrilldown = () => {
    setSelectedDrilldown(null);
    setGridApi(null);
    setQuickSearch('');
    setExportMenuOpen(false);
  };

  const dashboardStudies = recentStudies.length > 0 ? recentStudies : SAMPLE_STUDIES;
  const studyProgress = dashboardStudies.slice(0, 4).map((study) => {
    const enrolled = Math.max(0, Number(study.enrolled) || 0);
    const target = Math.max(0, Number(study.targetEnrollment ?? study.target) || 0);
    const progress = target > 0 ? Math.min(100, Math.round((enrolled / target) * 100)) : 0;

    return { ...study, enrolled, target, progress };
  });

  const statusSegments = Object.values(
    dashboardStudies.reduce<Record<string, DashboardPieSegment>>((groups, study, index) => {
      const key = String(study.status || 'OTHER').toUpperCase();
      if (!groups[key]) {
        groups[key] = {
          key,
          label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()),
          value: 0,
          color: PIE_COLORS[index % PIE_COLORS.length],
          colorIndex: index % PIE_COLORS.length,
        };
      }
      groups[key].value += 1;
      return groups;
    }, {})
  );

  const phaseSegments = Object.values(
    dashboardStudies.reduce<Record<string, DashboardPieSegment>>((groups, study, index) => {
      const key = String(study.phase || 'Unspecified');
      if (!groups[key]) {
        groups[key] = {
          key,
          label: key.replace(/_/g, ' ').toUpperCase(),
          value: 0,
          color: PIE_COLORS[index % PIE_COLORS.length],
          colorIndex: index % PIE_COLORS.length,
        };
      }
      groups[key].value += Math.max(0, Number(study.enrolled) || 0);
      return groups;
    }, {})
  );
  const activeStudyCount = statusSegments.find((segment) => segment.key === 'ACTIVE')?.value || 0;
  const screenedParticipants = Math.max(0, Number(stats?.totalParticipants) || 0);
  const enrolledParticipants = Math.max(0, Number(stats?.enrolledParticipants) || 0);
  const screeningParticipants = Math.max(0, Number(stats?.screeningParticipants) || 0);
  const participantDenominator = Math.max(screenedParticipants, enrolledParticipants, screeningParticipants, 1);
  const participantStages = [
    { key: 'screened', label: 'Total screened', value: screenedParticipants },
    { key: 'enrolled', label: 'Enrolled', value: enrolledParticipants },
    { key: 'screening', label: 'In screening', value: screeningParticipants },
  ];

  const drilldownSegment = selectedDrilldown
    ? selectedDrilldown.chart === 'participants'
      ? participantStages.find((segment) => segment.key === selectedDrilldown.key)
      : (selectedDrilldown.chart === 'status' ? statusSegments : phaseSegments)
          .find((segment) => segment.key === selectedDrilldown.key)
    : undefined;
  const isParticipantDrilldown = selectedDrilldown?.chart === 'participants';
  const participantDrilldownRows = selectedDrilldown?.chart === 'participants'
    ? participants.filter((participant) => {
        const status = String(participant.status || '').toUpperCase();
        if (selectedDrilldown.key === 'screened') return true;
        if (selectedDrilldown.key === 'screening') return status === 'SCREENING';
        return ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(status);
      })
    : [];
  const drilldownRows = isParticipantDrilldown
    ? participantDrilldownRows
    : selectedDrilldown
      ? dashboardStudies.filter((study) =>
          selectedDrilldown.chart === 'status'
            ? String(study.status || 'OTHER').toUpperCase() === selectedDrilldown.key
            : String(study.phase || 'Unspecified') === selectedDrilldown.key
        )
      : [];
  const studyDrilldownColumns: ColDef[] = [
    { field: 'id', headerName: 'Protocol ID', minWidth: 160, filter: true, sortable: true },
    { field: 'title', headerName: 'Study Title', minWidth: 260, flex: 2, filter: true, sortable: true },
    { field: 'phase', headerName: 'Phase', minWidth: 130, filter: true, sortable: true },
    { field: 'status', headerName: 'Status', minWidth: 130, filter: true, sortable: true },
    { field: 'enrolled', headerName: 'Enrolled', minWidth: 120, filter: 'agNumberColumnFilter', sortable: true },
    { field: 'targetEnrollment', headerName: 'Target', minWidth: 120, filter: 'agNumberColumnFilter', sortable: true,
      valueGetter: (params) => params.data?.targetEnrollment ?? params.data?.target ?? 0 },
  ];
  const participantDrilldownColumns: ColDef[] = [
    { field: 'participantId', headerName: 'Participant ID', minWidth: 170, valueGetter: (params) => params.data?.participantId ?? params.data?.id, filter: true, sortable: true },
    { field: 'studyId', headerName: 'Study ID', minWidth: 160, filter: true, sortable: true },
    { field: 'status', headerName: 'Status', minWidth: 140, filter: true, sortable: true },
    { field: 'enrolledAt', headerName: 'Enrolled At', minWidth: 200, filter: true, sortable: true },
  ];
  const drilldownColumns = isParticipantDrilldown ? participantDrilldownColumns : studyDrilldownColumns;
  const exportFileName = `${isParticipantDrilldown ? 'participants' : 'studies'}-${(drilldownSegment?.label || 'drilldown').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const getExportRows = () => {
    const rows: any[] = [];
    if (gridApi) {
      gridApi.forEachNodeAfterFilterAndSort((node) => {
        if (node.data) rows.push(node.data);
      });
      return rows;
    }
    return drilldownRows;
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(isParticipantDrilldown ? 'Participants' : 'Studies', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = isParticipantDrilldown ? [
      { header: 'Participant ID', key: 'participantId', width: 24 },
      { header: 'Study ID', key: 'studyId', width: 24 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Enrolled At', key: 'enrolledAt', width: 28 },
    ] : [
      { header: 'Protocol ID', key: 'id', width: 22 },
      { header: 'Study Title', key: 'title', width: 48 },
      { header: 'Phase', key: 'phase', width: 18 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Enrolled', key: 'enrolled', width: 14 },
      { header: 'Target Enrollment', key: 'targetEnrollment', width: 20 },
    ];
    getExportRows().forEach((row) => sheet.addRow(isParticipantDrilldown ? {
      participantId: row.participantId ?? row.id,
      studyId: row.studyId,
      status: row.status,
      enrolledAt: row.enrolledAt || '',
    } : normalizeStudy(row)));
    sheet.autoFilter = { from: 'A1', to: `${isParticipantDrilldown ? 'D' : 'F'}${Math.max(1, sheet.rowCount)}` };
    sheet.getRow(1).height = 25;
    sheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF123A5A' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle' };
    });
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          if (rowNumber % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F7FB' } };
          cell.font = { color: { argb: 'FF24445B' } };
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFDCE7EE' } } };
        });
      }
    });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.setTextColor('#123A5A');
    doc.text(`${isParticipantDrilldown ? 'Participant' : 'Study'} Drill-down: ${drilldownSegment?.label || ''}`, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor('#61798D');
    doc.text(`${getExportRows().length} ${isParticipantDrilldown ? 'participant records' : 'studies'}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [isParticipantDrilldown
        ? ['Participant ID', 'Study ID', 'Status', 'Enrolled At']
        : ['Protocol ID', 'Study Title', 'Phase', 'Status', 'Enrolled', 'Target Enrollment']],
      body: getExportRows().map((row) => isParticipantDrilldown
        ? [row.participantId ?? row.id, row.studyId, row.status, row.enrolledAt || '']
        : (() => {
            const study = normalizeStudy(row);
            return [study.id, study.title, study.phase, study.status, study.enrolled, study.targetEnrollment];
          })()),
      styles: { fontSize: 8, cellPadding: 3, textColor: [36, 68, 91], lineColor: [220, 231, 238], lineWidth: 0.1 },
      headStyles: { fillColor: [18, 58, 90], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 247, 251] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`${exportFileName}.pdf`);
  };

  return (
    <div>
      <PageHeader
        title="Clinical Operations Overview"
        subtitle="Real-time trial recruitment metrics, enrollment velocity, and site operational health"
        actions={
          <div className="page-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => context.navigate('/surveys')}
            >
              <FileText size={16} />
              <span>Survey Studio</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => context.navigate('/studies')}
            >
              <Plus size={16} />
              <span>New Study Protocol</span>
            </button>
          </div>
        }
      />

      {error ? (
        <div className="card">
          <div className="card-body">
            <div className="dashboard-error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <p className="stat-subtext">
              The dashboard displays live operational calculations from the backend aggregation service.
              Please ensure enrollnow-dashboard-service is running.
            </p>
          </div>
        </div>
      ) : (
        <>
          <section className="executive-progress-panel" aria-labelledby="executive-progress-title">
            <div className="executive-progress-panel__heading">
              <div>
                <p className="executive-progress-panel__eyebrow">Portfolio performance</p>
                <h2 id="executive-progress-title">Enrollment progress</h2>
                <p>Progress toward recruitment targets for prioritized active studies.</p>
              </div>
              <div className="executive-progress-panel__summary">
                <span>{studyProgress.length} studies</span>
                <strong>
                  {studyProgress.length > 0
                    ? `${Math.round(studyProgress.reduce((sum, study) => sum + study.progress, 0) / studyProgress.length)}%`
                    : '--'}
                </strong>
                <small>average target reached</small>
              </div>
            </div>

            <div className="executive-progress-list">
              {studyProgress.map((study) => (
                <div className="executive-progress-row" key={study.id}>
                  <div className="executive-progress-row__study">
                    <strong>{study.title}</strong>
                    <span>{study.phase || 'Clinical study'} · {study.status}</span>
                  </div>
                  <div className="executive-progress-row__bar" aria-label={`${study.progress}% of enrollment target`}>
                    <svg viewBox="0 0 100 8" preserveAspectRatio="none" role="img" aria-hidden="true">
                      <rect x="0" y="0" width="100" height="8" rx="4" className="executive-progress-track" />
                      <rect x="0" y="0" width={study.progress} height="8" rx="4" className="executive-progress-fill" />
                    </svg>
                  </div>
                  <div className="executive-progress-row__value">
                    <strong>{study.enrolled.toLocaleString()} / {study.target.toLocaleString()}</strong>
                    <span>{study.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="executive-charts-grid" aria-label="Study portfolio charts">
            <Card title="Studies by Status" subtitle="Select a slice to inspect matching protocols">
              <div className="executive-chart-content">
                <ExecutivePieChart
                  segments={statusSegments}
                  selectedKey={selectedDrilldown?.chart === 'status' ? selectedDrilldown.key : undefined}
                  centerValue={`${activeStudyCount}/${stats?.totalStudies ?? dashboardStudies.length}`}
                  centerLabel="active studies"
                  onSelect={(key) => openDrilldown('status', key)}
                />
                <div className="executive-chart-legend">
                  {statusSegments.map((segment) => (
                    <button
                      className="executive-chart-legend__item"
                      type="button"
                      key={segment.key}
                      aria-pressed={selectedDrilldown?.chart === 'status' && selectedDrilldown.key === segment.key}
                      onClick={() => openDrilldown('status', segment.key)}
                    >
                      <span className={`executive-chart-legend__swatch executive-chart-legend__swatch--${segment.colorIndex}`} />
                      <span>{segment.label}</span>
                      <strong>{segment.value}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Enrolled by Study Phase" subtitle="Select a slice to inspect enrollment by phase">
              <div className="executive-chart-content">
                <ExecutivePieChart
                  segments={phaseSegments}
                  selectedKey={selectedDrilldown?.chart === 'phase' ? selectedDrilldown.key : undefined}
                  centerValue={phaseSegments.reduce((sum, segment) => sum + segment.value, 0).toLocaleString()}
                  centerLabel="enrolled"
                  onSelect={(key) => openDrilldown('phase', key)}
                />
                <div className="executive-chart-legend">
                  {phaseSegments.map((segment) => (
                    <button
                      className="executive-chart-legend__item"
                      type="button"
                      key={segment.key}
                      aria-pressed={selectedDrilldown?.chart === 'phase' && selectedDrilldown.key === segment.key}
                      onClick={() => openDrilldown('phase', segment.key)}
                    >
                      <span className={`executive-chart-legend__swatch executive-chart-legend__swatch--${segment.colorIndex}`} />
                      <span>{segment.label}</span>
                      <strong>{segment.value.toLocaleString()}</strong>
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="Participant Screening Funnel" subtitle="Select a bar to inspect matching participant records">
              <div className="executive-participant-chart">
                {participantStages.map((metric) => {
                  const percent = Math.min(100, Math.round((metric.value / participantDenominator) * 100));
                  return (
                    <button
                      type="button"
                      className="executive-participant-chart__row"
                      key={metric.key}
                      aria-label={`${metric.label}: ${metric.value.toLocaleString()} participants. Open matching participant records.`}
                      onClick={() => openDrilldown('participants', metric.key)}
                    >
                      <div className="executive-participant-chart__label">
                        <span>{metric.label}</span>
                        <strong>{metric.value.toLocaleString()}</strong>
                      </div>
                      <div className={`executive-participant-chart__bar executive-participant-chart__bar--${(metric as any).color || metric.key}`} role="img" aria-label={`${metric.label}: ${metric.value.toLocaleString()}, ${percent}%`}>
                        <svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                          <rect className="executive-participant-chart__track" x="0" y="0" width="100" height="10" rx="5" />
                          <rect className="executive-participant-chart__fill" x="0" y="0" width={percent} height="10" rx="5" />
                        </svg>
                      </div>
                      <span className="executive-participant-chart__percent">{percent}%</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </section>

          <section className="executive-operations-strip" aria-label="Operational metrics">
            <div className="executive-operations-strip__metric">
              <TrendingUp size={18} aria-hidden="true" />
              <span>Recruitment velocity</span>
              <strong>{stats?.recruitmentVelocity || '--'}</strong>
              <small>Across active sites</small>
            </div>
            <div className="executive-operations-strip__divider" />
            <div className="executive-operations-strip__metric executive-operations-strip__metric--tasks">
              <CheckSquare size={18} aria-hidden="true" />
              <span>Pending action tasks</span>
              <strong>{stats?.pendingTasks !== undefined ? Number(stats.pendingTasks).toLocaleString() : '--'}</strong>
              <small>Investigator reviews and follow-ups</small>
            </div>
          </section>

          {drilldownSegment && (
            <div className="executive-drilldown-backdrop" role="presentation" onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDrilldown();
            }}>
              <section
                className="executive-drilldown-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="drilldown-title"
                onMouseDown={(event) => {
                  if (!(event.target as Element).closest('.executive-drilldown__exports')) setExportMenuOpen(false);
                }}
              >
                <div className="executive-drilldown__heading modal-title-bar">
                  <div>
                    <p className="executive-progress-panel__eyebrow">Chart drill-down</p>
                    <h2 id="drilldown-title">{drilldownSegment.label}</h2>
                    <p>
                      {isParticipantDrilldown
                        ? `${drilldownSegment.value.toLocaleString()} ${drilldownSegment.label.toLowerCase()} · ${drilldownRows.length} matching participant ${drilldownRows.length === 1 ? 'record' : 'records'} available`
                        : selectedDrilldown?.chart === 'status'
                        ? `${drilldownRows.length} matching study ${drilldownRows.length === 1 ? 'protocol' : 'protocols'}`
                        : `${drilldownSegment.value.toLocaleString()} enrolled participants across ${drilldownRows.length} ${drilldownRows.length === 1 ? 'study' : 'studies'}`}
                    </p>
                  </div>
                  <button type="button" className="executive-drilldown__close" aria-label="Close drill-down" onClick={closeDrilldown}>
                    <X size={20} />
                  </button>
                </div>
                <div className="executive-drilldown__toolbar">
                  <label className="executive-drilldown__search">
                    <Search size={16} />
                    <input value={quickSearch} onChange={(event) => {
                      setQuickSearch(event.target.value);
                      gridApi?.setGridOption('quickFilterText', event.target.value);
                    }} placeholder={isParticipantDrilldown ? 'Search these participants' : 'Search these studies'} aria-label={isParticipantDrilldown ? 'Search drill-down participants' : 'Search drill-down studies'} />
                  </label>
                  <div className="executive-drilldown__exports">
                    <button
                      type="button"
                      className="executive-export-trigger"
                      aria-haspopup="menu"
                      aria-expanded={exportMenuOpen}
                      onClick={() => setExportMenuOpen((open) => !open)}
                    >
                      <Download size={16} /> Export <ChevronDown size={15} />
                    </button>
                    {exportMenuOpen && (
                      <div className="executive-export-menu" role="menu" aria-label="Choose export format">
                        <button type="button" role="menuitem" onClick={() => {
                          gridApi?.exportDataAsCsv({ fileName: `${exportFileName}.csv` });
                          setExportMenuOpen(false);
                        }}>
                          <Download size={15} /> <span>CSV</span><small>Comma-separated values</small>
                        </button>
                        <button type="button" role="menuitem" onClick={() => {
                          void exportExcel();
                          setExportMenuOpen(false);
                        }}>
                          <FileSpreadsheet size={15} /> <span>Excel</span><small>Excel workbook (.xlsx)</small>
                        </button>
                        <button type="button" role="menuitem" onClick={() => {
                          exportPdf();
                          setExportMenuOpen(false);
                        }}>
                          <FileText size={15} /> <span>PDF</span><small>Portable document</small>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <DataGrid
                  wrapperClassName="executive-drilldown__grid"
                  rowData={drilldownRows}
                  columnDefs={drilldownColumns}
                  pagination
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 25, 50]}
                  onGridReady={(event) => {
                    setGridApi(event.api);
                    event.api.setGridOption('quickFilterText', quickSearch);
                  }}
                  domLayout="normal"
                  overlayNoRowsTemplate={isParticipantDrilldown
                    ? 'No participants match this chart segment.'
                    : 'No studies match this chart segment.'}
                />
              </section>
            </div>
          )}

          {/* Main Grid */}
          <div className="dashboard-content-grid">
            <Card
              title="Active Study Protocols"
              subtitle="Prioritized clinical trials and recruitment milestone progression"
              actions={
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => context.navigate('/studies')}
                >
                  <span>View All</span>
                  <ArrowUpRight size={14} />
                </button>
              }
            >
              <DataTable
                data={dashboardStudies}
                keyExtractor={(item) => item.id}
                columns={[
                  {
                    key: 'id',
                    header: 'Protocol ID',
                    render: (item) => <strong>{item.id}</strong>,
                  },
                  {
                    key: 'title',
                    header: 'Study Title',
                    render: (item) => (
                      <div>
                        <div>{item.title}</div>
                        <span className="stat-subtext">{item.phase}</span>
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (item) => <StatusBadge status={item.status} />,
                  },
                  {
                    key: 'enrolled',
                    header: 'Accrual Progress',
                    render: (item) => {
                      const enrolled = Math.max(0, Number(item.enrolled) || 0);
                      const target = Math.max(0, Number(item.targetEnrollment ?? item.target) || 0);
                      const progress = target > 0 ? Math.min(100, Math.round((enrolled / target) * 100)) : 0;

                      return (
                        <div>
                          <div>{enrolled.toLocaleString()} / {target.toLocaleString()} ({progress}%)</div>
                          <div className="progress-bar-track" role="img" aria-label={`${progress}% of enrollment target`}>
                            <svg viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
                              <rect x="0" y="0" width="100" height="6" rx="3" className="progress-bar-background" />
                              <rect x="0" y="0" width={progress} height="6" rx="3" className="progress-bar-fill" />
                            </svg>
                          </div>
                        </div>
                      );
                    },
                  },
                ]}
              />
            </Card>

            <Card
              title="Operational Microservices"
              subtitle="Direct launchpad for integrated trial modules"
            >
              <div className="quick-launch-grid">
                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/participants')}
                >
                  <div className="quick-launch-title launch-blue">
                    <Users size={18} />
                    <span>Participant Queue</span>
                  </div>
                  <p className="stat-subtext">Screen eligible subjects and monitor informed consent.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/recruitment')}
                >
                  <div className="quick-launch-title launch-green">
                    <Activity size={18} />
                    <span>Campaign Funnels</span>
                  </div>
                  <p className="stat-subtext">Track channel acquisition and conversion rates.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/surveys')}
                >
                  <div className="quick-launch-title launch-cyan">
                    <FileText size={18} />
                    <span>Survey Studio</span>
                  </div>
                  <p className="stat-subtext">Design validated electronic questionnaires and ePRO.</p>
                </div>

                <div
                  className="card quick-launch-card"
                  onClick={() => context.navigate('/organization')}
                >
                  <div className="quick-launch-title launch-yellow">
                    <Building size={18} />
                    <span>Site Directory</span>
                  </div>
                  <p className="stat-subtext">Coordinate multi-site investigative facilities.</p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardModule;
