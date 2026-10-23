// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MfeContext } from '../../../shared/contracts';
import { Plus, Upload, X } from 'lucide-react';
import { dashboardApi } from '../../../shared/api/dashboardApi';
import { participantApi } from '../../../shared/api/participantApi';
import { studyApi } from '../../../shared/api/studyApi';
import { toast } from '../../../shared/toaster';
import { confirmation } from '../../../shared/confirmation';
import { getApiErrorMessage } from '../../../shared/api-client';
import { useFocusTrap } from '../../../shared/accessibility/useFocusTrap';

export interface StudyModuleProps {
  context: MfeContext;
}

export const StudyModule: React.FC<StudyModuleProps> = ({ context }) => {
  const [studies, setStudies] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [isSavingStudy, setIsSavingStudy] = useState(false);
  const [studyFormError, setStudyFormError] = useState<string | null>(null);
  const [studyForm, setStudyForm] = useState({ shortName: '', templateId: '' });
  const importInputRef = useRef<HTMLInputElement>(null);
  const addStudyDialogRef = useFocusTrap<HTMLElement>({
    active: showAddStudy,
    onEscape: () => setShowAddStudy(false),
  });
  const location = useLocation();
  const navigate = useNavigate();
  const selectedStudyId = new URLSearchParams(location.search).get('studyId');

  useEffect(() => {
    if (new URLSearchParams(location.search).get('action') === 'add') {
      setStudyFormError(null);
      setShowAddStudy(true);
      navigate('/studies', { replace: true });
    }
  }, [location.search, navigate]);

  const fetchStudies = useCallback(async () => {
    setLoading(true);
    try {
      const [studiesRes, overviewRes, participantsRes] = await Promise.allSettled([
        studyApi.getStudies(),
        dashboardApi.getOverview({ skipToast: true } as any),
        participantApi.getParticipants({ skipToast: true } as any),
      ]);
      const registryStudies = studiesRes.status === 'fulfilled' && Array.isArray(studiesRes.value)
        ? studiesRes.value
        : [];
      const overviewStudies = overviewRes.status === 'fulfilled'
        ? overviewRes.value?.recentStudies || []
        : [];
      const getStudyIdentifiers = (study: any) => [study.id, study.studyId, study.protocolId, study.protocolNumber, study.studyCode]
        .filter((value) => value !== undefined && value !== null).map(String);
      const sourceStudies = registryStudies.length > 0 ? registryStudies : overviewStudies;
      const mergedStudies = sourceStudies.map((study: any) => {
        const ids = getStudyIdentifiers(study);
        const overviewStudy = overviewStudies.find((item: any) => getStudyIdentifiers(item).some((id: string) => ids.includes(id)));
        return {
          ...overviewStudy,
          ...study,
          title: study.title || study.name || overviewStudy?.title || overviewStudy?.name || 'Untitled Study',
          name: study.name || study.title || overviewStudy?.name || overviewStudy?.title || 'Untitled Study',
          enrolled: study.enrolled ?? study.enrolledParticipants ?? overviewStudy?.enrolled ?? overviewStudy?.enrolledParticipants ?? 0,
          targetEnrollment: study.targetEnrollment ?? study.sampleSize ?? study.targetParticipants ?? overviewStudy?.targetEnrollment ?? 100,
        };
      });
      setStudies(mergedStudies);
      if (participantsRes.status === 'fulfilled' && Array.isArray(participantsRes.value)) {
        setParticipants(participantsRes.value);
      }
    } catch {
      // Keep the study selection screen available when an endpoint is unavailable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudies();
  }, [fetchStudies]);

  const data = studies;
  const tableData = data.map((study) => ({
    ...study,
    protocolId: study.protocolId ?? study.protocolNumber ?? study.studyCode ?? study.id,
    targetParticipants: study.targetParticipants ?? study.targetEnrollment ?? study.sampleSize ?? study.target ?? 100,
    enrolledParticipants: study.enrolledParticipants ?? study.enrolled ?? 0,
    siteCount: study.siteCount ?? 0,
  }));

  const eligibleTemplates = [...tableData].sort((a, b) =>
    (a.title || a.name || '').localeCompare(b.title || b.name || '', undefined, { sensitivity: 'base' })
  );

  const selectedStudy = selectedStudyId
    ? tableData.find((study) => [study.id, study.studyId, study.protocolId, study.protocolNumber, study.studyCode]
        .some((id) => id !== undefined && String(id) === selectedStudyId))
    : undefined;

  const selectedStudyIds = selectedStudy ? [selectedStudy.id, selectedStudy.studyId, selectedStudy.protocolId, selectedStudy.protocolNumber, selectedStudy.studyCode]
    .filter((value) => value !== undefined && value !== null).map(String) : [];
  const matchingParticipants = participants.filter((participant) => [participant.studyId, participant.study?.id, participant.study?.studyId]
    .filter((value) => value !== undefined && value !== null).some((value) => selectedStudyIds.includes(String(value)))
  );
  const weeklyRecruitment = (() => {
    const weekly = new Map<string, number>();
    matchingParticipants
      .filter((participant) => ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(String(participant.status || '').toUpperCase()) && participant.enrolledAt)
      .forEach((participant) => {
        const date = new Date(participant.enrolledAt);
        if (Number.isNaN(date.getTime())) return;
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        weekStart.setHours(0, 0, 0, 0);
        const key = weekStart.toISOString().slice(0, 10);
        weekly.set(key, (weekly.get(key) || 0) + 1);
      });
    return Array.from(weekly, ([week, count]) => ({
      week,
      label: new Date(`${week}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count,
    })).sort((a, b) => a.week.localeCompare(b.week));
  })();
  const recruitedCount = Math.max(0, Number(selectedStudy?.enrolled ?? selectedStudy?.enrolledParticipants) || 0);
  const targetCount = Math.max(0, Number(selectedStudy?.targetEnrollment ?? selectedStudy?.targetParticipants ?? selectedStudy?.sampleSize) || 100);
  const recruitmentProgress = targetCount > 0 ? Math.min(100, Math.round((recruitedCount / targetCount) * 100)) : 0;
  const weeklyMaximum = Math.max(1, ...weeklyRecruitment.map((entry) => entry.count));

  const validateStudyName = (rawName: string): string | null => {
    const trimmed = rawName.trim();
    if (!trimmed) {
      return 'Short study name is required.';
    }
    if (trimmed.length > 15) {
      return 'Short study name must not exceed 15 characters.';
    }
    const isDuplicate = studies.some(
      (s) => (s.name || s.title || '').trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      return 'Study name already exists. Please choose another';
    }
    return null;
  };

  const handleCreateStudy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStudyFormError(null);

    const validationError = validateStudyName(studyForm.shortName);
    if (validationError) {
      setStudyFormError(validationError);
      return;
    }

    const trimmedName = studyForm.shortName.trim();
    setIsSavingStudy(true);

    try {
      if (studyForm.templateId) {
        // Copy from existing study
        const created = await studyApi.copyStudy({
          studyName: trimmedName,
          sourceStudyId: studyForm.templateId,
        });

        toast.success(`Successfully created study ${trimmedName}.`);
        setShowAddStudy(false);
        setStudyForm({ shortName: '', templateId: '' });
        const newId = String(created.id ?? created.studyId ?? created.studyCode ?? created.protocolNumber);
        await fetchStudies();
        navigate(`/studies?studyId=${encodeURIComponent(newId)}`);
      } else {
        // Normal study creation
        const template = tableData.find((study) => String(study.id ?? study.studyId ?? study.protocolId) === studyForm.templateId);
        const payload = {
          title: trimmedName,
          name: trimmedName,
          shortName: trimmedName,
          phase: template?.phase || 'Phase I',
          therapeuticArea: template?.therapeuticArea || '',
          sampleSize: Number(template?.targetEnrollment ?? template?.targetParticipants ?? 100),
          targetEnrollment: Number(template?.targetEnrollment ?? template?.targetParticipants ?? 100),
          status: 'ACTIVE',
        };

        const created = await studyApi.createStudy(payload);
        toast.success(`Successfully created study ${trimmedName}.`);
        setShowAddStudy(false);
        setStudyForm({ shortName: '', templateId: '' });
        const newId = String(created.id ?? created.studyId ?? created.studyCode ?? created.protocolNumber);
        await fetchStudies();
        navigate(`/studies?studyId=${encodeURIComponent(newId)}`);
      }
    } catch (err: any) {
      const msg = getApiErrorMessage(err) || 'Unable to create the study. Please try again.';
      setStudyFormError(msg);
      toast.error(msg);
    } finally {
      setIsSavingStudy(false);
    }
  };

  const handleImportButtonClick = () => {
    setStudyFormError(null);
    importInputRef.current?.click();
  };

  const handleImportStudy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setStudyFormError(null);

    const isJson = file.name.toLowerCase().endsWith('.json') || file.type === 'application/json';
    if (!isJson) {
      const err = 'Must select a .json file to import a study.';
      setStudyFormError(err);
      toast.error(err);
      return;
    }

    // Pre-validate JSON parse client-side before prompting confirmation
    let parsedJson: any = null;
    try {
      const fileText = await file.text();
      parsedJson = JSON.parse(fileText);
    } catch {
      const err = `File contents lack the proper format for file ${file.name}, please try again.`;
      setStudyFormError(err);
      toast.error(err);
      return;
    }

    // Determine study name: use entered shortName, or auto-extract from JSON / file name
    let trimmedName = studyForm.shortName.trim();
    if (!trimmedName && parsedJson) {
      const extracted = (parsedJson.study?.name || parsedJson.studyName || parsedJson.name || file.name.replace(/\.json$/i, '')).trim();
      if (extracted) {
        trimmedName = extracted.slice(0, 15);
        setStudyForm((current) => ({ ...current, shortName: trimmedName }));
      }
    }

    if (!trimmedName) {
      const err = 'Must provide a study name to import a new study.';
      setStudyFormError(err);
      toast.error(err);
      const input = document.getElementById('short-study-name') as HTMLInputElement | null;
      input?.focus();
      return;
    }

    if (trimmedName.length > 15) {
      const err = 'Short study name must not exceed 15 characters.';
      setStudyFormError(err);
      toast.error(err);
      const input = document.getElementById('short-study-name') as HTMLInputElement | null;
      input?.focus();
      return;
    }

    const isDuplicate = studies.some(
      (s) => (s.name || s.title || '').trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      const err = 'Study name already exists. Please choose another';
      setStudyFormError(err);
      toast.error(err);
      const input = document.getElementById('short-study-name') as HTMLInputElement | null;
      input?.focus();
      return;
    }

    // Confirmation dialog
    const confirmed = await confirmation.confirm({
      title: 'Are you sure?',
      message: `Importing file ${file.name} will create study ${trimmedName} and populate it with the file contents.`,
      confirmText: 'Yes, import and create study',
      cancelText: 'Cancel',
      intent: 'warning',
    });

    if (!confirmed) {
      return;
    }

    setIsSavingStudy(true);
    try {
      const result = await studyApi.importStudy(trimmedName, file);
      toast.success(`Successfully created study ${trimmedName}.`);
      setShowAddStudy(false);
      setStudyForm({ shortName: '', templateId: '' });
      const newId = String(result.studyId ?? result.studyCode);
      await fetchStudies();
      navigate(`/studies?studyId=${encodeURIComponent(newId)}`);
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err) || `Something went wrong while importing file ${file.name}, please contact the site admin.`;
      setStudyFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSavingStudy(false);
    }
  };

  return (
    <div className="study-workspace">
      {loading && !selectedStudy ? (
        <div className="study-selection-empty" role="status">Loading study details…</div>
      ) : selectedStudy ? (
        <section className="study-dashboard" aria-labelledby="study-dashboard-title">
          <header className="study-dashboard__header">
            <div>
              <p>STUDY DASHBOARD</p>
              <h1 id="study-dashboard-title">{selectedStudy.title}</h1>
              <span>{selectedStudy.protocolNumber || selectedStudy.protocolId || selectedStudy.studyCode || selectedStudy.id} · {selectedStudy.phase || 'Study phase unavailable'}</span>
            </div>
          </header>

          <section className="study-recruitment-panel" aria-labelledby="study-recruitment-title">
            <div className="study-recruitment-panel__heading">
              <div>
                <h2 id="study-recruitment-title">Recruitment Progress</h2>
                <p>{targetCount.toLocaleString()} participant recruitment target</p>
              </div>
              <strong>{recruitmentProgress}%</strong>
            </div>
            <div className="study-recruitment-scale" role="img" aria-label={`${recruitedCount} of ${targetCount} participants recruited, ${recruitmentProgress}% of target`}>
              <div className="study-recruitment-scale__track">
                <progress className="study-recruitment-scale__fill" value={recruitmentProgress} max={100} aria-hidden="true" />
              </div>
              <div className="study-recruitment-scale__ticks">
                {[0, 25, 50, 75, 100].map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>
          </section>

          <section className="study-weekly-panel" aria-labelledby="study-weekly-title">
            <div className="study-weekly-panel__heading">
              <h2 id="study-weekly-title">Weekly Recruitment</h2>
              <span>Rolling participant accrual</span>
            </div>
            <div className="study-weekly-chart" role="region" aria-label="Weekly recruitment breakdown chart">
              <div className="study-weekly-chart__y-label">Participants</div>
              <div className="study-weekly-chart__plot">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Weekly participant recruitment bar chart">
                  {[0, 25, 50, 75, 100].map((tick) => {
                    const y = 85 - tick * 0.75;
                    return <line key={tick} x1="4" x2="98" y1={y} y2={y} className="study-weekly-chart__gridline" />;
                  })}
                  {weeklyRecruitment.map((week, index) => {
                    const step = 90 / Math.max(weeklyRecruitment.length, 1);
                    const barWidth = Math.min(8, step * 0.55);
                    const barHeight = Math.max(3, (week.count / weeklyMaximum) * 66);
                    const x = 5 + index * step + (step - barWidth) / 2;
                    return <rect key={week.week} x={x} y={85 - barHeight} width={barWidth} height={barHeight} rx="1.5" className="study-weekly-chart__bar"><title>{week.label}: {week.count} participants</title></rect>;
                  })}
                </svg>
                {weeklyRecruitment.length === 0 && <div className="study-weekly-chart__empty">No weekly recruitment records are available for this study yet.</div>}
                {weeklyRecruitment.length > 0 && (
                  <div className="study-weekly-chart__labels">
                    {weeklyRecruitment.map((week) => <span key={week.week}>{week.label}</span>)}
                  </div>
                )}
              </div>
            </div>
          </section>
        </section>
      ) : (
        <section className="study-selection-empty" aria-live="polite">
          <div className="study-selection-empty__icon"><Plus size={22} /></div>
          <h1>{selectedStudyId ? 'Study not found' : 'Select a study to continue'}</h1>
          <p>{selectedStudyId
            ? 'Choose another study from Select Study in the top navigation.'
            : 'Use Select Study in the top navigation to open its recruitment dashboard, or choose Add Study to create a study.'}</p>
        </section>
      )}

      {showAddStudy && (
        <div className="study-form-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowAddStudy(false);
        }}>
          <section ref={addStudyDialogRef} className="study-form-dialog" role="dialog" aria-modal="true" aria-labelledby="add-study-title">
            <div className="study-form-dialog__heading">
              <h2 id="add-study-title">Add Study</h2>
              <button type="button" className="study-form-dialog__close" onClick={() => setShowAddStudy(false)} aria-label="Close add study form"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStudy}>
              <label>
                <span>Short Study Name</span>
                <input
                  id="short-study-name"
                  required
                  maxLength={15}
                  placeholder="max length 15 characters"
                  value={studyForm.shortName}
                  onChange={(event) => {
                    const val = event.target.value;
                    setStudyForm((current) => ({ ...current, shortName: val }));
                    if (studyFormError) setStudyFormError(null);
                  }}
                />
              </label>
              <label>
                <span>Copy From Existing Study</span>
                <select
                  aria-label="Select study to copy"
                  value={studyForm.templateId}
                  onChange={(event) => setStudyForm((current) => ({ ...current, templateId: event.target.value }))}
                >
                  <option value="">{eligibleTemplates.length === 0 ? 'No existing studies available to copy' : 'Select a template (optional)'}</option>
                  {eligibleTemplates.map((study) => {
                    const id = study.id ?? study.studyId ?? study.protocolId;
                    return <option key={id} value={String(id)}>{study.title || study.name}</option>;
                  })}
                </select>
              </label>
              {studyFormError && <p className="study-form-dialog__error" role="alert">{studyFormError}</p>}
              <div className="study-form-dialog__actions">
                <button type="submit" className="btn btn-primary" disabled={isSavingStudy}>
                  <Plus size={15} /> {isSavingStudy ? 'Submitting…' : 'Submit'}
                </button>
                <button
                  id="import-study-btn"
                  type="button"
                  className="study-form-dialog__import"
                  onClick={handleImportButtonClick}
                  disabled={isSavingStudy}
                >
                  <Upload size={15} /> {isSavingStudy ? 'Importing…' : 'Import Study'}
                </button>
                <input
                  ref={importInputRef}
                  className="study-form-dialog__file-input"
                  type="file"
                  accept="application/json,.json"
                  aria-label="Import study JSON file"
                  onChange={handleImportStudy}
                />
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default StudyModule;
