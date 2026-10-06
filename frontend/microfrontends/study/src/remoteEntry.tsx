// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MfeContext } from '../../../shared/contracts';
import { Plus, Upload, X } from 'lucide-react';
import { apiClient } from '../../../shared/api-client';

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

  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      try {
        const [studiesRes, overviewRes, participantsRes] = await Promise.allSettled([
          apiClient.get('/api/v1/studies'),
          apiClient.get('/api/v1/dashboard/overview'),
          apiClient.get('/api/v1/participants'),
        ]);
        const registryStudies = studiesRes.status === 'fulfilled' && Array.isArray(studiesRes.value.data?.data)
          ? studiesRes.value.data.data
          : [];
        const overviewStudies = overviewRes.status === 'fulfilled'
          ? overviewRes.value.data?.data?.recentStudies || []
          : [];
        const getStudyIdentifiers = (study: any) => [study.id, study.studyId, study.protocolId, study.protocolNumber]
          .filter((value) => value !== undefined && value !== null).map(String);
        const sourceStudies = registryStudies.length > 0 ? registryStudies : overviewStudies;
        const mergedStudies = sourceStudies.map((study: any) => {
          const ids = getStudyIdentifiers(study);
          const overviewStudy = overviewStudies.find((item: any) => getStudyIdentifiers(item).some((id: string) => ids.includes(id)));
          return {
            ...overviewStudy,
            ...study,
            enrolled: study.enrolled ?? study.enrolledParticipants ?? overviewStudy?.enrolled ?? overviewStudy?.enrolledParticipants ?? 0,
            targetEnrollment: study.targetEnrollment ?? study.targetParticipants ?? overviewStudy?.targetEnrollment ?? 0,
          };
        });
        setStudies(mergedStudies);
        if (participantsRes.status === 'fulfilled' && Array.isArray(participantsRes.value.data?.data)) {
          setParticipants(participantsRes.value.data.data);
        }
      } catch {
        // Keep the study selection screen available when an endpoint is unavailable.
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, []);

  const data = studies;
  const tableData = data.map((study) => ({
    ...study,
    protocolId: study.protocolId ?? study.protocolNumber ?? study.id,
    targetParticipants: study.targetParticipants ?? study.targetEnrollment ?? study.target ?? 0,
    enrolledParticipants: study.enrolledParticipants ?? study.enrolled ?? 0,
    siteCount: study.siteCount ?? 0,
  }));
  const selectedStudy = selectedStudyId
    ? tableData.find((study) => [study.id, study.studyId, study.protocolId, study.protocolNumber]
        .some((id) => id !== undefined && String(id) === selectedStudyId))
    : undefined;

  const selectedStudyIds = selectedStudy ? [selectedStudy.id, selectedStudy.studyId, selectedStudy.protocolId, selectedStudy.protocolNumber]
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
  const targetCount = Math.max(0, Number(selectedStudy?.targetEnrollment ?? selectedStudy?.targetParticipants) || 0);
  const recruitmentProgress = targetCount > 0 ? Math.min(100, Math.round((recruitedCount / targetCount) * 100)) : 0;
  const weeklyMaximum = Math.max(1, ...weeklyRecruitment.map((entry) => entry.count));

  const handleCreateStudy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingStudy(true);
    setStudyFormError(null);
    const template = tableData.find((study) => String(study.id ?? study.studyId ?? study.protocolId) === studyForm.templateId);
    const payload = {
      title: studyForm.shortName.trim(),
      shortName: studyForm.shortName.trim(),
      phase: template?.phase || 'Phase I',
      therapeuticArea: template?.therapeuticArea || '',
      targetEnrollment: Number(template?.targetEnrollment ?? template?.targetParticipants ?? 100),
      status: 'ACTIVE',
    };
    try {
      const res = await apiClient.post('/api/v1/studies', payload);
      const created = res.data?.data || payload;
      setStudies((current) => [{
        ...created,
        protocolId: created.protocolId ?? created.protocolNumber ?? created.id ?? `ST-${Date.now()}`,
        targetParticipants: created.targetParticipants ?? created.targetEnrollment ?? payload.targetEnrollment,
        enrolledParticipants: created.enrolledParticipants ?? created.enrolled ?? 0,
        siteCount: created.siteCount ?? 0,
      }, ...current]);
      setShowAddStudy(false);
      setStudyForm({ shortName: '', templateId: '' });
      navigate(`/studies?studyId=${encodeURIComponent(String(created.id ?? created.studyId ?? created.protocolNumber))}`);
    } catch {
      setStudyFormError('Unable to add the study. Please try again.');
    } finally {
      setIsSavingStudy(false);
    }
  };

  const handleImportStudy = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setStudyFormError(null);
    try {
      const imported = JSON.parse(await file.text());
      const name = String(imported.shortName ?? imported.title ?? '').trim().slice(0, 15);
      if (!name) throw new Error('The selected file does not contain a study name.');
      setIsSavingStudy(true);
      const payload = {
        title: name,
        shortName: name,
        phase: imported.phase || 'Phase I',
        therapeuticArea: imported.therapeuticArea || '',
        targetEnrollment: Math.max(1, Number(imported.targetEnrollment ?? imported.targetParticipants) || 100),
        status: 'ACTIVE',
      };
      const res = await apiClient.post('/api/v1/studies', payload);
      const created = res.data?.data || payload;
      setStudies((current) => [{
        ...created,
        protocolId: created.protocolId ?? created.protocolNumber ?? created.id ?? `ST-${Date.now()}`,
        targetEnrollment: created.targetEnrollment ?? payload.targetEnrollment,
        enrolled: created.enrolled ?? 0,
      }, ...current]);
      setShowAddStudy(false);
      setStudyForm({ shortName: '', templateId: '' });
      navigate(`/studies?studyId=${encodeURIComponent(String(created.id ?? created.studyId ?? created.protocolNumber))}`);
    } catch {
      setStudyFormError('Import a valid study JSON file with a short study name.');
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
              <span>{selectedStudy.protocolNumber || selectedStudy.protocolId || selectedStudy.id} · {selectedStudy.phase || 'Study phase unavailable'}</span>
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
                <div className="study-recruitment-scale__fill" style={{ width: `${recruitmentProgress}%` }} />
              </div>
              <div className="study-recruitment-scale__ticks">
                {[0, 25, 50, 75, 100].map((tick) => <span key={tick}>{tick}%</span>)}
              </div>
            </div>
          </section>

          <section className="study-metrics-grid" aria-label="Study recruitment metrics">
            <article className="study-metric study-metric--recruited">
              <span>Total number of participants recruited</span>
              <strong>{recruitedCount.toLocaleString()}</strong>
              <small>{Math.max(0, targetCount - recruitedCount).toLocaleString()} left to recruit</small>
            </article>
            <article className="study-metric study-metric--target">
              <span>On Target Performance</span>
              <strong>{recruitmentProgress}%</strong>
              <small>{recruitedCount.toLocaleString()} of {targetCount.toLocaleString()} participants</small>
            </article>
            <article className="study-metric study-metric--weekly">
              <span>Average recruited per active week</span>
              <strong>{weeklyRecruitment.length
                ? Math.round(weeklyRecruitment.reduce((sum, week) => sum + week.count, 0) / weeklyRecruitment.length).toLocaleString()
                : '—'}</strong>
              <small>{weeklyRecruitment.length ? 'From available participant records' : 'Weekly recruitment data unavailable'}</small>
            </article>
          </section>

          <section className="study-weekly-panel" aria-labelledby="study-weekly-title">
            <div className="study-weekly-panel__heading">
              <div>
                <h2 id="study-weekly-title">Weekly Recruitment</h2>
                <p>Enrolled participant records by week</p>
              </div>
            </div>
            <div className="study-weekly-chart">
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
          <section className="study-form-dialog" role="dialog" aria-modal="true" aria-labelledby="add-study-title">
            <div className="study-form-dialog__heading">
              <h2 id="add-study-title">Add Study</h2>
              <button type="button" className="study-form-dialog__close" onClick={() => setShowAddStudy(false)} aria-label="Close add study form"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStudy}>
              <label>
                <span>Short Study Name</span>
                <input required maxLength={15} placeholder="max length 15 characters" value={studyForm.shortName} onChange={(event) => setStudyForm((current) => ({ ...current, shortName: event.target.value }))} />
              </label>
              <label>
                <span>Copy From Existing Study</span>
                <select value={studyForm.templateId} onChange={(event) => setStudyForm((current) => ({ ...current, templateId: event.target.value }))}>
                  <option value="">Select a template (optional)</option>
                  {tableData.map((study) => {
                    const id = study.id ?? study.studyId ?? study.protocolId;
                    return <option key={id} value={String(id)}>{study.title}</option>;
                  })}
                </select>
              </label>
              {studyFormError && <p className="study-form-dialog__error" role="alert">{studyFormError}</p>}
              <div className="study-form-dialog__actions">
                <button type="submit" className="btn btn-primary" disabled={isSavingStudy}>
                  <Plus size={15} /> {isSavingStudy ? 'Submitting…' : 'Submit'}
                </button>
                <button type="button" className="study-form-dialog__import" onClick={() => importInputRef.current?.click()} disabled={isSavingStudy}>
                  <Upload size={15} /> Import Study
                </button>
                <input ref={importInputRef} className="study-form-dialog__file-input" type="file" accept="application/json,.json" onChange={handleImportStudy} />
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default StudyModule;
