export interface AuthSession {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    roleId?: string;
    roleName?: string;
    tenantId?: string;
    isSuperAdmin?: boolean;
    brandId?: string;
    vendorId?: string;
  };
  permissions?: { module: string; action: string }[];
}

const SESSION_KEY = "cj:session";
const SESSION_COOKIE = "cj:session";

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(
    JSON.stringify(session)
  )}; path=/; SameSite=Lax`;
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  document.cookie = `${SESSION_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getTenantId(): string | null {
  return getSession()?.user.tenantId ?? null;
}

export function hasPermission(
  module: string,
  action: string,
  session?: AuthSession | null
): boolean {
  const s = session ?? getSession();
  if (!s) return false;
  if (s.user.isSuperAdmin) return true;
  return (
    s.permissions?.some((p) => p.module === module && p.action === action) ??
    false
  );
}
