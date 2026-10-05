// frontend/shared/api/taskApi.ts - Centralized Task & Operations API
import { apiClient } from '../api-client';

export interface TaskItem {
  taskId: string;
  title: string;
  category?: string;
  studyId?: string;
  assignee?: string;
  dueDate?: string;
  priority?: string;
  status: string;
  [key: string]: any;
}

export const taskApi = {
  async getTasks(): Promise<TaskItem[]> {
    const res = await apiClient.get('/api/v1/tasks');
    return res.data?.data || [];
  },

  async getTask(taskId: string): Promise<TaskItem> {
    const res = await apiClient.get(`/api/v1/tasks/${taskId}`);
    return res.data?.data;
  },

  async createTask(task: Partial<TaskItem>): Promise<TaskItem> {
    const res = await apiClient.post('/api/v1/tasks', task);
    return res.data?.data;
  },

  async updateTaskStatus(taskId: string, status: string): Promise<TaskItem> {
    const res = await apiClient.patch(`/api/v1/tasks/${taskId}/status`, { status });
    return res.data?.data;
  },
};

export default taskApi;
