import { apiClient } from '@/api/client';
import type { CollectionResponse, PaginatedResponse } from '@/types/api';
import type {
  OpdVisit,
  Patient,
  PatientListParams,
  PatientQueueParams,
  QueuedReferral,
  ReferPatientRequest,
  RecordVisitRequest,
  RegisterPatientRequest,
  UpdatePatientRequest,
} from '../types/patient.types';

const SCREEN = 'patients.registration';
const QUEUE_SCREEN = 'patients.queue';
const REFERRAL_SCREEN = 'patients.referrals';

export const patientsApi = {
  list: (params: PatientListParams) =>
    apiClient
      .get<PaginatedResponse<Patient> | CollectionResponse<Patient>>('/patients', { params, screenKey: SCREEN })
      .then((r) => r.data),

  register: (payload: RegisterPatientRequest) =>
    apiClient.post<Patient>('/patients', payload, { screenKey: SCREEN }).then((r) => r.data),

  get: (id: number) => apiClient.get<Patient>(`/patients/${id}`, { screenKey: SCREEN }).then((r) => r.data),

  update: (id: number, payload: UpdatePatientRequest) =>
    apiClient.put<Patient>(`/patients/${id}`, payload, { screenKey: SCREEN }).then((r) => r.data),

  listVisits: (patientId: number) =>
    apiClient.get<CollectionResponse<OpdVisit>>(`/patients/${patientId}/visits`, { screenKey: SCREEN }).then((r) => r.data.data),

  recordVisit: (patientId: number, payload: RecordVisitRequest) =>
    apiClient.post<OpdVisit>(`/patients/${patientId}/visits`, payload, { screenKey: SCREEN }).then((r) => r.data),

  queue: (params: PatientQueueParams) =>
    apiClient
      .get<PaginatedResponse<QueuedReferral> | CollectionResponse<QueuedReferral>>('/patients/queue', { params, screenKey: QUEUE_SCREEN })
      .then((r) => r.data),

  refer: (opdVisitId: number, payload: ReferPatientRequest) =>
    apiClient
      .post<QueuedReferral>(`/patients/visits/${opdVisitId}/referrals`, payload, { screenKey: REFERRAL_SCREEN })
      .then((r) => r.data),
};
