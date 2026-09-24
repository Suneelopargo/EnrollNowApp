// frontend/microfrontends/survey/src/api/surveyApi.ts
import axios from 'axios';
import {
  Survey,
  SurveyListItem,
  SurveyAssignment,
  SurveyResponse,
  SurveyDashboardData,
  SurveyAnalyticsData,
  AiGenerateResponse,
  AiAssessment,
  Question,
  LogicRule,
} from '../types/survey';

const DEFAULT_BASE_URL = 'http://localhost:8087';

export const createSurveyApiClient = (apiBase: string = DEFAULT_BASE_URL, token?: string) => {
  const client = axios.create({
    baseURL: apiBase,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return {
    // Surveys
    listSurveys: async (search?: string, status?: string): Promise<SurveyListItem[]> => {
      const res = await client.get('/api/v1/surveys', { params: { search, status } });
      return res.data?.data || [];
    },

    getSurveys: async (search?: string, status?: string): Promise<SurveyListItem[]> => {
      const res = await client.get('/api/v1/surveys', { params: { search, status } });
      return res.data?.data || [];
    },

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
    listResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
      const res = await client.get(`/api/v1/surveys/${surveyId}/responses`);
      return res.data?.data || [];
    },

    getSurveyResponses: async (surveyId: number): Promise<SurveyResponse[]> => {
      const res = await client.get(`/api/v1/surveys/${surveyId}/responses`);
      return res.data?.data || [];
    },

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
    listAssignments: async (surveyId?: number): Promise<SurveyAssignment[]> => {
      const res = await client.get('/api/v1/surveys/assignments', { params: { surveyId } });
      return res.data?.data || [];
    },

    getSurveyAssignments: async (surveyId?: number): Promise<SurveyAssignment[]> => {
      const res = await client.get('/api/v1/surveys/assignments', { params: { surveyId } });
      return res.data?.data || [];
    },

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
    getDashboard: async (): Promise<SurveyDashboardData> => {
      const res = await client.get('/api/v1/surveys/analytics/dashboard');
      return res.data?.data;
    },

    getDashboardData: async (): Promise<SurveyDashboardData> => {
      const res = await client.get('/api/v1/surveys/analytics/dashboard');
      return res.data?.data;
    },

    getSurveyAnalytics: async (surveyId: number): Promise<SurveyAnalyticsData> => {
      const res = await client.get(`/api/v1/surveys/${surveyId}/analytics`);
      return res.data?.data;
    },

    exportResponsesCsvUrl: (surveyId: number) => {
      return `${apiBase}/api/v1/surveys/${surveyId}/responses/export`;
    },

    // AI Endpoints
    generateSurveyAi: async (prompt: string, studyType?: string): Promise<AiGenerateResponse> => {
      const res = await client.post('/api/v1/surveys/ai/generate', { prompt, studyType });
      return res.data?.data;
    },

    generateWithAi: async (prompt: string): Promise<AiGenerateResponse> => {
      const res = await client.post('/api/v1/surveys/ai/generate', { prompt });
      return res.data?.data;
    },

    suggestLogicAi: async (questions: Question[]): Promise<LogicRule[]> => {
      const res = await client.post('/api/v1/surveys/ai/suggest-logic', { questions });
      return res.data?.data?.suggestions || [];
    },

    generateLogicWithAi: async (questions: Question[]): Promise<LogicRule[]> => {
      const res = await client.post('/api/v1/surveys/ai/suggest-logic', { questions });
      return res.data?.data?.suggestions || [];
    },

    assessResponseAi: async (responseId: number): Promise<AiAssessment> => {
      const res = await client.post(`/api/v1/surveys/responses/${responseId}/assess`);
      return res.data?.data;
    },

    assessResponseWithAi: async (responseId: number): Promise<AiAssessment> => {
      const res = await client.post(`/api/v1/surveys/responses/${responseId}/assess`);
      return res.data?.data;
    },
  };
};

export const surveyApi = createSurveyApiClient();
