import { apiClient } from '@/api/client';
import type { CollectionResponse } from '@/types/api';
import type { PatientRadiologyPrescription, PatientRadiologyResult, PrescribeRadiologyTestsRequest } from '../types/radiology.types';

const WORKFLOW_SCREEN = 'radiology.workflow';

export const radiologyWorkflowApi = {
  forVisit: (opdVisitId: number) =>
    apiClient
      .get<CollectionResponse<PatientRadiologyPrescription>>(`/radiology/visits/${opdVisitId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  forPatient: (patientId: number) =>
    apiClient
      .get<CollectionResponse<PatientRadiologyPrescription>>(`/radiology/patients/${patientId}/prescriptions`, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  prescribe: (opdVisitId: number, payload: PrescribeRadiologyTestsRequest) =>
    apiClient
      .post<CollectionResponse<PatientRadiologyPrescription>>(`/radiology/visits/${opdVisitId}/prescriptions`, payload, { screenKey: WORKFLOW_SCREEN })
      .then((r) => r.data.data),

  saveResult: (prescriptionId: number, file: File, description: string | undefined, viewNumber: number, onProgress: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    formData.append('view_number', String(viewNumber));

    return apiClient
      .post<PatientRadiologyResult>(`/radiology/prescriptions/${prescriptionId}/results`, formData, {
        screenKey: WORKFLOW_SCREEN,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (evt.total) onProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      })
      .then((r) => r.data);
  },

  download: async (resultId: number, fileName: string) => {
    const response = await apiClient.get<Blob>(`/radiology/results/${resultId}/download`, {
      screenKey: WORKFLOW_SCREEN,
      responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
