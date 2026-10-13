// frontend/microfrontends/participant/src/test/participant.test.ts
import { describe, it, expect, vi } from 'vitest';
import { ParticipantModule } from '../remoteEntry';

import { mapParticipantResponseToRecord } from '../hooks/useRegistry';
import { registryApi } from '../../../../shared/api/registryApi';

describe('Participant MFE Remote Entry', () => {
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

  it('correctly maps backend RegistryParticipantResponse to ParticipantRecord', () => {
    const backendDto = {
      id: 'part-uuid-101',
      globalId: 'GLB-999',
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      sex: 'Male',
      birthday: '1990-05-15',
      age: 36,
      city: 'Boston',
      state: 'MA',
      zipcode: '02115',
      phone: '555-0101',
      contactForFutureStudies: true,
      availableToAddStudy: true,
      globalLastContactDate: '2026-04-10T14:30:00Z',
      studies: [{ studyId: 'st-1', studyName: 'Autism Study' }],
    };

    const record = mapParticipantResponseToRecord(backendDto);
    expect(record.id).toBe('part-uuid-101');
    expect(record.name).toBe('John Doe');
    expect(record.gender).toBe('Male');
    expect(record.age).toBe('36');
    expect(record.ageNumeric).toBe(36);
    expect(record.city).toBe('Boston');
    expect(record.studies).toHaveLength(1);
    expect(record.studies?.[0].name).toBe('Autism Study');
    expect(record.contactForFutureStudies).toBe(true);
  });

  it('exports all 13 registry API methods', () => {
    expect(typeof registryApi.searchRegistryParticipants).toBe('function');
    expect(typeof registryApi.getRegistryFilterOptions).toBe('function');
    expect(typeof registryApi.getRegistryParticipant).toBe('function');
    expect(typeof registryApi.getRegistryParticipantLogs).toBe('function');
    expect(typeof registryApi.getRegistrySurveySubmissions).toBe('function');
    expect(typeof registryApi.getSavedRegistrySearches).toBe('function');
    expect(typeof registryApi.saveRegistrySearch).toBe('function');
    expect(typeof registryApi.deleteSavedSearch).toBe('function');
    expect(typeof registryApi.createRegistryParticipant).toBe('function');
    expect(typeof registryApi.updateRegistryParticipant).toBe('function');
    expect(typeof registryApi.deleteRegistryParticipant).toBe('function');
    expect(typeof registryApi.addRegistryParticipantToStudy).toBe('function');
    expect(typeof registryApi.exportRegistryParticipants).toBe('function');
  });
});
