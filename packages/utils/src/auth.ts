export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    roleId?: string | null;
    roleName?: string | null;
    tenantId?: string | null;
    isSuperAdmin?: boolean;
    brandId?: string | null;
    vendorId?: string | null;
  };
  permissions?: { module: string; action: string }[];
}

const DEFAULT_SESSION_KEY = "cj:session";

export function buildSessionKey(portal: string): string {
  return `cj:${portal}:session`;
}

export function buildSessionCookie(portal: string): string {
  return `cj_${portal}_session`;
}

function localStorageKey(portal?: string): string {
  return portal ? buildSessionKey(portal) : DEFAULT_SESSION_KEY;
}

function cookieName(portal?: string): string {
  return portal ? buildSessionCookie(portal) : DEFAULT_SESSION_KEY.replaceAll(":", "_");
}

export function saveSession(session: AuthSession, portal?: string): void {
  if (typeof window === "undefined") return;
  const key = localStorageKey(portal);
  window.localStorage.setItem(key, JSON.stringify(session));
  document.cookie = `${cookieName(portal)}=${encodeURIComponent(
    JSON.stringify(session)
  )}; path=/; SameSite=Lax`;
}

export function getSession(portal?: string): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(localStorageKey(portal));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(portal?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(localStorageKey(portal));
  document.cookie = `${cookieName(portal)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAuthenticated(portal?: string): boolean {
  return getSession(portal) !== null;
}

export function getAccessToken(portal?: string): string | null {
  return getSession(portal)?.accessToken ?? null;
}

export function getRefreshToken(portal?: string): string | null {
  return getSession(portal)?.refreshToken ?? null;
}

export function updateSessionTokens(
  accessToken: string,
  refreshToken?: string,
  portal?: string
): void {
  if (typeof window === "undefined") return;
  const session = getSession(portal);
  if (!session) return;
  session.accessToken = accessToken;
  if (refreshToken) {
    session.refreshToken = refreshToken;
  }
  saveSession(session, portal);
}

export function getTenantId(portal?: string): string | null {
  return getSession(portal)?.user.tenantId ?? null;
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
