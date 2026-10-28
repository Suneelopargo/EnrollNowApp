// frontend/microfrontends/study/src/remoteEntry.tsx - Study MFE Remote Entry & Multi-Tab Navigation
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MfeContext } from '../../../shared/contracts';
import { Plus, ShieldAlert, AlertTriangle, ArrowLeftRight, ChevronDown, Check } from 'lucide-react';
import { dashboardApi } from '../../../shared/api/dashboardApi';
import { participantApi, Participant } from '../../../shared/api/participantApi';
import { studyApi, Study, StudyNavigationPermissions, StudyApiRequestConfig } from '../../../shared/api/studyApi';
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
import { StudyDirectory } from './components/StudyDirectory';

export interface StudyModuleProps {
  context?: MfeContext;
}

export const StudyModule: React.FC<StudyModuleProps> = ({ context }) => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddStudy, setShowAddStudy] = useState(false);
  const [isStudySwitcherOpen, setIsStudySwitcherOpen] = useState(false);
  const studySwitcherRef = useRef<HTMLDivElement>(null);

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

  // Click-outside listener for Change Study switcher dropdown
  useEffect(() => {
    if (!isStudySwitcherOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (studySwitcherRef.current && !studySwitcherRef.current.contains(e.target as Node)) {
        setIsStudySwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStudySwitcherOpen]);

  const fetchStudies = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    try {
      const reqConfig: StudyApiRequestConfig = isSilent
        ? { skipToast: true, skipLoader: true, headers: { 'x-skip-loader': 'true' } }
        : { skipToast: true };
      const [studiesRes, overviewRes, participantsRes] = await Promise.allSettled([
        studyApi.getStudies(reqConfig),
        dashboardApi.getOverview(reqConfig),
        participantApi.getParticipants(reqConfig),
      ]);
      const registryStudies: Study[] =
        studiesRes.status === 'fulfilled' && Array.isArray(studiesRes.value) ? studiesRes.value : [];
      const overviewStudies: Array<Record<string, unknown>> =
        overviewRes.status === 'fulfilled' && Array.isArray(overviewRes.value?.recentStudies)
          ? (overviewRes.value.recentStudies as Array<Record<string, unknown>>)
          : [];
      const getStudyIdentifiers = (study: Record<string, unknown>) =>
        [study.id, study.studyId, study.protocolId, study.protocolNumber, study.studyCode]
          .filter((value) => value !== undefined && value !== null)
          .map(String);
      // Authoritative study list comes strictly from studyApi.getStudies() (/api/v1/studies).
      // Overview studies only enrich matching study records and never fabricate studies when registryStudies is empty.
      const sourceStudies = registryStudies;
      const mergedStudies: Study[] = sourceStudies.map((study) => {
        const ids = getStudyIdentifiers(study);
        const overviewStudy = overviewStudies.find((item) =>
          getStudyIdentifiers(item).some((id: string) => ids.includes(id))
        );
        const rawEnrolled =
          study.enrolled ??
          study.enrolledParticipants ??
          (typeof overviewStudy?.enrolled === 'number' ? overviewStudy.enrolled : undefined) ??
          (typeof overviewStudy?.enrolledParticipants === 'number' ? overviewStudy.enrolledParticipants : undefined) ??
          null;
        const rawTarget =
          study.targetEnrollment ??
          study.sampleSize ??
          study.targetParticipants ??
          (typeof overviewStudy?.targetEnrollment === 'number' ? overviewStudy.targetEnrollment : undefined) ??
          (typeof overviewStudy?.sampleSize === 'number' ? overviewStudy.sampleSize : undefined) ??
          null;
        return {
          ...overviewStudy,
          ...study,
          title: String(study.title || study.name || overviewStudy?.title || overviewStudy?.name || 'Untitled Study'),
          name: String(study.name || study.title || overviewStudy?.name || overviewStudy?.title || 'Untitled Study'),
          enrolled: typeof rawEnrolled === 'number' ? rawEnrolled : null,
          targetEnrollment: typeof rawTarget === 'number' ? rawTarget : null,
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
      } catch (err: unknown) {
        if (!isCancelled) {
          setPermissions(null);
          const errObj = err as { status?: number; response?: { status?: number } };
          const status = errObj?.status || errObj?.response?.status;
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
        protocolId: String(study.protocolId ?? study.protocolNumber ?? study.studyCode ?? study.id ?? ''),
        targetParticipants:
          study.targetParticipants ?? study.targetEnrollment ?? study.sampleSize ?? null,
        enrolledParticipants: study.enrolledParticipants ?? study.enrolled ?? null,
        siteCount: study.siteCount ?? null,
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
        if (!participant.enrolledAt) return;
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

  const rawTargetCount =
    selectedStudy?.targetEnrollment ?? selectedStudy?.targetParticipants ?? selectedStudy?.sampleSize;
  const targetCount: number | null =
    typeof rawTargetCount === 'number' && !Number.isNaN(rawTargetCount) && rawTargetCount > 0
      ? rawTargetCount
      : null;

  const recruitmentProgress: number | null =
    targetCount !== null && targetCount > 0
      ? Math.min(100, Math.round((recruitedCount / targetCount) * 100))
      : null;
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
          {/* Header Context Banner with Navigation Side-by-Side */}
          <header className="study-dashboard__header">
            <div className="study-dashboard__title-wrap">
              <h1 id="study-dashboard-title">{studyTitle}</h1>
              {isArchived && (
                <div className="study-archived-badge" role="status">
                  Archived Study
                </div>
              )}

              {/* Quick Study Switcher / Change Study Option */}
              <div className="study-switcher-wrap" ref={studySwitcherRef}>
                <button
                  type="button"
                  className="study-switcher-btn"
                  onClick={() => setIsStudySwitcherOpen((prev) => !prev)}
                  aria-expanded={isStudySwitcherOpen}
                  aria-haspopup="menu"
                  title="Switch or change study"
                >
                  <ArrowLeftRight size={13} />
                  <span>Change Study</span>
                  <ChevronDown
                    size={13}
                    className={`study-switcher-chevron ${isStudySwitcherOpen ? 'is-open' : ''}`}
                  />
                </button>
                {isStudySwitcherOpen && (
                  <div className="study-switcher-dropdown" role="menu">
                    <div className="study-switcher-header">
                      <span>Assigned Studies</span>
                      <button
                        type="button"
                        className="study-switcher-add-btn"
                        onClick={() => {
                          setIsStudySwitcherOpen(false);
                          setShowAddStudy(true);
                        }}
                      >
                        <Plus size={13} />
                        <span>Add Study</span>
                      </button>
                    </div>
                    <div className="study-switcher-list">
                      {tableData.map((s) => {
                        const isCurrent = String(s.id) === String(selectedStudy?.id ?? selectedStudyId);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className={`study-switcher-item ${isCurrent ? 'is-active' : ''}`}
                            onClick={() => {
                              setIsStudySwitcherOpen(false);
                              navigate(`/studies?studyId=${encodeURIComponent(String(s.id))}&tab=${activeTab}`);
                            }}
                          >
                            <div className="study-switcher-item-main">
                              <span className="study-switcher-item-name">{s.title || s.name}</span>
                              <span className="study-switcher-item-code">{s.protocolId || s.studyCode || ''}</span>
                            </div>
                            {isCurrent && <Check size={14} className="study-switcher-item-check" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="study-switcher-footer">
                      <button
                        type="button"
                        className="study-switcher-all-btn"
                        onClick={() => {
                          setIsStudySwitcherOpen(false);
                          navigate('/studies');
                        }}
                      >
                        <span>View All Assigned Studies</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Study Navigation Tabs Strip Side-by-Side */}
            {permissions && (
              <StudyNavigation
                permissions={permissions}
                activeTab={activeTab}
                activeSubTab={activeSubTab}
                onSelectTab={handleSelectTab}
                isParticipantUser={Boolean(context?.user?.roles?.includes('PARTICIPANT'))}
              />
            )}
          </header>

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
                  fetchStudies(true);
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
        /* 5. Assigned Studies Directory / Selection */
        <StudyDirectory
          studies={tableData}
          loading={loading}
          onSelectStudy={(studyId, tab) => {
            navigate(`/studies?studyId=${encodeURIComponent(studyId)}&tab=${tab || 'dashboard'}`);
          }}
          onAddStudy={() => setShowAddStudy(true)}
          onRefresh={() => fetchStudies()}
        />
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
