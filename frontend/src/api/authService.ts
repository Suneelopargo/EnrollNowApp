import axiosInstance from './axiosInstance';
import { ApiResponse, AuthUser, LoginResponseData } from '../types/auth';

export const authService = {
  login: async (usernameOrEmail: string, password: string): Promise<LoginResponseData> => {
    const response = await axiosInstance.post<ApiResponse<LoginResponseData>>('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return response.data.data;
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await axiosInstance.get<ApiResponse<AuthUser>>('/api/auth/me');
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('enrollnow_token');
      localStorage.removeItem('enrollnow_user');
    }
  },
};
