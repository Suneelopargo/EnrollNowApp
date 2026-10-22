// frontend/microfrontends/study/src/test/study.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudyModule } from '../remoteEntry';
import { studyApi } from '../../../../shared/api/studyApi';
import { apiClient } from '../../../../shared/api-client';

describe('Study MFE Remote Entry & Study API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports StudyModule as a valid React component', () => {
    expect(StudyModule).toBeDefined();
    expect(typeof StudyModule).toBe('function');
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
      correlationId: 'study-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8080');
  });

  it('suppresses error toasts when fetching studies via studyApi.getStudies', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [{ id: 'study-1', title: 'Cardiology 101', status: 'ACTIVE' }],
    } as any);

    const studies = await studyApi.getStudies();
    expect(getSpy).toHaveBeenCalledWith('/api/v1/studies', expect.objectContaining({ skipToast: true }));
    expect(studies.length).toBe(1);
    getSpy.mockRestore();
  });

  it('passes skipToast: true to prevent 403 error toasts on study failure', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Forbidden'));

    await expect(studyApi.getStudies()).rejects.toThrow('Forbidden');
    expect(getSpy).toHaveBeenCalledWith('/api/v1/studies', expect.objectContaining({ skipToast: true }));
    getSpy.mockRestore();
  });
});
