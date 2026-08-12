import { apiClient } from '@/api/client';
import type { CollectionResponse } from '@/types/api';
import type { PatientConsultation, PatientDiagnosis, RecordConsultationRequest, RecordDiagnosesRequest } from '../types/consultation.types';

const SCREEN = 'consultations.recording';

export const consultationApi = {
  forVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientConsultation>>(`/consultations/visits/${opdVisitId}/consultations`, { screenKey: SCREEN })
      .then((r) => r.data.data),

  record: (opdVisitId: number, payload: RecordConsultationRequest) =>
    apiClient
      .post<PatientConsultation>(`/consultations/visits/${opdVisitId}/consultations`, payload, { screenKey: SCREEN })
      .then((r) => r.data),

  forPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientConsultation>>(`/consultations/patients/${patientId}/consultations`, { screenKey: SCREEN })
      .then((r) => r.data.data),

  diagnosesForVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientDiagnosis>>(`/consultations/visits/${opdVisitId}/diagnoses`, { screenKey: SCREEN })
      .then((r) => r.data.data),

  recordDiagnoses: (opdVisitId: number, payload: RecordDiagnosesRequest) =>
    apiClient
      .post<CollectionResponse<PatientDiagnosis>>(`/consultations/visits/${opdVisitId}/diagnoses`, payload, { screenKey: SCREEN })
      .then((r) => r.data.data),

  diagnosesForPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientDiagnosis>>(`/consultations/patients/${patientId}/diagnoses`, { screenKey: SCREEN })
      .then((r) => r.data.data),
};
