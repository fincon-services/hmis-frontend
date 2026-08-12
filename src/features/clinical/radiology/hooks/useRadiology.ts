import { useMutation, useQuery } from '@tanstack/react-query';
import { radiologyWorkflowApi } from '../api/radiologyApi';
import { queryClient } from '@/api/queryClient';
import type { PrescribeRadiologyTestsRequest } from '../types/radiology.types';

export const radiologyKeys = {
  forVisit: (opdVisitId: number) => ['radiology-prescriptions', 'visit', opdVisitId] as const,
  forPatient: (patientId: number) => ['radiology-prescriptions', 'patient', patientId] as const,
};

export function useRadiologyForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: radiologyKeys.forVisit(opdVisitId),
    queryFn: () => radiologyWorkflowApi.forVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function useRadiologyForPatient(patientId: number) {
  return useQuery({
    queryKey: radiologyKeys.forPatient(patientId),
    queryFn: () => radiologyWorkflowApi.forPatient(patientId),
    enabled: !!patientId,
  });
}

export function usePrescribeRadiologyTests(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: PrescribeRadiologyTestsRequest) => radiologyWorkflowApi.prescribe(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: radiologyKeys.forVisit(opdVisitId) }),
  });
}

export function useSaveRadiologyResult(opdVisitId: number) {
  return useMutation({
    mutationFn: ({ prescriptionId, file, description, viewNumber, onProgress }: { prescriptionId: number; file: File; description?: string; viewNumber: number; onProgress: (p: number) => void }) =>
      radiologyWorkflowApi.saveResult(prescriptionId, file, description, viewNumber, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiologyKeys.forVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: ['patients', 'queue'] });
    },
  });
}
