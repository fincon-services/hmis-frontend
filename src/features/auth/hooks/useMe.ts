import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/stores/authStore';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useMe() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
