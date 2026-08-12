import { useMutation, useQuery } from '@tanstack/react-query';
import { pharmacyWorkflowApi } from '../api/pharmacyApi';
import { queryClient } from '@/api/queryClient';
import type { PrescribeMedicinesRequest } from '../types/pharmacy.types';

export const pharmacyKeys = {
  pendingDispense: ['pharmacy', 'pending-dispense'] as const,
  forVisit: (opdVisitId: number) => ['pharmacy-prescriptions', 'visit', opdVisitId] as const,
  forPatient: (patientId: number) => ['pharmacy-prescriptions', 'patient', patientId] as const,
};

export function usePendingDispense() {
  return useQuery({
    queryKey: pharmacyKeys.pendingDispense,
    queryFn: pharmacyWorkflowApi.pendingDispense,
  });
}

export function usePharmacyForVisit(opdVisitId: number) {
  return useQuery({
    queryKey: pharmacyKeys.forVisit(opdVisitId),
    queryFn: () => pharmacyWorkflowApi.forVisit(opdVisitId),
    enabled: !!opdVisitId,
  });
}

export function usePharmacyForPatient(patientId: number) {
  return useQuery({
    queryKey: pharmacyKeys.forPatient(patientId),
    queryFn: () => pharmacyWorkflowApi.forPatient(patientId),
    enabled: !!patientId,
  });
}

export function usePrescribeMedicines(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: PrescribeMedicinesRequest) => pharmacyWorkflowApi.prescribe(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pharmacyKeys.forVisit(opdVisitId) }),
  });
}

export function useDispensePrescription() {
  return useMutation({
    mutationFn: (prescriptionId: number) => pharmacyWorkflowApi.dispense(prescriptionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pharmacyKeys.pendingDispense }),
  });
}
