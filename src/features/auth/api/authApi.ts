import { apiClient } from '@/api/client';
import type { MessageResponse } from '@/types/api';
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
  SwitchRoleRequest,
  SwitchRoleResponse,
} from '../types/auth.types';

export const authApi = {
  login: (payload: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  logout: () => apiClient.post<MessageResponse>('/auth/logout').then((r) => r.data),

  me: () => apiClient.get<MeResponse>('/auth/me').then((r) => r.data),

  changePassword: (payload: ChangePasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/change-password', payload).then((r) => r.data),

  switchRole: (payload: SwitchRoleRequest) =>
    apiClient.post<SwitchRoleResponse>('/auth/switch-role', payload).then((r) => r.data),
};
