import { useMutation, useQuery } from '@tanstack/react-query';
import { ipdApi } from '../api/ipdApi';
import { queryClient } from '@/api/queryClient';
import type { AdmitPatientRequest, DischargePatientRequest, TransferPatientRequest } from '../types/ipd.types';

export const ipdKeys = {
  bedsForWard: (wardId: number) => ['ipd-beds', wardId] as const,
  admissionsForWard: (wardId: number) => ['ipd-admissions', 'ward', wardId] as const,
  admissionsForPatient: (patientId: number) => ['ipd-admissions', 'patient', patientId] as const,
};

export function useWardBeds(wardId: number) {
  return useQuery({
    queryKey: ipdKeys.bedsForWard(wardId),
    queryFn: () => ipdApi.bedsForWard(wardId),
    enabled: !!wardId,
  });
}

export function useWardAdmissions(wardId: number) {
  return useQuery({
    queryKey: ipdKeys.admissionsForWard(wardId),
    queryFn: () => ipdApi.admissionsForWard(wardId),
    enabled: !!wardId,
  });
}

export function usePatientAdmissions(patientId: number) {
  return useQuery({
    queryKey: ipdKeys.admissionsForPatient(patientId),
    queryFn: () => ipdApi.admissionsForPatient(patientId),
    enabled: !!patientId,
  });
}

export function useAdmitPatient(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: AdmitPatientRequest) => ipdApi.admit(opdVisitId, payload),
  });
}

function invalidateWard(wardId: number) {
  queryClient.invalidateQueries({ queryKey: ipdKeys.admissionsForWard(wardId) });
  queryClient.invalidateQueries({ queryKey: ipdKeys.bedsForWard(wardId) });
  queryClient.invalidateQueries({ queryKey: ['ipd.wards'] });
}

export function useTransferAdmission(wardId: number) {
  return useMutation({
    mutationFn: ({ admissionId, payload }: { admissionId: number; payload: TransferPatientRequest }) => ipdApi.transfer(admissionId, payload),
    onSuccess: () => invalidateWard(wardId),
  });
}

export function useDischargeAdmission(wardId: number) {
  return useMutation({
    mutationFn: ({ admissionId, payload }: { admissionId: number; payload: DischargePatientRequest }) => ipdApi.discharge(admissionId, payload),
    onSuccess: () => invalidateWard(wardId),
  });
}
