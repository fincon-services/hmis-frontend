import { useMutation, useQuery } from '@tanstack/react-query';
import { otWorkflowApi } from '../api/otApi';
import { queryClient } from '@/api/queryClient';
import type { RecordSurgeryRequest, ScheduleSurgeryRequest } from '../types/ot.types';

export const otKeys = {
  schedulesForVisit: (opdVisitId: number) => ['ot-schedules', 'visit', opdVisitId] as const,
  schedulesForPatient: (patientId: number) => ['ot-schedules', 'patient', patientId] as const,
  surgeriesForVisit: (opdVisitId: number) => ['ot-surgeries', 'visit', opdVisitId] as const,
  surgeriesForPatient: (patientId: number) => ['ot-surgeries', 'patient', patientId] as const,
};

export function useOtSchedulesForVisit(opdVisitId: number) {
  return useQuery({ queryKey: otKeys.schedulesForVisit(opdVisitId), queryFn: () => otWorkflowApi.schedulesForVisit(opdVisitId), enabled: !!opdVisitId });
}

export function useOtSchedulesForPatient(patientId: number) {
  return useQuery({ queryKey: otKeys.schedulesForPatient(patientId), queryFn: () => otWorkflowApi.schedulesForPatient(patientId), enabled: !!patientId });
}

export function useOtSurgeriesForVisit(opdVisitId: number) {
  return useQuery({ queryKey: otKeys.surgeriesForVisit(opdVisitId), queryFn: () => otWorkflowApi.surgeriesForVisit(opdVisitId), enabled: !!opdVisitId });
}

export function useOtSurgeriesForPatient(patientId: number) {
  return useQuery({ queryKey: otKeys.surgeriesForPatient(patientId), queryFn: () => otWorkflowApi.surgeriesForPatient(patientId), enabled: !!patientId });
}

export function useScheduleSurgery(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: ScheduleSurgeryRequest) => otWorkflowApi.schedule(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: otKeys.schedulesForVisit(opdVisitId) }),
  });
}

export function useReferToOt(opdVisitId: number) {
  return useMutation({
    mutationFn: (scheduleId: number) => otWorkflowApi.refer(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: otKeys.schedulesForVisit(opdVisitId) });
      queryClient.invalidateQueries({ queryKey: ['patients', 'queue'] });
    },
  });
}

export function useRecordSurgery(opdVisitId: number) {
  return useMutation({
    mutationFn: (payload: RecordSurgeryRequest) => otWorkflowApi.recordSurgery(opdVisitId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: otKeys.surgeriesForVisit(opdVisitId) }),
  });
}
