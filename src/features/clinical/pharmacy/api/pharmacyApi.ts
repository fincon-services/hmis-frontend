import { apiClient } from '@/api/client';
import type { CollectionResponse, PaginatedResponse } from '@/types/api';
import type {
  LogSideEffectRequest,
  PatientMedicinePrescription,
  PatientMedicineSideEffect,
  PrescribeMedicinesRequest,
} from '../types/pharmacy.types';

const WORKFLOW_SCREEN = 'pharmacy.workflow';

export const pharmacyWorkflowApi = {
  pendingDispense: () =>
    apiClient.get<CollectionResponse<PatientMedicinePrescription>>('/pharmacy/pending-dispense', { screenKey: WORKFLOW_SCREEN }).then((r) => r.data.data),

  forVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientMedicinePrescription>>(`/pharmacy/visits/${opdVisitId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  forPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientMedicinePrescription>>(`/pharmacy/patients/${patientId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  prescribe: (opdVisitId: number, payload: PrescribeMedicinesRequest) =>
    apiClient
      .post<CollectionResponse<PatientMedicinePrescription>>(`/pharmacy/visits/${opdVisitId}/prescriptions`, payload, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  dispense: (prescriptionId: number) =>
    apiClient
      .post<PatientMedicinePrescription>(`/pharmacy/prescriptions/${prescriptionId}/dispense`, undefined, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data),

  sideEffects: (patientId?: number, perPage = 25) =>
    apiClient
      .get<PaginatedResponse<PatientMedicineSideEffect> | CollectionResponse<PatientMedicineSideEffect>>('/pharmacy/side-effects', {
        params: { patient_id: patientId, per_page: perPage },
        screenKey: WORKFLOW_SCREEN,
      })
      .then((r) => r.data),

  logSideEffect: (payload: LogSideEffectRequest) =>
    apiClient.post<PatientMedicineSideEffect>('/pharmacy/side-effects', payload, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),

  deleteSideEffect: (id: number) =>
    apiClient.delete(`/pharmacy/side-effects/${id}`, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),
};
