/**
 * Pagination utilities for mock data
 */

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  has_more: boolean;
}

/**
 * Apply pagination to an array
 */
export function paginate<T>(
  items: T[],
  params: PaginationParams = {}
): PaginatedResponse<T> {
  const limit = params.limit ?? 10;
  const page = params.page ?? 1;
  const offset = params.offset ?? (page - 1) * limit;

  const paginatedItems = items.slice(offset, offset + limit);
  const total = items.length;
  const has_more = offset + limit < total;

  return {
    data: paginatedItems,
    total,
    limit,
    offset,
    page,
    has_more,
  };
}

/**
 * Extract pagination params from URL search params
 */
export function extractPaginationParams(searchParams: URLSearchParams): PaginationParams {
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined;

  return { limit, offset, page };
}

