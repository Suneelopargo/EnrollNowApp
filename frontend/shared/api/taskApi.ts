// frontend/shared/api/taskApi.ts - Centralized Task & Operations API
import { apiClient } from '../api-client';

export interface TaskItem {
  taskId: string;
  id?: string;
  title: string;
  description?: string;
  category?: string;
  taskType?: string;
  studyId?: string;
  participantId?: string;
  assignee?: string;
  assignedUserIds?: string[];
  dueDate?: string;
  dueAt?: string;
  priority?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export const taskApi = {
  async getTasks(params?: { studyId?: string }): Promise<TaskItem[]> {
    const res = await apiClient.get('/api/v1/tasks', { params });
    return res.data?.data || res.data || [];
  },

  async getTask(taskId: string): Promise<TaskItem> {
    const res = await apiClient.get(`/api/v1/tasks/${taskId}`);
    return res.data?.data || res.data;
  },

  async createTask(task: Partial<TaskItem>): Promise<TaskItem> {
    const res = await apiClient.post('/api/v1/tasks', task);
    return res.data?.data || res.data;
  },

  async assignTask(taskId: string, assignedUserIds: string[]): Promise<TaskItem> {
    const res = await apiClient.post(`/api/v1/tasks/${taskId}/assignments`, { assignedUserIds });
    return res.data?.data || res.data;
  },

  async addTaskComment(taskId: string, comment: string): Promise<any> {
    const res = await apiClient.post(`/api/v1/tasks/${taskId}/comments`, { comment });
    return res.data?.data || res.data;
  },

  async updateTaskStatus(taskId: string, status: string): Promise<TaskItem> {
    const res = await apiClient.patch(`/api/v1/tasks/${taskId}/status`, { status });
    return res.data?.data || res.data;
  },

  async updateTaskDueDate(taskId: string, dueAt: string): Promise<TaskItem> {
    const res = await apiClient.patch(`/api/v1/tasks/${taskId}/due-date`, { dueAt });
    return res.data?.data || res.data;
  },

  async updateCalendarEventStatus(eventId: string, status: string): Promise<any> {
    const res = await apiClient.patch(`/api/v1/calendar-events/${eventId}/status`, { status });
    return res.data?.data || res.data;
  },
};

export default taskApi;
