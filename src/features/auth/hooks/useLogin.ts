import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/stores/authStore';
import type { LoginRequest } from '../types/auth.types';

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) => {
      const login = await authApi.login(payload);

      // Set the token first so the follow-up /auth/me call is authenticated.
      useAuthStore.setState({ token: login.token });
      const me = await authApi.me();

      useAuthStore.getState().setSession({
        token: login.token,
        user: { id: me.id, username: me.username, email: me.email, is_active: me.is_active },
        roles: me.roles,
        activeRoleId: me.active_role_id ?? login.role_id,
      });

      return me;
    },
  });
}
