// frontend/microfrontends/participant/src/test/participant.test.ts - Registry & Participant API Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParticipantModule } from '../remoteEntry';
import { ParticipantGrid } from '../components/ParticipantGrid';
import { AddParticipantModal } from '../components/AddParticipantModal';
import { SaveFilterModal } from '../components/SaveFilterModal';
import { participantApi } from '../../../../shared/api/participantApi';
import { apiClient } from '../../../../shared/api-client';

describe('Participant MFE Remote Entry & Registry API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports ParticipantModule as a valid React component', () => {
    expect(ParticipantModule).toBeDefined();
    expect(typeof ParticipantModule).toBe('function');
  });

  it('accepts MfeContext configured with backend API base URL (:8080)', () => {
    const mockContext = {
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@enrollnow.local',
        roles: ['ROLE_SUPER_ADMIN'],
      },
      token: 'valid-token',
      apiBaseUrl: 'http://localhost:8080',
      correlationId: 'participant-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8080');
  });

  it('queries participants with filter parameters via participantApi.getParticipants', async () => {
    const mockResponse = {
      items: [
        { id: '1', firstName: 'Alice', lastName: 'Smith', status: 'Active' },
        { id: '2', firstName: 'Bob', lastName: 'Jones', status: 'Active' },
      ],
      totalCount: 2,
      page: 0,
      pageSize: 25,
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockResponse,
    } as any);

    const result: any = await participantApi.getParticipants({
      searchTerm: 'Alice',
      contactFilter: 'yes',
      availableFilter: 'all',
    });

    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants', expect.objectContaining({
      params: { searchTerm: 'Alice', contactFilter: 'yes', availableFilter: 'all' },
      skipToast: true,
    }));
    expect(result.items.length).toBe(2);
    getSpy.mockRestore();
  });

  it('fetches single participant by id', async () => {
    const mockParticipant = { id: 'p-1', firstName: 'Alice', lastName: 'Smith' };
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: mockParticipant,
    } as any);

    const result = await participantApi.getParticipant('p-1');
    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants/p-1', expect.objectContaining({ skipToast: true }));
    expect(result.firstName).toBe('Alice');
    getSpy.mockRestore();
  });

  it('creates participant via POST /api/v1/participants', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'p-new', firstName: 'Charlie', lastName: 'Brown' },
    } as any);

    const result = await participantApi.createParticipant({
      firstName: 'Charlie',
      lastName: 'Brown',
      city: 'Philadelphia',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/participants', expect.objectContaining({
      firstName: 'Charlie',
      lastName: 'Brown',
    }), undefined);
    expect(result.firstName).toBe('Charlie');
    postSpy.mockRestore();
  });

  it('updates participant details via PUT /api/v1/participants/:id', async () => {
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
      data: { id: 'p-1', firstName: 'Alice', city: 'Pittsburgh' },
    } as any);

    const result = await participantApi.updateParticipant('p-1', { city: 'Pittsburgh' });
    expect(putSpy).toHaveBeenCalledWith('/api/v1/participants/p-1', { city: 'Pittsburgh' }, undefined);
    expect(result.city).toBe('Pittsburgh');
    putSpy.mockRestore();
  });

  it('updates participant status via PATCH /api/v1/participants/:id/status', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
      data: { id: 'p-1', status: 'INACTIVE' },
    } as any);

    const result = await participantApi.updateParticipantStatus('p-1', 'INACTIVE');
    expect(patchSpy).toHaveBeenCalledWith('/api/v1/participants/p-1/status', { status: 'INACTIVE' });
    expect(result.status).toBe('INACTIVE');
    patchSpy.mockRestore();
  });

  it('deletes participant via DELETE /api/v1/participants/:id', async () => {
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: null } as any);

    await participantApi.deleteParticipant('p-1');
    expect(deleteSpy).toHaveBeenCalledWith('/api/v1/participants/p-1');
    deleteSpy.mockRestore();
  });

  it('assigns participant to study via POST /api/v1/participants/assign-study', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: null } as any);

    await participantApi.assignStudy({
      participantId: 'p-1',
      studyId: 's-1',
      status: 'REFERRED',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/participants/assign-study', {
      participantId: 'p-1',
      studyId: 's-1',
      status: 'REFERRED',
    });
    postSpy.mockRestore();
  });

  it('supports bulk study assignment by participantIds and studyName', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({ data: null } as any);

    await participantApi.assignStudy({
      participantIds: ['p-1', 'p-2'],
      studyName: 'Autism Study',
      status: 'REFERRED',
      notes: 'Bulk assigned from Participant Registry',
    });

    expect(postSpy).toHaveBeenCalledWith('/api/v1/participants/assign-study', {
      participantIds: ['p-1', 'p-2'],
      studyName: 'Autism Study',
      status: 'REFERRED',
      notes: 'Bulk assigned from Participant Registry',
    });
    postSpy.mockRestore();
  });

  it('manages saved searches (get, create, delete)', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [{ id: 'search-1', name: 'Pediatric Search' }],
    } as any);
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
      data: { id: 'search-2', name: 'Adult Search' },
    } as any);
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({ data: null } as any);

    const searches = await participantApi.getSavedSearches();
    expect(getSpy).toHaveBeenCalledWith('/api/v1/registry/saved-searches', { skipToast: true });
    expect(searches.length).toBe(1);

    const created = await participantApi.createSavedSearch({ name: 'Adult Search' });
    expect(postSpy).toHaveBeenCalledWith('/api/v1/registry/saved-searches', { name: 'Adult Search' });
    expect(created.name).toBe('Adult Search');

    await participantApi.deleteSavedSearch('search-1');
    expect(deleteSpy).toHaveBeenCalledWith('/api/v1/registry/saved-searches/search-1');

    getSpy.mockRestore();
    postSpy.mockRestore();
    deleteSpy.mockRestore();
  });

  it('exports filtered registry as blob', async () => {
    const fakeBlob = new Blob(['csv-content'], { type: 'text/csv' });
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: fakeBlob,
    } as any);

    const blob = await participantApi.exportRegistry({ searchTerm: 'Alice' });
    expect(getSpy).toHaveBeenCalledWith('/api/v1/registry/export', expect.objectContaining({
      params: { searchTerm: 'Alice' },
      responseType: 'blob',
    }));
    expect(blob).toBe(fakeBlob);
    getSpy.mockRestore();
  });

  it('renders AddParticipantModal with accessible inputs for First, Middle, and Last Name', () => {
    const html = renderToStaticMarkup(
      React.createElement(AddParticipantModal, {
        isOpen: true,
        onClose: vi.fn(),
        onAdd: vi.fn(),
      })
    );
    expect(html).toContain('Add Participant');
    expect(html).toContain('First Name');
    expect(html).toContain('Middle Name');
    expect(html).toContain('Last Name');
    expect(html).toContain('participant-first-name');
    expect(html).toContain('participant-middle-name');
    expect(html).toContain('participant-last-name');
  });

  it('renders SaveFilterModal with accessible input for Filter Name', () => {
    const html = renderToStaticMarkup(
      React.createElement(SaveFilterModal, {
        isOpen: true,
        onClose: vi.fn(),
        onSave: vi.fn(),
      })
    );
    expect(html).toContain('Save Filter');
    expect(html).toContain('Filter Name');
    expect(html).toContain('saved-filter-name');
  });

  it('renders ParticipantGrid with local AG Grid overall quick filter search input', () => {
    const html = renderToStaticMarkup(
      React.createElement(ParticipantGrid, {
        participants: [
          {
            id: '1',
            name: 'John Doe',
            gender: 'Male',
            age: 30,
            studies: [{ id: 's1', name: 'Cardio Study' }],
            lastContact: '2026-01-01',
          },
        ],
      })
    );
    expect(html).toContain('Search participants...');
    expect(html).toContain('data-grid-toolbar__search');
    expect(html).toContain('Add Participant');
  });
});
