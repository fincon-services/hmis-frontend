import { useMutation, useQuery } from '@tanstack/react-query';
import { laboratoryApi, type LabTestParameterDto } from '../api/laboratoryApi';
import { queryClient } from '@/api/queryClient';

const key = (labTestId: number) => ['lab-test-parameters', labTestId] as const;

export function useLabTestParameters(labTestId: number) {
  return useQuery({
    queryKey: key(labTestId),
    queryFn: () => laboratoryApi.parametersForTest(labTestId),
    enabled: !!labTestId,
  });
}

export function useCreateLabTestParameter(labTestId: number) {
  return useMutation({
    mutationFn: (payload: LabTestParameterDto) => laboratoryApi.createParameter(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(labTestId) }),
  });
}

export function useUpdateLabTestParameter(labTestId: number) {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LabTestParameterDto }) => laboratoryApi.updateParameter(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(labTestId) }),
  });
}

export function useDeleteLabTestParameter(labTestId: number) {
  return useMutation({
    mutationFn: (id: number) => laboratoryApi.deleteParameter(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(labTestId) }),
  });
}
