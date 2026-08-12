import { useMutation } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { queryClient } from '@/api/queryClient';
import { patientKeys } from './usePatients';
import type { RegisterPatientRequest } from '../types/patient.types';

export function useRegisterPatient() {
  return useMutation({
    mutationFn: (payload: RegisterPatientRequest) => patientsApi.register(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: patientKeys.all }),
  });
}
