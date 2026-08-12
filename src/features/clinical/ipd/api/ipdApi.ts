import { apiClient } from '@/api/client';
import type { CollectionResponse } from '@/types/api';
import type { AdmitPatientRequest, DischargePatientRequest, TransferPatientRequest, WardAdmission, WardBed } from '../types/ipd.types';

const ADMISSIONS_SCREEN = 'ipd.admissions';
const WARDS_SCREEN = 'ipd.wards';

export const ipdApi = {
  bedsForWard: (wardId: number) =>
    apiClient.get<CollectionResponse<WardBed>>(`/ipd/wards/${wardId}/beds`, { screenKey: WARDS_SCREEN }).then((r) => r.data.data),

  admissionsForWard: (wardId: number) =>
    apiClient
      .get<CollectionResponse<WardAdmission>>(`/ipd/wards/${wardId}/admissions`, { screenKey: WARDS_SCREEN })
      .then((r) => r.data.data),

  admissionsForPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<WardAdmission>>(`/ipd/patients/${patientId}/admissions`, { screenKey: ADMISSIONS_SCREEN })
      .then((r) => r.data.data),

  admit: (opdVisitId: number, payload: AdmitPatientRequest) =>
    apiClient.post<WardAdmission>(`/ipd/visits/${opdVisitId}/admissions`, payload, { screenKey: ADMISSIONS_SCREEN }).then((r) => r.data),

  transfer: (admissionId: number, payload: TransferPatientRequest) =>
    apiClient.post(`/ipd/admissions/${admissionId}/transfer`, payload, { screenKey: ADMISSIONS_SCREEN }).then((r) => r.data),

  discharge: (admissionId: number, payload: DischargePatientRequest) =>
    apiClient.post(`/ipd/admissions/${admissionId}/discharge`, payload, { screenKey: ADMISSIONS_SCREEN }).then((r) => r.data),
};
