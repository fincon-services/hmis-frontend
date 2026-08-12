import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { ChangePasswordRequest } from '../types/auth.types';

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authApi.changePassword(payload),
  });
}
