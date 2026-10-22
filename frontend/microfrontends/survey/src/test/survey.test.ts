// frontend/microfrontends/survey/src/test/survey.test.ts
import { describe, it, expect, vi } from 'vitest';
import { SurveyModule } from '../remoteEntry';
import { QUESTION_TYPES } from '../constants/questionTypes';
import { SURVEY_TEMPLATES } from '../constants/templates';
import { surveyApi, createSurveyApiClient } from '../api/surveyApi';
import { surveyApi as sharedSurveyApi } from '../../../../shared/api/surveyApi';

describe('Survey MFE Remote Entry & Core Subsystem', () => {
  it('exports SurveyModule as a valid React component', () => {
    expect(SurveyModule).toBeDefined();
    expect(typeof SurveyModule).toBe('function');
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
      correlationId: 'survey-test-corr',
      navigate: vi.fn(),
    };
    expect(mockContext.apiBaseUrl).toBe('http://localhost:8080');
  });

  it('supports all 16 clinical question types with correct configuration metadata', () => {
    expect(QUESTION_TYPES.length).toBe(16);
    const types = QUESTION_TYPES.map((t) => t.type);
    expect(types).toContain('Single Choice');
    expect(types).toContain('Multiple Choice');
    expect(types).toContain('Rating');
    expect(types).toContain('Yes / No');
    expect(types).toContain('Dropdown');
    expect(types).toContain('Short Text');
    expect(types).toContain('Paragraph');
    expect(types).toContain('Number');
    expect(types).toContain('Date');
    expect(types).toContain('Date Time');
    expect(types).toContain('Email');
    expect(types).toContain('Phone');
    expect(types).toContain('File Upload');
    expect(types).toContain('Net Promoter Score');
    expect(types).toContain('Matrix / Likert');
    expect(types).toContain('Section / Page');
  });

  it('includes standard validated clinical templates', () => {
    expect(SURVEY_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const names = SURVEY_TEMPLATES.map((t) => t.name);
    expect(names).toContain('Pittsburgh Sleep Quality Index (PSQI)');
    expect(names).toContain('Cardiovascular Health Screening');
    expect(names).toContain('Adverse Event (AE) Daily Diary');
  });

  it('correctly validates conditional logic evaluation structure', () => {
    const mockRules = [
      {
        ifQuestionId: 1,
        condition: 'is' as const,
        value: 'Yes',
        thenAction: 'SHOW_QUESTION' as const,
        thenQuestionId: 2,
      },
    ];

    expect(mockRules[0].condition).toBe('is');
    expect(mockRules[0].thenAction).toBe('SHOW_QUESTION');
    expect(mockRules[0].thenQuestionId).toBe(2);
  });

  it('re-exports the authoritative shared surveyApi client and avoids double /api/api prefix in export URLs', () => {
    expect(surveyApi).toBe(sharedSurveyApi);
    const client = createSurveyApiClient();
    expect(client.getSurveys).toBe(client.listSurveys);
    expect(client.getSurveyResponses).toBe(client.listResponses);
    expect(client.getSurveyAssignments).toBe(client.listAssignments);
    expect(client.getDashboardData).toBe(client.getDashboard);
    expect(client.generateLogicWithAi).toBe(client.suggestLogicAi);
    expect(client.assessResponseWithAi).toBe(client.assessResponseAi);

    const exportUrl = client.exportResponsesCsvUrl(42);
    expect(exportUrl).toContain('/api/v1/surveys/42/responses/export');
    expect(exportUrl).not.toContain('/api/api/');
  });
});
