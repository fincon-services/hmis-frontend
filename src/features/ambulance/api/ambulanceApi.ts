import { apiClient } from '@/api/client';
import type { CollectionResponse, PaginatedResponse } from '@/types/api';
import type { DispatchTripRequest, ReturnTripRequest, Trip, TripListParams, TripReportParams } from '../types/ambulance.types';

const TRIPS_SCREEN = 'ambulance.trips';
const REPORTS_SCREEN = 'ambulance.reports';

export const ambulanceTripsApi = {
  list: (params: TripListParams) =>
    apiClient
      .get<PaginatedResponse<Trip> | CollectionResponse<Trip>>('/ambulance/trips', { params, screenKey: TRIPS_SCREEN })
      .then((r) => r.data),

  get: (id: number) => apiClient.get<Trip>(`/ambulance/trips/${id}`, { screenKey: TRIPS_SCREEN }).then((r) => r.data),

  dispatch: (payload: DispatchTripRequest) => apiClient.post<Trip>('/ambulance/trips', payload, { screenKey: TRIPS_SCREEN }).then((r) => r.data),

  return: (id: number, payload: ReturnTripRequest) =>
    apiClient.post<Trip>(`/ambulance/trips/${id}/return`, payload, { screenKey: TRIPS_SCREEN }).then((r) => r.data),

  report: (params: TripReportParams) =>
    apiClient.get<CollectionResponse<Trip>>('/ambulance/reports/trips', { params, screenKey: REPORTS_SCREEN }).then((r) => r.data.data),
};
