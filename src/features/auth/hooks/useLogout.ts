import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/stores/authStore';
import { queryClient } from '@/api/queryClient';

export function useLogout() {
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      useAuthStore.getState().clearSession();
      queryClient.clear();
    },
  });
}
