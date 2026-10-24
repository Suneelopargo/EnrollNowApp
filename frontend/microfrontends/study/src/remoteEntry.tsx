// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MfeContext } from '../../../shared/contracts';
import { Plus } from 'lucide-react';
import { dashboardApi } from '../../../shared/api/dashboardApi';
import { participantApi } from '../../../shared/api/participantApi';
import { studyApi } from '../../../shared/api/studyApi';
import { AddStudyModal } from '../../../shared/design-system/components/AddStudyModal';

export interface StudyModuleProps {
  context: MfeContext;
}

export const StudyModule: React.FC<StudyModuleProps> = ({ context }) => {
  const [studies, setStudies] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const selectedStudyId = new URLSearchParams(location.search).get('studyId');

  useEffect(() => {
    if (new URLSearchParams(location.search).get('action') === 'add') {
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
  const activeEnrolledCount = matchingParticipants.filter((participant) =>
    ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(String(participant.status || '').toUpperCase())
  ).length;
  const recruitedCount = activeEnrolledCount > 0
    ? activeEnrolledCount
    : Math.max(0, Number(selectedStudy?.enrolled ?? selectedStudy?.enrolledParticipants) || 0);
  const targetCount = Math.max(0, Number(selectedStudy?.targetEnrollment ?? selectedStudy?.targetParticipants ?? selectedStudy?.sampleSize) || 100);
  const recruitmentProgress = targetCount > 0 ? Math.min(100, Math.round((recruitedCount / targetCount) * 100)) : 0;
  const weeklyMaximum = Math.max(1, ...weeklyRecruitment.map((entry) => entry.count));

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

      <AddStudyModal
        isOpen={showAddStudy}
        onClose={() => setShowAddStudy(false)}
        studies={tableData}
        onStudyCreated={(newId) => {
          fetchStudies();
          navigate(`/studies?studyId=${encodeURIComponent(newId)}`);
        }}
      />
    </div>
  );
};

export default StudyModule;
