import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { vitalsApi } from '../api/vitalsApi';
import { queryClient } from '@/api/queryClient';
import type { RecordVitalsRequest, VitalsQueueParams } from '../types/vitals.types';

export const vitalsKeys = {
  queue: (params: VitalsQueueParams) => ['vitals', 'queue', params] as const,
  forVisit: (opdVisitId: number) => ['vitals', 'visit', opdVisitId] as const,
  forPatient: (patientId: number) => ['vitals', 'patient', patientId] as const,
};

export function useVitalsQueue(params: VitalsQueueParams) {
  return useQuery({
    queryKey: vitalsKeys.queue(params),
    queryFn: () => vitalsApi.queue(params),
    placeholderData: keepPreviousData,
  });
}

export function useVitalsForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: vitalsKeys.forVisit(opdVisitId),
    queryFn: () => vitalsApi.forVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function useVitalsForPatient(patientId: number) {
  return useQuery({
    queryKey: vitalsKeys.forPatient(patientId),
    queryFn: () => vitalsApi.forPatient(patientId),
    enabled: !!patientId,
  });
}

export function useRecordVitals(opdVisitId: number, patientId: number) {
  return useMutation({
    mutationFn: (payload: RecordVitalsRequest) => vitalsApi.record(opdVisitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vitalsKeys.forVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: vitalsKeys.forPatient(patientId) });
      queryClient.invalidateQueries({ queryKey: ['vitals', 'queue'] });
      queryClient.invalidateQueries({ queryKey: ['patients', 'queue'] });
    },
  });
}
