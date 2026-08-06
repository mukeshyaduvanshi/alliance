import type { ApiError } from "@cj/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiClientError extends Error {
  status: number;
  details?: ApiError;

  constructor(message: string, status: number, details?: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private onUnauthorized?: () => void;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? API_BASE_URL;
    this.getAccessToken = options.getAccessToken ?? (() => null);
    this.onUnauthorized = options.onUnauthorized;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      let details: ApiError | undefined;
      try {
        details = (await res.json()) as ApiError;
      } catch {
        // ignore non-JSON error bodies
      }
      if (res.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }
      throw new ApiClientError(
        details?.message
          ? Array.isArray(details.message)
            ? details.message.join(", ")
            : details.message
          : `Request failed with status ${res.status}`,
        res.status,
        details
      );
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  get<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  post<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, init?: RequestInit) {
    return this.request<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...init, method: "DELETE" });
  }
}

export { API_BASE_URL };
