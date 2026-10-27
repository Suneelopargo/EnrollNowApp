// frontend/microfrontends/participant/src/test/fullRegistryWorkflow.test.tsx - Tests for Full Registry Participant Workflows
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  participantApi,
  ParticipantCommentItem,
  CommunicationItem,
  ParticipantContactDetail,
  ParticipantAddressDetail,
  ConsentItem,
  ConsentOptionItem,
  SurveyAssignmentItem,
  SurveyOptionItem,
} from '../../../../shared/api/participantApi';
import { apiClient } from '../../../../shared/api-client';
import { ParticipantComments } from '../components/ParticipantComments';
import { ParticipantEmailSection } from '../components/ParticipantEmailSection';
import { ComposeEmailModal } from '../components/ComposeEmailModal';
import { ParticipantSmsSection } from '../components/ParticipantSmsSection';
import { ComposeSmsModal } from '../components/ComposeSmsModal';
import { ParticipantContactManagement } from '../components/ParticipantContactManagement';
import { AddContactModal } from '../components/AddContactModal';
import { AddAddressModal } from '../components/AddAddressModal';
import { ParticipantConsentSection } from '../components/ParticipantConsentSection';
import { RecordConsentModal } from '../components/RecordConsentModal';
import { ParticipantFormsSection } from '../components/ParticipantFormsSection';
import { AssignFormModal } from '../components/AssignFormModal';
import { ParticipantDetailModal } from '../components/ParticipantDetailModal';
import { ParticipantGrid } from '../components/ParticipantGrid';
import { ParticipantRecord } from '../types/participant';

describe('Full Registry Workflow - API Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const participantId = 'p-uuid-999';

  // 1. Comments API
  it('calls getComments and creates/pins comments via API', async () => {
    const mockComments: ParticipantCommentItem[] = [
      {
        id: 'c-1',
        participantId,
        authorName: 'Nurse Jackie',
        text: 'Followed up on intake questionnaire.',
        pinned: true,
        global: false,
        createdAt: '2026-04-10T09:00:00Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockComments } as any);
    const comments = await participantApi.getComments(participantId);
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/comments`,
      expect.objectContaining({ skipToast: true })
    );
    expect(comments).toHaveLength(1);
    expect(comments[0].pinned).toBe(true);
    getSpy.mockRestore();

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'c-2', participantId, text: 'New comment', pinned: false, global: false, createdAt: '2026-04-10T09:05:00Z' },
    } as any);
    const newComment = await participantApi.createComment(participantId, {
      text: 'New comment',
      pinned: false,
    });
    expect(postSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/comments`,
      { text: 'New comment', pinned: false },
      expect.anything()
    );
    expect(newComment.id).toBe('c-2');
    postSpy.mockRestore();

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: { id: 'c-1', participantId, text: 'New comment', pinned: true, global: false, createdAt: '2026-04-10T09:00:00Z' },
    } as any);
    const pinned = await participantApi.pinComment(participantId, 'c-1', true);
    expect(patchSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/comments/c-1/pin`,
      { sticky: true },
      expect.anything()
    );
    patchSpy.mockRestore();
  });

  // 2. Email API
  it('handles email list and sending via participantApi', async () => {
    const mockEmails: CommunicationItem[] = [
      {
        id: 'comm-1',
        participantId,
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        subject: 'Appointment Confirmation',
        body: 'Please confirm your appointment on Monday.',
        status: 'SENT',
        sentAt: '2026-04-12T14:00:00Z',
        pinned: true,
        recipients: [{ recipientType: 'TO', recipientValue: 'patient@example.com' }],
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockEmails } as any);
    const emails = await participantApi.getEmails(participantId);
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/emails`,
      expect.objectContaining({ skipToast: true })
    );
    expect(emails[0].subject).toBe('Appointment Confirmation');
    getSpy.mockRestore();

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'comm-2', subject: 'Welcome' },
    } as any);
    const sent = await participantApi.sendEmail(participantId, {
      to: ['patient@example.com'],
      subject: 'Welcome',
      body: '<p>Welcome!</p>',
    });
    expect(postSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/emails`,
      { to: ['patient@example.com'], subject: 'Welcome', body: '<p>Welcome!</p>' },
      expect.anything()
    );
    expect(sent.subject).toBe('Welcome');
    postSpy.mockRestore();
  });

  // 3. SMS API
  it('handles sms list and sending via participantApi', async () => {
    const mockSms: CommunicationItem[] = [
      {
        id: 'sms-1',
        participantId,
        channel: 'SMS',
        direction: 'OUTBOUND',
        body: 'Reminder: Study visit tomorrow at 10 AM.',
        status: 'DELIVERED',
        sentAt: '2026-04-14T08:00:00Z',
        pinned: false,
        recipients: [{ recipientType: 'TO', recipientValue: '+15551234567' }],
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockSms } as any);
    const smsList = await participantApi.getSms(participantId);
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/sms`,
      expect.objectContaining({ skipToast: true })
    );
    expect(smsList[0].channel).toBe('SMS');
    getSpy.mockRestore();

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'sms-2', body: 'Thank you' },
    } as any);
    const sentSms = await participantApi.sendSms(participantId, {
      toPhone: '+15559876543',
      body: 'Thank you',
    });
    expect(postSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/sms`,
      { toPhone: '+15559876543', body: 'Thank you' },
      expect.anything()
    );
    expect(sentSms.id).toBe('sms-2');
    postSpy.mockRestore();
  });

  // 4. Contact & Address Management API
  it('manages contacts and addresses via participantApi', async () => {
    const mockContacts: ParticipantContactDetail[] = [
      {
        id: 'cnt-1',
        participantId,
        contactName: 'Jane Doe',
        relationship: 'Mother',
        contactType: 'Phone',
        contactValue: '+15551234567',
        isPreferred: true,
        canLeaveMessage: true,
        primaryContact: true,
        active: true,
        createdAt: '2026-04-01T00:00:00Z',
      },
    ];

    const getContactsSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockContacts } as any);
    const contacts = await participantApi.getContacts(participantId);
    expect(getContactsSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contacts`,
      expect.objectContaining({ skipToast: true })
    );
    expect(contacts[0].contactName).toBe('Jane Doe');
    getContactsSpy.mockRestore();

    const postContactSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'cnt-2', contactName: 'John Doe', relationship: 'Father' },
    } as any);
    const newContact = await participantApi.createContact(participantId, {
      contactName: 'John Doe',
      relationship: 'Father',
    });
    expect(newContact.relationship).toBe('Father');
    postContactSpy.mockRestore();

    const mockAddresses: ParticipantAddressDetail[] = [
      {
        id: 'addr-1',
        participantId,
        addressType: 'HOME',
        addressLine1: '123 Main St',
        city: 'Boston',
        stateRegion: 'MA',
        postalCode: '02115',
        primaryAddress: true,
        active: true,
        createdAt: '2026-04-01T00:00:00Z',
      },
    ];
    const getAddrSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockAddresses } as any);
    const addresses = await participantApi.getAddresses(participantId);
    expect(addresses[0].city).toBe('Boston');
    getAddrSpy.mockRestore();
  });

  // 5. Consent API
  it('records and queries consents via participantApi', async () => {
    const mockConsents: ConsentItem[] = [
      {
        id: 'cns-1',
        participantId,
        studyId: 'std-1',
        studyName: 'Pediatric Oncology Study',
        consentVersionId: 'ver-1',
        consentVersionTitle: 'Main Informed Consent',
        versionNumber: '2.0',
        status: 'CONSENTED',
        consentedAt: '2026-03-01T12:00:00Z',
        consentMethod: 'ELECTRONIC',
        createdAt: '2026-03-01T12:00:00Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockConsents } as any);
    const consents = await participantApi.getConsents(participantId);
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consents`,
      expect.objectContaining({ skipToast: true })
    );
    expect(consents[0].status).toBe('CONSENTED');
    getSpy.mockRestore();

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'cns-2', status: 'CONSENTED' },
    } as any);
    const recorded = await participantApi.recordConsent(participantId, {
      studyId: 'std-1',
      consentVersionId: 'ver-1',
      status: 'CONSENTED',
    });
    expect(recorded.id).toBe('cns-2');
    postSpy.mockRestore();
  });

  // 6. Forms API
  it('manages participant survey assignments via participantApi', async () => {
    const mockForms: SurveyAssignmentItem[] = [
      {
        id: 'asg-1',
        participantId,
        surveyVersionId: 'v-1',
        surveyName: 'Health Quality Survey',
        surveyCode: 'HQS-2026',
        studyName: 'Main Registry',
        status: 'ASSIGNED',
        assignedAt: '2026-04-01T10:00:00Z',
        dueAt: '2026-05-01T23:59:59Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: mockForms } as any);
    const forms = await participantApi.getForms(participantId);
    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/forms`,
      expect.objectContaining({ skipToast: true })
    );
    expect(forms[0].surveyName).toBe('Health Quality Survey');
    getSpy.mockRestore();

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: { id: 'asg-1', status: 'COMPLETED' },
    } as any);
    const updated = await participantApi.updateFormStatus(participantId, 'asg-1', 'COMPLETED');
    expect(patchSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/forms/asg-1/status`,
      null,
      expect.objectContaining({ params: expect.objectContaining({ status: 'COMPLETED' }) })
    );
    expect(updated.status).toBe('COMPLETED');
    patchSpy.mockRestore();
  });
});

describe('Full Registry Workflow - React Components Static Rendering', () => {
  const dummyParticipant: ParticipantRecord = {
    id: 'p-100',
    name: 'Emily Davis',
    firstName: 'Emily',
    lastName: 'Davis',
    familyId: 'FAM-88',
    globalId: 'GLB-4432',
    status: 'Consented',
    contactForFutureStudies: true,
    globalDateOfLastContact: '04/20/2026',
    timezone: 'America/New_York (EDT)',
    tags: ['Pediatric', 'VIP'],
    demographics: {
      dob: '2012-05-15',
      gender: 'Female',
      race: 'Caucasian',
      ethnicity: 'Not Hispanic or Latino',
      primaryLanguage: 'English',
    },
    contactMethods: {
      primaryEmail: 'emily.davis@example.com',
      phone: '+1-555-0199',
      address: '742 Evergreen Terrace, Springfield',
      preferredMethod: 'Email',
    },
    family: {
      familyRole: 'Proband',
    },
    studies: [{ name: 'Study Alpha' }],
  };

  it('renders ParticipantComments with title and actions', () => {
    const html = renderToStaticMarkup(
      <ParticipantComments
        participantId="p-100"
        participantName="Emily Davis"
        studyId="Study Alpha"
      />
    );
    expect(html).toContain('Comments');
    expect(html).toContain('Add Comment');
    expect(html).toContain('Pin Comment');
  });

  it('renders ParticipantEmailSection with compose trigger', () => {
    const html = renderToStaticMarkup(
      <ParticipantEmailSection
        participantId="p-100"
        participantName="Emily Davis"
      />
    );
    expect(html).toContain('Email Communication History');
    expect(html).toContain('Compose Email');
  });

  it('renders ComposeEmailModal when open', () => {
    const html = renderToStaticMarkup(
      <ComposeEmailModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onEmailSent={() => {}}
      />
    );
    expect(html).toContain('Compose Email');
    expect(html).toContain('Subject');
  });

  it('renders ParticipantSmsSection with compose trigger', () => {
    const html = renderToStaticMarkup(
      <ParticipantSmsSection
        participantId="p-100"
        participantName="Emily Davis"
      />
    );
    expect(html).toContain('SMS Communication Gateway');
    expect(html).toContain('Send SMS');
  });

  it('renders ComposeSmsModal when open', () => {
    const html = renderToStaticMarkup(
      <ComposeSmsModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onSmsSent={() => {}}
      />
    );
    expect(html).toContain('Send SMS');
    expect(html).toContain('Message');
  });

  it('renders ParticipantContactManagement with Contact Persons and Addresses', () => {
    const html = renderToStaticMarkup(
      <ParticipantContactManagement
        participantId="p-100"
        participantName="Emily Davis"
      />
    );
    expect(html).toContain('Contact Methods &amp; Authorized Contacts');
    expect(html).toContain('Participant Addresses');
    expect(html).toContain('Add Contact');
    expect(html).toContain('Add Address');
  });

  it('renders AddContactModal and AddAddressModal', () => {
    const contactModal = renderToStaticMarkup(
      <AddContactModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onContactAdded={() => {}}
      />
    );
    expect(contactModal).toContain('Add Contact Method');
    expect(contactModal).toContain('Relationship');

    const addressModal = renderToStaticMarkup(
      <AddAddressModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onAddressAdded={() => {}}
      />
    );
    expect(addressModal).toContain('Add Address');
    expect(addressModal).toContain('Street Address');
  });

  it('renders ParticipantConsentSection and RecordConsentModal', () => {
    const consentSection = renderToStaticMarkup(
      <ParticipantConsentSection
        participantId="p-100"
        participantName="Emily Davis"
      />
    );
    expect(consentSection).toContain('Study Consents');
    expect(consentSection).toContain('Record Consent');

    const consentModal = renderToStaticMarkup(
      <RecordConsentModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onConsentRecorded={() => {}}
      />
    );
    expect(consentModal).toContain('Record Consent Decision');
  });

  it('renders ParticipantFormsSection and AssignFormModal', () => {
    const formsSection = renderToStaticMarkup(
      <ParticipantFormsSection
        participantId="p-100"
        participantName="Emily Davis"
      />
    );
    expect(formsSection).toContain('Forms &amp; Surveys');
    expect(formsSection).toContain('Assign Form');

    const assignModal = renderToStaticMarkup(
      <AssignFormModal
        isOpen={true}
        onClose={() => {}}
        participantId="p-100"
        participantName="Emily Davis"
        onFormAssigned={() => {}}
      />
    );
    expect(assignModal).toContain('Assign Form / Survey');
  });

  it('renders ParticipantDetailModal with complete navigation and sub-tabs', () => {
    const modalHtml = renderToStaticMarkup(
      <ParticipantDetailModal
        isOpen={true}
        onClose={() => {}}
        participant={dummyParticipant}
        onSave={() => {}}
      />
    );

    // Header & identity
    expect(modalHtml).toContain('Emily Davis');
    expect(modalHtml).toContain('GLB-4432');
    expect(modalHtml).toContain('FAM-88');

    // Top Navigation Tabs
    expect(modalHtml).toContain('Overview');
    expect(modalHtml).toContain('Contact Methods');
    expect(modalHtml).toContain('Demographics');
    expect(modalHtml).toContain('Family');
    expect(modalHtml).toContain('Variables');

    // Sub-Tabs
    expect(modalHtml).toContain('Comments');
    expect(modalHtml).toContain('Email');
    expect(modalHtml).toContain('Text');
    expect(modalHtml).toContain('Contact');
    expect(modalHtml).toContain('Consent');
    expect(modalHtml).toContain('Forms');
  });

  // 7. Potential Duplicate Participants Workflow
  it('renders ParticipantGrid toolbar with Potential Duplicate Participants toggle and count', () => {
    // Normal mode (All Participants)
    const allHtml = renderToStaticMarkup(
      <ParticipantGrid
        participants={[dummyParticipant]}
        totalCount={964}
        duplicatesOnly={false}
      />
    );
    expect(allHtml).toContain('All Participants');
    expect(allHtml).toContain('(964)');
    expect(allHtml).toContain('potential-duplicates-toggle');
    expect(allHtml).toContain('Display only potential participant duplicates');

    // Duplicates mode
    const dupHtml = renderToStaticMarkup(
      <ParticipantGrid
        participants={[dummyParticipant]}
        totalCount={254}
        duplicatesOnly={true}
      />
    );
    expect(dupHtml).toContain('Potential Duplicate Participants');
    expect(dupHtml).toContain('(254)');
    expect(dupHtml).toContain('participant-dupes');
    expect(dupHtml).toContain('btn-info');
  });

  it('forwards duplicatesOnly parameter in participantApi.getParticipants and exportRegistry', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [] } as any);

    await participantApi.getParticipants({ duplicatesOnly: true });
    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/participants',
      expect.objectContaining({
        params: expect.objectContaining({ duplicatesOnly: true }),
      })
    );

    await participantApi.exportRegistry({ duplicatesOnly: true });
    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/registry/export',
      expect.objectContaining({
        params: expect.objectContaining({ duplicatesOnly: true }),
        responseType: 'blob',
      })
    );
  });
});
