import { useMutation, useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import type { ListParams } from '@/types/api';
import type { createCrudApi } from './createCrudApi';

export function createCrudHooks<T, CreateDto, UpdateDto = CreateDto>(
  resourceKey: string,
  api: ReturnType<typeof createCrudApi<T, CreateDto, UpdateDto>>,
) {
  const keys = {
    all: [resourceKey] as const,
    list: (params: ListParams) => [resourceKey, 'list', params] as const,
  };

  function useList(params: ListParams) {
    return useQuery({
      queryKey: keys.list(params),
      queryFn: () => api.list(params),
      placeholderData: keepPreviousData,
    });
  }

  function useCreate() {
    return useMutation({
      mutationFn: (payload: CreateDto) => api.create(payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useUpdate() {
    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: UpdateDto }) => api.update(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useRemove() {
    return useMutation({
      mutationFn: (id: number) => api.remove(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  function useRemoveBulk() {
    return useMutation({
      mutationFn: (ids: number[]) => api.removeBulk(ids),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
    });
  }

  return { keys, useList, useCreate, useUpdate, useRemove, useRemoveBulk };
}
