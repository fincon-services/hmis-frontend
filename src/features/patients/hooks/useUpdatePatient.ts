import { useMutation } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { queryClient } from '@/api/queryClient';
import { patientKeys } from './usePatients';
import type { UpdatePatientRequest } from '../types/patient.types';

export function useUpdatePatient(id: number) {
  return useMutation({
    mutationFn: (payload: UpdatePatientRequest) => patientsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: patientKeys.all });
    },
  });
}
