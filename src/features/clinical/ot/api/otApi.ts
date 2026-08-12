import { apiClient } from '@/api/client';
import type { CollectionResponse, MessageResponse } from '@/types/api';
import type { OtSchedule, PatientSurgery, RecordSurgeryRequest, ScheduleSurgeryRequest } from '../types/ot.types';

const WORKFLOW_SCREEN = 'ot.workflow';

export const otWorkflowApi = {
  schedulesForVisit: (opdVisitId: number) =>
    apiClient.get<CollectionResponse<OtSchedule>>(`/ot/visits/${opdVisitId}/schedules`, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data.data),

  schedulesForPatient: (patientId: number) =>
    apiClient.get<CollectionResponse<OtSchedule>>(`/ot/patients/${patientId}/schedules`, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data.data),

  schedule: (opdVisitId: number, payload: ScheduleSurgeryRequest) =>
    apiClient.post<OtSchedule>(`/ot/visits/${opdVisitId}/schedules`, payload, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),

  refer: (scheduleId: number) =>
    apiClient.post<MessageResponse>(`/ot/schedules/${scheduleId}/refer`, undefined, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),

  surgeriesForVisit: (opdVisitId: number) =>
    apiClient.get<CollectionResponse<PatientSurgery>>(`/ot/visits/${opdVisitId}/surgeries`, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data.data),

  surgeriesForPatient: (patientId: number) =>
    apiClient.get<CollectionResponse<PatientSurgery>>(`/ot/patients/${patientId}/surgeries`, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data.data),

  recordSurgery: (opdVisitId: number, payload: RecordSurgeryRequest) =>
    apiClient.post<PatientSurgery>(`/ot/visits/${opdVisitId}/surgeries`, payload, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),
};
