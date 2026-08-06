export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  };
}

export function getPagination(
  page?: string | number,
  pageSize?: string | number,
  defaultSize = 20,
): { skip: number; take: number; page: number; pageSize: number } {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || defaultSize));
  return { skip: (p - 1) * size, take: size, page: p, pageSize: size };
}

export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return {
    data,
    meta: {
      total,
      page,
      perPage: pageSize,
      hasNextPage: page * pageSize < total,
    },
  };
}
