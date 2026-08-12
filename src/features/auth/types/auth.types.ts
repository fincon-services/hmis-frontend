export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user_id: number;
  username: string;
  role_id: number;
  token: string;
  token_type: 'Bearer';
}

export interface MeResponse {
  id: number;
  username: string;
  email: string | null;
  is_active: boolean;
  active_role_id: number | null;
  roles: { id: number; name: string }[];
}

export interface ChangePasswordRequest {
  old_password: string;
  password: string;
  password_confirmation: string;
}

export interface SwitchRoleRequest {
  role_id: number;
}

export interface SwitchRoleResponse {
  message: string;
  role_id: number;
}
