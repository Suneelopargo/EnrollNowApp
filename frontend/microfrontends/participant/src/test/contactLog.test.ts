// frontend/microfrontends/participant/src/test/contactLog.test.ts - Unit & Integration Tests for Contact Logs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { participantApi, ContactLogItem } from '../../../../shared/api/participantApi';
import { apiClient } from '../../../../shared/api-client';
import { AddContactLogModal } from '../components/AddContactLogModal';
import { ParticipantContactLogs } from '../components/ParticipantContactLogs';
import { ParticipantDetailModal } from '../components/ParticipantDetailModal';
import { ParticipantRecord } from '../types/participant';

describe('Contact Log API Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const participantId = 'p-12345';
  const logId = 'log-67890';

  it('queries contact logs via participantApi.getContactLogs', async () => {
    const mockLogs: ContactLogItem[] = [
      {
        id: logId,
        participantId,
        dateTimeOfContact: '2026-04-15T10:30:00Z',
        contactType: 'Phone Call',
        contactedBy: 'user-1',
        contactedByName: 'Dr. Jane Smith',
        outcome: 'Completed',
        sticky: true,
        notify: false,
        global: true,
        lastContact: true,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockLogs,
    } as any);

    const result = await participantApi.getContactLogs(participantId, { studyId: 's-1' });

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs`,
      expect.objectContaining({
        params: { studyId: 's-1' },
        skipToast: true,
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].outcome).toBe('Completed');
    expect(result[0].sticky).toBe(true);
    getSpy.mockRestore();
  });

  it('fetches a single contact log via participantApi.getContactLog', async () => {
    const mockLog: ContactLogItem = {
      id: logId,
      participantId,
      dateTimeOfContact: '2026-04-15T10:30:00Z',
      contactType: 'Email',
      contactedBy: 'user-2',
      outcome: 'Sent',
      sticky: false,
      notify: false,
      global: false,
      lastContact: false,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockLog,
    } as any);

    const result = await participantApi.getContactLog(participantId, logId);

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs/${logId}`,
      expect.objectContaining({ skipToast: true })
    );
    expect(result.id).toBe(logId);
    expect(result.contactType).toBe('Email');
    getSpy.mockRestore();
  });

  it('fetches dynamic contact type options via participantApi.getContactTypeOptions', async () => {
    const mockTypes = [
      { label: 'Phone Call', value: 'Phone Call' },
      { label: 'Email', value: 'Email' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockTypes,
    } as any);

    const result = await participantApi.getContactTypeOptions();

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/participants/contact-types',
      expect.objectContaining({ skipToast: true })
    );
    expect(result).toHaveLength(2);
    expect(result[0].label).toBe('Phone Call');
    getSpy.mockRestore();
  });

  it('fetches dynamic contact outcomes via participantApi.getContactOutcomes', async () => {
    const mockOutcomes = [
      { id: '1', outcome: 'Completed', active: true },
      { id: '2', outcome: 'Left Voicemail', active: true },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockOutcomes,
    } as any);

    const result = await participantApi.getContactOutcomes();

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/participants/contact-outcomes',
      expect.objectContaining({ skipToast: true })
    );
    expect(result).toHaveLength(2);
    expect(result[1].outcome).toBe('Left Voicemail');
    getSpy.mockRestore();
  });

  it('fetches participant contact methods via participantApi.getParticipantContactMethods', async () => {
    const mockMethods = [
      { id: 'm-1', label: 'Primary Email: participant@example.com', value: 'participant@example.com', isPreferred: true, type: 'Email' },
      { id: 'm-2', label: 'Mobile: 555-1234', value: '555-1234', isPreferred: false, type: 'Phone' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockMethods,
    } as any);

    const result = await participantApi.getParticipantContactMethods(participantId);

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-methods`,
      expect.objectContaining({ skipToast: true })
    );
    expect(result).toHaveLength(2);
    expect(result[0].isPreferred).toBe(true);
    getSpy.mockRestore();
  });

  it('fetches team members via participantApi.getContactTeamMembers', async () => {
    const mockMembers = [
      { id: 'u-1', name: 'Coordinator Alice', email: 'alice@example.com', role: 'STUDY_COORDINATOR' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockMembers,
    } as any);

    const result = await participantApi.getContactTeamMembers();

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/participants/contact-team-members',
      expect.objectContaining({ skipToast: true })
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Coordinator Alice');
    getSpy.mockRestore();
  });

  it('persists a new contact log via participantApi.createContactLog', async () => {
    const payload = {
      dateTimeOfContact: '2026-04-15T14:00:00Z',
      contactType: 'Phone Call',
      contactedBy: 'u-1',
      outcome: 'Completed',
      spokeTo: 'Participant',
      regarding: 'Enrollment follow-up',
      comments: 'Participant agreed to screening visit.',
      lastContact: true,
      sticky: false,
      notify: false,
      global: true,
    };

    const mockCreated = { id: 'new-log-1', ...payload };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockCreated,
    } as any);

    const result = await participantApi.createContactLog(participantId, payload);

    expect(postSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs`,
      payload,
      expect.any(Object)
    );
    expect(result.id).toBe('new-log-1');
    expect(result.spokeTo).toBe('Participant');
    postSpy.mockRestore();
  });

  it('updates an existing contact log via participantApi.updateContactLog', async () => {
    const payload = {
      dateTimeOfContact: '2026-04-15T15:00:00Z',
      contactType: 'In-Person',
      contactedBy: 'u-1',
      outcome: 'Completed',
      comments: 'Updated comments after visit.',
    };

    const mockUpdated = { id: logId, ...payload };

    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: mockUpdated,
    } as any);

    const result = await participantApi.updateContactLog(participantId, logId, payload);

    expect(putSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs/${logId}`,
      payload,
      expect.any(Object)
    );
    expect(result.id).toBe(logId);
    expect(result.comments).toBe('Updated comments after visit.');
    putSpy.mockRestore();
  });

  it('toggles pin status via participantApi.pinContactLog', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: { id: logId, sticky: true },
    } as any);

    const result = await participantApi.pinContactLog(participantId, logId, true);

    expect(patchSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs/${logId}/pin`,
      { sticky: true },
      expect.any(Object)
    );
    expect(result.sticky).toBe(true);
    patchSpy.mockRestore();
  });

  it('deletes a contact log via participantApi.deleteContactLog', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: null,
    } as any);

    await participantApi.deleteContactLog(participantId, logId);

    expect(deleteSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/contact-logs/${logId}`,
      expect.any(Object)
    );
    deleteSpy.mockRestore();
  });
});

describe('AddContactLogModal Component', () => {
  it('renders required form fields and labels when open', () => {
    const html = renderToStaticMarkup(
      React.createElement(AddContactLogModal, {
        isOpen: true,
        onClose: vi.fn(),
        participantId: 'p-1',
        onSaved: vi.fn(),
      })
    );

    expect(html).toContain('Add Participant Contact');
    expect(html).toContain('Contact Type');
    expect(html).toContain('Contact Date/Time');
    expect(html).toContain('Contacted By');
    expect(html).toContain('Method');
    expect(html).toContain('Spoke To');
    expect(html).toContain('Regarding');
    expect(html).toContain('Outcome');
    expect(html).toContain('Comments');
    expect(html).toContain('Date of Last Contact');
    expect(html).toContain('Pin Contact');
    expect(html).toContain('Save');
  });

  it('renders in Edit mode when logToEdit is supplied', () => {
    const logToEdit: ContactLogItem = {
      id: 'log-100',
      participantId: 'p-1',
      dateTimeOfContact: '2026-03-20T10:00:00Z',
      contactType: 'Phone Call',
      contactedBy: 'u-1',
      spokeTo: 'Jane Doe',
      regarding: 'Follow-up',
      outcome: 'Completed',
      comments: 'Existing log notes',
      sticky: true,
      notify: false,
      global: true,
      lastContact: false,
    };

    const html = renderToStaticMarkup(
      React.createElement(AddContactLogModal, {
        isOpen: true,
        onClose: vi.fn(),
        participantId: 'p-1',
        logToEdit,
        onSaved: vi.fn(),
      })
    );

    expect(html).toContain('Edit Participant Contact');
    expect(html).toContain('Update');
    expect(html).toContain('Existing log notes');
  });

  it('does not render modal content when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(AddContactLogModal, {
        isOpen: false,
        onClose: vi.fn(),
        participantId: 'p-1',
        onSaved: vi.fn(),
      })
    );

    expect(html).not.toContain('Add Participant Contact');
  });
});

describe('ParticipantContactLogs Component', () => {
  it('renders contact history header and Add Contact button', () => {
    const html = renderToStaticMarkup(
      React.createElement(ParticipantContactLogs, {
        participantId: 'p-1',
        participantName: 'Alice Smith',
      })
    );

    expect(html).toContain('Contact History');
    expect(html).toContain('Add Contact');
  });
});

describe('ParticipantDetailModal Contact Log Integration', () => {
  const mockParticipant: ParticipantRecord = {
    id: 'p-100',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    status: 'Active',
    gender: 'Male',
    age: '35',
    lastContact: '2026-04-10T12:00:00Z',
    familyId: 'FAM-200',
    dateCreated: '2026-01-01',
    globalId: 'GLB-100',
    tags: ['Screened'],
    contactMethods: {
      primaryEmail: 'john@example.com',
      phone: '555-9876',
      preferredMethod: 'Email',
    },
    demographics: {
      gender: 'Male',
      primaryLanguage: 'English',
    },
    family: {
      familyRole: 'Proband',
      membersCount: 1,
    },
    variables: [],
  };

  it('renders without hardcoded mock comments', () => {
    const html = renderToStaticMarkup(
      React.createElement(ParticipantDetailModal, {
        isOpen: true,
        onClose: vi.fn(),
        participant: mockParticipant,
        onSave: vi.fn(),
      })
    );

    expect(html).not.toContain('Dr. Sarah Connor');
    expect(html).not.toContain('Initial screening completed. Eligible for Autism Study.');
    expect(html).toContain('John Doe');
  });
});
