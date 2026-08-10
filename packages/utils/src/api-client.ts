import type { ApiError } from "@cj/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

const EXPIRY_SKEW_MS = 60_000;

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
  getRefreshToken?: () => string | null;
  refreshPath?: string;
  onTokensRefreshed?: (accessToken: string, refreshToken?: string) => void;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private baseUrl: string;
  private getAccessToken: () => string | null;
  private getRefreshToken?: () => string | null;
  private refreshPath?: string;
  private onTokensRefreshed?: (accessToken: string, refreshToken?: string) => void;
  private onUnauthorized?: () => void;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? API_BASE_URL;
    this.getAccessToken = options.getAccessToken ?? (() => null);
    this.getRefreshToken = options.getRefreshToken;
    this.refreshPath = options.refreshPath;
    this.onTokensRefreshed = options.onTokensRefreshed;
    this.onUnauthorized = options.onUnauthorized;
  }

  private decodeTokenExp(token: string): number | null {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  }

  private isExpiringSoon(token: string): boolean {
    if (typeof window === "undefined") return false;
    const exp = this.decodeTokenExp(token);
    if (exp == null) return false;
    return exp * 1000 - Date.now() < EXPIRY_SKEW_MS;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken?.() ?? null;
    if (!refreshToken || !this.refreshPath) return false;
    try {
      const res = await fetch(`${this.baseUrl}${this.refreshPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        accessToken?: string;
        refreshToken?: string;
      };
      if (!data.accessToken) return false;
      this.onTokensRefreshed?.(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private tryRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.doRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async buildHeaders(
    init: RequestInit
  ): Promise<{ headers: Record<string, string>; token: string | null }> {
    let token = this.getAccessToken();
    if (token && this.isExpiringSoon(token)) {
      const refreshed = await this.tryRefresh();
      token = refreshed ? this.getAccessToken() : null;
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers, token };
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const { headers, token } = await this.buildHeaders(init);

    let res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    if (res.status === 401 && token) {
      const refreshed = await this.tryRefresh();
      const newToken = this.getAccessToken();
      if (refreshed && newToken) {
        res = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          cache: "no-store",
        });
      }
    }

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
