export interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  active: boolean;
  roles: string[];
  siteCodes: string[];
  organizationName?: string;
}

export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}
