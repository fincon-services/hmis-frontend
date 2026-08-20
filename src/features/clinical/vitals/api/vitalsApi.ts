import { apiClient } from '@/api/client';
import type { CollectionResponse, PaginatedResponse } from '@/types/api';
import type { NurseQueueEntry, PatientVital, RecordVitalsRequest, VitalsQueueParams, WeightRange } from '../types/vitals.types';

const RECORDING_SCREEN = 'vitals.recording';
const QUEUE_SCREEN = 'vitals.queue';

export const vitalsApi = {
  queue: (params: VitalsQueueParams) =>
    apiClient
      .get<PaginatedResponse<NurseQueueEntry> | CollectionResponse<NurseQueueEntry>>('/vitals/queue', { params, screenKey: QUEUE_SCREEN })
      .then((r) => r.data),

  forVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientVital>>(`/vitals/visits/${opdVisitId}/vitals`, { screenKey: RECORDING_SCREEN })
      .then((r) => r.data.data),

  record: (opdVisitId: number, payload: RecordVitalsRequest) =>
    apiClient
      .post<CollectionResponse<PatientVital>>(`/vitals/visits/${opdVisitId}/vitals`, payload, { screenKey: RECORDING_SCREEN })
      .then((r) => r.data.data),

  forPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientVital>>(`/vitals/patients/${patientId}/vitals`, { screenKey: RECORDING_SCREEN })
      .then((r) => r.data.data),

  weightRange: (ageDays: number) =>
    apiClient.get<WeightRange>('/vitals/weight-range', { params: { age_days: ageDays }, screenKey: RECORDING_SCREEN }).then((r) => r.data),
};
