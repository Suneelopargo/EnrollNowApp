// frontend/microfrontends/participant/src/test/consentLog.test.ts - Unit & Integration Tests for Consent Logs
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { participantApi, ConsentLogItem, ConsentTypeOption } from '../../../../shared/api/participantApi';
import { apiClient } from '../../../../shared/api-client';
import { RecordConsentModal } from '../components/RecordConsentModal';
import { ParticipantConsentSection } from '../components/ParticipantConsentSection';

describe('Consent Log API Client Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const participantId = 'p-12345';
  const logId = 'consent-log-67890';

  it('queries consent logs via participantApi.getConsentLogs', async () => {
    const mockLogs: ConsentLogItem[] = [
      {
        id: logId,
        participantId,
        consentDate: '2026-04-15T10:30:00Z',
        consentType: 'Initial Consent',
        consentTitle: 'Main Study Consent Form v2.1',
        consentedBy: 'Dr. Jane Smith',
        version: '2.1',
        expiration: '2027-04-15',
        fileAttached: true,
        fileName: 'signed_consent.pdf',
        fileSizeBytes: 1048576,
        fileContentType: 'application/pdf',
        comments: 'Patient signed electronically after detailed review.',
        sticky: true,
        notify: false,
        global: true,
        lastContact: true,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockLogs,
    } as any);

    const result = await participantApi.getConsentLogs(participantId, { studyId: 's-1' });

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs`,
      expect.objectContaining({
        params: { studyId: 's-1' },
        skipToast: true,
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].consentTitle).toBe('Main Study Consent Form v2.1');
    expect(result[0].sticky).toBe(true);
    expect(result[0].fileAttached).toBe(true);
    getSpy.mockRestore();
  });

  it('fetches a single consent log via participantApi.getConsentLog', async () => {
    const mockLog: ConsentLogItem = {
      id: logId,
      participantId,
      consentDate: '2026-04-15T10:30:00Z',
      consentType: 'Assent',
      consentTitle: 'Pediatric Assent',
      sticky: false,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockLog,
    } as any);

    const result = await participantApi.getConsentLog(participantId, logId);

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs/${logId}`,
      expect.objectContaining({ skipToast: true })
    );
    expect(result.id).toBe(logId);
    expect(result.consentType).toBe('Assent');
    getSpy.mockRestore();
  });

  it('fetches dynamic consent type options via participantApi.getConsentTypeOptions', async () => {
    const mockTypes: ConsentTypeOption[] = [
      { label: 'Initial Consent', value: 'Initial Consent' },
      { label: 'Re-Consent', value: 'Re-Consent' },
      { label: 'Assent', value: 'Assent' },
      { label: 'Age of Majority', value: 'Age of Majority' },
      { label: 'Other', value: 'Other' },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockTypes,
    } as any);

    const result = await participantApi.getConsentTypeOptions();

    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/participants/consent-types',
      expect.objectContaining({ skipToast: true })
    );
    expect(result).toHaveLength(5);
    expect(result.map((t) => t.value)).toContain('Initial Consent');
    getSpy.mockRestore();
  });

  it('creates a consent log with JSON payload via participantApi.createConsentLog', async () => {
    const mockCreated: ConsentLogItem = {
      id: 'new-log-1',
      participantId,
      consentDate: '2026-04-16T14:00:00Z',
      consentType: 'Initial Consent',
      consentTitle: 'Informed Consent Form A',
      sticky: false,
    };

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: mockCreated,
    } as any);

    const payload = {
      consentTitle: 'Informed Consent Form A',
      consentDate: '2026-04-16T14:00:00Z',
      consentType: 'Initial Consent',
    };

    const result = await participantApi.createConsentLog(participantId, payload);

    expect(postSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs`,
      payload,
      expect.any(Object)
    );
    expect(result.id).toBe('new-log-1');
    postSpy.mockRestore();
  });

  it('pins and unpins a consent log via participantApi.pinConsentLog', async () => {
    const mockUpdated: ConsentLogItem = {
      id: logId,
      participantId,
      consentDate: '2026-04-15T10:30:00Z',
      consentType: 'Initial Consent',
      consentTitle: 'Pinned Consent Form',
      sticky: true,
    };

    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: mockUpdated,
    } as any);

    const result = await participantApi.pinConsentLog(participantId, logId, true);

    expect(patchSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs/${logId}/pin`,
      { sticky: true },
      expect.any(Object)
    );
    expect(result.sticky).toBe(true);
    patchSpy.mockRestore();
  });

  it('deletes a consent log via participantApi.deleteConsentLog', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
      data: null,
    } as any);

    await participantApi.deleteConsentLog(participantId, logId);

    expect(deleteSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs/${logId}`,
      expect.any(Object)
    );
    deleteSpy.mockRestore();
  });

  it('generates attachment download URL with correct participant and log IDs', () => {
    const url = participantApi.getConsentAttachmentUrl(participantId, logId);
    expect(url).toContain(`/api/v1/participants/${participantId}/consent-logs/${logId}/attachment`);
  });

  it('loads consent attachments through the authenticated API client', async () => {
    const file = new Blob(['consent document'], { type: 'application/pdf' });
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: file } as any);

    const result = await participantApi.getConsentAttachment(participantId, logId, { tenantId: 'tenant-1' });

    expect(getSpy).toHaveBeenCalledWith(
      `/api/v1/participants/${participantId}/consent-logs/${logId}/attachment`,
      expect.objectContaining({
        params: { tenantId: 'tenant-1' },
        responseType: 'blob',
        skipToast: true,
      })
    );
    expect(result).toBe(file);
    getSpy.mockRestore();
  });
});

describe('RecordConsentModal UI Component Rendering', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    participantId: 'p-12345',
    participantName: 'Alice Walker',
    studyId: 's-99',
    studyTitle: 'Cardio Registry Study',
    onConsentSaved: vi.fn(),
  };

  it('renders modal in create mode with all required legacy field labels', () => {
    const html = renderToStaticMarkup(React.createElement(RecordConsentModal, defaultProps));

    // Field order & labels matching legacy Ripple:
    // Consent Title (required)
    expect(html).toContain('Consent Title');
    expect(html).toContain('consent-record-form');
    expect(html).toContain('consent-form-row');
    // Consent Date / Time (required)
    expect(html).toContain('Consent Date');
    // Consent Type (required)
    expect(html).toContain('Consent Type');
    // Version (optional)
    expect(html).toContain('Version');
    // Consented By (optional)
    expect(html).toContain('Consented By');
    // Expiration (optional)
    expect(html).toContain('Expiration');
    // Attachment (file upload)
    expect(html).toContain('Attachment');
    expect(html).toContain('(Max 5 MB)');
    // Comments
    expect(html).toContain('Comments');
    // Checkboxes / Mark Consent As
    expect(html).toContain('Mark Consent As');
    expect(html).toContain('Pin Consent');
    expect(html).not.toContain('>Contact</span>');
    expect(html).not.toContain('>Notify</span>');
    expect(html).not.toContain('>Global</span>');
    expect((html.match(/type="checkbox"/g) || [])).toHaveLength(1);
    // Save button
    expect(html).toContain('Save');
  });

  it('renders edit mode title when logToEdit is provided', () => {
    const logToEdit: ConsentLogItem = {
      id: 'log-edit-1',
      participantId: 'p-12345',
      consentDate: '2026-03-01T12:00:00Z',
      consentType: 'Re-Consent',
      consentTitle: 'Amend v3 Protocol',
      consentedBy: 'Dr. John Doe',
      version: '3.0',
      fileAttached: true,
      fileName: 'protocol_v3.pdf',
      sticky: true,
    };

    const html = renderToStaticMarkup(
      React.createElement(RecordConsentModal, {
        ...defaultProps,
        logToEdit,
      })
    );

    expect(html).toContain('Edit Participant Consent');
    expect(html).toContain('Update');
  });

  it('does not render modal content when closed', () => {
    const html = renderToStaticMarkup(
      React.createElement(RecordConsentModal, {
        ...defaultProps,
        isOpen: false,
      })
    );

    expect(html).not.toContain('Consent Title');
  });
});

describe('ParticipantConsentSection UI Component Rendering', () => {
  it('renders study consents header and Add Consent button', () => {
    const html = renderToStaticMarkup(
      React.createElement(ParticipantConsentSection, {
        participantId: 'p-12345',
        participantName: 'Alice Walker',
        studyId: 's-10',
      })
    );

    expect(html).toContain('Study Consents');
    expect(html).toContain('Add Consent');
  });
});
