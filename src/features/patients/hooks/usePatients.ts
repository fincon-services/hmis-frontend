import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import type { PatientListParams } from '../types/patient.types';

export const patientKeys = {
  all: ['patients'] as const,
  list: (params: PatientListParams) => ['patients', 'list', params] as const,
  detail: (id: number) => ['patients', 'detail', id] as const,
  visits: (id: number) => ['patients', id, 'visits'] as const,
};

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.list(params),
    placeholderData: keepPreviousData,
  });
}
