import { apiClient } from '@/api/client';
import type { CollectionResponse, ListParams, MessageResponse, PaginatedResponse } from '@/types/api';

/**
 * Factory for the standard `screen:<route_key>`-gated CRUD endpoint shape
 * seen across Admin - HR Setup and other master-data modules: GET list
 * (paginated), POST create, PUT update, DELETE, POST delete-bulk.
 */
export function createCrudApi<T, CreateDto, UpdateDto = CreateDto>(basePath: string, screenKey: string) {
  return {
    list: (params: ListParams) =>
      apiClient
        .get<PaginatedResponse<T> | CollectionResponse<T>>(basePath, { params, screenKey })
        .then((r) => r.data),

    create: (payload: CreateDto) => apiClient.post<T>(basePath, payload, { screenKey }).then((r) => r.data),

    update: (id: number, payload: UpdateDto) =>
      apiClient.put<T>(`${basePath}/${id}`, payload, { screenKey }).then((r) => r.data),

    remove: (id: number) => apiClient.delete<MessageResponse>(`${basePath}/${id}`, { screenKey }).then((r) => r.data),

    removeBulk: (ids: number[]) =>
      apiClient.post<MessageResponse>(`${basePath}/delete-bulk`, { ids }, { screenKey }).then((r) => r.data),
  };
}
