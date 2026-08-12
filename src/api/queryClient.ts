import { QueryClient } from '@tanstack/react-query';
import type { ApiErrorShape } from '@/types/api';

function isApiErrorShape(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (isApiErrorShape(error) && [401, 403, 404, 422].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
