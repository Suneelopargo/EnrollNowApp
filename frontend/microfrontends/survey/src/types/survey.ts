// frontend/microfrontends/survey/src/types/survey.ts

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
