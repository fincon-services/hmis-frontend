import { apiClient } from '@/api/client';
import type { CollectionResponse, ListParams, MessageResponse, PaginatedResponse } from '@/types/api';
import type {
  BloodBag,
  BloodDiscard,
  BloodDonorScreening,
  BloodGroupReport,
  BloodIssue,
  DiscardBloodRequest,
  IssueBloodRequest,
  ReceiveBloodBagRequest,
  SaveDonorScreeningRequest,
} from '../types/bloodBank.types';

const INVENTORY_SCREEN = 'blood-bank.inventory';
const SCREENING_SCREEN = 'blood-bank.screening';
const DISPENSING_SCREEN = 'blood-bank.dispensing';

export interface BloodBagListParams extends ListParams {
  blood_group?: string;
  available?: boolean;
}

export const bloodBankApi = {
  list: (params: BloodBagListParams) =>
    apiClient
      .get<PaginatedResponse<BloodBag> | CollectionResponse<BloodBag>>('/blood-bank/bags', { params, screenKey: INVENTORY_SCREEN })
      .then((r) => r.data),

  get: (id: number) => apiClient.get<BloodBag>(`/blood-bank/bags/${id}`, { screenKey: INVENTORY_SCREEN }).then((r) => r.data),

  receive: (payload: ReceiveBloodBagRequest) =>
    apiClient.post<BloodBag>('/blood-bank/bags', payload, { screenKey: INVENTORY_SCREEN }).then((r) => r.data),

  report: (bloodGroup: string, dateFrom: string, dateTo: string) =>
    apiClient
      .get<BloodGroupReport>('/blood-bank/reports/by-blood-group', {
        params: { blood_group: bloodGroup, date_from: dateFrom, date_to: dateTo },
        screenKey: INVENTORY_SCREEN,
      })
      .then((r) => r.data),

  saveDonorScreening: (bagId: number, payload: SaveDonorScreeningRequest) =>
    apiClient.post<BloodDonorScreening>(`/blood-bank/bags/${bagId}/donor-screening`, payload, { screenKey: SCREENING_SCREEN }).then((r) => r.data),

  saveScreeningResults: (payload: {
    results: { screening_test_id: number; specimen_status: string; result_notes?: string; values?: { parameter_id: number; value: string }[] }[];
  }) => apiClient.post<MessageResponse>('/blood-bank/screening-results', payload, { screenKey: SCREENING_SCREEN }).then((r) => r.data),

  issue: (bagId: number, payload: IssueBloodRequest) =>
    apiClient.post<BloodIssue>(`/blood-bank/bags/${bagId}/issue`, payload, { screenKey: DISPENSING_SCREEN }).then((r) => r.data),

  issuesForBag: (bagId: number) =>
    apiClient.get<CollectionResponse<BloodIssue>>(`/blood-bank/bags/${bagId}/issues`, { screenKey: DISPENSING_SCREEN }).then((r) => r.data.data),

  discard: (bagId: number, payload: DiscardBloodRequest) =>
    apiClient.post<BloodDiscard>(`/blood-bank/bags/${bagId}/discard`, payload, { screenKey: DISPENSING_SCREEN }).then((r) => r.data),

  discardsForBag: (bagId: number) =>
    apiClient.get<CollectionResponse<BloodDiscard>>(`/blood-bank/bags/${bagId}/discards`, { screenKey: DISPENSING_SCREEN }).then((r) => r.data.data),
};
