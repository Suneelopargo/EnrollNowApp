// frontend/microfrontends/identity/src/components/MyAccount/MyAccountPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  accountApi,
  UserProfile,
  RecentLogin,
  StudyNotificationPreference,
} from '../../../../../shared/api/accountApi';
import { LoadingSpinner } from '../../../../../shared/design-system/components/LoadingSpinner';
import { MyAccountSidebar } from './Sidebar/MyAccountSidebar';
import { PersonalDetailsForm } from './PersonalDetails/PersonalDetailsForm';
import { StudyEmailSettingsTable } from './StudySettings/StudyEmailSettingsTable';
import { TimezoneDiscrepancyModal } from './Timezone/TimezoneDiscrepancyModal';
import { toast } from '../../../../../shared/toaster';

export const MyAccountPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [logins, setLogins] = useState<RecentLogin[]>([]);
  const [studies, setStudies] = useState<StudyNotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Timezone discrepancy modal state
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [detectedTimezone, setDetectedTimezone] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [profileData, loginsData, studiesData] = await Promise.all([
        accountApi.getProfile(),
        accountApi.getRecentLogins().catch(() => []),
        accountApi.getStudyPreferences().catch(() => []),
      ]);

      setProfile(profileData);
      setLogins(loginsData);
      setStudies(studiesData);

      // Check timezone discrepancy
      try {
        const guessed = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setDetectedTimezone(guessed);
        if (
          guessed &&
          profileData.timezone &&
          profileData.timezone !== guessed &&
          !profileData.ignoreTimezoneMismatch
        ) {
          setIsTimezoneModalOpen(true);
        }
      } catch {
        // ignore Intl errors
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load My Account settings';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="account-loading-wrapper">
        <LoadingSpinner message="Loading My Account settings..." />
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="account-error-container">
        <div className="alert alert-danger" role="alert">
          <h4>Unable to Load Account</h4>
          <p>{loadError || 'Account details could not be retrieved. Please check your session and connection.'}</p>
          <button type="button" className="btn btn-primary" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const prevLogin = logins.length > 1 ? logins[1].loginAt : profile?.lastLoginAt;

  return (
    <div className="account-page-container">
      <div className="account-layout-row">
        {/* Left Sidebar */}
        <div className="account-layout-sidebar-col">
          <MyAccountSidebar
            profile={profile}
            logins={logins}
            onPhotoUpdated={(newUrl) => {
              setProfile((prev) => (prev ? { ...prev, profilePhotoUrl: newUrl } : null));
            }}
          />
        </div>

        {/* Right Content */}
        <div className="account-layout-content-col">
          <header className="account-content-header">
            <h1 className="account-main-title">Edit My Account Settings</h1>
          </header>

          <PersonalDetailsForm
            profile={profile}
            prevLogin={prevLogin}
            onProfileUpdated={(updated) => {
              setProfile(updated);
            }}
            onRefreshRequested={loadData}
          />

          <StudyEmailSettingsTable
            preferences={studies}
            onPreferencesUpdated={(updated) => {
              setStudies(updated);
            }}
          />
        </div>
      </div>

      {/* Timezone discrepancy modal */}
      {isTimezoneModalOpen && profile.timezone && (
        <TimezoneDiscrepancyModal
          isOpen={isTimezoneModalOpen}
          configuredTimezone={profile.timezone}
          detectedTimezone={detectedTimezone}
          currentFirstName={profile.firstName}
          currentLastName={profile.lastName}
          onClose={() => setIsTimezoneModalOpen(false)}
          onTimezoneUpdated={(newTz) => {
            setProfile((prev) => (prev ? { ...prev, timezone: newTz } : null));
          }}
        />
      )}
    </div>
  );
};

export default MyAccountPage;
