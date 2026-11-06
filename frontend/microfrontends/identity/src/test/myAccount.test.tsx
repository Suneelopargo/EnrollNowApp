// frontend/microfrontends/identity/src/test/myAccount.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfilePhoto } from '../components/MyAccount/Sidebar/ProfilePhoto';
import { AccountCreated } from '../components/MyAccount/Sidebar/AccountCreated';
import { RecentLogins } from '../components/MyAccount/Sidebar/RecentLogins';
import { PersonalDetailsForm } from '../components/MyAccount/PersonalDetails/PersonalDetailsForm';
import { StudyEmailSettingsTable } from '../components/MyAccount/StudySettings/StudyEmailSettingsTable';
import { TimezoneDiscrepancyModal } from '../components/MyAccount/Timezone/TimezoneDiscrepancyModal';
import { MyAccountPage } from '../components/MyAccount/MyAccountPage';

vi.mock('../../../../shared/api/accountApi', () => ({
  accountApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    requestEmailChange: vi.fn(),
    verifyEmail: vi.fn(),
    getEmailStatus: vi.fn(),
    getRecentLogins: vi.fn(),
    getStudyPreferences: vi.fn(),
    updateStudyPreference: vi.fn(),
    uploadProfilePhoto: vi.fn(),
    sendDailyDigestNow: vi.fn(),
  },
}));

vi.mock('../../../../shared/toaster', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

let capturedDataGridProps: any = null;
vi.mock('../../../../shared/design-system/components/DataGrid', () => ({
  DataGrid: (props: any) => {
    capturedDataGridProps = props;
    return (
      <div data-testid="data-grid">
        <div data-testid="columns">
          {props.columnDefs?.map((c: any) => c.headerName).join(', ')}
        </div>
        {props.rowData?.map((row: any, i: number) => (
          <div key={i} data-testid={`row-${i}`}>
            <span>{row.studyName}</span>
            <span>{row.studyRole}</span>
            <span>{row.accessRole}</span>
          </div>
        ))}
      </div>
    );
  },
}));

describe('My Account Components Static Markup & Structure Tests', () => {
  const mockProfile = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    email: 'alice@example.com',
    emailVerified: true,
    title: 'Dr.',
    firstName: 'Alice',
    lastName: 'Smith',
    phoneNumber: '+15551234',
    profilePhotoUrl: null,
    createdAt: '2026-01-15T12:00:00Z',
    lastLoginAt: '2026-11-06T10:00:00Z',
    timezone: 'America/New_York',
    ignoreTimezoneMismatch: false,
    passwordExpiringDays: 30,
  };

  const mockLogins = [
    {
      loginAt: '2026-11-06T10:00:00Z',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  ];

  const mockStudies = [
    {
      studyId: 'study-1',
      studyName: 'Cardiology Registry',
      studyRole: 'Principal Investigator',
      accessRole: 'Site Admin',
      dailyDigest: true,
      taskEmails: true,
      participantEmails: false,
      surveySubmissions: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProfilePhoto with placeholder and file input button', () => {
    const html = renderToStaticMarkup(<ProfilePhoto url={null} onPhotoUpdated={vi.fn()} />);
    expect(html).toContain('Select Profile Image');
    expect(html).toContain('account-avatar-placeholder');
  });

  it('renders AccountCreated date formatted with user timezone', () => {
    const html = renderToStaticMarkup(
      <AccountCreated createdAt="2026-01-15T12:00:00Z" timezone="America/New_York" />
    );
    expect(html).toContain('Account Created');
    expect(html).toContain('January 15, 2026');
  });

  it('renders RecentLogins list with timestamp and IP address', () => {
    const html = renderToStaticMarkup(
      <RecentLogins logins={mockLogins} timezone="America/New_York" />
    );
    expect(html).toContain('Recent logins');
    expect(html).toContain('192.168.1.100');
  });

  it('renders PersonalDetailsForm with email, verified badge, and fields', () => {
    const html = renderToStaticMarkup(
      <PersonalDetailsForm
        profile={mockProfile}
        onProfileUpdated={vi.fn()}
        onRefreshRequested={vi.fn()}
      />
    );

    expect(html).toContain('Personal Details');
    expect(html).toContain('alice@example.com');
    expect(html).toContain('Verified');
    expect(html).toContain('Change Password');
    expect(html).toContain('value="Alice"');
    expect(html).toContain('value="Smith"');
    expect(html).toContain('Send Daily Digest Now');
  });

  it('renders StudyEmailSettingsTable with columns and checkboxes', () => {
    const html = renderToStaticMarkup(
      <StudyEmailSettingsTable
        preferences={mockStudies}
        onPreferencesUpdated={vi.fn()}
      />
    );

    expect(html).toContain('Cardiology Registry');
    expect(html).toContain('Principal Investigator');
    expect(html).toContain('Site Admin');
    expect(html).toContain('Daily Digest');
    expect(html).toContain('Task Emails');
    expect(html).toContain('Participant Emails');
    expect(html).toContain('Survey Submissions');
  });

  it('renders TimezoneDiscrepancyModal with prompt and options', () => {
    const html = renderToStaticMarkup(
      <TimezoneDiscrepancyModal
        isOpen={true}
        configuredTimezone="America/New_York"
        detectedTimezone="Europe/London"
        onClose={vi.fn()}
        onTimezoneUpdated={vi.fn()}
      />
    );

    expect(html).toContain('Timezone Discrepancy Detected');
    expect(html).toContain('Europe/London');
    expect(html).toContain('Yes, Update Timezone');
    expect(html).toContain('Never Ask Me Again');
    expect(html).toContain('No');
  });

  it('exports MyAccountPage as a valid component', () => {
    expect(MyAccountPage).toBeDefined();
    expect(typeof MyAccountPage).toBe('function');
  });
});
