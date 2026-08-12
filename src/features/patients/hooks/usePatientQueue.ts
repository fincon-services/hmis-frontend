import { useQuery, useMutation } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { queryClient } from '@/api/queryClient';
import type { PatientQueueParams, ReferPatientRequest } from '../types/patient.types';

export function usePatientQueue(params: PatientQueueParams) {
  return useQuery({
    queryKey: ['patients', 'queue', params],
    queryFn: () => patientsApi.queue(params),
  });
}

export function useReferPatient(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: ReferPatientRequest) => patientsApi.refer(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients', 'queue'] }),
  });
}
