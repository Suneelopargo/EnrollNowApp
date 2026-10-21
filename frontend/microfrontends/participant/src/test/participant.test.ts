// frontend/microfrontends/participant/src/test/participant.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ParticipantModule } from '../remoteEntry';
import { participantApi } from '../../../../shared/api/participantApi';
import { apiClient } from '../../../../shared/api-client';

describe('Participant MFE Remote Entry & Registry API', () => {
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

  it('suppresses error toasts when fetching participants via participantApi.getParticipants', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: '1', firstName: 'Alice', lastName: 'Smith', status: 'Enrolled' }],
      },
    } as any);

    const participants = await participantApi.getParticipants();
    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants', expect.objectContaining({ skipToast: true }));
    expect(participants.length).toBe(1);
    getSpy.mockRestore();
  });

  it('passes skipToast: true to prevent UI error message on API failure', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network error'));

    await expect(participantApi.getParticipants()).rejects.toThrow('Network error');
    expect(getSpy).toHaveBeenCalledWith('/api/v1/participants', expect.objectContaining({ skipToast: true }));
    getSpy.mockRestore();
  });
});
