// frontend/shared/api/surveyApi.ts - Centralized Survey & eConsent API
import { apiClient } from '../api-client';
import { getApiBaseUrl } from '../api-config';

export type QuestionType =
  | 'Single Choice'
  | 'Multiple Choice'
  | 'Rating'
  | 'Yes / No'
  | 'Dropdown'
  | 'Short Text'
  | 'Paragraph'
  | 'Number'
  | 'Date'
  | 'Date Time'
  | 'Email'
  | 'Phone'
  | 'File Upload'
  | 'Net Promoter Score'
  | 'Matrix / Likert'
  | 'Section / Page';

export interface Section {
  id?: number;
  title: string;
  description?: string;
  position: number;
}

export interface Question {
  id?: number;
  sectionId?: number | null;
  position: number;
  type: QuestionType;
  text: string;
  description?: string;
  required: boolean;
  options: string[];
}

export interface LogicRule {
  id?: number;
  ifQuestionId: number;
  condition: 'is' | 'is_not';
  value: string;
  thenAction: 'SHOW_QUESTION' | 'HIDE_QUESTION';
  thenQuestionId: number;
}

export interface Survey {
  id?: number;
  surveyCode?: string;
  studyId?: number | null;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  anonymousResponses: boolean;
  allowMultipleResponses: boolean;
  showProgressBar: boolean;
  thankYouMessage?: string;
  globalSubmission?: boolean;
  triggerEmailNotification?: boolean;
  enableEconsentCountersign?: boolean;
  requireRecaptcha?: boolean;
  publicToken?: string;
  createdAt?: string;
  updatedAt?: string;
  sections: Section[];
  questions: Question[];
  logicRules: LogicRule[];
  versionCount?: number;
  totalResponses?: number;
}

export interface SurveyListItem {
  id: number;
  surveyCode: string;
  studyId: number | null;
  title: string;
  description: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publicToken: string;
  questionsCount: number;
  sectionsCount: number;
  totalResponses: number;
  createdAt: string;
  updatedAt: string;
}

export type SurveySummary = SurveyListItem;

export interface SurveyAssignment {
  id: number;
  userId: number;
  surveyId: number;
  surveyCode: string;
  surveyTitle: string;
  status: 'PENDING' | 'COMPLETED';
  publicToken: string;
  assignedAt: string;
}

export interface AnswerItem {
  id?: number;
  questionId: number;
  questionText?: string;
  value: any;
}

export interface SurveyResponse {
  id: number;
  surveyId: number;
  surveyTitle: string;
  userId?: number;
  userEmail?: string;
  status: string;
  sessionToken?: string;
  startedAt: string;
  completedAt?: string;
  answers: AnswerItem[];
}

export interface DailyResponseStat {
  date: string;
  count: number;
  respondents: string[];
}

export interface SurveyDashboardData {
  totalSurveys: number;
  draftSurveys: number;
  publishedSurveys: number;
  totalResponses: number;
  completionRate: number;
  recentSurveys: SurveyListItem[];
  responsesByDay: DailyResponseStat[];
}

export interface SurveyAnalyticsData {
  surveyId: number;
  surveyTitle: string;
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageRating: number | null;
  responsesByDay: DailyResponseStat[];
}

export interface AiGenerateResponse {
  title: string;
  description: string;
  sections: Section[];
  questions: Question[];
  logicRules: LogicRule[];
}

export interface AiAssessment {
  responseId: number;
  summary: string;
  sentiment: string;
  clinicalFlags: string[];
  recommendations: string[];
}

export const createSurveyApiClient = (_apiBase?: string, _token?: string) => {
  const client = apiClient;

  const listSurveys = async (
    searchOrParams?: string | { search?: string; status?: string },
    status?: string
  ): Promise<SurveyListItem[]> => {
    const params =
      typeof searchOrParams === 'object' && searchOrParams !== null
        ? searchOrParams
        : { search: searchOrParams, status };
    const res = await client.get('/api/v1/surveys', { params });
    return res.data?.data || [];
  };

  const listResponses = async (surveyId: number): Promise<SurveyResponse[]> => {
    const res = await client.get(`/api/v1/surveys/${surveyId}/responses`);
    return res.data?.data || [];
  };

  const listAssignments = async (surveyId?: number): Promise<SurveyAssignment[]> => {
    const res = await client.get('/api/v1/surveys/assignments', { params: { surveyId } });
    return res.data?.data || [];
  };

  const getDashboard = async (): Promise<SurveyDashboardData> => {
    const res = await client.get('/api/v1/surveys/analytics/dashboard');
    return res.data?.data;
  };

  const generateSurveyAi = async (prompt: string, studyType?: string): Promise<AiGenerateResponse> => {
    const payload = studyType !== undefined ? { prompt, studyType } : { prompt };
    const res = await client.post('/api/v1/surveys/ai/generate', payload);
    return res.data?.data;
  };

  const suggestLogicAi = async (questions: Question[]): Promise<LogicRule[]> => {
    const res = await client.post('/api/v1/surveys/ai/suggest-logic', { questions });
    return res.data?.data?.suggestions || [];
  };

  const assessResponseAi = async (responseId: number): Promise<AiAssessment> => {
    const res = await client.post(`/api/v1/surveys/responses/${responseId}/assess`);
    return res.data?.data;
  };

  return {
    // Surveys
    listSurveys,
    getSurveys: listSurveys,

    getSurvey: async (id: number): Promise<Survey> => {
      const res = await client.get(`/api/v1/surveys/${id}`);
      return res.data?.data;
    },

    createSurvey: async (payload: Partial<Survey>): Promise<Survey> => {
      const res = await client.post('/api/v1/surveys', payload);
      return res.data?.data;
    },

    updateSurvey: async (id: number, payload: Partial<Survey>): Promise<Survey> => {
      const res = await client.put(`/api/v1/surveys/${id}`, payload);
      return res.data?.data;
    },

    publishSurvey: async (id: number): Promise<Survey> => {
      const res = await client.post(`/api/v1/surveys/${id}/publish`);
      return res.data?.data;
    },

    unpublishSurvey: async (id: number): Promise<Survey> => {
      const res = await client.post(`/api/v1/surveys/${id}/unpublish`);
      return res.data?.data;
    },

    duplicateSurvey: async (id: number): Promise<Survey> => {
      const res = await client.post(`/api/v1/surveys/${id}/duplicate`);
      return res.data?.data;
    },

    archiveSurvey: async (id: number): Promise<Survey> => {
      const res = await client.post(`/api/v1/surveys/${id}/archive`);
      return res.data?.data;
    },

    deleteSurvey: async (id: number): Promise<void> => {
      await client.delete(`/api/v1/surveys/${id}`);
    },

    // Public / Respondent Flow
    getPublicSurvey: async (publicToken: string): Promise<Survey> => {
      const res = await client.get(`/api/v1/surveys/public/${publicToken}`);
      return res.data?.data;
    },

    submitPublicResponse: async (
      publicToken: string,
      answers: { questionId: number; value: any }[],
      userEmail?: string
    ): Promise<SurveyResponse> => {
      const res = await client.post(`/api/v1/surveys/public/${publicToken}/responses`, { answers, userEmail });
      return res.data?.data;
    },

    submitResponse: async (
      surveyId: number,
      answers: { questionId: number; value: any }[],
      userId?: number
    ): Promise<SurveyResponse> => {
      const res = await client.post(`/api/v1/surveys/${surveyId}/responses`, { answers, userId });
      return res.data?.data;
    },

    // Responses
    listResponses,
    getSurveyResponses: listResponses,

    getMyResponses: async (): Promise<SurveyResponse[]> => {
      const res = await client.get('/api/v1/surveys/me/responses');
      return res.data?.data || [];
    },

    exportResponsesCsv: async (surveyId: number): Promise<Blob> => {
      const res = await client.get(`/api/v1/surveys/${surveyId}/responses/export`, {
        responseType: 'blob',
      });
      return res.data;
    },

    // Assignments
    listAssignments,
    getSurveyAssignments: listAssignments,

    assignSurvey: async (surveyId: number, userId: number): Promise<SurveyAssignment> => {
      const res = await client.post('/api/v1/surveys/assignments', { userId, surveyId });
      return res.data?.data;
    },

    unassignSurvey: async (assignmentId: number): Promise<void> => {
      await client.delete(`/api/v1/surveys/assignments/${assignmentId}`);
    },

    getMyAssignedSurveys: async (): Promise<SurveyAssignment[]> => {
      const res = await client.get('/api/v1/surveys/me/assigned');
      return res.data?.data || [];
    },

    // Analytics & Dashboard
    getDashboard,
    getDashboardData: getDashboard,

    getSurveyAnalytics: async (surveyId: number): Promise<SurveyAnalyticsData> => {
      const res = await client.get(`/api/v1/surveys/${surveyId}/analytics`);
      return res.data?.data;
    },

    exportResponsesCsvUrl: (surveyId: number): string => {
      const base = (getApiBaseUrl() || '/api').replace(/\/+$/, '');
      const prefix = base.endsWith('/api') ? base : `${base}/api`;
      return `${prefix}/v1/surveys/${surveyId}/responses/export`;
    },

    // AI Endpoints
    generateSurveyAi,
    generateWithAi: (prompt: string): Promise<AiGenerateResponse> => generateSurveyAi(prompt),

    suggestLogicAi,
    generateLogicWithAi: suggestLogicAi,

    assessResponseAi,
    assessResponseWithAi: assessResponseAi,
  };
};

export const surveyApi = createSurveyApiClient();
export default surveyApi;
