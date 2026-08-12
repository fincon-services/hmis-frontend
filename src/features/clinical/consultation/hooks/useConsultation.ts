import { useMutation, useQuery } from '@tanstack/react-query';
import { consultationApi } from '../api/consultationApi';
import { queryClient } from '@/api/queryClient';
import type { RecordConsultationRequest, RecordDiagnosesRequest } from '../types/consultation.types';

export const consultationKeys = {
  forVisit: (opdVisitId: number) => ['consultations', 'visit', opdVisitId] as const,
  forPatient: (patientId: number) => ['consultations', 'patient', patientId] as const,
  diagnosesForVisit: (opdVisitId: number) => ['diagnoses', 'visit', opdVisitId] as const,
  diagnosesForPatient: (patientId: number) => ['diagnoses', 'patient', patientId] as const,
};

export function useConsultationsForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: consultationKeys.forVisit(opdVisitId),
    queryFn: () => consultationApi.forVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function useConsultationsForPatient(patientId: number) {
  return useQuery({
    queryKey: consultationKeys.forPatient(patientId),
    queryFn: () => consultationApi.forPatient(patientId),
    enabled: !!patientId,
  });
}

export function useDiagnosesForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: consultationKeys.diagnosesForVisit(opdVisitId),
    queryFn: () => consultationApi.diagnosesForVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function useDiagnosesForPatient(patientId: number) {
  return useQuery({
    queryKey: consultationKeys.diagnosesForPatient(patientId),
    queryFn: () => consultationApi.diagnosesForPatient(patientId),
    enabled: !!patientId,
  });
}

export function useRecordConsultation(opdVisitId: number, patientId: number) {
  return useMutation({
    mutationFn: (payload: RecordConsultationRequest) => consultationApi.record(opdVisitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.forVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.forPatient(patientId) });
    },
  });
}

export function useRecordDiagnoses(opdVisitId: number, patientId: number) {
  return useMutation({
    mutationFn: (payload: RecordDiagnosesRequest) => consultationApi.recordDiagnoses(opdVisitId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: consultationKeys.diagnosesForVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: consultationKeys.diagnosesForPatient(patientId) });
    },
  });
}
