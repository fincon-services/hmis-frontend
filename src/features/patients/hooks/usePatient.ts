import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '../api/patientsApi';
import { patientKeys } from './usePatients';

export function usePatient(id: number) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.get(id),
    enabled: !!id,
  });
}
