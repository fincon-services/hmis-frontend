/** Laravel LengthAwarePaginator envelope (AnonymousResourceCollection over a paginated query). */
export interface PaginationLinks {
  first: string | null;
  last: string | null;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

/** Returned instead of PaginatedResponse when the caller passes per_page=0 (unpaginated). */
export interface CollectionResponse<T> {
  data: T[];
}

export function isPaginated<T>(
  res: PaginatedResponse<T> | CollectionResponse<T>,
): res is PaginatedResponse<T> {
  return 'meta' in res;
}

/** Common list query params supported by FiltersAndPaginates-backed endpoints. */
export interface ListParams {
  search?: string;
  is_active?: boolean;
  sort?: string;
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface MessageResponse {
  message: string;
}

/** Standard Laravel 422 validation error body. */
export interface ValidationErrorResponse {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiErrorShape {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}
