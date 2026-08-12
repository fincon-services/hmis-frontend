import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { patientKeys } from './usePatients';

export function usePatientVisits(patientId: number) {
  return useQuery({
    queryKey: patientKeys.visits(patientId),
    queryFn: () => patientsApi.listVisits(patientId),
    enabled: !!patientId,
  });
}
