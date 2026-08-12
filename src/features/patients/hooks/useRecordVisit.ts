import { useMutation } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { queryClient } from '@/api/queryClient';
import { patientKeys } from './usePatients';
import type { RecordVisitRequest } from '../types/patient.types';

export function useRecordVisit(patientId: number) {
  return useMutation({
    mutationFn: (payload: RecordVisitRequest) => patientsApi.recordVisit(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.visits(patientId) });
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) });
    },
  });
}
