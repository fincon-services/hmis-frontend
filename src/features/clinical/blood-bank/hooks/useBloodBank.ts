import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { bloodBankApi, type BloodBagListParams } from '../api/bloodBankApi';
import { queryClient } from '@/api/queryClient';
import type { DiscardBloodRequest, IssueBloodRequest, ReceiveBloodBagRequest, SaveDonorScreeningRequest } from '../types/bloodBank.types';

export const bloodBankKeys = {
  list: (params: BloodBagListParams) => ['blood-bags', 'list', params] as const,
  detail: (id: number) => ['blood-bags', 'detail', id] as const,
  issues: (id: number) => ['blood-bags', id, 'issues'] as const,
  discards: (id: number) => ['blood-bags', id, 'discards'] as const,
};

export function useBloodBags(params: BloodBagListParams) {
  return useQuery({ queryKey: bloodBankKeys.list(params), queryFn: () => bloodBankApi.list(params), placeholderData: keepPreviousData });
}

export function useBloodBag(id: number) {
  return useQuery({ queryKey: bloodBankKeys.detail(id), queryFn: () => bloodBankApi.get(id), enabled: !!id });
}

export function useBloodIssues(bagId: number) {
  return useQuery({ queryKey: bloodBankKeys.issues(bagId), queryFn: () => bloodBankApi.issuesForBag(bagId), enabled: !!bagId });
}

export function useBloodDiscards(bagId: number) {
  return useQuery({ queryKey: bloodBankKeys.discards(bagId), queryFn: () => bloodBankApi.discardsForBag(bagId), enabled: !!bagId });
}

export function useReceiveBloodBag() {
  return useMutation({
    mutationFn: (payload: ReceiveBloodBagRequest) => bloodBankApi.receive(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blood-bags'] }),
  });
}

export function useBloodGroupReport() {
  return useMutation({
    mutationFn: ({ bloodGroup, dateFrom, dateTo }: { bloodGroup: string; dateFrom: string; dateTo: string }) =>
      bloodBankApi.report(bloodGroup, dateFrom, dateTo),
  });
}

export function useSaveDonorScreening(bagId: number) {
  return useMutation({
    mutationFn: (payload: SaveDonorScreeningRequest) => bloodBankApi.saveDonorScreening(bagId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bloodBankKeys.detail(bagId) }),
  });
}

export function useSaveScreeningResults(bagId: number) {
  return useMutation({
    mutationFn: (payload: Parameters<typeof bloodBankApi.saveScreeningResults>[0]) => bloodBankApi.saveScreeningResults(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bloodBankKeys.detail(bagId) }),
  });
}

export function useIssueBlood(bagId: number) {
  return useMutation({
    mutationFn: (payload: IssueBloodRequest) => bloodBankApi.issue(bagId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloodBankKeys.detail(bagId) });
      queryClient.invalidateQueries({ queryKey: bloodBankKeys.issues(bagId) });
      queryClient.invalidateQueries({ queryKey: ['blood-bags', 'list'] });
    },
  });
}

export function useDiscardBlood(bagId: number) {
  return useMutation({
    mutationFn: (payload: DiscardBloodRequest) => bloodBankApi.discard(bagId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bloodBankKeys.detail(bagId) });
      queryClient.invalidateQueries({ queryKey: bloodBankKeys.discards(bagId) });
      queryClient.invalidateQueries({ queryKey: ['blood-bags', 'list'] });
    },
  });
}
