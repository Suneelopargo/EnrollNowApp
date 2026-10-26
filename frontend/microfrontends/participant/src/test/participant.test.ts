// frontend/microfrontends/participant/src/test/participant.test.ts - Registry & Participant API Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ParticipantModule } from '../remoteEntry';
import { ParticipantGrid } from '../components/ParticipantGrid';
import { AddParticipantModal } from '../components/AddParticipantModal';
import { SaveFilterModal } from '../components/SaveFilterModal';
import { ParticipantDetailModal } from '../components/ParticipantDetailModal';
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

  it('unwraps nested { params } without producing double-nested params', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { items: [], totalCount: 0 },
    } as any);

    await participantApi.getParticipants({
      params: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        siteId: '22222222-2222-2222-2222-222222222222',
        contactFilter: 'all',
      },
    });

    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants', expect.objectContaining({
      params: {
        tenantId: '11111111-1111-1111-1111-111111111111',
        siteId: '22222222-2222-2222-2222-222222222222',
        contactFilter: 'all',
      },
      skipToast: true,
    }));
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
            age: '30',
            studies: [{ name: 'Cardio Study' }],
            lastContact: '2026-01-01',
          },
        ],
      })
    );
    expect(html).toContain('Search participants...');
    expect(html).toContain('data-grid-toolbar__search');
    expect(html).toContain('Add Participant');
  });

  it('checks for duplicate participants via participantApi.checkDuplicates', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [{ id: 'p-1', firstName: 'John', lastName: 'Doe', name: 'John Doe' }],
    } as any);

    const duplicates = await participantApi.checkDuplicates('John', 'Doe');
    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants/check-duplicate', expect.objectContaining({
      params: { firstName: 'John', lastName: 'Doe' },
    }));
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].name).toBe('John Doe');
    getSpy.mockRestore();
  });

  it('renders ParticipantDetailModal with participant identity, contact methods, family, and variables in the modal', () => {
    const testParticipant = {
      id: 'p-101',
      name: 'Eleanor Vance',
      firstName: 'Eleanor',
      lastName: 'Vance',
      status: 'Active',
      familyId: 'FAM-2001',
      globalId: 'GLB-9988',
      timezone: 'America/New_York (EDT)',
      tags: ['Pediatric', 'Cohort A'],
      contactForFutureStudies: true,
      age: '12',
      gender: 'Female',
      contactMethods: {
        primaryEmail: 'eleanor@example.org',
        phone: '+1 555-1234',
        address: '42 Main St',
        preferredMethod: 'Email',
      },
      demographics: {
        dob: '05/12/2014',
        gender: 'Female',
        ethnicity: 'Not Hispanic',
        race: 'Caucasian',
        primaryLanguage: 'English',
      },
      family: {
        familyRole: 'Proband',
        members: [
          { id: 'p-101', name: 'Eleanor Vance', age: '12', sex: 'Female' },
          { id: 'p-102', name: 'Thomas Vance', age: '45', sex: 'Male' },
        ],
      },
      variables: [
        { id: 'v-1', name: 'IQ Score', value: '115', type: 'Number', lastUpdated: '10/20/2026' },
      ],
    };

    const html = renderToStaticMarkup(
      React.createElement(ParticipantDetailModal, {
        isOpen: true,
        participant: testParticipant,
        onClose: vi.fn(),
        onSave: vi.fn(),
      })
    );

    expect(html).toContain('Participant Details');
    expect(html).toContain('Eleanor Vance');
    expect(html).toContain('GLB-9988');
    expect(html).toContain('FAM-2001');
    expect(html).toContain('Contact For Future Studies?');
    expect(html).toContain('Save Changes');
  });

  it('does not render ParticipantDetailModal when isOpen is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ParticipantDetailModal, {
        isOpen: false,
        participant: null,
        onClose: vi.fn(),
        onSave: vi.fn(),
      })
    );

    expect(html).toBe('');
  });

  it('renders LeftFilterPanel with Add Filter and Search buttons', async () => {
    const { LeftFilterPanel } = await import('../components/LeftFilterPanel');
    const onAddFilter = vi.fn();
    const onSearch = vi.fn();
    const html = renderToStaticMarkup(
      React.createElement(LeftFilterPanel, {
        contactFilter: 'all',
        setContactFilter: vi.fn(),
        availableFilter: 'all',
        setAvailableFilter: vi.fn(),
        searchTerm: '',
        setSearchTerm: vi.fn(),
        customFilters: [],
        onAddFilter,
        onUpdateFilter: vi.fn(),
        onRemoveFilter: vi.fn(),
        onClearFilters: vi.fn(),
        onSaveFilter: vi.fn(),
        onSearch,
      })
    );

    expect(html).toContain('Add Filter');
    expect(html).toContain('Clear Filters');
    expect(html).toContain('Save Filter');
    expect(html).toContain('Search');
  });

  it('renders FilterCard with single input for age equal operator', async () => {
    const { FilterCard } = await import('../components/FilterCard');
    const filter = {
      id: 'f-1',
      field: 'age',
      operator: 'equal to',
      value: '35',
    };
    const html = renderToStaticMarkup(
      React.createElement(FilterCard, {
        filter,
        index: 0,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(html).toContain('Age');
    expect(html).toContain('equal to');
    expect(html).toContain('value="35"');
  });

  it('renders FilterCard with dual range inputs when operator is between', async () => {
    const { FilterCard } = await import('../components/FilterCard');
    const filter = {
      id: 'f-2',
      field: 'age',
      operator: 'between',
      minValue: '20',
      maxValue: '40',
    };
    const html = renderToStaticMarkup(
      React.createElement(FilterCard, {
        filter,
        index: 0,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(html).toContain('filter-card-range-inputs');
    expect(html).toContain('value="20"');
    expect(html).toContain('value="40"');
  });

  it('renders FilterCard with date picker for dateCreated and lastContact', async () => {
    const { FilterCard } = await import('../components/FilterCard');
    const filter = {
      id: 'f-3',
      field: 'dateCreated',
      operator: 'equal to',
      value: '2026-10-23',
    };
    const html = renderToStaticMarkup(
      React.createElement(FilterCard, {
        filter,
        index: 0,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(html).toContain('type="date"');
    expect(html).toContain('value="2026-10-23"');
  });

  it('renders FilterCard with multi-select options for gender, ethnicity, race, and birthMonth', async () => {
    const { FilterCard } = await import('../components/FilterCard');
    const filter = {
      id: 'f-4',
      field: 'gender',
      operator: 'equal to',
      values: ['Male', 'Female'],
    };
    const html = renderToStaticMarkup(
      React.createElement(FilterCard, {
        filter,
        index: 0,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(html).toContain('Male');
    expect(html).toContain('Female');
    expect(html).toContain('✓');
  });

  it('validates filter rules correctly via validateFilterRule', async () => {
    const { validateFilterRule } = await import('../constants/filterMetadata');

    // Valid rule
    const validRule = { id: '1', field: 'age', operator: 'equal to', value: '30' };
    expect(validateFilterRule(validRule).isValid).toBe(true);

    // Missing value
    const emptyRule = { id: '2', field: 'age', operator: 'equal to', value: '' };
    expect(validateFilterRule(emptyRule).isValid).toBe(false);

    // Valid range
    const validRange = { id: '3', field: 'age', operator: 'between', minValue: '20', maxValue: '30' };
    expect(validateFilterRule(validRange).isValid).toBe(true);

    // Inverted range
    const invertedRange = { id: '4', field: 'age', operator: 'between', minValue: '50', maxValue: '20' };
    expect(validateFilterRule(invertedRange).isValid).toBe(false);

    // Missing range endpoint
    const missingMax = { id: '5', field: 'age', operator: 'between', minValue: '20', maxValue: '' };
    expect(validateFilterRule(missingMax).isValid).toBe(false);

    // Special no-value operator (has any value)
    const assignedRule = { id: '6', field: 'custom_123', operator: 'has any value' };
    expect(validateFilterRule(assignedRule).isValid).toBe(true);

    // Date range valid and inverted
    const validDateRange = { id: '7', field: 'dateCreated', operator: 'between', minValue: '2026-01-01', maxValue: '2026-12-31' };
    expect(validateFilterRule(validDateRange).isValid).toBe(true);
    const invertedDateRange = { id: '8', field: 'dateCreated', operator: 'between', minValue: '2026-12-31', maxValue: '2026-01-01' };
    expect(validateFilterRule(invertedDateRange).isValid).toBe(false);

    // Multi-select empty vs non-empty
    const emptyMulti = { id: '9', field: 'gender', operator: 'equal to', values: [] };
    expect(validateFilterRule(emptyMulti).isValid).toBe(false);
    const validMulti = { id: '10', field: 'gender', operator: 'equal to', values: ['Male'] };
    expect(validateFilterRule(validMulti).isValid).toBe(true);
  });

  it('renders FilterCard with no-value informational notice when operator is has any value or has no value', async () => {
    const { FilterCard } = await import('../components/FilterCard');
    const filter = {
      id: 'f-assigned',
      field: 'custom_status',
      operator: 'has any value',
      value: '',
    };
    const html = renderToStaticMarkup(
      React.createElement(FilterCard, {
        filter,
        index: 0,
        onUpdate: vi.fn(),
        onRemove: vi.fn(),
      })
    );

    expect(html).toContain('filter-card-no-value-notice');
    expect(html).toContain('No value input needed');
  });

  it('fetches and registers dynamic custom filter metadata and adapts operators', async () => {
    const {
      registerDynamicFilterFields,
      getAllFilterFields,
      getFieldDefinition,
      getOperatorsForField,
    } = await import('../constants/filterMetadata');

    const mockMetadata = [
      {
        id: 'custom_bp',
        label: 'Blood Pressure',
        placeholder: 'Filter by Blood Pressure...',
        type: 'number' as const,
      },
      {
        id: 'custom_handedness',
        label: 'Handedness',
        placeholder: 'Filter by Handedness...',
        type: 'multiselect' as const,
        options: [
          { label: 'Right', value: 'right' },
          { label: 'Left', value: 'left' },
        ],
      },
    ];

    registerDynamicFilterFields(mockMetadata);

    const allFields = getAllFilterFields();
    expect(allFields.some((f) => f.id === 'custom_bp')).toBe(true);
    expect(allFields.some((f) => f.id === 'custom_handedness')).toBe(true);

    const numDef = getFieldDefinition('custom_bp');
    expect(numDef.type).toBe('number');
    const numOps = getOperatorsForField('custom_bp');
    expect(numOps).toContain('greater than');
    expect(numOps).toContain('between');

    const catDef = getFieldDefinition('custom_handedness');
    expect(catDef.type).toBe('multiselect');
    expect(catDef.options?.length).toBe(2);
    const catOps = getOperatorsForField('custom_handedness');
    expect(catOps).toContain('equal to');
    expect(catOps).toContain('not equal to');
  });

  it('queries /api/v1/registry/filter-metadata via participantApi.getFilterMetadata', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        data: [
          { id: 'custom_var1', label: 'Marker X', type: 'text' },
        ],
      },
    } as any);

    const result = await participantApi.getFilterMetadata('study-123');
    expect(getSpy).toHaveBeenCalledWith(
      '/api/v1/registry/filter-metadata',
      expect.objectContaining({
        params: { studyId: 'study-123' },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('custom_var1');
  });
});
