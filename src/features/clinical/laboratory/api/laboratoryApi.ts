import { apiClient } from '@/api/client';
import type { CollectionResponse, MessageResponse } from '@/types/api';
import type {
  LabTestParameter,
  PatientLabTestPrescription,
  PrescribeLabTestsRequest,
  PrescribeLabTestsResponse,
  RecordSpecimenRequest,
  SaveLabResultsRequest,
} from '../types/laboratory.types';

const WORKFLOW_SCREEN = 'laboratory.workflow';
const CATALOG_SCREEN = 'laboratory.catalog';

export interface LabTestParameterDto {
  lab_test_id: number;
  parameter_name: string;
  parameter_display_name: string;
  parameter_value?: string;
  fixed_val?: string;
}

export const laboratoryApi = {
  parametersForTest: (labTestId: number) =>
    apiClient
      .get<CollectionResponse<LabTestParameter>>('/laboratory/test-parameters', { params: { lab_test_id: labTestId }, screenKey: CATALOG_SCREEN })
      .then((r) => r.data.data),

  createParameter: (payload: LabTestParameterDto) =>
    apiClient.post<LabTestParameter>('/laboratory/test-parameters', payload, { screenKey: CATALOG_SCREEN }).then((r) => r.data),

  updateParameter: (id: number, payload: LabTestParameterDto) =>
    apiClient.put<LabTestParameter>(`/laboratory/test-parameters/${id}`, payload, { screenKey: CATALOG_SCREEN }).then((r) => r.data),

  deleteParameter: (id: number) =>
    apiClient.delete<MessageResponse>(`/laboratory/test-parameters/${id}`, { screenKey: CATALOG_SCREEN }).then((r) => r.data),

  prescribe: (opdVisitId: number, payload: PrescribeLabTestsRequest) =>
    apiClient
      .post<PrescribeLabTestsResponse>(`/laboratory/visits/${opdVisitId}/prescriptions`, payload, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data),

  forVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientLabTestPrescription>>(`/laboratory/visits/${opdVisitId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  forPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientLabTestPrescription>>(`/laboratory/patients/${patientId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  recordSpecimen: (prescriptionId: number, payload: RecordSpecimenRequest) =>
    apiClient
      .post<PatientLabTestPrescription>(`/laboratory/prescriptions/${prescriptionId}/specimen`, payload, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data),

  saveResults: (payload: SaveLabResultsRequest) =>
    apiClient.post<MessageResponse>('/laboratory/results', payload, { screenKey: WORKFLOW_SCREEN }).then((r) => r.data),
};
