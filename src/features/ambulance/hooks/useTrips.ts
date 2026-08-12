import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { ambulanceTripsApi } from '../api/ambulanceApi';
import { queryClient } from '@/api/queryClient';
import type { DispatchTripRequest, ReturnTripRequest, TripListParams, TripReportParams } from '../types/ambulance.types';

export const tripKeys = {
  list: (params: TripListParams) => ['ambulance-trips', 'list', params] as const,
  detail: (id: number) => ['ambulance-trips', 'detail', id] as const,
};

export function useTrips(params: TripListParams) {
  return useQuery({ queryKey: tripKeys.list(params), queryFn: () => ambulanceTripsApi.list(params), placeholderData: keepPreviousData });
}

export function useTrip(id: number) {
  return useQuery({ queryKey: tripKeys.detail(id), queryFn: () => ambulanceTripsApi.get(id), enabled: !!id });
}

export function useDispatchTrip() {
  return useMutation({
    mutationFn: (payload: DispatchTripRequest) => ambulanceTripsApi.dispatch(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ambulance-trips'] }),
  });
}

export function useReturnTrip() {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReturnTripRequest }) => ambulanceTripsApi.return(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ambulance-trips'] }),
  });
}

export function useTripReport() {
  return useMutation({
    mutationFn: (params: TripReportParams) => ambulanceTripsApi.report(params),
  });
}
