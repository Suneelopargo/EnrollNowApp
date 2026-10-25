// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry & Multi-Tab Navigation
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MfeContext } from '../../../shared/contracts';
import { Plus, ShieldAlert, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../../../shared/api/dashboardApi';
import { participantApi } from '../../../shared/api/participantApi';
import { studyApi, StudyNavigationPermissions } from '../../../shared/api/studyApi';
import { AddStudyModal } from '../../../shared/design-system/components/AddStudyModal';
import {
  StudyNavigation,
  StudyTabId,
  RecruitmentSubTabId,
  isStudyTabAuthorized,
} from './components/StudyNavigation';
import { StudyDashboardTab } from './components/StudyDashboardTab';
import { StudyTabPlaceholder } from './components/StudyTabPlaceholder';
import { StudyUnauthorizedTab } from './components/StudyUnauthorizedTab';
import { StudySettingsWorkspace } from './components/StudySettingsWorkspace';

export interface StudyModuleProps {
  context?: MfeContext;
}

export const StudyModule: React.FC<StudyModuleProps> = ({ context }) => {
  const [studies, setStudies] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);

  // Study-specific permissions & navigation state
  const [permissions, setPermissions] = useState<StudyNavigationPermissions | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedStudyId = searchParams.get('studyId');

  // Resolve active tab and subTab from URL search params (or path)
  const activeTab: StudyTabId = useMemo(() => {
    const tab = searchParams.get('tab') as StudyTabId;
    if (
      tab &&
      [
        'dashboard',
        'tasks',
        'recruitment',
        'calendar',
        'potential_participants',
        'enrolled_participants',
        'study_settings',
      ].includes(tab)
    ) {
      return tab;
    }
    return 'dashboard';
  }, [searchParams]);

  const activeSubTab: RecruitmentSubTabId | undefined = useMemo(() => {
    const subTab = searchParams.get('subTab') as RecruitmentSubTabId;
    if (subTab && ['sources', 'strategies'].includes(subTab)) {
      return subTab;
    }
    return undefined;
  }, [searchParams]);

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
      const registryStudies =
        studiesRes.status === 'fulfilled' && Array.isArray(studiesRes.value) ? studiesRes.value : [];
      const overviewStudies =
        overviewRes.status === 'fulfilled' ? overviewRes.value?.recentStudies || [] : [];
      const getStudyIdentifiers = (study: any) =>
        [study.id, study.studyId, study.protocolId, study.protocolNumber, study.studyCode]
          .filter((value) => value !== undefined && value !== null)
          .map(String);
      const sourceStudies = registryStudies.length > 0 ? registryStudies : overviewStudies;
      const mergedStudies = sourceStudies.map((study: any) => {
        const ids = getStudyIdentifiers(study);
        const overviewStudy = overviewStudies.find((item: any) =>
          getStudyIdentifiers(item).some((id: string) => ids.includes(id))
        );
        return {
          ...overviewStudy,
          ...study,
          title: study.title || study.name || overviewStudy?.title || overviewStudy?.name || 'Untitled Study',
          name: study.name || study.title || overviewStudy?.name || overviewStudy?.title || 'Untitled Study',
          enrolled:
            study.enrolled ??
            study.enrolledParticipants ??
            overviewStudy?.enrolled ??
            overviewStudy?.enrolledParticipants ??
            0,
          targetEnrollment:
            study.targetEnrollment ??
            study.sampleSize ??
            study.targetParticipants ??
            overviewStudy?.targetEnrollment ??
            100,
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

  // Load study-specific permissions dynamically whenever selectedStudyId changes
  useEffect(() => {
    // 1. Immediately clear any previously held permissions and errors to prevent cross-study leaks
    setPermissions(null);
    setPermissionsError(null);
    setIsAccessDenied(false);

    if (!selectedStudyId) {
      setPermissionsLoading(false);
      return;
    }

    let isCancelled = false;
    setPermissionsLoading(true);

    const loadStudyPermissions = async () => {
      try {
        const tenantId = context?.user?.tenantId;
        const res = await studyApi.getStudyPermissions(selectedStudyId, tenantId);

        if (!isCancelled) {
          setPermissions(res);
          setIsAccessDenied(false);
          setPermissionsError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setPermissions(null);
          const status = err?.status || err?.response?.status;
          if (status === 403) {
            setIsAccessDenied(true);
            setPermissionsError(
              `Access denied: You do not have permission to access study ${selectedStudyId}.`
            );
          } else if (status === 404) {
            setPermissionsError(`Study ${selectedStudyId} could not be found.`);
          } else {
            setPermissionsError(
              `Failed to load permissions for study ${selectedStudyId}. Access cannot be verified.`
            );
          }
        }
      } finally {
        if (!isCancelled) {
          setPermissionsLoading(false);
        }
      }
    };

    void loadStudyPermissions();

    return () => {
      isCancelled = true;
    };
  }, [selectedStudyId, context?.user?.tenantId]);

  const data = studies;
  const tableData = useMemo(
    () =>
      data.map((study) => ({
        ...study,
        protocolId: study.protocolId ?? study.protocolNumber ?? study.studyCode ?? study.id,
        targetParticipants:
          study.targetParticipants ?? study.targetEnrollment ?? study.sampleSize ?? study.target ?? 100,
        enrolledParticipants: study.enrolledParticipants ?? study.enrolled ?? 0,
        siteCount: study.siteCount ?? 0,
      })),
    [data]
  );

  const selectedStudy = useMemo(() => {
    if (!selectedStudyId) return undefined;
    return tableData.find((study) =>
      [study.id, study.studyId, study.protocolId, study.protocolNumber, study.studyCode].some(
        (id) => id !== undefined && String(id) === selectedStudyId
      )
    );
  }, [tableData, selectedStudyId]);

  // Handle switching tabs while strictly preserving selected study
  const handleSelectTab = useCallback(
    (tabId: StudyTabId, subTab?: RecruitmentSubTabId) => {
      if (!selectedStudyId) return;

      const params = new URLSearchParams(location.search);
      params.set('studyId', selectedStudyId);
      params.set('tab', tabId);
      if (subTab) {
        params.set('subTab', subTab);
      } else {
        params.delete('subTab');
      }

      navigate(`${location.pathname}?${params.toString()}`);
    },
    [selectedStudyId, location.search, location.pathname, navigate]
  );

  const selectedStudyIds = selectedStudy
    ? [
        selectedStudy.id,
        selectedStudy.studyId,
        selectedStudy.protocolId,
        selectedStudy.protocolNumber,
        selectedStudy.studyCode,
      ]
        .filter((value) => value !== undefined && value !== null)
        .map(String)
    : [];

  const matchingParticipants = participants.filter((participant) =>
    [participant.studyId, participant.study?.id, participant.study?.studyId]
      .filter((value) => value !== undefined && value !== null)
      .some((value) => selectedStudyIds.includes(String(value)))
  );

  const weeklyRecruitment = useMemo(() => {
    const weekly = new Map<string, number>();
    matchingParticipants
      .filter(
        (participant) =>
          ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(String(participant.status || '').toUpperCase()) &&
          participant.enrolledAt
      )
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
      label: new Date(`${week}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      count,
    })).sort((a, b) => a.week.localeCompare(b.week));
  }, [matchingParticipants]);

  const activeEnrolledCount = matchingParticipants.filter((participant) =>
    ['ENROLLED', 'ACTIVE', 'COMPLETED'].includes(String(participant.status || '').toUpperCase())
  ).length;

  const recruitedCount =
    activeEnrolledCount > 0
      ? activeEnrolledCount
      : Math.max(0, Number(selectedStudy?.enrolled ?? selectedStudy?.enrolledParticipants) || 0);

  const targetCount = Math.max(
    0,
    Number(
      selectedStudy?.targetEnrollment ?? selectedStudy?.targetParticipants ?? selectedStudy?.sampleSize
    ) || 100
  );

  const recruitmentProgress =
    targetCount > 0 ? Math.min(100, Math.round((recruitedCount / targetCount) * 100)) : 0;
  const weeklyMaximum = Math.max(1, ...weeklyRecruitment.map((entry) => entry.count));

  // Resolved title and protocol
  const studyTitle =
    permissions?.studyName || selectedStudy?.title || selectedStudy?.name || 'Study Workspace';
  const studyCode =
    permissions?.studyCode ||
    selectedStudy?.protocolNumber ||
    selectedStudy?.protocolId ||
    selectedStudy?.studyCode ||
    selectedStudy?.id ||
    selectedStudyId ||
    '';
  const studyRole = permissions?.studyRole || selectedStudy?.studyRole || 'Study Member';
  const isArchived = Boolean(permissions?.archived || selectedStudy?.archived);

  // Check if current active tab is authorized
  const isAuthorizedForCurrentTab = useMemo(() => {
    if (!permissions) {
      return activeTab === 'dashboard';
    }
    return isStudyTabAuthorized(activeTab, permissions);
  }, [activeTab, permissions]);

  return (
    <div className="study-workspace">
      {/* 1. Loading State */}
      {(loading || permissionsLoading) && !selectedStudy && !permissions ? (
        <div className="study-selection-empty" role="status">
          <div className="study-loading-indicator">Loading study details…</div>
        </div>
      ) : isAccessDenied ? (
        /* 2. Unauthorized / Access Denied State for Inaccessible Study */
        <section className="study-access-denied-panel" role="alert">
          <div className="study-access-denied-panel__icon">
            <ShieldAlert size={28} />
          </div>
          <h2>Study Access Denied</h2>
          <p>{permissionsError || 'You do not have authorization to access this study.'}</p>
          <button
            type="button"
            className="study-access-denied-panel__btn"
            onClick={() => navigate('/studies')}
          >
            Return to Studies
          </button>
        </section>
      ) : permissionsError ? (
        /* 3. Study Not Found or Permission Resolution Error State */
        <section className="study-selection-empty" aria-live="polite">
          <div className="study-selection-empty__icon">
            <AlertTriangle size={24} />
          </div>
          <h1>{permissionsError.includes('not be found') ? 'Study Not Found' : 'Unable to Authorize Study'}</h1>
          <p>{permissionsError}</p>
        </section>
      ) : permissionsLoading ? (
        <div className="study-selection-empty" role="status">
          <div className="study-loading-indicator">Loading study permissions…</div>
        </div>
      ) : selectedStudy || permissions ? (
        /* 4. Active Selected Study Workspace */
        <section className="study-dashboard" aria-labelledby="study-dashboard-title">
          {/* Header Context Banner */}
          <header className="study-dashboard__header">
            <div>
              
              <h1 id="study-dashboard-title">{studyTitle}</h1>
              
            </div>
            {isArchived && (
              <div className="study-archived-badge" role="status">
                Archived Study
              </div>
            )}
          </header>

          {/* Legacy Ripple Study Navigation Tabs Strip */}
          {permissions && (
            <StudyNavigation
              permissions={permissions}
              activeTab={activeTab}
              activeSubTab={activeSubTab}
              onSelectTab={handleSelectTab}
              isParticipantUser={Boolean(context?.user?.roles?.includes('PARTICIPANT'))}
            />
          )}

          {/* Archived Study Warning */}
          {isArchived && (
            <div className="study-archived-banner" role="alert">
              This study is archived. All records are in read-only preservation mode.
            </div>
          )}

          {/* Tab Content Display */}
          <div className="study-tab-content-container">
            {!isAuthorizedForCurrentTab ? (
              <StudyUnauthorizedTab
                tabId={activeTab}
                studyName={studyTitle}
                onGoToDashboard={() => handleSelectTab('dashboard')}
              />
            ) : activeTab === 'dashboard' ? (
              <StudyDashboardTab
                selectedStudy={selectedStudy}
                targetCount={targetCount}
                recruitedCount={recruitedCount}
                recruitmentProgress={recruitmentProgress}
                weeklyRecruitment={weeklyRecruitment}
                weeklyMaximum={weeklyMaximum}
              />
            ) : activeTab === 'study_settings' ? (
              <StudySettingsWorkspace
                studyId={String(selectedStudy?.id ?? selectedStudyId ?? '')}
                studyName={studyTitle}
                isArchived={isArchived}
                canManageSettings={Boolean(
                  permissions?.permissions?.includes('STUDY_SETTINGS_MANAGE') ||
                  permissions?.studyPermission === 'STUDY_ADMIN' ||
                  context?.user?.roles?.includes('SITE_ADMIN')
                )}
                onStudyUpdated={() => {
                  fetchStudies();
                }}
              />
            ) : (
              <StudyTabPlaceholder
                tabId={activeTab}
                subTab={activeSubTab}
                studyName={studyTitle}
              />
            )}
          </div>
        </section>
      ) : (
        /* 5. Empty State: No Study Selected */
        <section className="study-selection-empty" aria-live="polite">
          <div className="study-selection-empty__icon">
            <Plus size={22} />
          </div>
          <h1>{selectedStudyId ? 'Study not found' : 'Select a study to continue'}</h1>
          <p>
            {selectedStudyId
              ? 'Choose another study from Select Study in the top navigation.'
              : 'Use Select Study in the top navigation to open its recruitment dashboard, or choose Add Study to create a study.'}
          </p>
        </section>
      )}

      <AddStudyModal
        isOpen={showAddStudy}
        onClose={() => setShowAddStudy(false)}
        studies={tableData}
        onStudyCreated={(newId) => {
          fetchStudies();
          navigate(`/studies?studyId=${encodeURIComponent(newId)}&tab=dashboard`);
        }}
      />
    </div>
  );
};

export default StudyModule;
