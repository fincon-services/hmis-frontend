import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/api/queryClient';
import type { SwitchRoleRequest } from '../types/auth.types';

export function useSwitchRole() {
  return useMutation({
    mutationFn: (payload: SwitchRoleRequest) => authApi.switchRole(payload),
    onSuccess: (data, variables) => {
      useAuthStore.getState().setActiveRoleId(variables.role_id ?? data.role_id);
      // Screen/permission grants differ per role — drop all cached data.
      queryClient.clear();
    },
  });
}
