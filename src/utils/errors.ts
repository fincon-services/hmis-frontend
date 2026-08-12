import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import type { ApiErrorShape } from '@/types/api';

export function isApiError(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isApiError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Maps Laravel 422 {errors: {field: [msg]}} onto react-hook-form field errors. */
export function applyServerValidationErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): boolean {
  if (!isApiError(error) || !error.errors) return false;

  for (const [field, messages] of Object.entries(error.errors)) {
    setError(field as Path<T>, { type: 'server', message: messages[0] });
  }
  return true;
}
