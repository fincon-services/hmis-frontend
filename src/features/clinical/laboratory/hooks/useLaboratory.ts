import { useMutation, useQuery } from '@tanstack/react-query';
import { laboratoryApi } from '../api/laboratoryApi';
import { queryClient } from '@/api/queryClient';
import type { PrescribeLabTestsRequest, RecordSpecimenRequest, SaveLabResultsRequest } from '../types/laboratory.types';

export const labWorkflowKeys = {
  forVisit: (opdVisitId: number) => ['lab-prescriptions', 'visit', opdVisitId] as const,
  forPatient: (patientId: number) => ['lab-prescriptions', 'patient', patientId] as const,
};

export function useLabPrescriptionsForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: labWorkflowKeys.forVisit(opdVisitId),
    queryFn: () => laboratoryApi.forVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function useLabPrescriptionsForPatient(patientId: number) {
  return useQuery({
    queryKey: labWorkflowKeys.forPatient(patientId),
    queryFn: () => laboratoryApi.forPatient(patientId),
    enabled: !!patientId,
  });
}

export function usePrescribeLabTests(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: PrescribeLabTestsRequest) => laboratoryApi.prescribe(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labWorkflowKeys.forVisit(opdVisitId) }),
  });
}

export function useRecordSpecimen(opdVisitId: number) {
  return useMutation({
    mutationFn: ({ prescriptionId, payload }: { prescriptionId: number; payload: RecordSpecimenRequest }) =>
      laboratoryApi.recordSpecimen(prescriptionId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labWorkflowKeys.forVisit(opdVisitId) }),
  });
}

export function useSaveLabResults(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: SaveLabResultsRequest) => laboratoryApi.saveResults(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: labWorkflowKeys.forVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: ['patients', 'queue'] });
    },
  });
}
