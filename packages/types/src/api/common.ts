export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    hasNextPage: boolean;
  };
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
  path?: string;
  timestamp?: string;
}

export interface TenantContext {
  tenantId: string;
  tenantName: string;
}
